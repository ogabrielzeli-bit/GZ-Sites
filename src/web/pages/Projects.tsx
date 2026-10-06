import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FolderKanban, Plus } from 'lucide-react';
import { api, useApiMutation, useMeta, useProjects, type Project } from '../api';
import {
  Badge,
  Button,
  Empty,
  ErrorBox,
  Field,
  Input,
  Loading,
  Modal,
  Select,
  useToast,
} from '../components/ui';
import { PageHeader } from '../components/Layout';
import { relativeTime } from '@shared/utils';

export const PROJECT_STATUS: Record<Project['status'], { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: '#8e8e9a' },
  built: { label: 'Build OK', color: '#5b8def' },
  'qa-pass': { label: 'QA PASS', color: '#36c27a' },
  'qa-warning': { label: 'QA WARNING', color: '#f2a93b' },
  'qa-fail': { label: 'QA FAIL', color: '#ef5a5a' },
  exported: { label: 'Exportado', color: '#d4ff2b' },
};

export function Projects() {
  const { data, isLoading, error } = useProjects();
  const [open, setOpen] = useState(false);
  return (
    <>
      <PageHeader
        title="Projetos"
        sub="Sites em produção: build, QA, export e deploy."
        actions={
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setOpen(true)}>
            Criar projeto
          </Button>
        }
      />
      {isLoading && <Loading />}
      {error && <ErrorBox error={error} />}
      {data && data.length === 0 && (
        <div className="card">
          <Empty
            icon={<FolderKanban className="w-8 h-8" />}
            title="Nenhum projeto"
            text="Quando um prospect fechar, clique em “Criar projeto” na ficha dele (ou crie um projeto avulso aqui)."
            action={
              <Button variant="primary" onClick={() => setOpen(true)}>
                Criar projeto
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
                <th>Projeto</th>
                <th>Domínio</th>
                <th>Status</th>
                <th>Último build</th>
                <th>QA</th>
                <th>Atualizado</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link to={`/projects/${p.id}`} className="font-semibold hover:text-accent">
                      {p.name}
                    </Link>
                    <div className="text-xs text-muted mono">{p.slug}</div>
                  </td>
                  <td className="text-muted">{p.domain ?? '—'}</td>
                  <td>
                    <Badge color={PROJECT_STATUS[p.status].color}>{PROJECT_STATUS[p.status].label}</Badge>
                  </td>
                  <td className="text-muted text-xs">{p.lastBuildAt ? relativeTime(p.lastBuildAt) : '—'}</td>
                  <td className="text-xs">
                    {p.lastQa ? (
                      <span
                        className={
                          p.lastQa.status === 'pass'
                            ? 'text-ok'
                            : p.lastQa.status === 'warning'
                              ? 'text-warn'
                              : 'text-bad'
                        }
                      >
                        {p.lastQa.counts.fail} fail · {p.lastQa.counts.warning} warn
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="text-muted text-xs">{relativeTime(p.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <NewProjectModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function NewProjectModal({
  open,
  onClose,
  prospectId,
  defaultName,
}: {
  open: boolean;
  onClose: () => void;
  prospectId?: string;
  defaultName?: string;
}) {
  const [name, setName] = useState(defaultName ?? '');
  const [domain, setDomain] = useState('');
  const [segment, setSegment] = useState('servicos');
  const { data: meta } = useMeta();
  const nav = useNavigate();
  const toast = useToast();
  const create = useApiMutation(
    (body: Record<string, unknown>) => api.post<Project>('/projects', body),
    [['projects'], ['prospect', prospectId]],
    (p) => {
      toast.ok('Projeto criado');
      onClose();
      nav(`/projects/${p.id}`);
    },
  );
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Criar projeto"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            loading={create.isPending}
            onClick={() =>
              name.trim()
                ? create.mutate(
                    {
                      name,
                      domain: domain || undefined,
                      prospectId: prospectId ?? null,
                      ...(prospectId ? {} : { segment }),
                    },
                    { onError: (e) => toast.err(e.message) },
                  )
                : toast.err('Informe o nome')
            }
          >
            Criar projeto
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Field label="Nome do projeto / cliente *">
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </Field>
        <Field label="Domínio (opcional)" hint="Usado no canonical, sitemap e Open Graph.">
          <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="empresa.com.br" />
        </Field>
        {!prospectId && (
          <Field label="Segmento" hint="Projeto avulso (sem prospect) é gerado com o preset do segmento.">
            <Select value={segment} onChange={(e) => setSegment(e.target.value)}>
              {meta?.segments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <p className="text-xs text-muted">
          O projeto é criado em <span className="mono">data/projects/&lt;slug&gt;/</span> com{' '}
          <span className="mono">site.config.json</span>, assets e scripts de build. Depois: Build → QA →
          Exportar.
        </p>
      </div>
    </Modal>
  );
}
