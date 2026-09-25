use crate::config::{save_config, ConfigState};
use crate::launcher::{launch_item, run_all_sequentially};
use crate::models::{AppConfig, AppItem, AppSettings, WindowsStartupItem};
use crate::windows_startup::{disable_windows_item, scan_startup_items};
use tauri::{AppHandle, State};

#[tauri::command]
pub fn get_config(state: State<'_, ConfigState>) -> Result<AppConfig, String> {
    let cfg = state.0.lock().map_err(|e| e.to_string())?;
    Ok(cfg.clone())
}

#[tauri::command]
pub fn save_items(items: Vec<AppItem>, state: State<'_, ConfigState>) -> Result<(), String> {
    let mut cfg = state.0.lock().map_err(|e| e.to_string())?;
    cfg.items = items;
    save_config(&cfg)?;
    Ok(())
}

#[tauri::command]
pub fn save_settings(settings: AppSettings, state: State<'_, ConfigState>) -> Result<(), String> {
    let mut cfg = state.0.lock().map_err(|e| e.to_string())?;
    cfg.settings = settings;
    save_config(&cfg)?;
    Ok(())
}

#[tauri::command]
pub fn add_item(mut item: AppItem, state: State<'_, ConfigState>) -> Result<(), String> {
    let mut cfg = state.0.lock().map_err(|e| e.to_string())?;
    item.order = cfg.items.len();
    cfg.items.push(item);
    save_config(&cfg)?;
    Ok(())
}

#[tauri::command]
pub fn update_item(item: AppItem, state: State<'_, ConfigState>) -> Result<(), String> {
    let mut cfg = state.0.lock().map_err(|e| e.to_string())?;
    if let Some(pos) = cfg.items.iter().position(|i| i.id == item.id) {
        cfg.items[pos] = item;
        save_config(&cfg)?;
        Ok(())
    } else {
        Err("Application not found".to_string())
    }
}

#[tauri::command]
pub fn delete_item(id: String, state: State<'_, ConfigState>) -> Result<(), String> {
    let mut cfg = state.0.lock().map_err(|e| e.to_string())?;
    cfg.items.retain(|i| i.id != id);
    // Re-index order
    for (idx, item) in cfg.items.iter_mut().enumerate() {
        item.order = idx;
    }
    save_config(&cfg)?;
    Ok(())
}

#[tauri::command]
pub fn scan_windows() -> Result<Vec<WindowsStartupItem>, String> {
    Ok(scan_startup_items())
}

#[tauri::command]
pub fn import_windows_item(
    item: WindowsStartupItem,
    disable_native: bool,
    state: State<'_, ConfigState>,
) -> Result<(), String> {
    if disable_native {
        let _ = disable_windows_item(&item.name, &item.location_type, &item.command);
    }

    // Clean up command if it has quotes or arguments
    let mut path = item.command.trim().to_string();
    let mut args = String::new();

    if path.starts_with('"') {
        if let Some(end_quote) = path[1..].find('"') {
            let actual_path = &path[1..=end_quote];
            let remaining = path[(end_quote + 2)..].trim();
            args = remaining.to_string();
            path = actual_path.to_string();
        }
    } else if let Some(space_idx) = path.find(' ') {
        let actual_path = &path[..space_idx];
        let remaining = path[(space_idx + 1)..].trim();
        args = remaining.to_string();
        path = actual_path.to_string();
    }

    let app_item = AppItem {
        id: format!("app_{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis()),
        name: item.name,
        path,
        args,
        working_dir: String::new(),
        run_as_admin: false,
        enabled: true,
        order: 0,
    };

    add_item(app_item, state)
}

#[tauri::command]
pub fn run_all(app_handle: AppHandle) -> Result<(), String> {
    run_all_sequentially(app_handle);
    Ok(())
}

#[tauri::command]
pub fn run_single(id: String, state: State<'_, ConfigState>) -> Result<(), String> {
    let cfg = state.0.lock().map_err(|e| e.to_string())?;
    if let Some(item) = cfg.items.iter().find(|i| i.id == id) {
        launch_item(item)
    } else {
        Err("Application not found".to_string())
    }
}
