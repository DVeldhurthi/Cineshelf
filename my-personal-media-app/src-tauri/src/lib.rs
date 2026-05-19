use serde::Deserialize;
use serde_json::Value;
use std::sync::LazyLock;
use std::time::Duration;

static HTTP_CLIENT: LazyLock<reqwest::Client> = LazyLock::new(|| {
    reqwest::Client::builder()
        .user_agent("Cineshelf/0.1.0 Tauri")
        .timeout(Duration::from_secs(12))
        .build()
        .expect("failed to build HTTP client")
});

static INSECURE_HTTP_CLIENT: LazyLock<reqwest::Client> = LazyLock::new(|| {
    reqwest::Client::builder()
        .user_agent("Cineshelf/0.1.0 Tauri")
        .timeout(Duration::from_secs(12))
        .danger_accept_invalid_certs(true)
        .build()
        .expect("failed to build insecure HTTP client")
});

#[derive(Debug, Deserialize)]
struct MiruroQueryParam {
    key: String,
    value: String,
}

#[tauri::command]
async fn miruro_get(
    base_url: String,
    path: String,
    query: Option<Vec<MiruroQueryParam>>,
) -> Result<Value, String> {
    let mut base_url = reqwest::Url::parse(&base_url).map_err(|error| error.to_string())?;

    if !matches!(base_url.scheme(), "https" | "http") {
        return Err("Miruro API base URL must use HTTP or HTTPS.".into());
    }

    if !base_url.path().ends_with('/') {
        let path_prefix = base_url.path().trim_end_matches('/');
        base_url.set_path(&format!("{path_prefix}/"));
    }

    let clean_path = path.trim_start_matches('/');
    let mut url = base_url.join(clean_path).map_err(|error| error.to_string())?;

    if let Some(query_params) = query {
        let mut pairs = url.query_pairs_mut();

        for param in query_params {
            pairs.append_pair(&param.key, &param.value);
        }
    }

    let host = base_url.host_str().unwrap_or_default();
    let client = if matches!(host, "animeclud.shop" | "www.animeclud.shop") {
        &*INSECURE_HTTP_CLIENT
    } else {
        &*HTTP_CLIENT
    };
    let response = client
        .get(url)
        .send()
        .await
        .map_err(|error| error.to_string())?;
    let status = response.status();

    if !status.is_success() {
        return Err(format!("Miruro API returned HTTP {status}."));
    }

    response
        .json::<Value>()
        .await
        .map_err(|error| error.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![miruro_get])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
