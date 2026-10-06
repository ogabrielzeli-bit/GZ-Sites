import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  ExternalLink,
  FileText,
  Globe,
  Hammer,
  Instagram,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
} from 'lucide-react';
import {
  api,
  useApiMutation,
  useAudit,
  useMeta,
  useProspect,
  type AuditFull,
  type Preview,
  type Proposal,
  type ProposalInput,
  type ProspectFull,
} from '../api';
import {
  Badge,
  Button,
  Card,
  Confirm,
  CopyButton,
  Empty,
  ErrorBox,
  Field,
  Input,
  Loading,
  Modal,
  Score,
  Select,
  StatusBadge,
  Tabs,
  Textarea,
  useToast,
} from '../components/ui';
import { PageHeader } from '../components/Layout';
import { ProspectFormModal } from './ProspectForm';
import { AdaptiveMessages, AssetGrid, DirectionModal } from './Creative';
import { NewProjectModal, PROJECT_STATUS } from './Projects';
import { STAGES, stageLabel } from '@shared/stages';
import { segmentLabel } from '@shared/segments';
import { formatCurrency, formatDate, relativeTime, whatsappLink, instagramUrl } from '@shared/utils';
import type { AuditCategory } from '@shared/schemas';

type Tab = 'ficha' | 'auditoria' | 'previas' | 'propostas' | 'mensagens' | 'projeto' | 'historico';

export function ProspectDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const [sp] = useSearchParams();
  const [tab, setTab] = useState<Tab>((sp.get('tab') as Tab) || 'ficha');
  const [editOpen, setEditOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [poll, setPoll] = useState(false);
  const { data: prospect, isLoading, error, refetch } = useProspect(id, poll);
  useEffect(() => setPoll(!!prospect?.activeJobs.length), [prospect]);
  const stage = useApiMutation(
    (s: string) => api.post(`/prospects/${id}/stage`, { stage: s }),
    [['prospect', id], ['prospects']],
  );
  const del = useApiMutation(
    () => api.del(`/prospects/${id}`),
    [['prospects']],
    () => {
      toast.ok('Prospect excluído');
      nav('/prospects');
    },
  );
  if (isLoading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  if (!prospect) return null;
  const st = STAGES.find((s) => s.id === prospect.stage);
  const counts = {
    auditoria: prospect.audits.length,
    previas: prospect.previews.length,
    propostas: prospect.proposals.length,
    projeto: prospect.projects.length,
  };
  return (
    <>
      <Link
        to="/prospects"
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-text mb-3"
      >
        <ArrowLeft className="w-3 h-3" /> Prospects
      </Link>
      <PageHeader
        title={prospect.name}
        sub={
          <span className="flex flex-wrap items-center gap-2">
            <Badge color={st?.color}>{stageLabel(prospect.stage)}</Badge>
            <span>{segmentLabel(prospect.segment)}</span>
            {prospect.city && <span>· {[prospect.city, prospect.state].filter(Boolean).join('/')}</span>}
            {prospect.potentialValue != null && (
              <span>· {formatCurrency(prospect.closedValue ?? prospect.potentialValue)}</span>
            )}
          </span>
        }
        actions={
          <>
            <Select
              value={prospect.stage}
              onChange={(e) => stage.mutate(e.target.value)}
              className="w-40 h-9"
            >
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
            <Button icon={<Pencil className="w-4 h-4" />} onClick={() => setEditOpen(true)}>
              Editar
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setDelOpen(true)} aria-label="Excluir">
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        }
      />
      <ActionBar p={prospect} setTab={setTab} refetch={refetch} />
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: 'ficha', label: 'Ficha' },
          { id: 'auditoria', label: 'Auditoria', count: counts.auditoria },
          { id: 'previas', label: 'Prévias', count: counts.previas },
          { id: 'propostas', label: 'Propostas', count: counts.propostas },
          { id: 'mensagens', label: 'Mensagens' },
          { id: 'projeto', label: 'Projeto', count: counts.projeto },
          { id: 'historico', label: 'Histórico & tarefas' },
        ]}
      />
      <div className="mt-5">
        {tab === 'ficha' && <FichaTab p={prospect} onEdit={() => setEditOpen(true)} />}
        {tab === 'auditoria' && <AuditTab p={prospect} />}
        {tab === 'previas' && <PreviewsTab p={prospect} />}
        {tab === 'propostas' && <ProposalsTab p={prospect} />}
        {tab === 'mensagens' && <MessagesTab p={prospect} />}
        {tab === 'projeto' && <ProjectTab p={prospect} />}
        {tab === 'historico' && <HistoryTab p={prospect} />}
      </div>
      <ProspectFormModal open={editOpen} onClose={() => setEditOpen(false)} prospect={prospect} />
      <Confirm
        open={delOpen}
        onClose={() => setDelOpen(false)}
        onConfirm={() => del.mutate(undefined)}
        title="Excluir prospect?"
        text="Auditorias, prévias, propostas e histórico deste prospect serão apagados. Projetos criados ficam (sem vínculo)."
        danger
      />
    </>
  );
}

