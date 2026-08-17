'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ChevronDown, ChevronRight, Info } from 'lucide-react';
import StandupKanbanCard from './StandupKanbanCard';
import { getColumnIcon, getColumnColor } from './columnConfig';
import { canTypeEnterColumn, resolveStateForColumn } from '@/lib/kanban-columns';
import type { StandupColumn, StandupWorkItem } from '@/types';

// Done-category columns only show items changed in the last 7 days; this hint
// explains the cutoff so users don't think older items have vanished.
const DONE_WINDOW_HINT = 'Showing items resolved or closed in the last 7 days';

/** Simple droppable column for the standup kanban */
function DroppableColumn({
  name,
  category,
  items,
  activeId,
  isBlocked = false,
  blockedReason,
  onItemClick,
}: {
  name: string;
  category: string;
  items: StandupWorkItem[];
  activeId: number | null;
  /** The dragged card's type has no state for this column — refuse the drop. */
  isBlocked?: boolean;
  blockedReason?: string;
  onItemClick?: (item: StandupWorkItem) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: name, disabled: isBlocked });
  const color = getColumnColor(name, category);
  const isDoneColumn = category === 'Resolved' || category === 'Completed';

  return (
    <div
      className="kanban-column"
      style={isBlocked ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
      title={isBlocked ? blockedReason : undefined}
    >
      <div className="kanban-column-header">
        <div className="flex items-center gap-2">
          <span style={{ color }}>{getColumnIcon(name, category)}</span>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{name}</h3>
          {isDoneColumn && (
            <button
              type="button"
              title={DONE_WINDOW_HINT}
              aria-label={DONE_WINDOW_HINT}
              className="cursor-help"
              style={{ color: 'var(--text-muted)' }}
            >
              <Info size={12} />
            </button>
          )}
        </div>
        <span className="rounded-full bg-[var(--surface-hover)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
          {items.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`kanban-column-content ${isOver ? 'kanban-column-over' : ''}`}
      >
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <StandupKanbanCard
              key={item.id}
              item={item}
              isDragging={activeId === item.id}
              onClick={onItemClick}
            />
          ))}
        </SortableContext>

        {items.length === 0 && (
          <div className="flex h-20 items-center justify-center text-xs text-[var(--text-muted)]">
            No items
          </div>
        )}
      </div>
    </div>
  );
}

interface KanbanGroupSectionProps {
  groupName: string;
  columns: StandupColumn[];
  /** Work item type -> states that type defines. Omit to allow every drop. */
  allowedStatesByType?: Record<string, string[]>;
  onStateChange?: (itemId: number, targetState: string) => Promise<void>;
  onItemClick?: (item: StandupWorkItem) => void;
}

