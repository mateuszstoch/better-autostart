use crate::models::WindowsStartupItem;
use std::fs;
use std::path::{Path, PathBuf};
use winreg::enums::*;
use winreg::RegKey;

const RUN_KEY_PATH: &str = r"Software\Microsoft\Windows\CurrentVersion\Run";
const BACKUP_KEY_PATH: &str = r"Software\Microsoft\Windows\CurrentVersion\Run_Disabled_BetterAutostart";

pub fn is_process_elevated() -> bool {
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    hklm.open_subkey_with_flags(RUN_KEY_PATH, KEY_SET_VALUE).is_ok()
}

pub fn is_app_autostart_enabled() -> bool {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    if let Ok(run_key) = hkcu.open_subkey_with_flags(RUN_KEY_PATH, KEY_READ) {
        if run_key.get_value::<String, _>("BetterAutostart").is_ok()
            || run_key.get_value::<String, _>("better-autostart").is_ok()
        {
            return true;
        }
    }
    false
}

pub fn set_app_autostart(enabled: bool) -> Result<(), String> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let run_key = hkcu
        .open_subkey_with_flags(RUN_KEY_PATH, KEY_READ | KEY_SET_VALUE)
        .map_err(|e| format!("Brak dostępu do rejestru HKCU: {}", e))?;

    let app_name = "BetterAutostart";
    if enabled {
        let exe = std::env::current_exe().map_err(|e| format!("Nie udało się odczytać ścieżki programu: {}", e))?;
        let cmd = format!("\"{}\" --autostart", exe.display());
        run_key
            .set_value(app_name, &cmd)
            .map_err(|e| format!("Błąd rejestracji autostartu w rejestrze Windows: {}", e))?;
    } else {
        let _ = run_key.delete_value(app_name);
        let _ = run_key.delete_value("better-autostart");
    }
    Ok(())
}

pub fn scan_startup_items() -> Vec<WindowsStartupItem> {
    let mut items = Vec::new();

    // 1. Scan HKCU\Software\Microsoft\Windows\CurrentVersion\Run
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    if let Ok(run_key) = hkcu.open_subkey_with_flags(RUN_KEY_PATH, KEY_READ) {
        for (name, value) in run_key.enum_values().flatten() {
            let val_str = value.to_string();
            // Ignore ourselves if registered
            if name.eq_ignore_ascii_case("BetterAutostart")
                || name.eq_ignore_ascii_case("better-autostart")
                || val_str.to_lowercase().contains("better-autostart")
            {
                continue;
            }
            items.push(WindowsStartupItem {
                id: format!("hkcu_{}", name),
                name: name.clone(),
                command: val_str,
                source: "Rejestr HKCU (Bieżący użytkownik)".to_string(),
                location_type: "RegistryHKCU".to_string(),
                enabled: true,
            });
        }
    }

    // 2. Scan HKLM\Software\Microsoft\Windows\CurrentVersion\Run
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    if let Ok(run_key) = hklm.open_subkey_with_flags(RUN_KEY_PATH, KEY_READ) {
        for (name, value) in run_key.enum_values().flatten() {
            let val_str = value.to_string();
            if name.eq_ignore_ascii_case("BetterAutostart")
                || name.eq_ignore_ascii_case("better-autostart")
                || val_str.to_lowercase().contains("better-autostart")
            {
                continue;
            }
            items.push(WindowsStartupItem {
                id: format!("hklm_{}", name),
                name: name.clone(),
                command: val_str,
                source: "Rejestr HKLM (Wszyscy użytkownicy)".to_string(),
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
                            source: "Folder Autostart".to_string(),
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
            let run_key = hkcu.open_subkey_with_flags(RUN_KEY_PATH, KEY_READ | KEY_SET_VALUE)
                .map_err(|e| format!("Brak dostępu do rejestru HKCU: {}", e))?;
            
            // Backup before deleting
            let (backup_key, _) = hkcu.create_subkey(BACKUP_KEY_PATH)
                .map_err(|e| format!("Błąd tworzenia kopii zapasowej rejestru: {}", e))?;
            
            if let Ok(val) = run_key.get_raw_value(name) {
                let _ = backup_key.set_raw_value(name, &val);
            }

            run_key.delete_value(name)
                .map_err(|e| format!("Nie udało się usunąć wpisu z HKCU: {}", e))?;
            Ok(())
        }
        "RegistryHKLM" => {
            let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
            let run_key = hklm.open_subkey_with_flags(RUN_KEY_PATH, KEY_READ | KEY_SET_VALUE)
                .map_err(|e| {
                    if e.kind() == std::io::ErrorKind::PermissionDenied {
                        "Wymagane uprawnienia administratora: Wpis znajduje się w gałęzi HKLM (Wszyscy użytkownicy). Uruchom Better Autostart jako administrator, aby móc wyłączać wpisy systemowe.".to_string()
                    } else {
                        format!("Wymagane uprawnienia administratora do edycji HKLM: {}", e)
                    }
                })?;
            
            let (backup_key, _) = hklm.create_subkey(BACKUP_KEY_PATH)
                .map_err(|e| format!("Błąd tworzenia kopii zapasowej rejestru HKLM (wymagane uprawnienia administratora): {}", e))?;
            
            if let Ok(val) = run_key.get_raw_value(name) {
                let _ = backup_key.set_raw_value(name, &val);
            }

            run_key.delete_value(name)
                .map_err(|e| format!("Nie udało się usunąć wpisu z HKLM: {}", e))?;
            Ok(())
        }
        "StartupFolder" => {
            let p = Path::new(command_path);
            if p.exists() {
                let new_path = format!("{}.disabled", command_path);
                fs::rename(p, new_path).map_err(|e| format!("Nie udało się zmienić nazwy pliku w folderze Autostart (odmowa dostępu): {}", e))?;
                Ok(())
            } else {
                Err("Plik w folderze Autostart nie istnieje".to_string())
            }
        }
        _ => Err("Nieznany typ autostartu".to_string()),
    }
}
