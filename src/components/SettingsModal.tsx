/* Hallmark · genre: modern-minimal · macrostructure: Workbench · design-system: design.md · designed-as-app */
import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { invoke } from '@tauri-apps/api/core';
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart';
import { X, Clock, Power, Sliders, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  onClose: () => void;
  onSave: (settings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSave,
}) => {
  const [delay, setDelay] = useState(1.5);
  const [launchOnBoot, setLaunchOnBoot] = useState(true);
  const [silentStart, setSilentStart] = useState(true);
  const [autostartPluginActive, setAutostartPluginActive] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDelay(settings.delay_seconds);
      setLaunchOnBoot(settings.launch_on_boot);
      setSilentStart(settings.silent_start);

      // Check OS autostart state directly from Windows Registry
      invoke<boolean>('check_app_autostart')
        .then((active) => {
          setAutostartPluginActive(active);
        })
        .catch(() => {
          isEnabled()
            .then((active) => setAutostartPluginActive(active))
            .catch((e) => console.warn('Error reading autostart state:', e));
        });
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleToggleBoot = async (checked: boolean) => {
    setLaunchOnBoot(checked);
    try {
      await invoke('set_app_autostart', { enabled: checked });
      try {
        if (checked) {
          await enable();
        } else {
          await disable();
        }
      } catch {
        // Plugin fallback
      }
      setAutostartPluginActive(checked);
    } catch (err) {
      console.error('Error toggling Windows autostart:', err);
    }
  };

  const handleSave = () => {
    onSave({
      delay_seconds: Number(delay),
      launch_on_boot: launchOnBoot,
      silent_start: silentStart,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-md bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[6px] shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-rule)]">
          <h2 className="text-xs font-semibold text-[var(--color-ink)] uppercase font-mono tracking-wider flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-[var(--color-ink-3)]" />
            <span>Engine Configuration</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[var(--color-ink-3)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 text-xs">
          {/* Pacing Delay */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-medium text-[var(--color-ink-2)] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--color-ink-3)]" />
                <span>Sequence Delay (pacing interval)</span>
              </label>
              <span className="font-mono tabular-nums text-[var(--color-ink)] bg-[var(--color-paper)] px-2 py-0.5 rounded-[3px] border border-[var(--color-rule)] font-semibold">
                {delay.toFixed(1)}s
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              value={delay}
              onChange={(e) => setDelay(parseFloat(e.target.value))}
              className="w-full h-1 bg-[var(--color-paper)] rounded appearance-none cursor-pointer accent-[var(--color-ink)]"
            />
            <p className="text-[11px] text-[var(--color-ink-3)] leading-normal">
              Pacing delay after launching each process before spawning the next item.
            </p>
          </div>

          <div className="h-[1px] bg-[var(--color-rule)]" />

          {/* Autostart Toggle */}
          <div>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={launchOnBoot}
                onChange={(e) => handleToggleBoot(e.target.checked)}
                className="mt-0.5 rounded border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] focus:ring-0 cursor-pointer"
              />
              <div>
                <span className="font-medium text-[var(--color-ink)] flex items-center gap-2">
                  <Power className="w-3.5 h-3.5 text-[var(--color-signal-run)]" />
                  <span>Launch with Windows</span>
                  {autostartPluginActive && (
                    <span className="text-[10px] text-[var(--color-signal-run)] bg-[var(--color-paper)] px-1.5 py-0.2 rounded-[3px] border border-[var(--color-rule)] font-mono">
                      Active
                    </span>
                  )}
                </span>
                <p className="text-[11px] text-[var(--color-ink-3)] mt-0.5 leading-normal">
                  Registers Better Autostart in Windows Run key to manage startup sequence on user logon.
                </p>
              </div>
            </label>
          </div>

          {/* Silent Start */}
          <div>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={silentStart}
                onChange={(e) => setSilentStart(e.target.checked)}
                className="mt-0.5 rounded border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] focus:ring-0 cursor-pointer"
              />
              <div>
                <span className="font-medium text-[var(--color-ink)]">
                  Silent Background Start
                </span>
                <p className="text-[11px] text-[var(--color-ink-3)] mt-0.5 leading-normal">
                  When booting with Windows, launches minimized to system tray without displaying main window.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-[var(--color-rule)] bg-[var(--color-paper)]">
          <button
            type="button"
            onClick={onClose}
            className="h-6 px-3 text-xs font-medium text-[var(--color-ink-2)] hover:text-[var(--color-ink)] bg-transparent hover:bg-[var(--color-paper-3)] rounded-[4px] border border-[var(--color-rule)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="h-6 px-3 text-xs font-medium text-[var(--color-paper)] bg-[var(--color-ink)] hover:bg-white rounded-[4px] flex items-center gap-1 transition-colors"
          >
            <Check className="w-3 h-3" />
            <span>Save</span>
          </button>
        </div>
      </div>
    </div>
  );
};