/* ---------------- Barra de ações principais ---------------- */
function ActionBar({
  p,
  setTab,
  refetch,
}: {
  p: ProspectFull;
  setTab: (t: Tab) => void;
  refetch: () => void;
}) {
  const toast = useToast();
  const [urlOpen, setUrlOpen] = useState(false);
  const [url, setUrl] = useState(p.website ?? '');
  const [projOpen, setProjOpen] = useState(false);
  const audit = useApiMutation(
    (u?: string) => api.post(`/prospects/${p.id}/audit`, u ? { url: u } : {}),
    [['prospect', p.id]],
    () => {
      toast.info('Auditoria iniciada. Leva de 15 a 60 segundos.');
      setTab('auditoria');
      refetch();
    },
  );
  const preview = useApiMutation(
    (body: Record<string, unknown>) => api.post<Preview>(`/prospects/${p.id}/previews`, body),
    [['prospect', p.id], ['prospects']],
    (pv) => {
      toast.ok('Prévia gerada');
      setTab('previas');
      window.open(pv.url, '_blank', 'noopener');
    },
  );
  const proposal = useApiMutation(
    () => api.post<Proposal>(`/prospects/${p.id}/proposals`, {}),
    [['prospect', p.id], ['prospects']],
    () => {
      toast.ok('Proposta criada a partir da auditoria e dos preços padrão');
      setTab('propostas');
    },
  );
  const close = useApiMutation(
    () => api.post(`/prospects/${p.id}/stage`, { stage: 'fechado' }),
    [['prospect', p.id], ['prospects']],
    () => toast.ok('Cliente fechado! 🎉'),
  );
  const auditing = p.activeJobs.some((j) => j.kind === 'audit');
  const closedOrLater = ['fechado', 'producao', 'entregue'].includes(p.stage);
  return (
    <>
      <div className="flex flex-wrap gap-2 mb-5">
        <Button
          variant="primary"
          icon={<Search className="w-4 h-4" />}
          loading={auditing}
          onClick={() =>
            p.website ? audit.mutate(undefined, { onError: (e) => toast.err(e.message) }) : setUrlOpen(true)
          }
        >
          {auditing ? 'Auditando…' : 'Auditar site'}
        </Button>
        <Button
          variant="primary"
          icon={<Sparkles className="w-4 h-4" />}
          loading={preview.isPending}
          onClick={() => preview.mutate({}, { onError: (e) => toast.err(e.message) })}
        >
          Gerar prévia
        </Button>
        <Button
          icon={<FileText className="w-4 h-4" />}
          loading={proposal.isPending}
          onClick={() => proposal.mutate(undefined, { onError: (e) => toast.err(e.message) })}
        >
          Criar proposta
        </Button>
        <Button icon={<MessageCircle className="w-4 h-4" />} onClick={() => setTab('mensagens')}>
          Mensagens
        </Button>
        {!closedOrLater && (
          <Button
            icon={<Hammer className="w-4 h-4" />}
            loading={close.isPending}
            onClick={() => close.mutate(undefined)}
          >
            Fechar cliente
          </Button>
        )}
        {closedOrLater && p.projects.length === 0 && (
          <Button variant="primary" icon={<Hammer className="w-4 h-4" />} onClick={() => setProjOpen(true)}>
            Criar projeto
          </Button>
        )}
        {p.projects.length > 0 && (
          <Link to={`/projects/${p.projects[0].id}`} className="btn btn-secondary">
            <Hammer className="w-4 h-4" /> Abrir projeto
          </Link>
        )}
      </div>
      <Modal
        open={urlOpen}
        onClose={() => setUrlOpen(false)}
        title="Qual site auditar?"
        footer={
          <Button
            variant="primary"
            onClick={() => {
              setUrlOpen(false);
              audit.mutate(url, { onError: (e) => toast.err(e.message) });
            }}
          >
            Auditar
          </Button>
        }
      >
        <Field
          label="URL do site atual"
          hint="Se a empresa não tem site, pule a auditoria e gere a prévia direto."
        >
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="empresa.com.br"
            autoFocus
          />
        </Field>
      </Modal>
      <NewProjectModal
        open={projOpen}
        onClose={() => setProjOpen(false)}
        prospectId={p.id}
        defaultName={p.name}
      />
    </>
  );
}

/* ---------------- Ficha ---------------- */
function FichaTab({ p, onEdit }: { p: ProspectFull; onEdit: () => void }) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const upload = useApiMutation(
    ({ files, category }: { files: FileList; category: string }) => {
      const fd = new FormData();
      fd.append('category', category);
      Array.from(files).forEach((f) => fd.append('files', f));
      return api.post(`/prospects/${p.id}/uploads`, fd);
    },
    [['prospect', p.id]],
    () => toast.ok('Arquivos enviados e otimizados (WebP)'),
  );
  const wa = whatsappLink(p.whatsapp);
  const ig = instagramUrl(p.instagram);
  const row = (label: string, value?: React.ReactNode) =>
    value ? (
      <div className="flex gap-3 py-2 border-b border-line/70 text-sm">
        <span className="w-32 shrink-0 text-muted">{label}</span>
        <span className="min-w-0 break-words">{value}</span>
      </div>
    ) : null;
  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <Card
        title="Dados"
        className="lg:col-span-2"
        actions={
          <Button size="sm" onClick={onEdit}>
            Editar
          </Button>
        }
      >
        {row('Responsável', p.contactName)}
        {row(
          'WhatsApp',
          wa ? (
            <a
              className="text-accent hover:underline inline-flex items-center gap-1"
              href={wa}
              target="_blank"
              rel="noreferrer"
            >
              <Phone className="w-3 h-3" /> {p.whatsapp}
            </a>
          ) : (
            p.whatsapp
          ),
        )}
        {row('Telefone', p.phone)}
        {row(
          'E-mail',
          p.email && (
            <a className="hover:underline" href={`mailto:${p.email}`}>
              {p.email}
            </a>
          ),
        )}
        {row(
          'Site atual',
          p.website && (
            <a
              className="text-accent hover:underline inline-flex items-center gap-1"
              href={p.website}
              target="_blank"
              rel="noreferrer"
            >
              <Globe className="w-3 h-3" /> {p.website}
            </a>
          ),
        )}
        {row(
          'Instagram',
          ig && (
            <a
              className="text-accent hover:underline inline-flex items-center gap-1"
              href={ig}
              target="_blank"
              rel="noreferrer"
            >
              <Instagram className="w-3 h-3" /> {p.instagram}
            </a>
          ),
        )}
        {row('Origem', p.leadSource)}
        {row('Último contato', p.lastContactAt && formatDate(p.lastContactAt, true))}
        {row('Próximo follow-up', p.nextFollowupAt && formatDate(p.nextFollowupAt))}
        {row(
          'Links',
          p.links.length ? (
            <span className="flex flex-col gap-1">
              {p.links.map((l, i) => (
                <a
                  key={i}
                  className="hover:underline inline-flex items-center gap-1"
                  href={l.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="w-3 h-3" /> {l.label || l.url}
                </a>
              ))}
            </span>
          ) : undefined,
        )}
        {row('Serviços', p.services?.length ? p.services.map((s) => s.title).join(' · ') : undefined)}
        {row('Diferenciais', p.differentials?.length ? p.differentials.join(' · ') : undefined)}
        {row(
          'Cores da marca',
          p.brandColors?.length ? (
            <span className="flex gap-2 flex-wrap">
              {p.brandColors.map((c) => (
                <span key={c} className="inline-flex items-center gap-1 text-xs">
                  <span className="w-3.5 h-3.5 rounded-full border border-line" style={{ background: c }} />{' '}
                  {c}
                </span>
              ))}
            </span>
          ) : undefined,
        )}
        {row(
          'Unidades',
          p.locations?.length ? (
            <span className="flex flex-col gap-1">
              {p.locations.map((l, i) => (
                <span key={i}>
                  <b>{l.name || `Unidade ${i + 1}`}</b>{' '}
                  {[l.address, l.city, l.state].filter(Boolean).join(', ')}
                  {l.openingHours ? ` · ${l.openingHours}` : ''}
                </span>
              ))}
            </span>
          ) : undefined,
        )}
        {row('Observações', p.notes && <span className="whitespace-pre-wrap">{p.notes}</span>)}
        {!p.contactName && !p.whatsapp && !p.website && !p.instagram && (
          <p className="text-muted text-sm">
            Só o nome por enquanto. Clique em Editar para completar a ficha.
          </p>
        )}
      </Card>
      <Card
        title="Logo, fotos e vídeos"
        actions={
          <Button
            size="sm"
            icon={<Upload className="w-3.5 h-3.5" />}
            loading={upload.isPending}
            onClick={() => fileRef.current?.click()}
          >
            Fotos e vídeos
          </Button>
        }
      >
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,video/mp4,video/webm,video/quicktime,.mov"
          className="hidden"
          onChange={(e) =>
            e.target.files?.length &&
            upload.mutate(
              { files: e.target.files, category: 'photo' },
              { onError: (er) => toast.err(er.message) },
            )
          }
        />
        <input
          ref={logoRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) =>
            e.target.files?.length &&
            upload.mutate(
              { files: e.target.files, category: 'logo' },
              { onError: (er) => toast.err(er.message) },
            )
          }
        />
        <div className="flex items-center gap-3 mb-4">
          <div className="h-14 w-14 rounded-lg bg-panel-2 grid place-items-center overflow-hidden border border-line">
            {p.logoPath ? (
              <img src={p.logoPath} alt="Logo" className="object-contain h-full w-full" />
            ) : (
              <Camera className="w-5 h-5 text-muted-2" />
            )}
          </div>
          <div>
            <div className="text-sm font-medium">Logo</div>
            <button className="text-xs text-muted hover:text-text" onClick={() => logoRef.current?.click()}>
              {p.logoPath ? 'Trocar logo' : 'Enviar logo'}
            </button>
          </div>
        </div>
        <AssetGrid p={p} />
      </Card>
    </div>
  );
}

