import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, Users } from 'lucide-react';
import { useMeta, useProspects } from '../api';
import { Badge, Button, Empty, ErrorBox, Input, Loading, Select, useDebounce } from '../components/ui';
import { PageHeader } from '../components/Layout';
import { ProspectFormModal } from './ProspectForm';
import { formatCurrency, relativeTime } from '@shared/utils';
import { segmentLabel } from '@shared/segments';
import { STAGES, stageLabel } from '@shared/stages';

export function Prospects() {
  const [sp, setSp] = useSearchParams();
  const [q, setQ] = useState(sp.get('q') ?? '');
  const dq = useDebounce(q, 250);
  const stage = sp.get('stage') ?? '';
  const segment = sp.get('segment') ?? '';
  const { data, isLoading, error } = useProspects({ q: dq, stage, segment });
  const { data: meta } = useMeta();
  const [newOpen, setNewOpen] = useState(false);
  const setParam = (k: string, v: string) => {
    const n = new URLSearchParams(sp);
    if (v) n.set(k, v);
    else n.delete(k);
    setSp(n, { replace: true });
  };
  return (
    <>
      <PageHeader
        title="Prospects"
        sub={data ? `${data.length} empresa(s)` : undefined}
        actions={
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setNewOpen(true)}>
            Novo Prospect
          </Button>
        }
      />
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, cidade, Instagram…"
            className="pl-9"
          />
        </div>
        <Select value={stage} onChange={(e) => setParam('stage', e.target.value)} className="w-44">
          <option value="">Todas as etapas</option>
          {STAGES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </Select>
        <Select value={segment} onChange={(e) => setParam('segment', e.target.value)} className="w-52">
          <option value="">Todos os segmentos</option>
          {meta?.segments.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>
      {isLoading && <Loading />}
      {error && <ErrorBox error={error} />}
      {data && data.length === 0 && (
        <div className="card">
          <Empty
            icon={<Users className="w-8 h-8" />}
            title="Nenhum prospect"
            text="Cadastre a primeira empresa: basta o nome. Depois audite o site, gere uma prévia e envie a proposta."
            action={
              <Button variant="primary" onClick={() => setNewOpen(true)}>
                Novo Prospect
              </Button>
            }
          />
        </div>
      )}
      {data && data.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Segmento</th>
                <th>Etapa</th>
                <th>Nota GZ</th>
                <th>Prévias</th>
                <th>Valor</th>
                <th>Atualizado</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => {
                const st = STAGES.find((s) => s.id === p.stage);
                return (
                  <tr key={p.id}>
                    <td>
                      <Link to={`/prospects/${p.id}`} className="font-semibold hover:text-accent">
                        {p.name}
                      </Link>
                      <div className="text-xs text-muted">
                        {[p.city, p.state].filter(Boolean).join('/') || p.instagram || p.website || '—'}
                      </div>
                    </td>
                    <td className="text-muted">{segmentLabel(p.segment)}</td>
                    <td>
                      <Badge color={st?.color}>{stageLabel(p.stage)}</Badge>
                    </td>
                    <td>
                      {p.auditScore == null ? (
                        <span className="text-muted-2">—</span>
                      ) : (
                        <span
                          className={
                            p.auditScore >= 70 ? 'text-ok' : p.auditScore >= 45 ? 'text-warn' : 'text-bad'
                          }
                        >
                          {p.auditScore}
                        </span>
                      )}
                    </td>
                    <td className="text-muted">{p.previewsCount || '—'}</td>
                    <td>{formatCurrency(p.closedValue ?? p.potentialValue)}</td>
                    <td className="text-muted text-xs">{relativeTime(p.updatedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <ProspectFormModal open={newOpen} onClose={() => setNewOpen(false)} />
    </>
  );
}
