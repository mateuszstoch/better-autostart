/* Hallmark · genre: modern-minimal · macrostructure: Workbench · design-system: design.md · designed-as-app */
import React, { useState, useEffect, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

import { AppItem, AppSettings, WindowsStartupItem, LaunchStatus } from './types';
import { Header } from './components/Header';
import { AppCard } from './components/AppCard';
import { AddEditModal } from './components/AddEditModal';
import { WindowsStartupModal } from './components/WindowsStartupModal';
import { SettingsModal } from './components/SettingsModal';
import { StatusBar } from './components/StatusBar';
import { Plus, Search, FolderDown, Terminal } from 'lucide-react';

export const App: React.FC = () => {
  const [items, setItems] = useState<AppItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [settings, setSettings] = useState<AppSettings>({
    delay_seconds: 1.5,
    launch_on_boot: true,
    silent_start: true,
  });

  const [windowsItems, setWindowsItems] = useState<WindowsStartupItem[]>([]);
  const [isScanningWindows, setIsScanningWindows] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<AppItem | null>(null);
  const [isWindowsModalOpen, setIsWindowsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Launch Status
  const [launchStatus, setLaunchStatus] = useState<LaunchStatus>({
    status: 'idle',
    total: 0,
    current: 0,
    appName: '',
  });
  const [lastError, setLastError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadConfig();

    const unlistenStatus = listen<LaunchStatus>('launch-status', (event) => {
      setLaunchStatus(event.payload);
      if (event.payload.status === 'completed') {
        setTimeout(() => {
          setLaunchStatus((prev) => (prev.status === 'completed' ? { ...prev, status: 'idle' } : prev));
        }, 3500);
      }
    });

    const unlistenError = listen<{ appName: string; error: string }>('launch-error', (event) => {
      setLastError(`${event.payload.appName}: ${event.payload.error}`);
      setTimeout(() => setLastError(null), 5000);
    });

    return () => {
      unlistenStatus.then((fn) => fn());
      unlistenError.then((fn) => fn());
    };
  }, []);

  const loadConfig = async () => {
    try {
      const config = await invoke<{ items: AppItem[]; settings: AppSettings }>('get_config');
      const sorted = (config.items || []).sort((a, b) => a.order - b.order);
      setItems(sorted);
      if (config.settings) {
        setSettings(config.settings);
      }
    } catch (err) {
      console.error('Error loading config:', err);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    const reordered = arrayMove(items, oldIndex, newIndex).map((item, idx) => ({
      ...item,
      order: idx,
    }));

    setItems(reordered);
    try {
      await invoke('save_items', { items: reordered });
    } catch (err) {
      console.error('Error saving order:', err);
    }
  };

  const handleToggle = async (id: string) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, enabled: !item.enabled } : item
    );
    setItems(updated);
    try {
      await invoke('save_items', { items: updated });
    } catch (err) {
      console.error('Error saving state:', err);
    }
  };

  const handleDelete = async (id: string) => {
    const updated = items
      .filter((item) => item.id !== id)
      .map((item, idx) => ({ ...item, order: idx }));
    setItems(updated);
    try {
      await invoke('delete_item', { id });
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  const handleSaveItem = async (itemData: Partial<AppItem>) => {
    if (itemToEdit) {
      const updatedItem: AppItem = {
        ...itemToEdit,
        ...itemData,
      } as AppItem;

      const updated = items.map((i) => (i.id === updatedItem.id ? updatedItem : i));
      setItems(updated);
      try {
        await invoke('update_item', { item: updatedItem });
      } catch (err) {
        console.error('Error updating item:', err);
      }
    } else {
      const newItem: AppItem = {
        id: `app_${Date.now()}`,
        name: itemData.name || '',
        path: itemData.path || '',
        args: itemData.args || '',
        working_dir: itemData.working_dir || '',
        run_as_admin: !!itemData.run_as_admin,
        enabled: true,
        order: items.length,
      };

      const updated = [...items, newItem];
      setItems(updated);
      try {
        await invoke('add_item', { item: newItem });
      } catch (err) {
        console.error('Error adding item:', err);
      }
    }
  };

  const handleSaveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    try {
      await invoke('save_settings', { settings: newSettings });
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };

  const handleRunAll = async () => {
    setLastError(null);
    try {
      await invoke('run_all');
    } catch (err) {
      setLastError(String(err));
    }
  };

  const handleRunSingle = async (id: string) => {
    try {
      await invoke('run_single', { id });
    } catch (err) {
      setLastError(String(err));
    }
  };

  const handleScanWindows = async () => {
    setIsScanningWindows(true);
    try {
      const scanned = await invoke<WindowsStartupItem[]>('scan_windows');
      setWindowsItems(scanned);
    } catch (err) {
      console.error('Error scanning Windows startup:', err);
    } finally {
      setIsScanningWindows(false);
    }
  };

  const handleImportWindowsItem = async (
    item: WindowsStartupItem,
    disableNative: boolean
  ) => {
    try {
      await invoke('import_windows_item', { item, disableNative });
      await loadConfig();
    } catch (err) {
      console.error('Error importing Windows item:', err);
    }
  };

  const activeCount = useMemo(() => items.filter((i) => i.enabled).length, [items]);

  const displayedItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (i) => i.name.toLowerCase().includes(q) || i.path.toLowerCase().includes(q) || i.args.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  return (
    <div className="flex flex-col h-screen bg-[var(--color-paper)] text-[var(--color-ink)] select-none">
      {/* Top Application Header */}
      <Header
        onOpenAddModal={() => {
          setItemToEdit(null);
          setIsAddModalOpen(true);
        }}
        onOpenWindowsModal={() => {
          handleScanWindows();
          setIsWindowsModalOpen(true);
        }}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onRunAll={handleRunAll}
        isRunning={launchStatus.status === 'launching' || launchStatus.status === 'started'}
        itemCount={items.length}
        activeCount={activeCount}
        delaySeconds={settings.delay_seconds}
      />

      {/* Sequence Telemetry Bar */}
      {items.length > 0 && (
        <div className="h-9 px-4 bg-[var(--color-paper-2)] border-b border-[var(--color-rule)] flex items-center justify-between gap-4">
          <div className="relative w-72">
            <Search className="w-3 h-3 text-[var(--color-ink-3)] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter sequence entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-2.5 py-1 text-xs font-mono bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-[4px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-3)] focus:border-[var(--color-accent)] transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono tabular-nums text-[var(--color-ink-2)]">
            <span>Queue: {activeCount} of {items.length} processes</span>
            <span className="text-[var(--color-ink-3)]">•</span>
            <span>Est. launch duration: ~{(activeCount * settings.delay_seconds).toFixed(1)}s</span>
          </div>
        </div>
      )}

      {/* Main Table / Sequence Area */}
      <main className="flex-1 overflow-y-auto px-4 py-3">
        <div className="max-w-4xl mx-auto">
          {items.length === 0 ? (
            <div className="py-16 px-6 border border-[var(--color-rule)] rounded-[6px] bg-[var(--color-paper-2)] text-center flex flex-col items-center justify-center">
              <div className="w-9 h-9 rounded-[4px] bg-[var(--color-paper-3)] border border-[var(--color-rule)] flex items-center justify-center text-[var(--color-ink-2)] mb-3">
                <Terminal className="w-4 h-4 text-[var(--color-accent)]" />
              </div>
              <h3 className="text-xs font-semibold text-[var(--color-ink)] uppercase font-mono tracking-wider mb-1">
                Startup sequence is empty
              </h3>
              <p className="text-xs text-[var(--color-ink-2)] max-w-sm mb-4 leading-normal">
                Configure your boot sequence by adding your first executable or importing existing apps from Windows.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleScanWindows();
                    setIsWindowsModalOpen(true);
                  }}
                  className="h-7 px-3 text-xs font-medium rounded-[4px] bg-[var(--color-paper)] hover:bg-[var(--color-paper-3)] text-[var(--color-ink)] border border-[var(--color-rule)] flex items-center gap-1.5 transition-colors"
                >
                  <FolderDown className="w-3.5 h-3.5 text-[var(--color-ink-2)]" />
                  <span>Scan Windows</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setItemToEdit(null);
                    setIsAddModalOpen(true);
                  }}
                  className="h-7 px-3 text-xs font-medium rounded-[4px] bg-[var(--color-ink)] hover:bg-white text-[var(--color-paper)] flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add Program</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={displayedItems.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {displayedItems.map((item, index) => (
                    <AppCard
                      key={item.id}
                      item={item}
                      index={index}
                      onToggle={handleToggle}
                      onEdit={(it) => {
                        setItemToEdit(it);
                        setIsAddModalOpen(true);
                      }}
                      onDelete={handleDelete}
                      onRunSingle={handleRunSingle}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>
      </main>

      {/* Docked System Telemetry Footer */}
      <StatusBar
        status={launchStatus}
        lastError={lastError}
        delaySeconds={settings.delay_seconds}
      />

      {/* Modals */}
      <AddEditModal
        isOpen={isAddModalOpen}
        itemToEdit={itemToEdit}
        onClose={() => {
          setIsAddModalOpen(false);
          setItemToEdit(null);
        }}
        onSave={handleSaveItem}
      />

      <WindowsStartupModal
        isOpen={isWindowsModalOpen}
        items={windowsItems}
        isLoading={isScanningWindows}
        onRefresh={handleScanWindows}
        onImport={handleImportWindowsItem}
        onClose={() => setIsWindowsModalOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        settings={settings}
        onClose={() => setIsSettingsModalOpen(false)}
        onSave={handleSaveSettings}
      />
    </div>
  );
};

export default App;
