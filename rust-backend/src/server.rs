use crate::fetcher::{
    IndexData, fetch_index_details, fetch_indices, fetch_stock_financials, fetch_stocks,
};
use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::get,
};
use serde::Serialize;
use socketioxide::{SocketIo, extract::SocketRef};
use std::{
    net::SocketAddr,
    sync::Arc,
    time::{Duration, SystemTime, UNIX_EPOCH},
};
use tokio::{net::TcpListener, sync::RwLock};
use tower_http::cors::CorsLayer;
use tracing::{info, warn};

const REFRESH_INTERVAL: Duration = Duration::from_secs(30);

#[derive(Clone)]
struct AppState {
    cache: Arc<RwLock<MarketCache>>,
}

#[derive(Debug, Default)]
struct MarketCache {
    indices: Vec<IndexData>,
    stocks: Vec<IndexData>,
}

#[derive(Serialize)]
struct ListResponse {
    success: bool,
    data: Vec<IndexData>,
    stale: bool,
}

#[derive(Serialize)]
struct DataResponse<T> {
    success: bool,
    data: T,
}

#[derive(Serialize)]
struct ErrorResponse {
    success: bool,
    error: &'static str,
}

#[derive(Serialize)]
struct PingResponse {
    timestamp: u128,
}

#[derive(Serialize)]
struct QuantSignalsRequest {
    indices: Vec<IndexData>,
}

pub async fn run() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "marketflow_rust_backend=info,tower_http=info".into()),
        )
        .init();

    let port = std::env::var("RUST_BACKEND_PORT")
        .ok()
        .and_then(|value| value.parse::<u16>().ok())
        .unwrap_or(3001);
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    let state = AppState {
        cache: Arc::new(RwLock::new(MarketCache::default())),
    };

    let (socket_layer, io) = SocketIo::new_layer();
    io.ns("/", async |socket: SocketRef| {
        info!(socket_id = %socket.id, "Socket.io client connected");
        socket.on("ping", async |socket: SocketRef| {
            let _ = socket.emit(
                "pong",
                &PingResponse {
                    timestamp: now_ms(),
                },
            );
        });
        socket.on_disconnect(async |socket: SocketRef| {
            info!(socket_id = %socket.id, "Socket.io client disconnected");
        });
    });

    refresh_all(&state, Some(&io)).await;
    tokio::spawn(refresh_loop(state.clone(), io.clone()));

    let app = Router::new()
        .route("/api/indices", get(get_indices))
        .route("/api/indices/{code}", get(get_index))
        .route("/api/indices/{code}/details", get(get_index_details))
        .route("/api/stocks", get(get_stocks))
        .route("/api/stocks/{code}/financials", get(get_stock_financials))
        .route("/api/quant/health", get(get_quant_health))
        .route("/api/quant/strategies", get(get_quant_strategies))
        .route("/api/quant/signals", get(get_quant_signals))
        .route("/health", get(health))
        .with_state(state)
        .layer(CorsLayer::permissive())
        .layer(socket_layer);

    let listener = TcpListener::bind(addr).await?;
    info!("Rust MarketFlow backend listening on http://{addr}");
    axum::serve(listener, app).await?;
    Ok(())
}

async fn refresh_loop(state: AppState, io: SocketIo) {
    let mut interval = tokio::time::interval(REFRESH_INTERVAL);
    loop {
        interval.tick().await;
        refresh_all(&state, Some(&io)).await;
    }
}

async fn refresh_all(state: &AppState, io: Option<&SocketIo>) {
    let (indices, stocks) = tokio::join!(fetch_indices(), fetch_stocks());

    match indices {
        Ok(report) => {
            for issue in &report.issues {
                warn!(code = %issue.code, reason = %issue.reason, "Skipped index quote");
            }
            let data = report.data;
            {
                let mut cache = state.cache.write().await;
                cache.indices = data.clone();
            }
            if let Some(io) = io {
                let payload = DataResponse {
                    success: true,
                    data: data.as_slice(),
                };
                if let Err(error) = io.emit("indices:update", &payload).await {
                    warn!(%error, "Failed to emit indices:update");
                }
            }
        }
        Err(error) => warn!(%error, "Failed to refresh indices; keeping cached data"),
    }

    match stocks {
        Ok(report) => {
            for issue in &report.issues {
                warn!(code = %issue.code, reason = %issue.reason, "Skipped stock quote");
            }
            state.cache.write().await.stocks = report.data;
        }
        Err(error) => warn!(%error, "Failed to refresh stocks; keeping cached data"),
    }
}

