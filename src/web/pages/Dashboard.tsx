import { Link } from 'react-router-dom';
import { Plus, CheckSquare, Clock } from 'lucide-react';
import { useDashboard, useMeta, useApiMutation, api, useSettings } from '../api';
import { Button, Card, ErrorBox, Kpi, Loading, Empty } from '../components/ui';
import { PageHeader } from '../components/Layout';
import { formatCurrency, relativeTime, formatDate } from '@shared/utils';
import { stageLabel } from '@shared/stages';
import { useState } from 'react';
import { ProspectFormModal } from './ProspectForm';

export function Dashboard() {
  const { data, isLoading, error } = useDashboard();
  const { data: meta } = useMeta();
  const { data: settings } = useSettings();
  const [newOpen, setNewOpen] = useState(false);
  const doneTask = useApiMutation((id: string) => api.patch(`/tasks/${id}`, { done: true }), [['tasks']]);
  if (isLoading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  if (!data) return null;
  const cur = (v: number) => formatCurrency(v, settings?.currency, settings?.locale);
  const maxStage = Math.max(1, ...data.byStage.map((s) => s.count));
  return (
    <>
      <PageHeader
        title="Dashboard"
        sub={settings?.slogan}
        actions={
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setNewOpen(true)}>
            Novo Prospect
          </Button>
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3 mb-6">
        <Kpi label="Prospects" value={data.counts.prospects} />
        <Kpi label="Auditados" value={data.counts.audited} />
        <Kpi label="Prévias geradas" value={data.counts.previews} />
        <Kpi label="Propostas enviadas" value={data.counts.proposalsSent} />
        <Kpi label="Clientes fechados" value={data.counts.closed} accent />
        <Kpi label="Sites em produção" value={data.counts.inProduction} />
        <Kpi label="Sites concluídos" value={data.counts.delivered} />
        <Kpi label="Pipeline potencial" value={cur(data.pipelineValue)} />
        <Kpi label="Valor vendido" value={cur(data.soldValue)} accent />
        <Kpi label="Tarefas pendentes" value={data.counts.tasksPending} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card
          title="Pipeline"
          className="lg:col-span-2"
          actions={
            <Link to="/pipeline" className="text-xs text-muted hover:text-text">
              Abrir kanban →
            </Link>
          }
        >
          <div className="grid grid-cols-9 gap-2 items-end h-40">
            {data.byStage.map((s) => {
              const st = meta?.stages.find((m) => m.id === s.stage);
              return (
                <Link
                  to={`/prospects?stage=${s.stage}`}
                  key={s.stage}
                  className="flex flex-col items-center gap-1 h-full justify-end group"
                  title={`${s.count} · ${cur(s.value)}`}
                >
                  <span className="text-xs font-bold">{s.count}</span>
                  <div
                    className="w-full rounded-md transition group-hover:opacity-80"
                    style={{
                      height: `${Math.max(6, (s.count / maxStage) * 100)}%`,
                      background: st?.color ?? '#555',
                    }}
                  />
                  <span className="text-[10px] text-muted truncate w-full text-center">
                    {stageLabel(s.stage)}
                  </span>
                </Link>
              );
            })}
          </div>
        </Card>

        <Card title="Follow-ups próximos">
          {data.followups.length === 0 ? (
            <p className="text-muted text-sm">Nenhum follow-up nos próximos 3 dias.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {data.followups.map((f) => (
                <li key={f.id}>
                  <Link
                    to={`/prospects/${f.id}`}
                    className="flex items-center justify-between gap-2 text-sm hover:text-accent"
                  >
                    <span className="truncate">{f.name}</span>
                    <span className="text-xs text-muted flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" /> {formatDate(f.nextFollowupAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Tarefas pendentes" className="lg:col-span-1">
          {data.tasks.length === 0 ? (
            <Empty title="Tudo em dia" text="Crie tarefas na ficha de cada prospect." />
          ) : (
            <ul className="flex flex-col gap-2">
              {data.tasks.map((t) => (
                <li key={t.id} className="flex items-start gap-2 text-sm">
                  <button
                    className="text-muted hover:text-ok mt-0.5"
                    onClick={() => doneTask.mutate(t.id)}
                    aria-label="Concluir"
                  >
                    <CheckSquare className="w-4 h-4" />
                  </button>
                  <div className="min-w-0">
                    <div className="truncate">{t.title}</div>
                    <div className="text-xs text-muted">
                      {t.prospectName ? (
                        <Link to={`/prospects/${t.prospectId}`} className="hover:text-text">
                          {t.prospectName}
                        </Link>
                      ) : (
                        'Geral'
                      )}
                      {t.dueAt && ` · ${formatDate(t.dueAt)}`}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Atividade recente" className="lg:col-span-2">
          {data.recentActivity.length === 0 ? (
            <Empty
              title="Nenhuma atividade ainda"
              text="Cadastre seu primeiro prospect para começar."
              action={
                <Button variant="primary" onClick={() => setNewOpen(true)}>
                  Novo Prospect
                </Button>
              }
            />
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {data.recentActivity.map((a) => (
                <li key={a.id} className="py-2 flex items-start justify-between gap-3 text-sm">
                  <span className="min-w-0">
                    {a.prospectId ? (
                      <Link to={`/prospects/${a.prospectId}`} className="hover:text-accent">
                        {a.description}
                      </Link>
                    ) : (
                      a.description
                    )}
                  </span>
                  <span className="text-xs text-muted shrink-0">{relativeTime(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <ProspectFormModal open={newOpen} onClose={() => setNewOpen(false)} />
    </>
  );
}
