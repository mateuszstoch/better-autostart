/* Hallmark · genre: modern-minimal · macrostructure: Workbench · design-system: design.md · designed-as-app */
import React, { useState, useEffect } from 'react';
import { AppItem } from '../types';
import { open } from '@tauri-apps/plugin-dialog';
import { X, FolderOpen, Shield, Terminal, Folder } from 'lucide-react';

interface AddEditModalProps {
  isOpen: boolean;
  itemToEdit: AppItem | null;
  onClose: () => void;
  onSave: (item: Partial<AppItem>) => void;
}

export const AddEditModal: React.FC<AddEditModalProps> = ({
  isOpen,
  itemToEdit,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [path, setPath] = useState('');
  const [args, setArgs] = useState('');
  const [workingDir, setWorkingDir] = useState('');
  const [runAsAdmin, setRunAsAdmin] = useState(false);

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name);
      setPath(itemToEdit.path);
      setArgs(itemToEdit.args || '');
      setWorkingDir(itemToEdit.working_dir || '');
      setRunAsAdmin(itemToEdit.run_as_admin || false);
    } else {
      setName('');
      setPath('');
      setArgs('');
      setWorkingDir('');
      setRunAsAdmin(false);
    }
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleBrowseFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: 'Wykonywalne (*.exe, *.bat, *.cmd, *.lnk)',
            extensions: ['exe', 'bat', 'cmd', 'lnk'],
          },
          {
            name: 'Wszystkie pliki (*.*)',
            extensions: ['*'],
          },
        ],
      });

      if (selected && typeof selected === 'string') {
        setPath(selected);
        if (!name) {
          const filename = selected.split(/[\\/]/).pop() || '';
          const clean = filename.replace(/\.[^/.]+$/, '');
          setName(clean.charAt(0).toUpperCase() + clean.slice(1));
        }
      }
    } catch (err) {
      console.error('Błąd otwierania okna dialogowego:', err);
    }
  };

  const handleBrowseDir = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });
      if (selected && typeof selected === 'string') {
        setWorkingDir(selected);
      }
    } catch (err) {
      console.error('Błąd wyboru folderu:', err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !path.trim()) return;

    onSave({
      name: name.trim(),
      path: path.trim(),
      args: args.trim(),
      working_dir: workingDir.trim(),
      run_as_admin: runAsAdmin,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-lg bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[6px] shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-rule)]">
          <h2 className="text-xs font-semibold text-[var(--color-ink)] uppercase font-mono tracking-wider">
            {itemToEdit ? 'Konfiguracja pozycji' : 'Nowa pozycja sekwencji'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[var(--color-ink-3)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          {/* Name */}
          <div>
            <label className="block font-medium text-[var(--color-ink-2)] mb-1">
              Nazwa wyświetlana
            </label>
            <input
              type="text"
              required
              placeholder="np. Discord, Steam..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-[4px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-3)] focus:border-[var(--color-accent)] transition-colors"
            />
          </div>

          {/* Path */}
          <div>
            <label className="block font-medium text-[var(--color-ink-2)] mb-1">
              Plik wykonywalny (.exe / .bat)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="C:\Program Files\..."
                value={path}
                onChange={(e) => setPath(e.target.value)}
                className="flex-1 px-2.5 py-1.5 font-mono bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-[4px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-3)] focus:border-[var(--color-accent)] transition-colors"
              />
              <button
                type="button"
                onClick={handleBrowseFile}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--color-paper-3)] hover:bg-[var(--color-rule)] text-[var(--color-ink)] font-medium rounded-[4px] border border-[var(--color-rule)] transition-colors"
              >
                <FolderOpen className="w-3.5 h-3.5 text-[var(--color-ink-2)]" />
                <span>Wybierz…</span>
              </button>
            </div>
          </div>

          {/* Arguments */}
          <div>
            <label className="block font-medium text-[var(--color-ink-2)] mb-1 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-[var(--color-ink-3)]" />
              Argumenty wiersza poleceń
            </label>
            <input
              type="text"
              placeholder="np. --silent --minimized"
              value={args}
              onChange={(e) => setArgs(e.target.value)}
              className="w-full px-2.5 py-1.5 font-mono bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-[4px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-3)] focus:border-[var(--color-accent)] transition-colors"
            />
          </div>

          {/* Working directory */}
          <div>
            <label className="block font-medium text-[var(--color-ink-2)] mb-1 flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-[var(--color-ink-3)]" />
              Katalog roboczy (opcjonalny)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Domyślnie katalog pliku .exe"
                value={workingDir}
                onChange={(e) => setWorkingDir(e.target.value)}
                className="flex-1 px-2.5 py-1.5 font-mono bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-[4px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-3)] focus:border-[var(--color-accent)] transition-colors"
              />
              <button
                type="button"
                onClick={handleBrowseDir}
                className="px-2.5 py-1.5 bg-[var(--color-paper-3)] hover:bg-[var(--color-rule)] text-[var(--color-ink-2)] rounded-[4px] border border-[var(--color-rule)] transition-colors"
              >
                Katalog
              </button>
            </div>
          </div>

          {/* Elevation Toggle */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 p-2.5 bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-[4px] cursor-pointer hover:border-[var(--color-ink-3)] transition-colors">
              <input
                type="checkbox"
                checked={runAsAdmin}
                onChange={(e) => setRunAsAdmin(e.target.checked)}
                className="mt-0.5 rounded border-[var(--color-rule)] bg-[var(--color-paper-2)] text-[var(--color-ink)] focus:ring-0 cursor-pointer"
              />
              <div>
                <div className="flex items-center gap-1.5 font-semibold text-[var(--color-ink)]">
                  <Shield className="w-3.5 h-3.5 text-[var(--color-signal-warn)]" />
                  Wymagaj uprawnień administratora
                </div>
                <p className="text-[11px] text-[var(--color-ink-2)] mt-0.5 leading-normal">
                  Wywołuje proces przez Win32 ShellExecuteW z czasownikiem `runas` (elewacja UAC).
                </p>
              </div>
            </label>
          </div>

          {/* Dialog Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-rule)]">
            <button
              type="button"
              onClick={onClose}
              className="h-7 px-3 text-xs font-medium text-[var(--color-ink-2)] hover:text-[var(--color-ink)] bg-transparent hover:bg-[var(--color-paper-3)] rounded-[4px] border border-[var(--color-rule)] transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="h-7 px-3.5 text-xs font-medium text-[var(--color-paper)] bg-[var(--color-ink)] hover:bg-white rounded-[4px] transition-colors"
            >
              {itemToEdit ? 'Zapisz' : 'Zatwierdź'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
