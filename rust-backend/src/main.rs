use marketflow_rust_backend::fetcher::{
    FetchError, QuoteParseReport, fetch_all_quotes, fetch_indices, fetch_stocks,
};
use marketflow_rust_backend::server;
use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct CliOutput<'a> {
    success: bool,
    data: &'a [marketflow_rust_backend::fetcher::IndexData],
    stale: bool,
}

#[tokio::main]
async fn main() {
    let mode = std::env::args()
        .nth(1)
        .unwrap_or_else(|| "indices".to_owned());

    let result = match mode.as_str() {
        "indices" => fetch_indices().await,
        "stocks" => fetch_stocks().await,
        "all" => fetch_all_quotes().await,
        "serve" => {
            if let Err(error) = server::run().await {
                eprintln!("server failed: {error}");
                std::process::exit(1);
            }
            return;
        }
        "--help" | "-h" => {
            print_help();
            return;
        }
        value => {
            eprintln!("unknown mode: {value}");
            print_help();
            std::process::exit(2);
        }
    };

    match result {
        Ok(report) => print_report(&report),
        Err(error) => exit_with_error(error),
    }
}

fn print_report(report: &QuoteParseReport) {
    for issue in &report.issues {
        eprintln!("skipped {}: {}", issue.code, issue.reason);
    }

    let output = CliOutput {
        success: true,
        data: &report.data,
        stale: report.data.is_empty(),
    };

    match serde_json::to_string_pretty(&output) {
        Ok(json) => println!("{json}"),
        Err(error) => {
            eprintln!("failed to serialize JSON output: {error}");
            std::process::exit(1);
        }
    }
}

fn exit_with_error(error: FetchError) -> ! {
    eprintln!("{error}");
    let output = CliOutput {
        success: false,
        data: &[],
        stale: true,
    };

    if let Ok(json) = serde_json::to_string_pretty(&output) {
        println!("{json}");
    }

    std::process::exit(1);
}

fn print_help() {
    eprintln!("Usage: cargo run -- [serve|indices|stocks|all]");
    eprintln!("  serve    Start the Rust HTTP + Socket.io backend on RUST_BACKEND_PORT or 3001");
    eprintln!("  indices  Fetch current MarketFlow index codes (default)");
    eprintln!("  stocks   Fetch configured stock codes");
    eprintln!("  all      Fetch both indices and stocks");
}
