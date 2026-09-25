/* Hallmark · genre: modern-minimal · macrostructure: Workbench · design-system: design.md · designed-as-app */
import React from 'react';
import { Play, Plus, RefreshCw, Settings, Terminal, Activity } from 'lucide-react';

interface HeaderProps {
  onOpenAddModal: () => void;
  onOpenWindowsModal: () => void;
  onOpenSettingsModal: () => void;
  onRunAll: () => void;
  isRunning: boolean;
  itemCount: number;
  activeCount: number;
  delaySeconds: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAddModal,
  onOpenWindowsModal,
  onOpenSettingsModal,
  onRunAll,
  isRunning,
  itemCount,
  activeCount,
  delaySeconds,
}) => {
  return (
    <header className="h-13 px-4 bg-[var(--color-paper-2)] border-b border-[var(--color-rule)] flex items-center justify-between select-none">
      {/* Brand & Context */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-[4px] bg-[var(--color-paper-3)] border border-[var(--color-rule)] flex items-center justify-center text-[var(--color-ink-2)]">
            <Terminal className="w-3 h-3 text-[var(--color-accent)]" />
          </div>
          <span className="text-xs font-semibold tracking-wider text-[var(--color-ink)] uppercase font-mono">
            Better Autostart
          </span>
        </div>

        <div className="h-3 w-[1px] bg-[var(--color-rule)] mx-1" />

        <div className="flex items-center gap-2 text-[11px] font-mono tabular-nums text-[var(--color-ink-2)]">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-signal-run)] inline-block" />
            <span>{activeCount} / {itemCount} active</span>
          </span>
          <span className="text-[var(--color-ink-3)]">•</span>
          <span className="text-[var(--color-ink-3)]">step: {delaySeconds.toFixed(1)}s</span>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRunAll}
          disabled={isRunning || activeCount === 0}
          className={`h-7 px-2.5 rounded-[4px] text-xs font-mono font-medium flex items-center gap-1.5 border transition-colors ${
            isRunning || activeCount === 0
              ? 'bg-[var(--color-paper)] text-[var(--color-ink-3)] border-[var(--color-rule)] cursor-not-allowed'
              : 'bg-[var(--color-paper-3)] hover:bg-[var(--color-rule)] text-[var(--color-signal-run)] border-[var(--color-rule)] active:translate-y-[1px]'
          }`}
          title="Run full application sequence in order"
        >
          {isRunning ? (
            <RefreshCw className="w-3 h-3 animate-spin text-[var(--color-signal-run)]" />
          ) : (
            <Play className="w-3 h-3 fill-current text-[var(--color-signal-run)]" />
          )}
          <span>{isRunning ? 'Running…' : 'Run Sequence'}</span>
        </button>

        <div className="h-3.5 w-[1px] bg-[var(--color-rule)] mx-0.5" />

        <button
          type="button"
          onClick={onOpenWindowsModal}
          className="h-7 px-2.5 rounded-[4px] text-xs font-medium text-[var(--color-ink-2)] hover:text-[var(--color-ink)] bg-[var(--color-paper)] hover:bg-[var(--color-paper-3)] border border-[var(--color-rule)] flex items-center gap-1.5 transition-colors"
          title="Scan Windows Registry and Startup folder entries"
        >
          <Activity className="w-3 h-3 text-[var(--color-ink-3)]" />
          <span>Scan Windows</span>
        </button>

        <button
          type="button"
          onClick={onOpenAddModal}
          className="h-7 px-2.5 rounded-[4px] text-xs font-medium text-[var(--color-paper)] bg-[var(--color-ink)] hover:bg-white flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add Program</span>
        </button>

        <button
          type="button"
          onClick={onOpenSettingsModal}
          className="h-7 w-7 rounded-[4px] flex items-center justify-center text-[var(--color-ink-2)] hover:text-[var(--color-ink)] bg-[var(--color-paper)] hover:bg-[var(--color-paper-3)] border border-[var(--color-rule)] transition-colors"
          title="Engine Settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
