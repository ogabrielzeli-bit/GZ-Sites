import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Hammer,
  Play,
  Rocket,
  Save,
  ShieldCheck,
  Trash2,
  Wand2,
} from 'lucide-react';
import { api, useApiMutation, useMeta, useProject, type ProjectFull } from '../api';
import {
  Badge,
  Button,
  Card,
  Confirm,
  Empty,
  ErrorBox,
  Field,
  Input,
  Loading,
  Modal,
  Select,
  StatusBadge,
  Tabs,
  Textarea,
  useToast,
} from '../components/ui';
import { PageHeader } from '../components/Layout';
import { PROJECT_STATUS } from './Projects';
import { formatDate, relativeTime } from '@shared/utils';
import type { QaReport, QaScreenshot } from '../../qa/types';

type QaReportWeb = Omit<QaReport, 'screenshots'> & {
  htmlUrl: string;
  screenshots: (QaScreenshot & { url: string })[];
};

type Tab = 'overview' | 'config' | 'qa' | 'files';

export function ProjectDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('overview');
  const [delOpen, setDelOpen] = useState(false);
  const { data: p0, isLoading, error } = useProject(id);
  const { data: p1 } = useProject(id, !!p0?.activeJobs.length);
  const p = p1 ?? p0;
  const build = useApiMutation(
    () => api.post<{ files: number; warnings: string[] }>(`/projects/${id}/build`),
    [['project', id], ['projects']],
    (r) =>
      toast.ok(
        `Build concluído: ${r.files} arquivos${r.warnings.length ? ` · ${r.warnings.length} aviso(s)` : ''}`,
      ),
  );
  const qa = useApiMutation(
    () => api.post(`/projects/${id}/qa`, {}),
    [['project', id]],
    () => {
      toast.info('QA iniciado: build, lint, links, 5 viewports, formulário, Lighthouse…');
      setTab('qa');
    },
  );
  const exp = useApiMutation(
    (kind: 'netlify' | 'full') =>
      api.post<{ url: string; bytes: number; file: string }>(`/projects/${id}/export`, { kind }),
    [['project', id], ['projects']],
    (r) => {
      window.location.href = r.url;
      toast.ok(`${r.file} (${(r.bytes / 1024).toFixed(0)} KB)`);
    },
  );
  const del = useApiMutation(
    () => api.del(`/projects/${id}`),
    [['projects']],
    () => {
      toast.ok('Projeto excluído');
      nav('/projects');
    },
  );
  if (isLoading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  if (!p) return null;
  const qaRunning = p.activeJobs.find((j) => j.kind === 'qa');
  return (
    <>
      <Link to="/projects" className="inline-flex items-center gap-1 text-xs text-muted hover:text-text mb-3">
        <ArrowLeft className="w-3 h-3" /> Projetos
      </Link>
      <PageHeader
        title={p.name}
        sub={
          <span className="flex flex-wrap items-center gap-2">
            <Badge color={PROJECT_STATUS[p.status].color}>{PROJECT_STATUS[p.status].label}</Badge>
            <span className="mono">{p.slug}</span>
            {p.domain && <span>· {p.domain}</span>}
            {p.prospectId && (
              <Link to={`/prospects/${p.prospectId}`} className="hover:text-text">
                · ver prospect
              </Link>
            )}
          </span>
        }
        actions={
          <Button variant="ghost" size="icon" onClick={() => setDelOpen(true)} aria-label="Excluir">
            <Trash2 className="w-4 h-4" />
          </Button>
        }
      />
      <div className="flex flex-wrap gap-2 mb-5">
        <Button
          variant="primary"
          icon={<Hammer className="w-4 h-4" />}
          loading={build.isPending}
          onClick={() => build.mutate(undefined, { onError: (e) => toast.err(e.message) })}
        >
          Build site
        </Button>
        <Button
          variant="primary"
          icon={<ShieldCheck className="w-4 h-4" />}
          loading={!!qaRunning}
          onClick={() => qa.mutate(undefined, { onError: (e) => toast.err(e.message) })}
        >
          {qaRunning ? qaRunning.progress : 'Rodar QA'}
        </Button>
        {p.previewUrl && (
          <a className="btn btn-secondary" href={p.previewUrl} target="_blank" rel="noreferrer">
            <Play className="w-4 h-4" /> Abrir site
          </a>
        )}
        <Button
          icon={<Download className="w-4 h-4" />}
          loading={exp.isPending}
          onClick={() => exp.mutate('netlify', { onError: (e) => toast.err(e.message) })}
        >
          Exportar ZIP (Netlify)
        </Button>
        <Button
          icon={<Download className="w-4 h-4" />}
          loading={exp.isPending}
          onClick={() => exp.mutate('full', { onError: (e) => toast.err(e.message) })}
        >
          Exportar projeto completo
        </Button>
        <DeployButton p={p} />
      </div>
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: 'overview', label: 'Visão geral' },
          { id: 'config', label: 'Conteúdo & config' },
          { id: 'qa', label: 'GZ Quality Report' },
          { id: 'files', label: 'Arquivos' },
        ]}
      />
      <div className="mt-5">
        {tab === 'overview' && <Overview p={p} goQa={() => setTab('qa')} />}
        {tab === 'config' && <ConfigEditor p={p} />}
        {tab === 'qa' && <QaView p={p} />}
        {tab === 'files' && <FilesView p={p} />}
      </div>
      <Confirm
        open={delOpen}
        onClose={() => setDelOpen(false)}
        onConfirm={() => del.mutate(undefined)}
        title="Excluir projeto?"
        text="A pasta do projeto (config, assets, build e relatórios) será apagada."
        danger
      />
    </>
  );
}