/* ---------------- Auditoria ---------------- */
const CATS: { id: AuditCategory; label: string }[] = [
  { id: 'visual', label: 'Visual' },
  { id: 'mobile', label: 'Mobile' },
  { id: 'performance', label: 'Performance' },
  { id: 'seo', label: 'SEO' },
  { id: 'conversion', label: 'Conversão' },
  { id: 'security', label: 'Segurança' },
];

function AuditTab({ p }: { p: ProspectFull }) {
  const [sel, setSel] = useState<string | null>(null);
  const latest = p.audits[0];
  const id = sel ?? latest?.id;
  const running = p.activeJobs.find((j) => j.kind === 'audit');
  const { data: audit } = useAudit(
    id,
    !!running || latest?.status === 'running' || latest?.status === 'pending',
  );
  const toast = useToast();
  const del = useApiMutation((aid: string) => api.del(`/audits/${aid}`), [['prospect', p.id]]);
  if (!p.audits.length && !running)
    return (
      <div className="card">
        <Empty
          icon={<Search className="w-8 h-8" />}
          title="Nenhuma auditoria"
          text={
            p.website
              ? 'Clique em “Auditar site” para analisar performance, mobile, SEO, conversão e segurança.'
              : 'Este prospect não tem site cadastrado. Edite a ficha e informe a URL, ou gere a prévia direto.'
          }
        />
      </div>
    );
  return (
    <div className="grid gap-4">
      {p.audits.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {p.audits.map((a) => (
            <button
              key={a.id}
              className={`badge ${id === a.id ? 'bg-accent text-accent-ink' : 'bg-panel-2 text-muted'}`}
              onClick={() => setSel(a.id)}
            >
              {formatDate(a.createdAt, true)}{' '}
              {a.scores ? `· ${a.scores.overall}` : a.status === 'failed' ? '· falhou' : '· …'}
            </button>
          ))}
        </div>
      )}
      {(running || audit?.status === 'running' || audit?.status === 'pending') && (
        <div className="card p-5 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <div>
            <div className="font-medium">Auditando {audit?.url ?? p.website}</div>
            <div className="text-sm text-muted">{running?.progress ?? 'Iniciando…'}</div>
          </div>
        </div>
      )}
      {audit?.status === 'failed' && (
        <ErrorBox
          error={
            new Error(
              `A auditoria falhou: ${audit.error ?? 'erro desconhecido'}. Verifique se a URL abre no navegador e tente de novo.`,
            )
          }
        />
      )}
      {audit?.status === 'done' && audit.report && (
        <AuditReportView
          audit={audit}
          onDelete={() =>
            del.mutate(audit.id, {
              onSuccess: () => {
                setSel(null);
                toast.ok('Auditoria removida');
              },
            })
          }
        />
      )}
    </div>
  );
}

