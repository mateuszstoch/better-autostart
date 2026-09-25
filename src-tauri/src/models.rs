use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppItem {
    pub id: String,
    pub name: String,
    pub path: String,
    #[serde(default)]
    pub args: String,
    #[serde(default)]
    pub working_dir: String,
    #[serde(default)]
    pub run_as_admin: bool,
    #[serde(default = "default_true")]
    pub enabled: bool,
    pub order: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    #[serde(default = "default_delay")]
    pub delay_seconds: f32,
    #[serde(default = "default_true")]
    pub launch_on_boot: bool,
    #[serde(default = "default_true")]
    pub silent_start: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            delay_seconds: 1.5,
            launch_on_boot: true,
            silent_start: true,
        }
    }
}

fn default_true() -> bool {
    true
}

fn default_delay() -> f32 {
    1.5
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AppConfig {
    pub items: Vec<AppItem>,
    pub settings: AppSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowsStartupItem {
    pub id: String,
    pub name: String,
    pub command: String,
    pub source: String,
    pub location_type: String, // "RegistryHKCU", "RegistryHKLM", "StartupFolder"
    pub enabled: bool,
}
