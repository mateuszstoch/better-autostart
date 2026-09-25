import React, { useState, useEffect } from 'react';
import { WindowsStartupItem, ImportResponse } from '../types';
import { invoke } from '@tauri-apps/api/core';
import { X, RefreshCw, Check, ArrowDownToLine, Search, ShieldAlert, Shield, AlertTriangle } from 'lucide-react';

interface WindowsStartupModalProps {
  isOpen: boolean;
  items: WindowsStartupItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onImport: (item: WindowsStartupItem, disableNative: boolean) => Promise<ImportResponse | void>;
  onClose: () => void;
}

export const WindowsStartupModal: React.FC<WindowsStartupModalProps> = ({
  isOpen,
  items,
  isLoading,
  onRefresh,
  onImport,
  onClose,
}) => {
  const [filter, setFilter] = useState('');
  const [disableNative, setDisableNative] = useState(true);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [itemWarnings, setItemWarnings] = useState<Record<string, string>>({});
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      invoke<boolean>('check_admin')
        .then((elevated) => setIsAdmin(elevated))
        .catch(() => setIsAdmin(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(filter.toLowerCase()) ||
      item.command.toLowerCase().includes(filter.toLowerCase()) ||
      item.source.toLowerCase().includes(filter.toLowerCase())
  );

  const handleImportItem = async (item: WindowsStartupItem) => {
    try {
      const res = await onImport(item, disableNative);
      setImportedIds((prev) => new Set(prev).add(item.id));
      if (res && res.warning) {
        setItemWarnings((prev) => ({ ...prev, [item.id]: res.warning! }));
      }
    } catch (err) {
      console.error('Błąd importu:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-2xl bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[6px] shadow-lg overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-rule)]">
          <div>
            <h2 className="text-xs font-semibold text-[var(--color-ink)] uppercase font-mono tracking-wider">
              Natywne wpisy autostartu Windows
            </h2>
            <p className="text-[11px] text-[var(--color-ink-2)] mt-0.5">
              Odczyt z rejestru (HKCU/HKLM Run) oraz folderu systemowego.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[var(--color-ink-3)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Filter & Options Toolbar */}
        <div className="p-3 bg-[var(--color-paper)] border-b border-[var(--color-rule)] flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[var(--color-ink-3)] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtruj wpisy po nazwie lub ścieżce..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 text-xs font-mono bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[4px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-3)] focus:border-[var(--color-accent)] transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-6 px-2.5 bg-[var(--color-paper-3)] hover:bg-[var(--color-rule)] text-[var(--color-ink)] text-xs font-medium rounded-[4px] border border-[var(--color-rule)] flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-[var(--color-accent)]' : 'text-[var(--color-ink-2)]'}`} />
            <span>Skanuj ponownie</span>
          </button>
        </div>

        {/* Status Strip */}
        <div className="px-4 py-1.5 bg-[var(--color-paper-2)] border-b border-[var(--color-rule)] flex items-center justify-between text-[11px]">
          <label className="flex items-center gap-2 text-[var(--color-ink-2)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={disableNative}
              onChange={(e) => setDisableNative(e.target.checked)}
              className="rounded border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] focus:ring-0 cursor-pointer"
            />
            <span>Wyłącz oryginalny wpis po imporcie (tworzy kopię w rejestrze)</span>
          </label>
          <span className="font-mono text-[var(--color-ink-3)] tabular-nums">
            {filteredItems.length} pozycji
          </span>
        </div>

        {/* Admin Warning Banner */}
        {!isAdmin && (
          <div className="mx-4 mt-3 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-[4px] flex items-start gap-2.5 text-xs text-amber-200">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-amber-300">
                Uruchomiono bez uprawnień administratora
              </p>
              <p className="text-[11px] text-amber-200/80 leading-relaxed">
                Wpisy ze źródła <strong className="font-semibold text-amber-200">HKLM (Wszyscy użytkownicy)</strong> wymagają uruchomienia Better Autostart jako Administrator, aby system Windows zezwolił na ich wyłączenie. Wpisy z HKCU oraz Folderu Autostart można wyłączać bez uprawnień admina.
              </p>
            </div>
          </div>
        )}

        {/* Scanned Items Table */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--color-rule)] mt-2">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-[var(--color-ink-2)] font-mono">
              <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-[var(--color-accent)]" />
              Przeszukiwanie rejestru Windows…
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--color-ink-3)]">
              Brak programów w natywnym autostarcie.
            </div>
          ) : (
            filteredItems.map((item) => {
              const isImported = importedIds.has(item.id);
              const warningMsg = itemWarnings[item.id];
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-4 py-2 hover:bg-[var(--color-paper-3)] transition-colors"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-[var(--color-ink)] truncate font-sans">
                        {item.name}
                      </span>
                      {item.location_type === 'RegistryHKLM' ? (
                        <span className="text-[10px] text-amber-300 bg-amber-950/40 px-1.5 py-0.5 rounded-[3px] border border-amber-800/50 font-mono flex items-center gap-1">
                          <Shield className="w-2.5 h-2.5" />
                          <span>HKLM · Wymaga Admina</span>
                        </span>
                      ) : item.location_type === 'RegistryHKCU' ? (
                        <span className="text-[10px] text-[var(--color-ink-2)] bg-[var(--color-paper)] px-1.5 py-0.5 rounded-[3px] border border-[var(--color-rule)] font-mono">
                          HKCU · Użytkownik
                        </span>
                      ) : (
                        <span className="text-[10px] text-[var(--color-ink-2)] bg-[var(--color-paper)] px-1.5 py-0.5 rounded-[3px] border border-[var(--color-rule)] font-mono">
                          Folder Autostart
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--color-ink-2)] font-mono truncate mt-0.5 select-text" title={item.command}>
                      {item.command}
                    </p>
                    {warningMsg && (
                      <p className="text-[11px] text-amber-400 font-mono mt-1 flex items-start gap-1 leading-tight">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{warningMsg}</span>
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleImportItem(item)}
                    disabled={isImported}
                    className={`h-6 px-2.5 rounded-[4px] text-xs font-mono font-medium flex items-center gap-1.5 transition-colors shrink-0 ${
                      isImported
                        ? 'bg-[var(--color-paper)] text-[var(--color-signal-run)] border border-[var(--color-rule)] cursor-default'
                        : 'bg-[var(--color-paper-3)] hover:bg-[var(--color-rule)] text-[var(--color-ink)] border border-[var(--color-rule)]'
                    }`}
                  >
                    {isImported ? (
                      <>
                        <Check className="w-3 h-3 text-[var(--color-signal-run)]" />
                        <span>Dodano</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownToLine className="w-3 h-3 text-[var(--color-ink-2)]" />
                        <span>Importuj</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-4 py-2.5 border-t border-[var(--color-rule)] bg-[var(--color-paper)]">
          <button
            type="button"
            onClick={onClose}
            className="h-6 px-3 text-xs font-medium text-[var(--color-ink-2)] hover:text-[var(--color-ink)] bg-[var(--color-paper-2)] hover:bg-[var(--color-paper-3)] rounded-[4px] border border-[var(--color-rule)] transition-colors"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
};