function Overview({ p, goQa }: { p: ProjectFull; goQa: () => void }) {
  const cfg = p.config as any;
  const sections: string[] = (cfg?.pages?.[0]?.sections ?? []).map(
    (s: any) => s.type + (s.variant ? `/${s.variant}` : ''),
  );
  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <Card title="Fluxo">
        <ol className="flex flex-col gap-3 text-sm">
          {[
            ['Projeto criado', true, formatDate(p.createdAt)],
            ['Build', !!p.lastBuildAt, p.lastBuildAt ? relativeTime(p.lastBuildAt) : 'clique em Build site'],
            [
              'QA',
              !!p.lastQa,
              p.lastQa
                ? `${p.lastQa.status.toUpperCase()} · ${relativeTime(p.lastQa.ranAt)}`
                : 'clique em Rodar QA',
            ],
            [
              'Export / deploy',
              p.status === 'exported',
              p.status === 'exported' ? 'ZIP gerado' : 'exporte para a Netlify',
            ],
          ].map(([label, done, sub], i) => (
            <li key={i} className="flex items-start gap-3">
              <span
                className={`w-5 h-5 rounded-full grid place-items-center text-[10px] font-bold ${done ? 'bg-ok text-black' : 'bg-panel-2 text-muted'}`}
              >
                {i + 1}
              </span>
              <div>
                <div className={done ? '' : 'text-muted'}>{label as string}</div>
                <div className="text-xs text-muted">{sub as string}</div>
              </div>
            </li>
          ))}
        </ol>
      </Card>
      <Card
        title="Último QA"
        actions={
          p.lastQa && (
            <Button size="sm" variant="ghost" onClick={goQa}>
              Ver relatório
            </Button>
          )
        }
      >
        {!p.lastQa ? (
          <p className="text-sm text-muted">
            Ainda não rodou. O QA testa build, lint, links, console, 5 viewports, imagens, botões, formulário,
            segurança e Lighthouse.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <StatusBadge status={p.lastQa.status} />
            <div className="text-sm">
              <span className="text-ok">{p.lastQa.counts.pass} pass</span> ·{' '}
              <span className="text-warn">{p.lastQa.counts.warning} warning</span> ·{' '}
              <span className="text-bad">{p.lastQa.counts.fail} fail</span>
            </div>
            {p.lastQa.lighthouse && (
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  ['Perf', p.lastQa.lighthouse.performance],
                  ['A11y', p.lastQa.lighthouse.accessibility],
                  ['SEO', p.lastQa.lighthouse.seo],
                  ['BP', p.lastQa.lighthouse.bestPractices],
                ].map(([l, v]) => (
                  <div key={l as string} className="bg-bg-2 rounded-lg p-2">
                    <div
                      className={`text-lg font-bold ${(v as number) >= 90 ? 'text-ok' : (v as number) >= 60 ? 'text-warn' : 'text-bad'}`}
                    >
                      {v ?? '—'}
                    </div>
                    <div className="text-[10px] text-muted uppercase">{l as string}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
      <Card title="Estrutura do site">
        <div className="text-xs text-muted mb-2">
          Tema <b className="text-text">{cfg?.theme?.id}</b> · {sections.length} seções · formulário via{' '}
          <b className="text-text">{cfg?.integrations?.form}</b>
        </div>
        <ol className="text-xs flex flex-wrap gap-1">
          {sections.map((s, i) => (
            <li key={i} className="bg-panel-2 rounded px-1.5 py-0.5 mono">
              {s}
            </li>
          ))}
        </ol>
        <p className="text-xs text-muted mt-3">
          Pasta: <span className="mono">{p.path}</span>
        </p>
      </Card>
    </div>
  );
}

function ConfigEditor({ p }: { p: ProjectFull }) {
  const toast = useToast();
  const { data: meta } = useMeta();
  const [json, setJson] = useState(JSON.stringify(p.config, null, 2));
  const [domain, setDomain] = useState(p.domain ?? '');
  const [theme, setTheme] = useState((p.config as any)?.theme?.id ?? '');
  const [form, setForm] = useState((p.config as any)?.integrations?.form ?? 'whatsapp');
  const [analytics, setAnalytics] = useState(
    (p.config as any)?.integrations?.analytics ?? { provider: 'none', id: '' },
  );
  useEffect(() => setJson(JSON.stringify(p.config, null, 2)), [p.config]);
  const save = useApiMutation(
    (body: Record<string, unknown>) => api.patch(`/projects/${p.id}`, body),
    [['project', p.id], ['projects']],
    () => toast.ok('Config salva. Rode o Build para aplicar.'),
  );
  const quick = () => {
    try {
      const c = JSON.parse(json);
      c.theme = { ...(c.theme ?? {}), id: theme };
      c.integrations = { ...(c.integrations ?? {}), form, analytics };
      c.seo = {
        ...(c.seo ?? {}),
        siteUrl: domain ? (domain.startsWith('http') ? domain : `https://${domain}`) : undefined,
      };
      save.mutate({ config: c, domain: domain || null }, { onError: (e) => toast.err(e.message) });
    } catch (e) {
      toast.err('JSON inválido: ' + (e as Error).message);
    }
  };
  return (
    <div className="grid gap-4">
      <Card
        title="Ajustes rápidos"
        actions={
          <Button
            variant="primary"
            icon={<Save className="w-4 h-4" />}
            loading={save.isPending}
            onClick={quick}
          >
            Salvar
          </Button>
        }
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Domínio">
            <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="empresa.com.br" />
          </Field>
          <Field label="Tema">
            <Select value={theme} onChange={(e) => setTheme(e.target.value)}>
              {meta?.themes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Formulário envia por">
            <Select value={form} onChange={(e) => setForm(e.target.value)}>
              <option value="whatsapp">WhatsApp (abre conversa)</option>
              <option value="netlify">Netlify Forms</option>
              <option value="mailto">E-mail (mailto)</option>
              <option value="none">Sem formulário</option>
            </Select>
          </Field>
          <Field label="Analytics">
            <div className="flex gap-2">
              <Select
                value={analytics.provider}
                onChange={(e) => setAnalytics({ ...analytics, provider: e.target.value })}
                className="w-32"
              >
                <option value="none">Nenhum</option>
                <option value="plausible">Plausible</option>
                <option value="ga4">GA4</option>
              </Select>
              <Input
                value={analytics.id ?? ''}
                onChange={(e) => setAnalytics({ ...analytics, id: e.target.value })}
                placeholder="domínio / G-XXXX"
              />
            </div>
          </Field>
        </div>
      </Card>
      <Card
        title="site.config.json"
        actions={
          <span className="text-xs text-muted">
            Edite textos, seções, serviços, contato. Validação Zod ao salvar.
          </span>
        }
      >
        <Textarea
          value={json}
          onChange={(e) => setJson(e.target.value)}
          rows={30}
          className="mono text-xs leading-relaxed"
          spellCheck={false}
        />
        <div className="flex gap-2 mt-3">
          <Button
            variant="primary"
            icon={<Save className="w-4 h-4" />}
            loading={save.isPending}
            onClick={() => {
              try {
                save.mutate(
                  { config: JSON.parse(json) },
                  {
                    onError: (e) =>
                      toast.err(
                        e.message + (e.details ? ': ' + JSON.stringify(e.details).slice(0, 300) : ''),
                      ),
                  },
                );
              } catch (e) {
                toast.err('JSON inválido: ' + (e as Error).message);
              }
            }}
          >
            Salvar JSON
          </Button>
          <Button variant="ghost" onClick={() => setJson(JSON.stringify(p.config, null, 2))}>
            Descartar alterações
          </Button>
        </div>
        <details className="mt-4 text-xs text-muted">
          <summary className="cursor-pointer">Seções disponíveis ({meta?.sections.length})</summary>
          <ul className="mt-2 grid sm:grid-cols-2 lg:grid-cols-3 gap-1">
            {meta?.sections.map((s) => (
              <li key={s.type}>
                <b className="text-text mono">{s.type}</b> — {s.name}:{' '}
                {s.variants.map((v) => v.id).join(', ')}
              </li>
            ))}
          </ul>
        </details>
      </Card>
    </div>
  );
}

function QaView({ p }: { p: ProjectFull }) {
  const toast = useToast();
  const { data: meta } = useMeta();
  const [report, setReport] = useState<QaReportWeb | null | undefined>(undefined);
  const [sel, setSel] = useState<string[]>([]);
  const [fixOpen, setFixOpen] = useState(false);
  useEffect(() => {
    api
      .get<typeof report>(`/projects/${p.id}/qa`)
      .then(setReport)
      .catch(() => setReport(null));
  }, [p.id, p.lastQa?.ranAt]);
  const fix = useApiMutation(
    (only?: string[]) =>
      api.post<{ applied: { id: string; description: string }[]; rebuilt: boolean }>(
        `/projects/${p.id}/autofix`,
        { only, rebuild: true },
      ),
    [['project', p.id]],
    (r) => {
      toast.ok(
        r.applied.length
          ? `${r.applied.length} correção(ões) aplicada(s)${r.rebuilt ? ' e site reconstruído' : ''}. Rode o QA de novo.`
          : 'Nada para corrigir automaticamente.',
      );
      setFixOpen(false);
    },
  );
  const running = p.activeJobs.find((j) => j.kind === 'qa');
  if (running)
    return (
      <div className="card p-5 flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        <div>
          <div className="font-medium">Rodando QA…</div>
          <div className="text-sm text-muted">{running.progress}</div>
        </div>
      </div>
    );
  if (report === undefined) return <Loading />;
  if (!report)
    return (
      <div className="card">
        <Empty
          icon={<ShieldCheck className="w-8 h-8" />}
          title="Sem relatório"
          text="Clique em “Rodar QA” para gerar o GZ Quality Report."
        />
      </div>
    );
  const fixable = report.checks.filter((c) => c.status !== 'pass' && c.fix);
  const groups = Array.from(new Set(report.checks.map((c) => c.group)));
  const GROUP: Record<string, string> = {
    build: 'Build',
    lint: 'Lint HTML',
    links: 'Links & recursos',
    console: 'Console',
    mobile: 'Mobile',
    images: 'Imagens',
    buttons: 'Botões',
    form: 'Formulário',
    security: 'Segurança',
    seo: 'SEO',
    performance: 'Performance',
    a11y: 'Acessibilidade',
  };
  return (
    <div className="grid gap-4">
      <div className="card p-5 flex flex-wrap items-center gap-4">
        <StatusBadge status={report.status} />
        <div className="text-sm">
          <span className="text-ok">{report.counts.pass} pass</span> ·{' '}
          <span className="text-warn">{report.counts.warning} warning</span> ·{' '}
          <span className="text-bad">{report.counts.fail} fail</span>
          <span className="text-muted">
            {' '}
            · {formatDate(report.ranAt, true)} · {(report.durationMs / 1000).toFixed(0)}s
          </span>
        </div>
        {report.lighthouse.ran && (
          <div className="flex gap-3 text-xs">
            {[
              ['Perf', report.lighthouse.performance],
              ['A11y', report.lighthouse.accessibility],
              ['SEO', report.lighthouse.seo],
              ['BP', report.lighthouse.bestPractices],
            ].map(([l, v]) => (
              <span key={l as string}>
                {l as string}{' '}
                <b
                  className={`${(v as number) >= 90 ? 'text-ok' : (v as number) >= 60 ? 'text-warn' : 'text-bad'}`}
                >
                  {v}
                </b>
              </span>
            ))}
          </div>
        )}
        <div className="ml-auto flex gap-2">
          <a className="btn btn-secondary btn-sm" href={report.htmlUrl} target="_blank" rel="noreferrer">
            Relatório HTML <ExternalLink className="w-3 h-3" />
          </a>
          <Button
            size="sm"
            variant="primary"
            icon={<Wand2 className="w-3.5 h-3.5" />}
            onClick={() => {
              setSel(fixable.map((c) => c.fix!));
              setFixOpen(true);
            }}
          >
            Corrigir automaticamente {fixable.length ? `(${fixable.length})` : ''}
          </Button>
        </div>
      </div>
      {groups.map((g) => (
        <Card key={g} title={GROUP[g] ?? g}>
          <ul className="divide-y divide-line">
            {report.checks
              .filter((c) => c.group === g)
              .map((c) => (
                <li key={c.id} className="py-2 flex items-start gap-3 text-sm">
                  <StatusBadge status={c.status} />
                  <div className="min-w-0 flex-1">
                    <div>
                      {c.title}{' '}
                      {c.fix && c.status !== 'pass' && (
                        <span className="text-[10px] text-accent ml-1">auto-fix</span>
                      )}
                    </div>
                    {c.detail && <div className="text-xs text-muted">{c.detail}</div>}
                    {c.items?.length ? (
                      <ul className="text-xs text-muted list-disc pl-4 mt-1">
                        {c.items.map((i, k) => (
                          <li key={k} className="break-words">
                            {i}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </li>
              ))}
          </ul>
        </Card>
      ))}
      <Card title="Screenshots">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {report.screenshots.map((s) => (
            <a key={s.viewport} href={s.url} target="_blank" rel="noreferrer" className="block">
              <div className="aspect-[3/4] rounded-md overflow-hidden bg-panel-2 border border-line">
                <img
                  src={s.url}
                  alt={s.viewport}
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                />
              </div>
              <div className="text-[11px] text-muted mt-1">
                {s.viewport} {s.overflow > 4 && <span className="text-bad">overflow +{s.overflow}px</span>}
              </div>
            </a>
          ))}
        </div>
      </Card>
      <Modal
        open={fixOpen}
        onClose={() => setFixOpen(false)}
        title="Corrigir problemas automaticamente"
        footer={
          <>
            <Button variant="ghost" onClick={() => setFixOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              loading={fix.isPending}
              onClick={() =>
                fix.mutate(sel.length ? sel : undefined, { onError: (e) => toast.err(e.message) })
              }
            >
              Aplicar {sel.length ? `(${sel.length})` : 'todas'} e reconstruir
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted mb-3">
          Só correções seguras e determinísticas. Nada de design é alterado.
        </p>
        <ul className="flex flex-col gap-2">
          {(meta?.autofixes ?? []).map((a) => (
            <li key={a.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={sel.includes(a.id)}
                onChange={(e) => setSel(e.target.checked ? [...sel, a.id] : sel.filter((x) => x !== a.id))}
                className="accent-[#d4ff2b]"
              />
              <span>
                <b className="mono text-xs">{a.id}</b> — {a.description}
                {fixable.some((c) => c.fix === a.id) && (
                  <span className="text-[10px] text-warn ml-1">necessário</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}

function FilesView({ p }: { p: ProjectFull }) {
  const [files, setFiles] = useState<{ path: string; bytes: number }[] | null>(null);
  useEffect(() => {
    api.get<{ path: string; bytes: number }[]>(`/projects/${p.id}/files`).then(setFiles);
  }, [p.id, p.lastBuildAt]);
  if (!files) return <Loading />;
  return (
    <Card
      title={`${files.length} arquivos`}
      actions={<span className="text-xs text-muted mono">{p.path}</span>}
    >
      <ul className="text-xs mono grid sm:grid-cols-2 gap-x-6 gap-y-1">
        {files.map((f) => (
          <li key={f.path} className="flex justify-between gap-2 border-b border-line/50 py-0.5">
            <span className="truncate">{f.path}</span>
            <span className="text-muted shrink-0">
              {f.bytes > 1024 ? `${(f.bytes / 1024).toFixed(0)} KB` : `${f.bytes} B`}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function DeployButton({ p }: { p: ProjectFull }) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState('');
  const [siteId, setSiteId] = useState('');
  const [result, setResult] = useState<{ url: string; siteId: string; adminUrl?: string } | null>(null);
  const toast = useToast();
  const deploy = useApiMutation(
    () =>
      api.post<{ url: string; siteId: string; adminUrl?: string }>(`/projects/${p.id}/deploy/netlify`, {
        token: token || undefined,
        siteId: siteId || undefined,
      }),
    [['project', p.id]],
    (r) => {
      setResult(r);
      toast.ok('Deploy enviado para a Netlify');
    },
  );
  return (
    <>
      <Button icon={<Rocket className="w-4 h-4" />} onClick={() => setOpen(true)}>
        Publicar na Netlify
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Publicar na Netlify"
        footer={
          <Button
            variant="primary"
            loading={deploy.isPending}
            onClick={() => deploy.mutate(undefined, { onError: (e) => toast.err(e.message) })}
          >
            Fazer deploy
          </Button>
        }
      >
        <div className="grid gap-4 text-sm">
          <div className="bg-bg-2 rounded-lg p-3 text-muted">
            <b className="text-text">Opção 1 (sem token):</b> clique em “Exportar ZIP (Netlify)” e arraste o
            arquivo em app.netlify.com → Add new site → Deploy manually.
            <br />
            <b className="text-text">Opção 2 (API):</b> informe um Personal Access Token da Netlify abaixo.
            Ele é usado só nesta requisição e nunca é salvo (ou defina NETLIFY_AUTH_TOKEN no .env).
          </div>
          <Field label="Token da Netlify">
            <Input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="nfp_…"
              autoComplete="off"
            />
          </Field>
          <Field label="Site ID (opcional — vazio cria um site novo)">
            <Input value={siteId} onChange={(e) => setSiteId(e.target.value)} />
          </Field>
          {result && (
            <div className="bg-ok/10 border border-ok/30 rounded-lg p-3">
              Publicado em{' '}
              <a className="text-accent underline" href={result.url} target="_blank" rel="noreferrer">
                {result.url}
              </a>
              <div className="text-xs text-muted mt-1">
                Site ID: {result.siteId}. Guarde para republicar no mesmo site.
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