export default function KanbanGroupSection({
  groupName,
  columns,
  allowedStatesByType,
  onStateChange,
  onItemClick,
}: KanbanGroupSectionProps) {
  const columnNames = useMemo(() => columns.map((c) => c.name), [columns]);
  const totalItems = useMemo(() => columns.reduce((sum, c) => sum + c.items.length, 0), [columns]);

  const [expanded, setExpanded] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Local state for drag-and-drop reactivity, keyed by column name
  const [localItems, setLocalItems] = useState<Record<string, StandupWorkItem[]>>(() => {
    const map: Record<string, StandupWorkItem[]> = {};
    for (const col of columns) {
      map[col.name] = col.items;
    }
    return map;
  });

  // Reset the optimistic board back to what the server last told us. Used both
  // to sync after a refresh and to roll back a drag that didn't stick.
  const syncFromProps = useCallback(() => {
    const map: Record<string, StandupWorkItem[]> = {};
    for (const col of columns) {
      map[col.name] = col.items;
    }
    setLocalItems(map);
  }, [columns]);

  // Sync with prop changes (e.g. after refresh)
  useEffect(() => {
    syncFromProps();
  }, [syncFromProps]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Find which column an item is in
  const findColumn = useCallback(
    (itemId: number | string): string | null => {
      const id = Number(itemId);
      for (const colName of columnNames) {
        if (localItems[colName]?.some((i) => i.id === id)) return colName;
      }
      // Check if the ID is a column name
      if (columnNames.includes(String(itemId))) return String(itemId);
      return null;
    },
    [localItems, columnNames]
  );

  const activeItem = useMemo(() => {
    if (!activeId) return null;
    for (const colName of columnNames) {
      const found = localItems[colName]?.find((i) => i.id === activeId);
      if (found) return found;
    }
    return null;
  }, [activeId, localItems, columnNames]);

  // Columns the dragged card can't enter, because its work item type defines no
  // matching state. Empty while nothing is being dragged, and empty whenever we
  // have no state list for the type — the server stays the authority (#391).
  const blockedColumns = useMemo(() => {
    if (!activeItem) return new Set<string>();
    return new Set(
      columnNames.filter(
        (name) => !canTypeEnterColumn(activeItem.workItemType, name, allowedStatesByType)
      )
    );
  }, [activeItem, columnNames, allowedStatesByType]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeItemId = active.id as number;
      const overId = String(over.id);

      const sourceCol = findColumn(activeItemId);
      const targetCol = columnNames.includes(overId) ? overId : findColumn(overId);

      if (!sourceCol || !targetCol || sourceCol === targetCol) return;

      setLocalItems((prev) => {
        const item = prev[sourceCol]?.find((i) => i.id === activeItemId);
        if (!item) return prev;
        return {
          ...prev,
          [sourceCol]: prev[sourceCol].filter((i) => i.id !== activeItemId),
          [targetCol]: [...(prev[targetCol] || []), item],
        };
      });
    },
    [findColumn, columnNames]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active } = event;
      setActiveId(null);

      if (!event.over || !onStateChange) {
        // Rollback visual state if no handler
        syncFromProps();
        return;
      }

      const activeItemId = active.id as number;
      const targetCol = findColumn(activeItemId);
      if (!targetCol) return;

      // Find original column from props
      const originalCol = columns.find((c) => c.items.some((i) => i.id === activeItemId));
      if (originalCol?.name === targetCol) return; // No change

      // Blocked columns are already disabled as drop targets, so this only
      // trips if the cached state list went stale mid-session. Say so plainly
      // rather than letting DevOps answer with a raw rule error.
      const dragged = originalCol?.items.find((i) => i.id === activeItemId);
      if (dragged && !canTypeEnterColumn(dragged.workItemType, targetCol, allowedStatesByType)) {
        syncFromProps();
        toast.error(`${dragged.workItemType} work items have no "${targetCol}" state`);
        return;
      }

      setIsUpdating(true);
      try {
        // The column label is not necessarily the state name — "To Do" is the
        // state "Todo" in the KnowAll process — so translate before writing.
        await onStateChange(
          activeItemId,
          resolveStateForColumn(dragged?.workItemType, targetCol, allowedStatesByType)
        );
      } catch (error) {
        console.error('Failed to update state:', error);
        syncFromProps();
        // Surface the upstream reason. A work item can only enter states its
        // own work item type defines, so drops onto a column the type has no
        // state for are rejected by DevOps ("TF401320: Rule Error…"). Without
        // this toast the card just snaps back with no explanation (#391, #366).
        toast.error(
          error instanceof Error && error.message
            ? `Couldn't move to "${targetCol}": ${error.message}`
            : `Couldn't move to "${targetCol}"`
        );
      } finally {
        setIsUpdating(false);
      }
    },
    [onStateChange, findColumn, columns, allowedStatesByType, syncFromProps]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    syncFromProps();
  }, [syncFromProps]);

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-white/5"
      >
        <span style={{ color: 'var(--text-muted)' }}>
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </span>

        <h3 className="flex-1 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
          {groupName}
        </h3>

        {totalItems === 0 && (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            No items
          </span>
        )}
      </button>

      {/* Kanban board */}
      {expanded && totalItems > 0 && (
        <div className="border-t" style={{ borderColor: 'var(--border)' }}>
          {isUpdating && (
            <div className="bg-[var(--primary)] px-4 py-1.5 text-center text-xs text-white">
              Updating...
            </div>
          )}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="kanban-columns" style={{ padding: '0.75rem' }}>
              {columns.map((col) => {
                const items = localItems[col.name] || [];
                const isBlocked = blockedColumns.has(col.name);
                return (
                  <DroppableColumn
                    key={col.name}
                    name={col.name}
                    category={col.category}
                    items={items}
                    activeId={activeId}
                    isBlocked={isBlocked}
                    blockedReason={
                      isBlocked && activeItem
                        ? `${activeItem.workItemType} work items have no "${col.name}" state`
                        : undefined
                    }
                    onItemClick={onItemClick}
                  />
                );
              })}
            </div>

            <DragOverlay>
              {activeItem ? <StandupKanbanCard item={activeItem} isDragging /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}
    </div>
  );
}