function AuditReportView({ audit, onDelete }: { audit: AuditFull; onDelete: () => void }) {
  const r = audit.report!;
  const [cat, setCat] = useState<AuditCategory | 'all'>('all');
  const [shot, setShot] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const toast = useToast();
  const sum = useApiMutation(
    () => api.get<{ text: string }>(`/audits/${audit.id}/summary`),
    [],
    (res) => setSummary(res.text),
  );
  const findings = r.findings.filter((f) => cat === 'all' || f.category === cat);
  const shots = audit.screenshots.filter((s) => s.device !== 'thumb');
  const lh = r.lighthouse;
  return (
    <>
      <div className="grid lg:grid-cols-[auto_1fr] gap-4">
        <Card className="flex flex-col items-center justify-center gap-2 p-6 min-w-[200px]">
          <Score value={r.scores.overall} size={120} />
          <div className="text-xs uppercase tracking-widest text-muted">Nota GZ geral</div>
          <div className="text-[11px] text-muted-2 text-center">
            {formatDate(audit.finishedAt, true)} · {(r.durationMs / 1000).toFixed(0)}s
          </div>
        </Card>
        <Card
          title="Notas por categoria"
          actions={
            <a
              href={audit.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-muted hover:text-text inline-flex items-center gap-1"
            >
              {r.finalUrl.replace(/^https?:\/\//, '').slice(0, 40)} <ExternalLink className="w-3 h-3" />
            </a>
          }
        >
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {CATS.map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(cat === c.id ? 'all' : c.id)}
                className={`rounded-lg p-2 transition ${cat === c.id ? 'bg-panel-2' : 'hover:bg-panel-2/60'}`}
              >
                <Score value={r.scores[c.id]} label={c.label} />
              </button>
            ))}
          </div>
          {lh.ran && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted mt-4">
              <span>
                Lighthouse: Perf <b className="text-text">{lh.performance}</b>
              </span>
              <span>
                A11y <b className="text-text">{lh.accessibility}</b>
              </span>
              <span>
                SEO <b className="text-text">{lh.seo}</b>
              </span>
              <span>
                BP <b className="text-text">{lh.bestPractices}</b>
              </span>
              {lh.lcp != null && (
                <span>
                  LCP <b className="text-text">{(lh.lcp / 1000).toFixed(1)}s</b>
                </span>
              )}
              {lh.cls != null && (
                <span>
                  CLS <b className="text-text">{lh.cls.toFixed(2)}</b>
                </span>
              )}
              {lh.tbt != null && (
                <span>
                  TBT <b className="text-text">{Math.round(lh.tbt)}ms</b>
                </span>
              )}
              <span>
                Peso <b className="text-text">{(r.network.transferBytes / 1024 / 1024).toFixed(1)} MB</b>
              </span>
              <span>
                Requests <b className="text-text">{r.network.requests}</b>
              </span>
            </div>
          )}
          {!lh.ran && (
            <p className="text-xs text-muted mt-3">
              Lighthouse não rodou ({lh.error}). Notas baseadas nas heurísticas do GZ.
            </p>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card
          title="Principais oportunidades"
          actions={<CopyButton text={r.opportunities.map((o, i) => `${i + 1}. ${o.title}`).join('\n')} />}
        >
          {r.opportunities.length === 0 ? (
            <p className="text-sm text-muted">
              O site está em boa forma. Argumente por design/identidade e conversão.
            </p>
          ) : (
            <ol className="flex flex-col gap-3">
              {r.opportunities.map((o, i) => (
                <li key={o.id} className="flex gap-3">
                  <span className="w-6 h-6 rounded-md bg-panel-2 grid place-items-center text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <div>
                    <div className="font-medium text-sm flex items-center gap-2">
                      {o.title}{' '}
                      <Badge
                        color={
                          o.severity === 'high' ? '#ef5a5a' : o.severity === 'medium' ? '#f2a93b' : '#8e8e9a'
                        }
                      >
                        {o.severity === 'high' ? 'alto' : o.severity === 'medium' ? 'médio' : 'baixo'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted mt-0.5">{o.detail}</div>
                  </div>
                </li>
              ))}
            </ol>
          )}
          <div className="mt-4 pt-4 border-t border-line">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted">Resumo para enviar ao cliente</span>
              <Button
                size="sm"
                icon={<Wand2 className="w-3.5 h-3.5" />}
                loading={sum.isPending}
                onClick={() => sum.mutate(undefined, { onError: (e) => toast.err(e.message) })}
              >
                Gerar resumo
              </Button>
            </div>
            {summary && (
              <div className="mt-2 text-sm bg-bg-2 rounded-lg p-3 flex flex-col gap-2">
                <p>{summary}</p>
                <div>
                  <CopyButton text={summary} />
                </div>
              </div>
            )}
          </div>
        </Card>
        <Card
          title="Screenshots"
          actions={
            <Button size="sm" variant="ghost" onClick={onDelete}>
              Excluir auditoria
            </Button>
          }
        >
          <div className="grid grid-cols-3 gap-2">
            {shots.map((s) => (
              <button key={s.device} className="group text-left" onClick={() => setShot(s.url)}>
                <div className="aspect-[3/4] rounded-md overflow-hidden bg-panel-2 border border-line">
                  <img
                    src={s.url}
                    alt={s.device}
                    className="w-full h-full object-cover object-top group-hover:opacity-90"
                    loading="lazy"
                  />
                </div>
                <div className="text-[11px] text-muted mt-1 capitalize">
                  {s.device} · {s.width}px
                </div>
              </button>
            ))}
          </div>
          <Modal open={!!shot} onClose={() => setShot(null)} title="Screenshot" size="xl">
            {shot && <img src={shot} alt="" className="w-full rounded-md border border-line" />}
          </Modal>
        </Card>
      </div>

      <Card
        title={`Detalhes (${findings.length})`}
        actions={
          cat !== 'all' && (
            <Button size="sm" variant="ghost" onClick={() => setCat('all')}>
              Ver todas as categorias
            </Button>
          )
        }
      >
        <ul className="divide-y divide-line">
          {findings.map((f) => (
            <li key={f.id} className="py-2 flex items-start gap-3 text-sm">
              <StatusBadge status={f.status} />
              <div className="min-w-0">
                <div>{f.title}</div>
                {f.detail && <div className="text-xs text-muted break-words">{f.detail}</div>}
              </div>
              <span className="ml-auto text-[11px] text-muted-2 uppercase shrink-0">
                {CATS.find((c) => c.id === f.category)?.label}
              </span>
            </li>
          ))}
        </ul>
        {(r.console.errors.length > 0 || r.page.legacySignals.length > 0) && (
          <details className="mt-3 text-xs text-muted">
            <summary className="cursor-pointer">Dados técnicos</summary>
            <pre className="mt-2 bg-bg-2 rounded p-3 overflow-auto max-h-64 mono">
              {JSON.stringify(
                {
                  title: r.page.title,
                  description: r.page.description,
                  h1: r.page.h1,
                  generator: r.page.generator,
                  legacy: r.page.legacySignals,
                  headers: r.headers,
                  console: r.console.errors,
                  thirdParty: r.network.thirdPartyDomains,
                  heaviest: r.network.heaviestImages.slice(0, 5),
                },
                null,
                2,
              )}
            </pre>
          </details>
        )}
      </Card>
    </>
  );
}

/* ---------------- Prévias ---------------- */
function PreviewsTab({ p }: { p: ProspectFull }) {
  const { data: meta } = useMeta();
  const toast = useToast();
  const [theme, setTheme] = useState('');
  const [sp, setSp] = useSearchParams();
  const [dirOpen, setDirOpen] = useState(false);
  const [editing, setEditing] = useState<Preview | null>(
    () => p.previews.find((pv) => pv.id === sp.get('edit')) ?? null,
  );
  const closeEditor = () => {
    setEditing(null);
    if (sp.get('edit')) setSp({}, { replace: true });
  };
  const create = useApiMutation(
    (body: Record<string, unknown>) => api.post<Preview>(`/prospects/${p.id}/previews`, body),
    [['prospect', p.id], ['prospects']],
    (pv) => {
      toast.ok('Prévia gerada');
      window.open(pv.url, '_blank', 'noopener');
    },
  );
  const del = useApiMutation((id: string) => api.del(`/previews/${id}`), [['prospect', p.id], ['prospects']]);
  return (
    <div className="grid gap-4">
      <Card title="Nova prévia">
        <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-line">
          <Button variant="primary" icon={<Wand2 className="w-4 h-4" />} onClick={() => setDirOpen(true)}>
            Criar com direção criativa
          </Button>
          <p className="text-xs text-muted">
            Pesquisa fontes públicas (se houver), monta o DNA do negócio e propõe 3 direções visuais
            diferentes. Usa fotos, vídeos e unidades da ficha. Sem IA.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Tema (modo clássico)" className="w-64">
            <Select value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="">Automático (preset do segmento)</option>
              {meta?.themes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {t.description.slice(0, 50)}
                </option>
              ))}
            </Select>
          </Field>
          <Button
            variant="primary"
            icon={<Sparkles className="w-4 h-4" />}
            loading={create.isPending}
            onClick={() => create.mutate(theme ? { theme } : {}, { onError: (e) => toast.err(e.message) })}
          >
            Gerar prévia clássica
          </Button>
          <p className="text-xs text-muted basis-full">
            Modo V1: preset do segmento + tema, composição por variação ({p.previews.length + 1}).
          </p>
        </div>
      </Card>
      {p.previews.length === 0 ? (
        <div className="card">
          <Empty
            icon={<Sparkles className="w-8 h-8" />}
            title="Nenhuma prévia"
            text="Gere uma prévia e envie o link para o cliente pelo WhatsApp."
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {p.previews.map((pv) => {
            const th = meta?.themes.find((t) => t.id === pv.theme);
            return (
              <div key={pv.id} className="card overflow-hidden flex flex-col">
                <a
                  href={pv.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block aspect-[16/10] bg-panel-2 border-b border-line relative overflow-hidden"
                >
                  <iframe
                    src={pv.url}
                    title={`Prévia ${th?.name}`}
                    className="absolute top-0 left-0 w-[1280px] h-[800px] origin-top-left pointer-events-none"
                    style={{ transform: 'scale(0.3)' }}
                    loading="lazy"
                    tabIndex={-1}
                  />
                </a>
                <div className="p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-sm">
                      {pv.meta?.direction?.name ?? th?.name ?? pv.theme}
                    </div>
                    <span className="text-[11px] text-muted">{relativeTime(pv.createdAt)}</span>
                  </div>
                  <div className="text-xs text-muted flex flex-wrap gap-x-2">
                    {pv.meta?.direction ? (
                      <>
                        <span>{th?.name ?? pv.theme}</span>
                        <span>· seed {pv.meta.seed ?? 0}</span>
                        {pv.meta.creativeScore != null && <span>· score {pv.meta.creativeScore}</span>}
                      </>
                    ) : (
                      <span>
                        Variação {pv.layoutVariant + 1} · {th?.fonts.display}
                      </span>
                    )}
                    {pv.published && (
                      <a href={pv.published.url} target="_blank" rel="noreferrer" className="text-success">
                        · publicada
                      </a>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Link className="btn btn-primary btn-sm" to={`/preview/${pv.id}`}>
                      Abrir
                    </Link>
                    <CopyButton text={`${window.location.origin}${pv.url}`} label="Copiar link" />
                    <Button size="sm" onClick={() => setEditing(pv)}>
                      Ajustar dados
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => del.mutate(pv.id)} aria-label="Excluir">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {editing && <PreviewEditor preview={editing} prospectId={p.id} onClose={closeEditor} />}
      <DirectionModal p={p} open={dirOpen} onClose={() => setDirOpen(false)} />
    </div>
  );
}

/** Editor de dados da prévia: campos principais + JSON completo */
function PreviewEditor({
  preview,
  prospectId,
  onClose,
}: {
  preview: Preview;
  prospectId: string;
  onClose: () => void;
}) {
  const cfg = preview.config as any;
  const toast = useToast();
  const [brand, setBrand] = useState(cfg.brand?.name ?? '');
  const [tagline, setTagline] = useState(cfg.brand?.tagline ?? '');
  const [whatsapp, setWhatsapp] = useState(cfg.contact?.whatsapp ?? '');
  const [address, setAddress] = useState(cfg.contact?.address ?? '');
  const [years, setYears] = useState(cfg.business?.yearsExperience ?? '');
  const [headline, setHeadline] = useState<string>(
    () => (cfg.pages?.[0]?.sections ?? []).find((s: any) => s.type.startsWith('hero'))?.props?.headline ?? '',
  );
  const [sub, setSub] = useState<string>(
    () =>
      (cfg.pages?.[0]?.sections ?? []).find((s: any) => s.type.startsWith('hero'))?.props?.subheadline ?? '',
  );
  const [services, setServices] = useState<string>(() =>
    (cfg.business?.services ?? []).map((s: any) => `${s.title}: ${s.description}`).join('\n'),
  );
  const [json, setJson] = useState(JSON.stringify(cfg, null, 2));
  const [mode, setMode] = useState<'form' | 'json'>('form');
  const save = useApiMutation(
    (config: unknown) => api.put<Preview>(`/previews/${preview.id}`, { config }),
    [['prospect', prospectId]],
    (pv) => {
      toast.ok('Prévia atualizada');
      window.open(pv.url, '_blank', 'noopener');
      onClose();
    },
  );
  const build = () => {
    if (mode === 'json') return JSON.parse(json);
    const c = JSON.parse(JSON.stringify(cfg));
    c.brand.name = brand;
    c.brand.tagline = tagline;
    c.contact.whatsapp = whatsapp || undefined;
    c.contact.address = address || undefined;
    c.business.yearsExperience = years ? Number(years) : undefined;
    const hero = (c.pages[0].sections as any[]).find((s) => s.type.startsWith('hero'));
    if (hero) {
      hero.props.headline = headline;
      hero.props.subheadline = sub;
    }
    const list = services
      .split('\n')
      .map((l: string) => l.trim())
      .filter(Boolean)
      .map((l: string) => {
        const [title, ...rest] = l.split(':');
        return { title: title.trim(), description: rest.join(':').trim() };
      });
    if (list.length) {
      c.business.services = list;
      for (const s of c.pages[0].sections as any[])
        if (s.type === 'services' && Array.isArray(s.props?.items))
          s.props.items = list.map((it: any, i: number) => ({ ...(s.props.items[i] ?? {}), ...it }));
    }
    return c;
  };
  return (
    <Modal
      open
      onClose={onClose}
      title="Ajustar dados da prévia"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => setMode(mode === 'form' ? 'json' : 'form')}>
            {mode === 'form' ? 'Editar JSON completo' : 'Voltar ao formulário'}
          </Button>
          <Button
            variant="primary"
            loading={save.isPending}
            onClick={() => {
              try {
                save.mutate(build(), { onError: (e) => toast.err(e.message) });
              } catch (e) {
                toast.err('JSON inválido: ' + (e as Error).message);
              }
            }}
          >
            Salvar e regerar
          </Button>
        </>
      }
    >
      {mode === 'form' ? (
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nome exibido">
            <Input value={brand} onChange={(e) => setBrand(e.target.value)} />
          </Field>
          <Field label="Anos de experiência">
            <Input type="number" value={years} onChange={(e) => setYears(e.target.value)} />
          </Field>
          <Field label="Headline (use *asteriscos* para destacar)" className="sm:col-span-2">
            <Input value={headline} onChange={(e) => setHeadline(e.target.value)} />
          </Field>
          <Field label="Subtítulo" className="sm:col-span-2">
            <Textarea value={sub} onChange={(e) => setSub(e.target.value)} rows={2} />
          </Field>
          <Field label="Tagline (rodapé)" className="sm:col-span-2">
            <Input value={tagline} onChange={(e) => setTagline(e.target.value)} />
          </Field>
          <Field label="WhatsApp">
            <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
          </Field>
          <Field label="Endereço">
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </Field>
          <Field label="Serviços (um por linha: Título: descrição)" className="sm:col-span-2">
            <Textarea value={services} onChange={(e) => setServices(e.target.value)} rows={6} />
          </Field>
        </div>
      ) : (
        <Textarea value={json} onChange={(e) => setJson(e.target.value)} rows={28} className="mono text-xs" />
      )}
    </Modal>
  );
}

/* ---------------- Propostas ---------------- */
function ProposalsTab({ p }: { p: ProspectFull }) {
  const [editing, setEditing] = useState<Proposal | null>(null);
  const toast = useToast();
  const create = useApiMutation(
    () => api.post<Proposal>(`/prospects/${p.id}/proposals`, {}),
    [['prospect', p.id], ['prospects']],
    (pr) => setEditing(pr),
  );
  const del = useApiMutation((id: string) => api.del(`/proposals/${id}`), [['prospect', p.id]]);
  const statusColor: Record<string, string> = {
    draft: '#8e8e9a',
    sent: '#5b8def',
    viewed: '#c86cf2',
    accepted: '#36c27a',
    rejected: '#ef5a5a',
  };
  const statusLabel: Record<string, string> = {
    draft: 'Rascunho',
    sent: 'Enviada',
    viewed: 'Visualizada',
    accepted: 'Aceita',
    rejected: 'Recusada',
  };
  return (
    <div className="grid gap-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted">
          A proposta puxa os problemas da auditoria, o preço padrão e a prévia mais recente. Edite, exporte em
          HTML/PDF/texto ou copie a versão curta para o WhatsApp.
        </p>
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          loading={create.isPending}
          onClick={() => create.mutate(undefined, { onError: (e) => toast.err(e.message) })}
        >
          Nova proposta
        </Button>
      </div>
      {p.proposals.length === 0 ? (
        <div className="card">
          <Empty icon={<FileText className="w-8 h-8" />} title="Nenhuma proposta" />
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Nº</th>
                <th>Título</th>
                <th>Valor</th>
                <th>Prazo</th>
                <th>Status</th>
                <th>Criada</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {p.proposals.map((pr) => (
                <tr key={pr.id}>
                  <td className="mono text-muted">{String(pr.number).padStart(3, '0')}</td>
                  <td>
                    <button
                      className="font-medium hover:text-accent text-left"
                      onClick={() => setEditing(pr)}
                    >
                      {pr.title}
                    </button>
                  </td>
                  <td>{formatCurrency(pr.price - (pr.discount || 0))}</td>
                  <td className="text-muted">{pr.deadlineDays} dias</td>
                  <td>
                    <Badge color={statusColor[pr.status]}>{statusLabel[pr.status]}</Badge>
                  </td>
                  <td className="text-muted text-xs">{formatDate(pr.createdAt)}</td>
                  <td>
                    <div className="flex gap-1 justify-end">
                      <a
                        className="btn btn-ghost btn-sm"
                        href={`/api/proposals/${pr.id}/html`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        HTML
                      </a>
                      <a className="btn btn-ghost btn-sm" href={`/api/proposals/${pr.id}/pdf`}>
                        PDF
                      </a>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => del.mutate(pr.id)}
                        aria-label="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && <ProposalEditor proposal={editing} prospectId={p.id} onClose={() => setEditing(null)} />}
    </div>
  );
}

function ProposalEditor({
  proposal,
  prospectId,
  onClose,
}: {
  proposal: Proposal;
  prospectId: string;
  onClose: () => void;
}) {
  const toast = useToast();
  const [f, setF] = useState<ProposalInput>({ ...proposal });
  const [wa, setWa] = useState<string | null>(null);
  const save = useApiMutation(
    (data: ProposalInput) => api.put<Proposal>(`/proposals/${proposal.id}`, data),
    [['prospect', prospectId], ['prospects']],
    () => toast.ok('Proposta salva'),
  );
  const ai = useApiMutation(
    () => api.post<{ text: string; provider: string }>(`/proposals/${proposal.id}/ai-solution`),
    [],
    (r) => setF({ ...f, solution: r.text }),
  );
  const whatsapp = useApiMutation(
    () =>
      api.get<{ text: string }>(
        `/proposals/${proposal.id}/whatsapp?link=${encodeURIComponent(`${window.location.origin}/api/proposals/${proposal.id}/html`)}`,
      ),
    [],
    (r) => setWa(r.text),
  );
  const lines = (v: string[]) => v.join('\n');
  const fromLines = (s: string) =>
    s
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
  return (
    <Modal
      open
      onClose={onClose}
      title={`Proposta nº ${String(proposal.number).padStart(3, '0')}`}
      size="xl"
      footer={
        <>
          <a
            className="btn btn-secondary"
            href={`/api/proposals/${proposal.id}/html`}
            target="_blank"
            rel="noreferrer"
          >
            Ver HTML
          </a>
          <a className="btn btn-secondary" href={`/api/proposals/${proposal.id}/pdf`}>
            Baixar PDF
          </a>
          <a
            className="btn btn-secondary"
            href={`/api/proposals/${proposal.id}/text`}
            target="_blank"
            rel="noreferrer"
          >
            Texto
          </a>
          <Button
            onClick={() => whatsapp.mutate(undefined)}
            loading={whatsapp.isPending}
            icon={<MessageCircle className="w-4 h-4" />}
          >
            Versão WhatsApp
          </Button>
          <Button
            variant="primary"
            loading={save.isPending}
            onClick={() => save.mutate(f, { onError: (e) => toast.err(e.message) })}
          >
            Salvar
          </Button>
        </>
      }
    >
      {wa && (
        <div className="mb-4 bg-bg-2 rounded-lg p-3 text-sm whitespace-pre-wrap">
          {wa}
          <div className="mt-2">
            <CopyButton text={wa} />
          </div>
        </div>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Field label="Título" className="lg:col-span-3">
          <Input value={f.title ?? ''} onChange={(e) => setF({ ...f, title: e.target.value })} />
        </Field>
        <Field label="Status">
          <Select
            value={f.status}
            onChange={(e) => setF({ ...f, status: e.target.value as ProposalInput['status'] })}
          >
            <option value="draft">Rascunho</option>
            <option value="sent">Enviada</option>
            <option value="viewed">Visualizada</option>
            <option value="accepted">Aceita</option>
            <option value="rejected">Recusada</option>
          </Select>
        </Field>
        <Field label="Problemas encontrados (um por linha)" className="sm:col-span-2">
          <Textarea
            rows={5}
            value={lines(f.problems)}
            onChange={(e) => setF({ ...f, problems: fromLines(e.target.value) })}
          />
        </Field>
        <Field label="Solução proposta" className="sm:col-span-2">
          <Textarea rows={5} value={f.solution} onChange={(e) => setF({ ...f, solution: e.target.value })} />
          <Button
            size="sm"
            className="mt-2"
            variant="ghost"
            icon={<Wand2 className="w-3.5 h-3.5" />}
            loading={ai.isPending}
            onClick={() => ai.mutate(undefined)}
          >
            Regerar texto (IA opcional / fallback)
          </Button>
        </Field>
        <Field label="Páginas (uma por linha)" className="sm:col-span-2">
          <Textarea
            rows={5}
            value={lines(f.pages)}
            onChange={(e) => setF({ ...f, pages: fromLines(e.target.value) })}
          />
        </Field>
        <Field label="Funcionalidades (uma por linha)" className="sm:col-span-2">
          <Textarea
            rows={5}
            value={lines(f.features)}
            onChange={(e) => setF({ ...f, features: fromLines(e.target.value) })}
          />
        </Field>
        <Field label="Preço (R$)">
          <Input
            type="number"
            value={f.price}
            onChange={(e) => setF({ ...f, price: Number(e.target.value) })}
          />
        </Field>
        <Field label="Desconto (R$)">
          <Input
            type="number"
            value={f.discount}
            onChange={(e) => setF({ ...f, discount: Number(e.target.value) })}
          />
        </Field>
        <Field label="Prazo (dias úteis)">
          <Input
            type="number"
            value={f.deadlineDays}
            onChange={(e) => setF({ ...f, deadlineDays: Number(e.target.value) })}
          />
        </Field>
        <Field label="Validade (dias)">
          <Input
            type="number"
            value={f.validDays}
            onChange={(e) => setF({ ...f, validDays: Number(e.target.value) })}
          />
        </Field>
        <Field label="Forma de pagamento" className="sm:col-span-2 lg:col-span-4">
          <Input value={f.paymentTerms} onChange={(e) => setF({ ...f, paymentTerms: e.target.value })} />
        </Field>
        <Field label="Manutenção">
          <Select
            value={f.maintenance.enabled ? '1' : '0'}
            onChange={(e) =>
              setF({ ...f, maintenance: { ...f.maintenance, enabled: e.target.value === '1' } })
            }
          >
            <option value="1">Incluir (opcional ao cliente)</option>
            <option value="0">Não mencionar</option>
          </Select>
        </Field>
        <Field label="Manutenção mensal (R$)">
          <Input
            type="number"
            value={f.maintenance.monthlyPrice}
            onChange={(e) =>
              setF({ ...f, maintenance: { ...f.maintenance, monthlyPrice: Number(e.target.value) } })
            }
          />
        </Field>
        <Field label="Descrição da manutenção" className="sm:col-span-2">
          <Input
            value={f.maintenance.description}
            onChange={(e) => setF({ ...f, maintenance: { ...f.maintenance, description: e.target.value } })}
          />
        </Field>
        <Field label="Observações" className="sm:col-span-2 lg:col-span-4">
          <Textarea rows={3} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
        </Field>
      </div>
    </Modal>
  );
}

/* ---------------- Mensagens ---------------- */
function MessagesTab({ p }: { p: ProspectFull }) {
  const toast = useToast();
  const [data, setData] = useState<{
    messages: { key: string; name: string; category: string; text: string }[];
  } | null>(null);
  const [sel, setSel] = useState<string>('');
  const [text, setText] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const { data: meta } = useMeta();
  useEffect(() => {
    api
      .get<{ messages: { key: string; name: string; category: string; text: string }[] }>(
        `/prospects/${p.id}/messages`,
      )
      .then((d) => {
        setData(d);
        if (d.messages[0]) {
          setSel(d.messages[0].key);
          setText(d.messages[0].text);
        }
      })
      .catch((e) => setErr(e.message));
  }, [p.id, p.audits.length, p.previews.length, p.proposals.length]);
  const tone = useApiMutation(
    (t: string) => api.post<{ text: string }>(`/prospects/${p.id}/messages/render`, { body: text, tone: t }),
    [],
    (r) => setText(r.text),
  );
  const contact = useApiMutation(
    () => api.patch(`/prospects/${p.id}`, { lastContactAt: new Date().toISOString() }),
    [['prospect', p.id], ['prospects']],
    () => toast.ok('Contato registrado'),
  );
  const wa = whatsappLink(p.whatsapp, text);
  if (err) return <ErrorBox error={new Error(err)} />;
  if (!data) return <Loading />;
  const current = data.messages.find((m) => m.key === sel);
  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-4">
      <Card title="Modelos" pad={false}>
        <ul>
          {data.messages.map((m) => (
            <li key={m.key}>
              <button
                className={`w-full text-left px-4 py-2.5 text-sm border-b border-line hover:bg-panel-2 ${sel === m.key ? 'bg-panel-2 text-accent' : ''}`}
                onClick={() => {
                  setSel(m.key);
                  setText(m.text);
                }}
              >
                {m.name}
                <div className="text-[11px] text-muted">{m.category}</div>
              </button>
            </li>
          ))}
        </ul>
        <div className="p-3 text-[11px] text-muted">Edite os modelos em Configurações → Mensagens.</div>
      </Card>
      <div className="grid gap-4">
        <AdaptiveMessages p={p} onUse={(t) => setText(t)} />
        <Card
          title={current?.name ?? 'Mensagem'}
          actions={
            meta?.ai.available && (
              <Select
                className="h-8 w-36 text-xs"
                defaultValue=""
                onChange={(e) => e.target.value && tone.mutate(e.target.value)}
              >
                <option value="">Adaptar tom (IA)</option>
                <option value="formal">Formal</option>
                <option value="amigavel">Amigável</option>
                <option value="direto">Direto</option>
                <option value="premium">Premium</option>
                <option value="descontraido">Descontraído</option>
              </Select>
            )
          }
        >
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={14} />
          <div className="flex flex-wrap gap-2 mt-3">
            <CopyButton text={text} label="Copiar mensagem" />
            {wa ? (
              <a
                className="btn btn-primary btn-sm"
                href={wa}
                target="_blank"
                rel="noreferrer"
                onClick={() => contact.mutate(undefined)}
              >
                <MessageCircle className="w-3.5 h-3.5" /> Abrir no WhatsApp
              </a>
            ) : (
              <span className="text-xs text-muted self-center">
                Cadastre o WhatsApp na ficha para abrir a conversa direto.
              </span>
            )}
            <Button size="sm" variant="ghost" onClick={() => contact.mutate(undefined)}>
              Registrar contato
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------------- Projeto ---------------- */
function ProjectTab({ p }: { p: ProspectFull }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="grid gap-4">
      {p.projects.length === 0 ? (
        <div className="card">
          <Empty
            icon={<Hammer className="w-8 h-8" />}
            title="Nenhum projeto"
            text="Quando o cliente fechar, crie o projeto: o GZ OS monta a estrutura real do site (config + assets + build)."
            action={
              <Button variant="primary" onClick={() => setOpen(true)}>
                Criar projeto
              </Button>
            }
          />
        </div>
      ) : (
        p.projects.map((pj) => (
          <Card
            key={pj.id}
            title={pj.name}
            actions={<Badge color={PROJECT_STATUS[pj.status].color}>{PROJECT_STATUS[pj.status].label}</Badge>}
          >
            <div className="text-sm text-muted mb-3">
              {pj.domain ?? 'sem domínio'} · criado {relativeTime(pj.createdAt)}{' '}
              {pj.lastBuildAt && `· build ${relativeTime(pj.lastBuildAt)}`}
            </div>
            <Link to={`/projects/${pj.id}`} className="btn btn-primary">
              Abrir projeto (build, QA, export)
            </Link>
          </Card>
        ))
      )}
      {p.projects.length > 0 && (
        <Button className="self-start" onClick={() => setOpen(true)} icon={<Plus className="w-4 h-4" />}>
          Outro projeto
        </Button>
      )}
      <NewProjectModal open={open} onClose={() => setOpen(false)} prospectId={p.id} defaultName={p.name} />
    </div>
  );
}

/* ---------------- Histórico & tarefas ---------------- */
function HistoryTab({ p }: { p: ProspectFull }) {
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [note, setNote] = useState('');
  const toast = useToast();
  const addTask = useApiMutation(
    () =>
      api.post('/tasks', {
        prospectId: p.id,
        title,
        dueAt: due ? new Date(due + 'T09:00:00').toISOString() : null,
      }),
    [['prospect', p.id], ['dashboard']],
    () => {
      setTitle('');
      setDue('');
    },
  );
  const toggle = useApiMutation(
    ({ id, done }: { id: string; done: boolean }) => api.patch(`/tasks/${id}`, { done }),
    [['prospect', p.id], ['dashboard']],
  );
  const delTask = useApiMutation(
    (id: string) => api.del(`/tasks/${id}`),
    [['prospect', p.id], ['dashboard']],
  );
  const addNote = useApiMutation(
    () => api.post(`/prospects/${p.id}/notes`, { text: note }),
    [['prospect', p.id]],
    () => {
      setNote('');
      toast.ok('Nota registrada');
    },
  );
  const grouped = useMemo(() => p.activities, [p.activities]);
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card title="Tarefas">
        <form
          className="flex gap-2 mb-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (title.trim()) addTask.mutate(undefined);
          }}
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nova tarefa (ex.: ligar quinta)"
          />
          <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="w-40" />
          <Button type="submit" variant="primary" size="icon" aria-label="Adicionar">
            <Plus className="w-4 h-4" />
          </Button>
        </form>
        {p.tasks.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma tarefa.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {p.tasks.map((t) => (
              <li key={t.id} className="flex items-center gap-2 text-sm py-1">
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={(e) => toggle.mutate({ id: t.id, done: e.target.checked })}
                  className="accent-[#d4ff2b]"
                />
                <span className={`flex-1 ${t.done ? 'line-through text-muted' : ''}`}>{t.title}</span>
                {t.dueAt && <span className="text-xs text-muted">{formatDate(t.dueAt)}</span>}
                <button
                  className="text-muted hover:text-bad"
                  onClick={() => delTask.mutate(t.id)}
                  aria-label="Excluir"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card title="Histórico">
        <form
          className="flex gap-2 mb-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (note.trim()) addNote.mutate(undefined);
          }}
        >
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Registrar nota (ex.: ligou, pediu desconto)"
          />
          <Button type="submit" size="icon" aria-label="Adicionar nota">
            <Plus className="w-4 h-4" />
          </Button>
        </form>
        <ul className="relative border-l border-line ml-2 flex flex-col gap-3">
          {grouped.map((a) => (
            <li key={a.id} className="pl-4 text-sm relative">
              <span
                className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full ${a.type === 'client.closed' ? 'bg-ok' : a.type.startsWith('audit') ? 'bg-info' : a.type === 'note' ? 'bg-warn' : 'bg-muted-2'}`}
              />
              <div className={a.type === 'note' ? 'whitespace-pre-wrap' : ''}>{a.description}</div>
              <div className="text-[11px] text-muted">{formatDate(a.createdAt, true)}</div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
