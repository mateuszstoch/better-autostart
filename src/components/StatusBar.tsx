/* Hallmark · genre: modern-minimal · macrostructure: Workbench · design-system: design.md · designed-as-app */
import React from 'react';
import { LaunchStatus } from '../types';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface StatusBarProps {
  status: LaunchStatus;
  lastError: string | null;
  delaySeconds: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({ status, lastError, delaySeconds }) => {
  const isLaunching = status.status === 'launching' || status.status === 'started';
  const isCompleted = status.status === 'completed';

  return (
    <footer className="h-6 px-3 bg-[var(--color-paper-2)] border-t border-[var(--color-rule)] flex items-center justify-between text-[11px] font-mono select-none flex-shrink-0 text-[var(--color-ink-2)]">
      <div className="flex items-center gap-2.5 min-w-0">
        {isLaunching ? (
          <div className="flex items-center gap-2 text-[var(--color-ink)]">
            <RefreshCw className="w-3 h-3 text-[var(--color-signal-run)] animate-spin flex-shrink-0" />
            <span className="tabular-nums font-semibold text-[var(--color-signal-run)]">
              [{String(status.current).padStart(2, '0')}/{String(status.total).padStart(2, '0')}]
            </span>
            <span className="truncate text-[var(--color-ink-2)]">
              Uruchamianie: <strong className="text-[var(--color-ink)] font-normal">{status.appName}</strong>
            </span>
          </div>
        ) : isCompleted ? (
          <div className="flex items-center gap-1.5 text-[var(--color-signal-run)]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Sekwencja wykonana pomyślnie ({status.total} procesów)</span>
          </div>
        ) : lastError ? (
          <div className="flex items-center gap-1.5 text-[var(--color-signal-err)] truncate">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{lastError}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[var(--color-ink-3)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-signal-run)] inline-block" />
            <span className="text-[var(--color-ink-2)] font-sans">Gotowy</span>
            <span>•</span>
            <span className="tabular-nums">Odstęp: {delaySeconds.toFixed(1)}s</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-[10px] text-[var(--color-ink-3)] font-mono">
        <span>TAURI v2</span>
        <span>•</span>
        <span>WIN32</span>
      </div>
    </footer>
  );
};
