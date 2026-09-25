export interface AppItem {
  id: string;
  name: string;
  path: string;
  args: string;
  working_dir: string;
  run_as_admin: boolean;
  enabled: boolean;
  order: number;
}

export interface AppSettings {
  delay_seconds: number;
  launch_on_boot: boolean;
  silent_start: boolean;
}

export interface AppConfig {
  items: AppItem[];
  settings: AppSettings;
}

export interface WindowsStartupItem {
  id: string;
  name: string;
  command: string;
  source: string;
  location_type: 'RegistryHKCU' | 'RegistryHKLM' | 'StartupFolder';
  enabled: boolean;
}

export interface LaunchStatus {
  status: 'idle' | 'started' | 'launching' | 'completed';
  total: number;
  current: number;
  appName: string;
}

export interface ImportResponse {
  success: boolean;
  warning?: string;
}

