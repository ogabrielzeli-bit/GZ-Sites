import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { api, useApiMutation, useProspects, useSettings, type ProspectRow } from '../api';
import { Button, ErrorBox, Loading, useToast } from '../components/ui';
import { PageHeader } from '../components/Layout';
import { STAGES } from '@shared/stages';
import { formatCurrency, relativeTime } from '@shared/utils';
import { segmentLabel } from '@shared/segments';
import { ProspectFormModal } from './ProspectForm';

export function Pipeline() {
  const { data, isLoading, error } = useProspects();
  const { data: settings } = useSettings();
  const [active, setActive] = useState<ProspectRow | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const toast = useToast();
  const move = useApiMutation(
    ({ id, stage }: { id: string; stage: string }) => api.post(`/prospects/${id}/stage`, { stage }),
    [['prospects'], ['prospect']],
  );
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );
  const byStage = useMemo(() => {
    const m = new Map<string, ProspectRow[]>();
    for (const s of STAGES) m.set(s.id, []);
    for (const p of data ?? []) m.get(p.stage)?.push(p);
    return m;
  }, [data]);
  const onStart = (e: DragStartEvent) => setActive((data ?? []).find((p) => p.id === e.active.id) ?? null);
  const onEnd = (e: DragEndEvent) => {
    setActive(null);
    const id = String(e.active.id);
    const stage = e.over ? String(e.over.id) : null;
    const p = (data ?? []).find((x) => x.id === id);
    if (!p || !stage || p.stage === stage) return;
    move.mutate({ id, stage }, { onError: (err) => toast.err(err.message) });
  };
  if (isLoading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  return (
    <>
      <PageHeader
        title="Pipeline"
        sub="Arraste os cards entre as etapas."
        actions={
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setNewOpen(true)}>
            Novo Prospect
          </Button>
        }
      />
      <DndContext
        sensors={sensors}
        onDragStart={onStart}
        onDragEnd={onEnd}
        onDragCancel={() => setActive(null)}
      >
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          {STAGES.map((s) => {
            const list = byStage.get(s.id) ?? [];
            const total = list.reduce(
              (a, p) => a + ((s.won ? p.closedValue : null) ?? p.potentialValue ?? 0),
              0,
            );
            return (
              <Column
                key={s.id}
                id={s.id}
                label={s.label}
                color={s.color}
                count={list.length}
                total={formatCurrency(total, settings?.currency, settings?.locale)}
              >
                {list.map((p) => (
                  <CardItem key={p.id} p={p} />
                ))}
              </Column>
            );
          })}
        </div>
        <DragOverlay>{active ? <CardBody p={active} dragging /> : null}</DragOverlay>
      </DndContext>
      <ProspectFormModal open={newOpen} onClose={() => setNewOpen(false)} />
    </>
  );
}

function Column({
  id,
  label,
  color,
  count,
  total,
  children,
}: {
  id: string;
  label: string;
  color: string;
  count: number;
  total: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`kanban-col ${isOver ? 'border-accent/60 bg-panel' : ''}`}>
      <div className="flex items-center justify-between px-1 pt-1 pb-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full" style={{ background: color }} />
          {label}
          <span className="text-muted font-normal">{count}</span>
        </div>
        <span className="text-[11px] text-muted">{total}</span>
      </div>
      <div className="flex flex-col gap-2 min-h-24">{children}</div>
    </div>
  );
}

function CardItem({ p }: { p: ProspectRow }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: p.id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={{ opacity: isDragging ? 0.3 : 1 }}>
      <CardBody p={p} />
    </div>
  );
}

function CardBody({ p, dragging }: { p: ProspectRow; dragging?: boolean }) {
  return (
    <div className={`kanban-card ${dragging ? 'shadow-2xl rotate-1 border-accent/50' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <Link
          to={`/prospects/${p.id}`}
          className="font-semibold text-sm leading-tight hover:text-accent"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {p.name}
        </Link>
        {p.auditScore != null && (
          <span
            className={`text-xs font-bold ${p.auditScore >= 70 ? 'text-ok' : p.auditScore >= 45 ? 'text-warn' : 'text-bad'}`}
          >
            {p.auditScore}
          </span>
        )}
      </div>
      <div className="text-[11px] text-muted mt-1 truncate">
        {segmentLabel(p.segment)}
        {p.city ? ` · ${p.city}` : ''}
      </div>
      <div className="flex items-center justify-between mt-2 text-[11px]">
        <span className="font-medium">{formatCurrency(p.closedValue ?? p.potentialValue)}</span>
        <span className="text-muted-2">{relativeTime(p.lastContactAt ?? p.updatedAt)}</span>
      </div>
    </div>
  );
}
