/* Hallmark · genre: modern-minimal · macrostructure: Workbench · design-system: design.md · designed-as-app */
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AppItem } from '../types';
import {
  GripVertical,
  Play,
  Pencil,
  Trash2,
  Shield,
  Terminal,
} from 'lucide-react';

interface AppCardProps {
  item: AppItem;
  index: number;
  onToggle: (id: string) => void;
  onEdit: (item: AppItem) => void;
  onDelete: (id: string) => void;
  onRunSingle: (id: string) => void;
}

export const AppCard: React.FC<AppCardProps> = ({
  item,
  index,
  onToggle,
  onEdit,
  onDelete,
  onRunSingle,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  const formattedIndex = String(index + 1).padStart(2, '0');

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center justify-between px-3 py-2 rounded-[5px] border transition-colors ${
        isDragging
          ? 'bg-[var(--color-paper-3)] border-[var(--color-accent)] opacity-95'
          : item.enabled
          ? 'bg-[var(--color-paper-2)] hover:bg-[var(--color-paper-3)] border-[var(--color-rule)]'
          : 'bg-[var(--color-paper)] border-[var(--color-rule)] opacity-40 hover:opacity-70'
      }`}
    >
      {/* Sequence Item Details */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {/* Grip Handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-[var(--color-ink-3)] group-hover:text-[var(--color-ink-2)] p-0.5 rounded transition-colors"
          title="Drag to change position in sequence"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>

        {/* Tabular Order Number */}
        <span className="font-mono text-xs tabular-nums text-[var(--color-ink-3)] w-5 select-none font-medium">
          {formattedIndex}
        </span>

        {/* App Info Grid */}
        <div className="min-w-0 flex-1 pr-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--color-ink)] truncate font-sans">
              {item.name}
            </span>

            {item.run_as_admin && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[var(--color-signal-warn)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] px-1 py-0.2 rounded-[3px]" title="Requires administrator privileges (UAC)">
                <Shield className="w-2.5 h-2.5 fill-current" />
                ADMIN
              </span>
            )}

            {item.args && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[var(--color-ink-2)] bg-[var(--color-paper)] border border-[var(--color-rule)] px-1 py-0.2 rounded-[3px] truncate max-w-[180px]" title={`Arguments: ${item.args}`}>
                <Terminal className="w-2.5 h-2.5 text-[var(--color-ink-3)]" />
                {item.args}
              </span>
            )}
          </div>

          <p className="text-[11px] text-[var(--color-ink-2)] font-mono truncate mt-0.5 select-text" title={item.path}>
            {item.path}
          </p>
        </div>
      </div>

      {/* Row Actions */}
      <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
          <button
            type="button"
            onClick={() => onRunSingle(item.id)}
            className="h-6 w-6 rounded-[3px] flex items-center justify-center text-[var(--color-ink-2)] hover:text-[var(--color-signal-run)] hover:bg-[var(--color-paper)] border border-transparent hover:border-[var(--color-rule)] transition-colors"
            title="Test launch single process"
          >
            <Play className="w-3 h-3 fill-current" />
          </button>

          <button
            type="button"
            onClick={() => onEdit(item)}
            className="h-6 w-6 rounded-[3px] flex items-center justify-center text-[var(--color-ink-2)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper)] border border-transparent hover:border-[var(--color-rule)] transition-colors"
            title="Edit parameters"
          >
            <Pencil className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="h-6 w-6 rounded-[3px] flex items-center justify-center text-[var(--color-ink-2)] hover:text-[var(--color-signal-err)] hover:bg-[var(--color-paper)] border border-transparent hover:border-[var(--color-rule)] transition-colors"
            title="Remove from sequence"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>

        <div className="h-3 w-[1px] bg-[var(--color-rule)] mx-0.5" />

        {/* Compact Mechanical Toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={item.enabled}
          onClick={() => onToggle(item.id)}
          className={`relative inline-flex h-3.5 w-6 flex-shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-100 ${
            item.enabled ? 'bg-[var(--color-ink)]' : 'bg-[var(--color-rule)]'
          }`}
          title={item.enabled ? 'Enabled (launches on boot)' : 'Disabled'}
        >
          <span
            className={`pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full shadow-sm transition duration-100 ${
              item.enabled ? 'translate-x-2.5 bg-[var(--color-paper)]' : 'translate-x-0.5 bg-[var(--color-ink-3)]'
            }`}
          />
        </button>
      </div>
    </div>
  );
};
