use chrono::{SecondsFormat, Utc};
use encoding_rs::GBK;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::time::Duration;
use thiserror::Error;

pub const INDEX_CODES: &[(&str, &str)] = &[
    ("sh000001", "上证指数"),
    ("sz399001", "深证成指"),
    ("sh000688", "科创50"),
    ("sz399006", "创业板指"),
    ("hkHSI", "恒生指数"),
    ("hkHSCEI", "国企指数"),
    ("hkHSTECH", "恒生科技"),
    ("usNDX", "纳斯达克100"),
    ("usINX", "标普500"),
    ("usDJI", "道琼斯"),
];

pub const STOCK_CODES: &[(&str, &str)] = &[("hk00700", "腾讯控股"), ("hk09988", "阿里巴巴-W")];

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct IndexData {
    pub code: String,
    pub name: String,
    pub price: f64,
    pub change: f64,
    pub change_percent: f64,
    pub volume: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pe: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub market_cap: Option<f64>,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CandlePoint {
    pub time: String,
    pub open: f64,
    pub close: f64,
    pub high: f64,
    pub low: f64,
    pub volume: f64,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct TrendPoint {
    pub time: String,
    pub value: f64,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct IndexDetails {
    pub code: String,
    pub name: String,
    pub market_chart: MarketChart,
    pub trend: TrendWindows,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct MarketChart {
    pub time: Vec<TrendPoint>,
    pub day: Vec<CandlePoint>,
    pub week: Vec<CandlePoint>,
    pub month: Vec<CandlePoint>,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct TrendWindows {
    #[serde(rename = "3d")]
    pub three_days: Vec<TrendPoint>,
    #[serde(rename = "7d")]
    pub seven_days: Vec<TrendPoint>,
    #[serde(rename = "1m")]
    pub one_month: Vec<TrendPoint>,
    #[serde(rename = "3m")]
    pub three_months: Vec<TrendPoint>,
    #[serde(rename = "6m")]
    pub six_months: Vec<TrendPoint>,
    #[serde(rename = "1y")]
    pub one_year: Vec<TrendPoint>,
    #[serde(rename = "2y")]
    pub two_years: Vec<TrendPoint>,
    #[serde(rename = "3y")]
    pub three_years: Vec<TrendPoint>,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct StockFinancials {
    pub code: String,
    pub name: String,
    pub years: Vec<FinancialYear>,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct FinancialYear {
    pub year: String,
    pub revenue: f64,
    pub net_profit: f64,
    pub eps: f64,
    pub total_assets: f64,
    pub total_liabilities: f64,
    pub shareholders_equity: f64,
}

#[derive(Debug, Clone, PartialEq)]
struct IntradayPoint {
    time: String,
    value: f64,
    volume: f64,
}

#[derive(Debug, Clone, PartialEq)]
struct MultiDaySeries {
    date: String,
    data: Vec<IntradayPoint>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct QuoteParseIssue {
    pub code: String,
    pub reason: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct QuoteParseReport {
    pub data: Vec<IndexData>,
    pub issues: Vec<QuoteParseIssue>,
}

#[derive(Debug, Error)]
pub enum FetchError {
    #[error("Tencent Finance request failed: {0}")]
    Request(#[from] reqwest::Error),
}

pub async fn fetch_indices() -> Result<QuoteParseReport, FetchError> {
    fetch_quotes(INDEX_CODES).await
}

pub async fn fetch_stocks() -> Result<QuoteParseReport, FetchError> {
    fetch_quotes(STOCK_CODES).await
}

pub async fn fetch_all_quotes() -> Result<QuoteParseReport, FetchError> {
    let mut codes = Vec::with_capacity(INDEX_CODES.len() + STOCK_CODES.len());
    codes.extend_from_slice(INDEX_CODES);
    codes.extend_from_slice(STOCK_CODES);
    fetch_quotes(&codes).await
}

pub async fn fetch_index_details(code: &str) -> IndexDetails {
    let client = build_client().expect("reqwest client should be constructible");
    let name = all_code_name(code).unwrap_or(code).to_owned();

    let (daily, weekly, monthly, intraday, multi_day) = tokio::join!(
        fetch_period_series(&client, code, "day"),
        fetch_period_series(&client, code, "week"),
        fetch_period_series(&client, code, "month"),
        fetch_intraday_series(&client, code),
        fetch_multi_day_intraday_series(&client, code),
    );

    let daily_series = daily.unwrap_or_default();
    let weekly_series = weekly.unwrap_or_default();
    let monthly_series = monthly.unwrap_or_default();
    let intraday_series = intraday.unwrap_or_default();
    let multi_day_series = multi_day.unwrap_or_default();
    let current_date = intraday_series
        .first()
        .and_then(|point| point.time.split_once(' ').map(|(date, _)| date.to_owned()));
    let recent_multi_day = multi_day_series
        .into_iter()
        .filter(|item| current_date.as_deref() != Some(item.date.as_str()))
        .rev()
        .take(2)
        .collect::<Vec<_>>()
        .into_iter()
        .rev()
        .flat_map(|item| item.data)
        .collect::<Vec<_>>();
    let recent_three_days = recent_multi_day
        .into_iter()
        .chain(intraday_series.iter().cloned())
        .collect::<Vec<_>>();

    IndexDetails {
        code: code.to_owned(),
        name,
        market_chart: MarketChart {
            time: to_trend_points_from_intraday(&intraday_series),
            day: daily_series.clone(),
            week: weekly_series,
            month: monthly_series,
        },
        trend: TrendWindows {
            three_days: if recent_three_days.is_empty() {
                to_trend_points(&slice_tail(&daily_series, 3))
            } else {
                to_trend_points_from_intraday(&recent_three_days)
            },
            seven_days: to_trend_points(&slice_tail(&daily_series, 7)),
            one_month: to_trend_points(&slice_tail(&daily_series, 22)),
            three_months: to_trend_points(&slice_tail(&daily_series, 66)),
            six_months: to_trend_points(&slice_tail(&daily_series, 132)),
            one_year: to_trend_points(&slice_tail(&daily_series, 252)),
            two_years: to_trend_points(&slice_tail(&daily_series, 504)),
            three_years: to_trend_points(&slice_tail(&daily_series, 756)),
        },
    }
}

pub async fn fetch_stock_financials(code: &str) -> Option<StockFinancials> {
    let name = STOCK_CODES
        .iter()
        .find_map(|(known_code, name)| (*known_code == code).then_some(*name))?;
    let client = build_client().ok()?;
    let url = format!("https://web.ifzq.gtimg.cn/appstock/app/profit/get?symbol={code}&type=year");
    let response = client.get(url).send().await.ok()?.error_for_status().ok()?;
    let json = response.json::<Value>().await.ok()?;
    let raw_years = json
        .pointer(&format!("/data/{code}/profit/year"))?
        .as_array()?;

    let mut years = raw_years
        .iter()
        .filter_map(parse_financial_year)
        .collect::<Vec<_>>();
    if years.is_empty() {
        return None;
    }

    years.sort_by(|a, b| a.year.cmp(&b.year));
    Some(StockFinancials {
        code: code.to_owned(),
        name: name.to_owned(),
        years,
    })
}

pub async fn fetch_quotes(codes: &[(&str, &str)]) -> Result<QuoteParseReport, FetchError> {
    if codes.is_empty() {
        return Ok(QuoteParseReport {
            data: Vec::new(),
            issues: Vec::new(),
        });
    }

    let query = codes
        .iter()
        .map(|(code, _)| *code)
        .collect::<Vec<_>>()
        .join(",");
    let url = format!("http://qt.gtimg.cn/q={query}");
    let client = build_client()?;
    let response = client.get(url).send().await?.error_for_status()?;
    let bytes = response.bytes().await?;
    let text = decode_tencent_body(&bytes);

    Ok(parse_quote_response(&text, codes))
}

fn build_client() -> Result<Client, reqwest::Error> {
    Client::builder().timeout(Duration::from_secs(5)).build()
}

fn decode_tencent_body(bytes: &[u8]) -> String {
    String::from_utf8(bytes.to_vec()).unwrap_or_else(|_| {
        let (text, _, _) = GBK.decode(bytes);
        text.into_owned()
    })
}

pub fn parse_quote_response(source: &str, known_codes: &[(&str, &str)]) -> QuoteParseReport {
    let names: HashMap<&str, &str> = known_codes.iter().copied().collect();
    let timestamp = Utc::now().to_rfc3339_opts(SecondsFormat::Millis, true);
    let mut data = Vec::new();
    let mut issues = Vec::new();

    for assignment in QuoteAssignments::new(source) {
        let name = match names.get(assignment.code.as_str()) {
            Some(name) => *name,
            None => continue,
        };

        match create_index_data(&assignment.code, name, &assignment.payload, &timestamp) {
            Ok(item) => data.push(item),
            Err(reason) => issues.push(QuoteParseIssue {
                code: assignment.code,
                reason,
            }),
        }
    }

    QuoteParseReport { data, issues }
}

fn create_index_data(
    code: &str,
    name: &str,
    payload: &str,
    timestamp: &str,
) -> Result<IndexData, String> {
    let fields: Vec<&str> = payload.split('~').collect();
    if fields.len() <= 45 {
        return Err(format!(
            "expected at least 46 Tencent fields, got {}",
            fields.len()
        ));
    }

    let pe = positive_number(fields.get(39).copied());
    let market_cap = positive_number(fields.get(45).copied());

    Ok(IndexData {
        code: code.to_owned(),
        name: name.to_owned(),
        price: number_or_zero(fields.get(3).copied()),
        change: number_or_zero(fields.get(31).copied()),
        change_percent: number_or_zero(fields.get(32).copied()),
        volume: number_or_zero(fields.get(6).copied()),
        pe,
        market_cap,
        timestamp: timestamp.to_owned(),
    })
}

async fn fetch_period_series(
    client: &Client,
    code: &str,
    period: &str,
) -> Result<Vec<CandlePoint>, FetchError> {
    let url = format!(
        "https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param={code},{period},,,900,qfq"
    );
    let response = client.get(url).send().await?.error_for_status()?;
    let json = response.json::<Value>().await?;
    let quote = &json["data"][code];
    let raw_series = if period == "day" {
        quote
            .get("qfqday")
            .or_else(|| quote.get("day"))
            .or_else(|| quote.get("hfqday"))
    } else {
        quote.get(period)
    };

    Ok(raw_series
        .and_then(Value::as_array)
        .map(|items| items.iter().filter_map(parse_candle_row).collect())
        .unwrap_or_default())
}

async fn fetch_intraday_series(
    client: &Client,
    code: &str,
) -> Result<Vec<IntradayPoint>, FetchError> {
    let url = format!("https://web.ifzq.gtimg.cn/appstock/app/minute/query?code={code}");
    let response = client.get(url).send().await?.error_for_status()?;
    let json = response.json::<Value>().await?;
    let quote = &json["data"][code];
    let data_value = quote.get("data").unwrap_or(&Value::Null);
    let container = data_value
        .get("data")
        .map(|_| data_value)
        .unwrap_or(data_value);
    let date = container.get("date").and_then(Value::as_str);

    Ok(container
        .get("data")
        .and_then(Value::as_array)
        .map(|items| {
            items
                .iter()
                .filter_map(|item| item.as_str())
                .filter_map(|line| parse_intraday_row(line, date))
                .collect()
        })
        .unwrap_or_default())
}

async fn fetch_multi_day_intraday_series(
    client: &Client,
    code: &str,
) -> Result<Vec<MultiDaySeries>, FetchError> {
    let Some(path) = get_tencent_flash_path(code) else {
        return Ok(Vec::new());
    };
    let url = format!("http://data.gtimg.cn/flashdata/hushen/4day/{path}.js?visitDstTime=1");
    let response = client.get(url).send().await?.error_for_status()?;
    let bytes = response.bytes().await?;
    Ok(parse_four_day_series(&decode_tencent_body(&bytes)))
}

fn parse_candle_row(item: &Value) -> Option<CandlePoint> {
    let row = item.as_array()?;
    if row.len() < 5 {
        return None;
    }

    Some(CandlePoint {
        time: value_to_string(&row[0]),
        open: value_to_number(row.get(1)),
        close: value_to_number(row.get(2)),
        high: value_to_number(row.get(3)),
        low: value_to_number(row.get(4)),
        volume: value_to_number(row.get(5)),
    })
}

fn parse_intraday_row(line: &str, date: Option<&str>) -> Option<IntradayPoint> {
    let mut segments = line.split_whitespace();
    let time = segments.next()?;
    let value = segments.next()?;
    let volume = segments.next();
    let normalized_date = date.and_then(normalize_compact_date);

    Some(IntradayPoint {
        time: normalized_date
            .map(|date| format!("{date} {time}"))
            .unwrap_or_else(|| time.to_owned()),
        value: str_to_number(value),
        volume: volume.map(str_to_number).unwrap_or(0.0),
    })
}

#[derive(Deserialize)]
struct RawFourDaySeries {
    date: Option<String>,
    data: Option<String>,
}

fn parse_four_day_series(source: &str) -> Vec<MultiDaySeries> {
    let Some(captures) = source
        .trim()
        .strip_prefix("var min_data_4d=[")
        .and_then(|tail| tail.strip_suffix("];"))
        .or_else(|| {
            source
                .trim()
                .strip_prefix("var min_data_4d=[")
                .and_then(|tail| tail.strip_suffix(']'))
        })
    else {
        return Vec::new();
    };
    let normalized = captures.replace('\'', "\"");
    let Ok(parsed) = serde_json::from_str::<Vec<RawFourDaySeries>>(&format!("[{normalized}]"))
    else {
        return Vec::new();
    };

    parsed
        .into_iter()
        .filter_map(|item| {
            let date = normalize_compact_date(item.date.as_deref()?)?;
            let data = item
                .data?
                .split('^')
                .filter_map(|line| parse_four_day_row(line, &date))
                .collect::<Vec<_>>();
            (!data.is_empty()).then_some(MultiDaySeries { date, data })
        })
        .collect()
}

fn parse_four_day_row(line: &str, date: &str) -> Option<IntradayPoint> {
    let mut segments = line.split('~');
    let raw_time = segments.next()?;
    let value = segments.next()?;
    let volume = segments.next()?;
    let time = if raw_time.len() == 4 {
        format!("{}:{}", &raw_time[0..2], &raw_time[2..4])
    } else {
        raw_time.to_owned()
    };

    Some(IntradayPoint {
        time: format!("{date} {time}"),
        value: str_to_number(value),
        volume: str_to_number(volume),
    })
}

fn parse_financial_year(item: &Value) -> Option<FinancialYear> {
    let row = item.as_array()?;
    if row.len() < 9 {
        return None;
    }

    let revenue = value_to_number(row.get(2));
    let net_profit = value_to_number(row.get(3));
    if revenue == 0.0 && net_profit == 0.0 {
        return None;
    }

    Some(FinancialYear {
        year: value_to_string(&row[0]),
        revenue,
        net_profit,
        eps: value_to_number(row.get(6)),
        total_assets: value_to_number(row.get(7)),
        total_liabilities: value_to_number(row.get(8)),
        shareholders_equity: value_to_number(row.get(9)),
    })
}

fn normalize_compact_date(value: &str) -> Option<String> {
    if value.is_empty() {
        return None;
    }

    if value.len() == 8 && value.chars().all(|character| character.is_ascii_digit()) {
        Some(format!(
            "{}-{}-{}",
            &value[0..4],
            &value[4..6],
            &value[6..8]
        ))
    } else {
        Some(value.to_owned())
    }
}

fn to_trend_points(series: &[CandlePoint]) -> Vec<TrendPoint> {
    series
        .iter()
        .map(|item| TrendPoint {
            time: item.time.clone(),
            value: item.close,
        })
        .collect()
}

fn to_trend_points_from_intraday(series: &[IntradayPoint]) -> Vec<TrendPoint> {
    series
        .iter()
        .map(|item| TrendPoint {
            time: item.time.clone(),
            value: item.value,
        })
        .collect()
}

fn get_tencent_flash_path(code: &str) -> Option<String> {
    if code.starts_with("sh") {
        Some(format!("sh/{code}"))
    } else if code.starts_with("sz") {
        Some(format!("sz/{code}"))
    } else {
        None
    }
}

fn all_code_name(code: &str) -> Option<&'static str> {
    INDEX_CODES
        .iter()
        .chain(STOCK_CODES.iter())
        .find_map(|(known_code, name)| (*known_code == code).then_some(*name))
}

fn slice_tail<T: Clone>(items: &[T], size: usize) -> Vec<T> {
    items[items.len().saturating_sub(size)..].to_vec()
}

fn value_to_string(value: &Value) -> String {
    value
        .as_str()
        .map(str::to_owned)
        .unwrap_or_else(|| value.to_string())
}

fn value_to_number(value: Option<&Value>) -> f64 {
    match value {
        Some(Value::Number(number)) => number.as_f64().unwrap_or(0.0),
        Some(Value::String(text)) => str_to_number(text),
        _ => 0.0,
    }
}

fn str_to_number(value: &str) -> f64 {
    value
        .parse::<f64>()
        .ok()
        .filter(|value| value.is_finite())
        .unwrap_or(0.0)
}

fn number_or_zero(value: Option<&str>) -> f64 {
    value
        .and_then(|value| value.parse::<f64>().ok())
        .filter(|value| value.is_finite())
        .unwrap_or(0.0)
}

fn positive_number(value: Option<&str>) -> Option<f64> {
    let value = number_or_zero(value);
    (value > 0.0).then_some(value)
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct QuoteAssignment {
    code: String,
    payload: String,
}

struct QuoteAssignments<'a> {
    source: &'a str,
    cursor: usize,
}

impl<'a> QuoteAssignments<'a> {
    fn new(source: &'a str) -> Self {
        Self { source, cursor: 0 }
    }
}

impl Iterator for QuoteAssignments<'_> {
    type Item = QuoteAssignment;

    fn next(&mut self) -> Option<Self::Item> {
        while self.cursor < self.source.len() {
            let remainder = &self.source[self.cursor..];
            let Some(prefix_offset) = remainder.find("v_") else {
                self.cursor = self.source.len();
                return None;
            };

            let code_start = self.cursor + prefix_offset + 2;
            let Some(equals_offset) = self.source[code_start..].find("=\"") else {
                self.cursor = code_start;
                continue;
            };

            let equals_index = code_start + equals_offset;
            let code = &self.source[code_start..equals_index];
            if !is_tencent_code(code) {
                self.cursor = equals_index + 1;
                continue;
            }

            let payload_start = equals_index + 2;
            let Some(payload_end_offset) = self.source[payload_start..].find('"') else {
                self.cursor = self.source.len();
                return None;
            };

            let payload_end = payload_start + payload_end_offset;
            self.cursor = payload_end + 1;
            return Some(QuoteAssignment {
                code: code.to_owned(),
                payload: self.source[payload_start..payload_end].to_owned(),
            });
        }

        None
    }
}

fn is_tencent_code(value: &str) -> bool {
    !value.is_empty()
        && value
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || character == '_')
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_index_data_with_optional_fields() {
        let mut fields = vec![""; 50];
        fields[3] = "3025.12";
        fields[6] = "123456";
        fields[31] = "-10.5";
        fields[32] = "-0.35";
        fields[39] = "13.2";
        fields[45] = "98765.4";
        let source = format!("v_sh000001=\"{}\";", fields.join("~"));

        let report = parse_quote_response(&source, INDEX_CODES);

        assert!(report.issues.is_empty());
        assert_eq!(report.data.len(), 1);
        assert_eq!(report.data[0].code, "sh000001");
        assert_eq!(report.data[0].name, "上证指数");
        assert_eq!(report.data[0].price, 3025.12);
        assert_eq!(report.data[0].change, -10.5);
        assert_eq!(report.data[0].change_percent, -0.35);
        assert_eq!(report.data[0].volume, 123456.0);
        assert_eq!(report.data[0].pe, Some(13.2));
        assert_eq!(report.data[0].market_cap, Some(98765.4));
    }

    #[test]
    fn skips_unknown_codes_and_reports_short_known_records() {
        let source = "v_unknown=\"1~2~3\";v_sh000001=\"1~2~3\";";

        let report = parse_quote_response(source, INDEX_CODES);

        assert!(report.data.is_empty());
        assert_eq!(
            report.issues,
            vec![QuoteParseIssue {
                code: "sh000001".to_owned(),
                reason: "expected at least 46 Tencent fields, got 3".to_owned()
            }]
        );
    }

    #[test]
    fn serializes_frontend_compatible_field_names() {
        let data = IndexData {
            code: "usINX".to_owned(),
            name: "标普500".to_owned(),
            price: 1.0,
            change: 2.0,
            change_percent: 3.0,
            volume: 4.0,
            pe: None,
            market_cap: Some(5.0),
            timestamp: "2026-07-02T00:00:00.000Z".to_owned(),
        };

        let json = serde_json::to_value(data).unwrap();

        assert_eq!(json["changePercent"], 3.0);
        assert_eq!(json["marketCap"], 5.0);
        assert!(json.get("pe").is_none());
    }
}
