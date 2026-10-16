#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![save_export])
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}

#[tauri::command]
fn save_export(
    app: tauri::AppHandle,
    file_name: String,
    content: String,
    format: String,
) -> Result<bool, String> {
    use tauri_plugin_dialog::DialogExt;

    let (description, extension) = match format.as_str() {
        "csv" => ("CSV 檔案", "csv"),
        "tsv" => ("TSV 檔案", "tsv"),
        "json" => ("JSON 檔案", "json"),
        "md" => ("Markdown 檔案", "md"),
        "sql" => ("SQL 檔案", "sql"),
        _ => return Err("不支援的匯出格式".into()),
    };

    let Some(path) = app
        .dialog()
        .file()
        .set_file_name(file_name)
        .add_filter(description, &[extension])
        .blocking_save_file()
    else {
        return Ok(false);
    };

    let path = path.into_path().map_err(|error| error.to_string())?;
    std::fs::write(path, content).map_err(|error| error.to_string())?;
    Ok(true)
}
