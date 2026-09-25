# Better Autostart 🚀

A modern desktop application built with **Rust (Tauri v2)** and **React + Tailwind CSS** that replaces the default Windows autostart mechanism, giving you complete control over logon process ordering and execution pacing.

---

## ✨ Key Features

- **Drag & Drop Ordering:** Reorder your startup applications using an intuitive, linear sequence list.
- **Sequential Background Execution:** Applications don't launch simultaneously, avoiding disk and CPU throttling. Instead, they boot sequentially with a configurable pacing interval (e.g. 1.5s).
- **Import from Windows Startup:** Scans Windows Registry (`HKCU\Run`, `HKLM\Run`) and the user `shell:startup` folder, allowing 1-click import with automatic registry backups.
- **Run as Administrator:** Native process elevation via Win32 `ShellExecuteW` with `runas` verb.
- **Active State Toggle:** Enable or disable applications without removing them from your sequence.
- **Arguments & Working Directory:** Full support for command-line arguments (e.g., `--minimized`, `--silent`) and custom `working_dir`.
- **System Tray Integration:** Minimizes cleanly to the system tray with a context menu to inspect status, run the sequence on demand, or quit.
- **Silent Boot Mode:** When starting up with Windows (`--autostart`), launches silently into the system tray without displaying the desktop window.

---

## 🛠️ Architecture & Stack

- **Backend:** Rust, Tauri v2, `winreg` (Windows Registry management), Win32 API (`ShellExecuteW`).
- **Frontend:** React 18, TypeScript, Tailwind CSS, `@dnd-kit/core` & `@dnd-kit/sortable`, `lucide-react`.
- **Design System:** Hallmark `modern-minimal` genre with `Workbench` macrostructure and `Cobalt Technical Dark` OKLCH theme.
- **Configuration:** Persisted in JSON at `%APPDATA%\BetterAutostart\config.json`.

---

## 🚀 Running & Building

### Prerequisites:
- Node.js (v18+) & npm
- Rust (`rustup` with `x86_64-pc-windows-gnu` or `msvc` toolchain)

### Development Mode:
```bash
npm run tauri dev
```

### Production Build:
```bash
npm run tauri build
```
The compiled executable will be located at:
`src-tauri/target/release/better-autostart.exe`

---

## 📁 Safety & Registry Backups

When disabling a native Windows entry via Better Autostart, the original value is preserved in a backup registry key:
`HKCU\Software\Microsoft\Windows\CurrentVersion\Run_Disabled_BetterAutostart`
For shortcut files in the Startup folder, items are renamed with a `.disabled` extension.
