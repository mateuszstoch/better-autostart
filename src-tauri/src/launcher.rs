use crate::config::load_config;
use crate::models::AppItem;
use std::ffi::OsStr;
use std::os::windows::ffi::OsStrExt;
use std::path::Path;
use std::process::Command;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

#[link(name = "shell32")]
extern "system" {
    fn ShellExecuteW(
        hwnd: isize,
        lpOperation: *const u16,
        lpFile: *const u16,
        lpParameters: *const u16,
        lpDirectory: *const u16,
        nShowCmd: i32,
    ) -> isize;
}

const SW_SHOWNORMAL: i32 = 1;

fn to_wide_null<S: AsRef<OsStr>>(s: S) -> Vec<u16> {
    s.as_ref().encode_wide().chain(std::iter::once(0)).collect()
}

pub fn launch_item(item: &AppItem) -> Result<(), String> {
    if item.path.trim().is_empty() {
        return Err("Ścieżka do pliku wykonywalnego jest pusta".to_string());
    }

    if item.run_as_admin {
        // Launch elevated via ShellExecuteW with verb "runas"
        let verb = to_wide_null("runas");
        let file = to_wide_null(&item.path);

        let params_wide = if item.args.trim().is_empty() {
            None
        } else {
            Some(to_wide_null(&item.args))
        };
        let params_ptr = match &params_wide {
            Some(w) => w.as_ptr(),
            None => std::ptr::null(),
        };

        let dir_wide = if item.working_dir.trim().is_empty() {
            // Default to executable directory if not specified
            Path::new(&item.path)
                .parent()
                .map(|parent| to_wide_null(parent.as_os_str()))
        } else {
            Some(to_wide_null(&item.working_dir))
        };
        let dir_ptr = match &dir_wide {
            Some(w) => w.as_ptr(),
            None => std::ptr::null(),
        };

        let result = unsafe {
            ShellExecuteW(
                0,
                verb.as_ptr(),
                file.as_ptr(),
                params_ptr,
                dir_ptr,
                SW_SHOWNORMAL,
            )
        };

        // ShellExecute returns an HINSTANCE > 32 on success
        if result > 32 {
            Ok(())
        } else {
            Err(format!("ShellExecuteW nie powiodło się z kodem błędu: {}", result))
        }
    } else {
        // Launch standard process
        let mut cmd = Command::new(&item.path);
        
        if !item.args.trim().is_empty() {
            let parts: Vec<&str> = item.args.split_whitespace().collect();
            cmd.args(parts);
        }

        if !item.working_dir.trim().is_empty() {
            cmd.current_dir(&item.working_dir);
        } else if let Some(parent) = Path::new(&item.path).parent() {
            if parent.exists() {
                cmd.current_dir(parent);
            }
        }

        cmd.spawn().map_err(|e| format!("Błąd uruchamiania {}: {}", item.path, e))?;
        Ok(())
    }
}

pub fn run_all_sequentially(app_handle: AppHandle) {
    thread::spawn(move || {
        let config = load_config();
        let mut items = config.items;
        items.sort_by_key(|i| i.order);

        let active_items: Vec<AppItem> = items.into_iter().filter(|i| i.enabled).collect();
        let total = active_items.len();

        let _ = app_handle.emit("launch-status", serde_json::json!({
            "status": "started",
            "total": total,
            "current": 0,
            "appName": ""
        }));

        for (idx, item) in active_items.iter().enumerate() {
            let _ = app_handle.emit("launch-status", serde_json::json!({
                "status": "launching",
                "total": total,
                "current": idx + 1,
                "appName": &item.name
            }));

            if let Err(err) = launch_item(item) {
                eprintln!("Błąd uruchamiania {}: {}", item.name, err);
                let _ = app_handle.emit("launch-error", serde_json::json!({
                    "appName": &item.name,
                    "error": err
                }));
            }

            // Global delay between applications
            if idx + 1 < total {
                let delay = config.settings.delay_seconds.max(0.1);
                thread::sleep(Duration::from_secs_f32(delay));
            }
        }

        let _ = app_handle.emit("launch-status", serde_json::json!({
            "status": "completed",
            "total": total,
            "current": total,
            "appName": ""
        }));
    });
}