async fn get_indices(State(state): State<AppState>) -> Json<ListResponse> {
    let data = state.cache.read().await.indices.clone();
    Json(ListResponse {
        stale: data.is_empty(),
        success: true,
        data,
    })
}

async fn get_stocks(State(state): State<AppState>) -> Json<ListResponse> {
    let data = state.cache.read().await.stocks.clone();
    Json(ListResponse {
        stale: data.is_empty(),
        success: true,
        data,
    })
}

async fn get_index(
    State(state): State<AppState>,
    Path(code): Path<String>,
) -> Result<Json<DataResponse<IndexData>>, impl IntoResponse> {
    let cache = state.cache.read().await;
    cache
        .indices
        .iter()
        .find(|item| item.code == code)
        .cloned()
        .map(|data| {
            Json(DataResponse {
                success: true,
                data,
            })
        })
        .ok_or((
            StatusCode::OK,
            Json(ErrorResponse {
                success: false,
                error: "Index not found",
            }),
        ))
}

async fn get_index_details(
    Path(code): Path<String>,
) -> Json<DataResponse<crate::fetcher::IndexDetails>> {
    let data = fetch_index_details(&code).await;
    Json(DataResponse {
        success: true,
        data,
    })
}

async fn get_stock_financials(
    Path(code): Path<String>,
) -> Result<Json<DataResponse<crate::fetcher::StockFinancials>>, impl IntoResponse> {
    fetch_stock_financials(&code)
        .await
        .map(|data| {
            Json(DataResponse {
                success: true,
                data,
            })
        })
        .ok_or((
            StatusCode::OK,
            Json(ErrorResponse {
                success: false,
                error: "Stock not found or no financial data",
            }),
        ))
}

async fn get_quant_health() -> Json<serde_json::Value> {
    Json(proxy_quant_get("/health").await)
}

async fn get_quant_strategies() -> Json<serde_json::Value> {
    Json(proxy_quant_get("/strategies").await)
}

async fn get_quant_signals(State(state): State<AppState>) -> Json<serde_json::Value> {
    let indices = state.cache.read().await.indices.clone();
    Json(proxy_quant_post("/signals", &QuantSignalsRequest { indices }).await)
}

async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({ "success": true, "status": "ok" }))
}

async fn proxy_quant_get(path: &str) -> serde_json::Value {
    let client = match reqwest::Client::builder()
        .timeout(Duration::from_secs(5))
        .build()
    {
        Ok(client) => client,
        Err(error) => return quant_error(error),
    };

    let response = match client
        .get(format!("{}{}", quant_service_url(), path))
        .send()
        .await
    {
        Ok(response) => response,
        Err(error) => return quant_error(error),
    };

    match response.error_for_status() {
        Ok(response) => response
            .json::<serde_json::Value>()
            .await
            .unwrap_or_else(|_| quant_unavailable()),
        Err(error) => quant_error(error),
    }
}

async fn proxy_quant_post<T: Serialize + ?Sized>(path: &str, payload: &T) -> serde_json::Value {
    let client = match reqwest::Client::builder()
        .timeout(Duration::from_secs(5))
        .build()
    {
        Ok(client) => client,
        Err(error) => return quant_error(error),
    };

    let response = match client
        .post(format!("{}{}", quant_service_url(), path))
        .json(payload)
        .send()
        .await
    {
        Ok(response) => response,
        Err(error) => return quant_error(error),
    };

    match response.error_for_status() {
        Ok(response) => response
            .json::<serde_json::Value>()
            .await
            .unwrap_or_else(|_| quant_unavailable()),
        Err(error) => quant_error(error),
    }
}

fn quant_service_url() -> String {
    std::env::var("QUANT_SERVICE_URL").unwrap_or_else(|_| "http://localhost:8000".to_owned())
}

fn quant_error(error: reqwest::Error) -> serde_json::Value {
    warn!(%error, "Quant service request failed");
    quant_unavailable()
}

fn quant_unavailable() -> serde_json::Value {
    serde_json::json!({ "success": false, "error": "Quant service unavailable" })
}

fn now_ms() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis())
        .unwrap_or(0)
}
