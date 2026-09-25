pub mod commands;
pub mod config;
pub mod launcher;
pub mod models;
pub mod tray;
pub mod windows_startup;

use config::{load_config, ConfigState};
use std::sync::Mutex;
use tauri::{Manager, WindowEvent};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let initial_config = load_config();
    let is_autostart = std::env::args().any(|arg| arg == "--autostart" || arg == "--minimized");

    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--autostart"]),
        ))
        .plugin(tauri_plugin_dialog::init())
        .manage(ConfigState(Mutex::new(initial_config.clone())))
        .invoke_handler(tauri::generate_handler![
            commands::get_config,
            commands::save_items,
            commands::save_settings,
            commands::add_item,
            commands::update_item,
            commands::delete_item,
            commands::scan_windows,
            commands::import_windows_item,
            commands::run_all,
            commands::run_single,
        ])
        .setup(move |app| {
            // Setup system tray
            if let Err(e) = tray::setup_tray(app.handle()) {
                eprintln!("Error initializing system tray: {}", e);
            }

            // Handle main window behavior on startup
            if let Some(window) = app.get_webview_window("main") {
                if is_autostart {
                    let _ = window.hide();
                    // If autostarted by system, run the queue in background
                    if initial_config.settings.launch_on_boot {
                        launcher::run_all_sequentially(app.handle().clone());
                    }
                } else {
                    let _ = window.show();
                }
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            // Minimize to tray on close
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("Error running Better Autostart application");
}
