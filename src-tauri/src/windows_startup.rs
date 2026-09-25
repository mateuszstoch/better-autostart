use crate::models::WindowsStartupItem;
use std::fs;
use std::path::{Path, PathBuf};
use winreg::enums::*;
use winreg::RegKey;

const RUN_KEY_PATH: &str = r"Software\Microsoft\Windows\CurrentVersion\Run";
const BACKUP_KEY_PATH: &str = r"Software\Microsoft\Windows\CurrentVersion\Run_Disabled_BetterAutostart";

pub fn scan_startup_items() -> Vec<WindowsStartupItem> {
    let mut items = Vec::new();

    // 1. Scan HKCU\Software\Microsoft\Windows\CurrentVersion\Run
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    if let Ok(run_key) = hkcu.open_subkey(RUN_KEY_PATH) {
        for (name, value) in run_key.enum_values().flatten() {
            // Ignore ourselves if registered
            if name.eq_ignore_ascii_case("BetterAutostart") {
                continue;
            }
            items.push(WindowsStartupItem {
                id: format!("hkcu_{}", name),
                name: name.clone(),
                command: value.to_string(),
                source: "Registry HKCU (Current User)".to_string(),
                location_type: "RegistryHKCU".to_string(),
                enabled: true,
            });
        }
    }

    // 2. Scan HKLM\Software\Microsoft\Windows\CurrentVersion\Run
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    if let Ok(run_key) = hklm.open_subkey(RUN_KEY_PATH) {
        for (name, value) in run_key.enum_values().flatten() {
            if name.eq_ignore_ascii_case("BetterAutostart") {
                continue;
            }
            items.push(WindowsStartupItem {
                id: format!("hklm_{}", name),
                name: name.clone(),
                command: value.to_string(),
                source: "Registry HKLM (All Users)".to_string(),
                location_type: "RegistryHKLM".to_string(),
                enabled: true,
            });
        }
    }

    // 3. Scan User Startup Folder
    if let Ok(app_data) = std::env::var("APPDATA") {
        let startup_dir = PathBuf::from(app_data)
            .join(r"Microsoft\Windows\Start Menu\Programs\Startup");

        if startup_dir.exists() {
            if let Ok(entries) = fs::read_dir(&startup_dir) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.is_file() {
                        let filename = path.file_name().unwrap_or_default().to_string_lossy().to_string();
                        if filename.eq_ignore_ascii_case("desktop.ini") {
                            continue;
                        }
                        let is_disabled = filename.ends_with(".disabled");
                        let clean_name = if is_disabled {
                            filename.trim_end_matches(".disabled").to_string()
                        } else {
                            filename.clone()
                        };

                        items.push(WindowsStartupItem {
                            id: format!("folder_{}", filename),
                            name: clean_name,
                            command: path.to_string_lossy().to_string(),
                            source: "Startup Folder".to_string(),
                            location_type: "StartupFolder".to_string(),
                            enabled: !is_disabled,
                        });
                    }
                }
            }
        }
    }

    items
}

pub fn disable_windows_item(name: &str, location_type: &str, command_path: &str) -> Result<(), String> {
    match location_type {
        "RegistryHKCU" => {
            let hkcu = RegKey::predef(HKEY_CURRENT_USER);
            let run_key = hkcu.open_subkey_with_flags(RUN_KEY_PATH, KEY_ALL_ACCESS)
                .map_err(|e| format!("Access denied to HKCU registry: {}", e))?;
            
            // Backup before deleting
            let (backup_key, _) = hkcu.create_subkey(BACKUP_KEY_PATH)
                .map_err(|e| format!("Error creating registry backup: {}", e))?;
            
            if let Ok(val) = run_key.get_raw_value(name) {
                let _ = backup_key.set_raw_value(name, &val);
            }

            run_key.delete_value(name)
                .map_err(|e| format!("Failed to delete entry from HKCU: {}", e))?;
            Ok(())
        }
        "RegistryHKLM" => {
            let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
            let run_key = hklm.open_subkey_with_flags(RUN_KEY_PATH, KEY_ALL_ACCESS)
                .map_err(|e| format!("Administrator privileges required to edit HKLM: {}", e))?;
            
            let (backup_key, _) = hklm.create_subkey(BACKUP_KEY_PATH)
                .map_err(|e| format!("Error creating HKLM registry backup: {}", e))?;
            
            if let Ok(val) = run_key.get_raw_value(name) {
                let _ = backup_key.set_raw_value(name, &val);
            }

            run_key.delete_value(name)
                .map_err(|e| format!("Failed to delete entry from HKLM: {}", e))?;
            Ok(())
        }
        "StartupFolder" => {
            let p = Path::new(command_path);
            if p.exists() {
                let new_path = format!("{}.disabled", command_path);
                fs::rename(p, new_path).map_err(|e| format!("Failed to rename file: {}", e))?;
                Ok(())
            } else {
                Err("File in Startup folder does not exist".to_string())
            }
        }
        _ => Err("Unknown startup type".to_string()),
    }
}
