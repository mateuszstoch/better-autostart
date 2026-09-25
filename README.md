# Better Autostart 🚀

Nowoczesna aplikacja w **Rust (Tauri v2)** oraz **React + Tailwind CSS**, która zastępuje domyślny mechanizm autostartu Windowsa, dając pełną kontrolę nad procesem logowania i wstawania aplikacji.

---

## ✨ Kluczowe funkcjonalności

- **Przeciągnij i upuść (Drag & Drop):** Ustal dokładną kolejność uruchamiania programów za pomocą intuicyjnej listy drag & drop.
- **Sekwencyjne uruchamianie w tle:** Aplikacje nie startują jednocześnie dławiąc procesor i dysk – uruchamiają się po kolei z konfigurowalnym odstępem czasu (np. 1.5 sekundy).
- **Import z Windows Autostart:** Skaner rejestru (`HKCU\Run`, `HKLM\Run`) oraz folderu `shell:startup` pozwala jednym kliknięciem zaimportować obecne programy i bezpiecznie je wyłączyć w Windowsie (z automatyczną kopią zapasową w rejestrze).
- **Uruchamianie jako Administrator (Run as Admin):** Opcja natywnego wywołania procesu przez `ShellExecuteW` z uprawnieniami administratora (`runas`).
- **Przełącznik aktywności:** Wyłączanie programów bez usuwania ich z kolejki.
- **Parametry i katalog roboczy:** Pełna obsługa argumentów wiersza poleceń (np. `--minimized`, `--silent`) i definiowanie `working_dir`.
- **Integracja z zasobnikiem systemowym (Tray):** Aplikacja minimalizuje się do traya, skąd można podejrzeć stan, uruchomić całą kolejkę ręcznie lub zamknąć program.
- **Cichy start w tle:** Przy autostarcie systemowym program może uruchamiać się bez pokazywania okna głównego (`--autostart`).

---

## 🛠️ Architektura i technologie

- **Backend:** Rust, Tauri v2, `winreg` (edycja rejestru Windows), Win32 API (`ShellExecuteW`).
- **Frontend:** React 18, TypeScript, Tailwind CSS, `@dnd-kit/core` & `@dnd-kit/sortable`, `lucide-react`.
- **Konfiguracja:** Zapisywana w czytelnym formacie JSON w `%APPDATA%\BetterAutostart\config.json`.

---

## 🚀 Uruchamianie i rozwój

### Wymagania:
- Node.js (v18+) i npm
- Rust (`rustup` z toolchainem `x86_64-pc-windows-gnu` lub `msvc`)

### Tryb deweloperski:
```bash
npm run tauri dev
```

### Budowanie wersji produkcyjnej (.exe / instalator):
```bash
npm run tauri build
```
Wyjściowy plik `.exe` znajdziesz w:
`src-tauri/target/release/better-autostart.exe`

---

## 📁 Bezpieczeństwo i kopie zapasowe

Gdy wyłączasz program w rejestrze systemowym przez Better Autostart, oryginalna wartość zostaje zachowana w kluczu zapasowym:
`HKCU\Software\Microsoft\Windows\CurrentVersion\Run_Disabled_BetterAutostart`
W przypadku skrótów z folderu Autostart, pliki otrzymują bezpieczne rozszerzenie `.disabled`.
