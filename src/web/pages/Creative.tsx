/**
 * UI V2 — direção criativa, página de prévia (dispositivos, locks, regenerar, publicar),
 * assets com papéis (vídeo/foto), mensagens adaptativas e editor de unidades.
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Globe,
  Lock,
  LockOpen,
  Monitor,
  Pencil,
  RefreshCw,
  Search,
  Smartphone,
  Sparkles,
  Tablet,
  Trash2,
  Video,
} from 'lucide-react';
import { api, useApiMutation, useProspect, type Preview, type ProspectFull } from '../api';
import {
  Badge,
  Button,
  Card,
  CopyButton,
  ErrorBox,
  Field,
  Input,
  Loading,
  Modal,
  Select,
  Spinner,
  StatusBadge,
  Textarea,
  useToast,
} from '../components/ui';
import type { BusinessDNA, CreativeDirection, Location, ProspectAsset, Research } from '@shared/v2';
import { relativeTime } from '@shared/utils';

/* ---------------- tipos de resposta ---------------- */
interface DirectionsResult {
  research: Research | null;
  researchSummary: { found: string[]; sources: { type: string; url: string; ok: boolean }[] } | null;
  dna: BusinessDNA;
  dnaSummary: string;
  directions: CreativeDirection[];
  creativity: string;
}
interface CreativeReport {
  score: number;
  checks: {
    id: string;
    label: string;
    status: 'pass' | 'warning' | 'fail';
    points: number;
    max: number;
    detail?: string;
  }[];
  warnings: string[];
}
interface PublishStatus {
  configured: boolean;
  provider: string;
  message: string;
}

const SOURCE_LABEL: Record<string, string> = {
  website: 'Site',
  instagram: 'Instagram',
  maps: 'Google Maps',
  link: 'Link',
};

/* ---------------- Direção criativa ---------------- */
export function DirectionModal({
  p,
  open,
  onClose,
}: {
  p: ProspectFull;
  open: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const nav = useNavigate();
  const [data, setData] = useState<DirectionsResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const hasSources = !!(p.website || p.instagram || p.links.some((l) => /^https?:\/\//.test(l.url)));
  const load = (refresh = false) => {
    setLoading(true);
    setErr(null);
    api
      .post<DirectionsResult>(`/prospects/${p.id}/directions`, { refresh })
      .then(setData)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    if (open) {
      setData(null);
      load(false);
    }
  }, [open, p.id]);
  const create = useApiMutation(
    (directionId: string) => api.post<Preview>(`/prospects/${p.id}/previews`, { directionId }),
    [['prospect', p.id], ['prospects']],
    (pv) => {
      toast.ok('Prévia gerada');
      onClose();
      nav(`/preview/${pv.id}`);
    },
  );
  const r = data?.researchSummary;
  return (
    <Modal open={open} onClose={onClose} title="Direção criativa" size="xl">
      {loading && (
        <div className="flex items-center gap-3 text-sm text-muted py-8 justify-center">
          <Spinner className="w-4 h-4" />{' '}
          {hasSources && !p.research
            ? 'Pesquisando fontes públicas e montando o DNA do negócio…'
            : 'Montando o DNA do negócio…'}
        </div>
      )}
      {err && <ErrorBox error={new Error(err)} />}
      {data && !loading && (
        <div className="grid gap-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card title="DNA do negócio">
              <p className="text-sm">{data.dnaSummary}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {data.dna.priorityServices.map((s) => (
                  <Badge key={s}>{s}</Badge>
                ))}
                {data.dna.brandColors.slice(0, 4).map((c) => (
                  <span key={c} className="inline-flex items-center gap-1 text-[11px] text-muted">
                    <span className="w-3 h-3 rounded-full border border-line" style={{ background: c }} /> {c}
                  </span>
                ))}
              </div>
              <ul className="text-[11px] text-muted mt-2 list-disc pl-4">
                {data.dna.signals.slice(0, 5).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </Card>
            <Card
              title="Pesquisa pública"
              actions={
                hasSources && (
                  <Button size="sm" icon={<Search className="w-3.5 h-3.5" />} onClick={() => load(true)}>
                    Pesquisar de novo
                  </Button>
                )
              }
            >
              {!hasSources && (
                <p className="text-xs text-muted">
                  Sem site, Instagram ou links na ficha. Adicione para extrair serviços, horários e unidades
                  publicados.
                </p>
              )}
              {hasSources && !r && <p className="text-xs text-muted">Ainda não pesquisado.</p>}
              {r && (
                <>
                  <ul className="text-xs grid gap-1">
                    {r.sources.map((s, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <StatusBadge status={s.ok ? 'pass' : 'fail'} />
                        <span className="text-muted">{SOURCE_LABEL[s.type] ?? s.type}</span>
                        <a href={s.url} target="_blank" rel="noreferrer" className="truncate hover:underline">
                          {s.url}
                        </a>
                        {!s.ok && (
                          <span className="text-[11px] text-muted">
                            {data.research?.sources[i]?.error ?? 'bloqueado'}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 text-xs">
                    {r.found.length ? (
                      <>
                        <span className="text-muted">Encontrado: </span>
                        {r.found.join(', ')}
                      </>
                    ) : (
                      <span className="text-muted">
                        Nenhuma informação verificável encontrada; o site usa só os dados da ficha.
                      </span>
                    )}
                  </div>
                  {data.research && <ResearchFacts research={data.research} />}
                </>
              )}
            </Card>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {data.directions.map((d, i) => (
              <div key={d.id} className="card p-4 flex flex-col gap-2">
                <div className="flex gap-1 h-8 rounded overflow-hidden border border-line">
                  <span className="flex-1" style={{ background: d.palette.bg }} />
                  <span className="w-8" style={{ background: d.palette.surface }} />
                  <span className="w-8" style={{ background: d.palette.accent }} />
                  <span className="w-4" style={{ background: d.palette.text }} />
                </div>
                <div className="font-semibold">
                  {i === 0 && <Badge color="var(--accent)">Recomendada</Badge>} {d.name}
                </div>
                <p className="text-xs text-muted">{d.description}</p>
                <div className="text-[11px] text-muted">
                  Hero {d.hero} · motion {d.motion} · {d.typography.display}
                </div>
                <ul className="text-[11px] list-disc pl-4 text-muted">
                  {d.why.slice(0, 3).map((w, j) => (
                    <li key={j}>{w}</li>
                  ))}
                </ul>
                <Button
                  variant={i === 0 ? 'primary' : 'secondary'}
                  size="sm"
                  className="mt-auto"
                  loading={create.isPending && create.variables === d.id}
                  onClick={() => create.mutate(d.id, { onError: (e) => toast.err(e.message) })}
                >
                  Usar esta direção
                </Button>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              icon={<Sparkles className="w-4 h-4" />}
              loading={create.isPending && create.variables === 'auto'}
              onClick={() => create.mutate('auto', { onError: (e) => toast.err(e.message) })}
            >
              Escolha por mim
            </Button>
            <span className="text-xs text-muted">
              Criatividade: {data.creativity} (ajuste em Configurações). Tudo por regras, sem IA.
            </span>
          </div>
        </div>
      )}
    </Modal>
  );
}

function ResearchFacts({ research }: { research: Research }) {
  const f = research.facts;
  const rows: [string, string[]][] = [
    ['Serviços', f.services],
    ['Posicionamento', f.positioning],
    ['Diferenciais', f.differentials],
    ['Horários', f.hours],
    ['Unidades', f.locations.map((l) => [l.name, l.address, l.city].filter(Boolean).join(' · '))],
    ['Conteúdo', f.contentTypes],
    ['Cores', f.colors],
  ];
  const any = rows.some(([, v]) => v.length);
  if (!any) return null;
  return (
    <details className="mt-2 text-xs">
      <summary className="cursor-pointer text-muted">Detalhes extraídos</summary>
      <dl className="grid grid-cols-[90px_1fr] gap-x-2 gap-y-1 mt-1">
        {rows
          .filter(([, v]) => v.length)
          .map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted">{k}</dt>
              <dd>{v.slice(0, 6).join(' · ')}</dd>
            </div>
          ))}
      </dl>
    </details>
  );
}

/* ---------------- Página da prévia ---------------- */
const DEVICES = [
  { id: 'desktop', label: 'Desktop', w: 1440, icon: Monitor },
  { id: 'tablet', label: 'Tablet', w: 820, icon: Tablet },
  { id: 'mobile', label: 'Celular', w: 390, icon: Smartphone },
] as const;

export function PreviewPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [report, setReport] = useState<CreativeReport | null>(null);
  const [pub, setPub] = useState<PublishStatus | null>(null);
  const [device, setDevice] = useState<(typeof DEVICES)[number]['id']>('desktop');
  const [err, setErr] = useState<string | null>(null);
  const [dirOpen, setDirOpen] = useState(false);
  const [reload, setReload] = useState(0);
  const { data: prospect } = useProspect(preview?.prospectId);
  useEffect(() => {
    if (!id) return;
    api
      .get<Preview>(`/previews/${id}`)
      .then(setPreview)
      .catch((e) => setErr(e.message));
    api
      .get<CreativeReport>(`/previews/${id}/creative-qa`)
      .then(setReport)
      .catch(() => setReport(null));
    api
      .get<PublishStatus>('/publish/status')
      .then(setPub)
      .catch(() => null);
  }, [id, reload]);
  const regen = useApiMutation(
    (locks: string[]) => api.post<Preview>(`/previews/${id}/regenerate`, { locks }),
    [['prospect', preview?.prospectId], ['prospects']],
    (pv) => {
      toast.ok('Nova composição gerada');
      nav(`/preview/${pv.id}`);
    },
  );
  const setLocks = useApiMutation(
    (locks: string[]) => api.put<Preview>(`/previews/${id}/locks`, { locks }),
    [],
    (pv) => setPreview(pv),
  );
  const publish = useApiMutation(
    () => api.post<Preview>(`/previews/${id}/publish`),
    [['prospect', preview?.prospectId]],
    (pv) => {
      setPreview(pv);
      toast.ok(pv.published?.url ? `Publicado: ${pv.published.url}` : 'Publicado');
    },
  );
  if (err) return <ErrorBox error={new Error(err)} />;
  if (!preview) return <Loading />;
  const cfg = preview.config as {
    pages: {
      sections: { type: string; variant?: string; enabled: boolean; props: Record<string, unknown> }[];
    }[];
  };
  const sections = cfg.pages?.[0]?.sections ?? [];
  const heroIdx = sections.findIndex((s) => s.type.startsWith('hero'));
  const locks = preview.meta.locks ?? [];
  const toggleLock = (pathKey: string) =>
    setLocks.mutate(locks.includes(pathKey) ? locks.filter((l) => l !== pathKey) : [...locks, pathKey]);
  const dev = DEVICES.find((d) => d.id === device)!;
  const dir = preview.meta.direction;
  const pubUrl = preview.published?.url
    ? preview.published.url.startsWith('http')
      ? preview.published.url
      : `${window.location.origin}${preview.published.url}`
    : '';
  return (
    <div className="grid gap-4">
      <Link
        to={`/prospects/${preview.prospectId}`}
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-text"
      >
        <ArrowLeft className="w-3 h-3" /> {prospect?.name ?? 'Prospect'}
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-md border border-line overflow-hidden">
          {DEVICES.map((d) => (
            <button
              key={d.id}
              className={`px-3 h-9 text-xs inline-flex items-center gap-1 ${device === d.id ? 'bg-panel-2 text-accent' : 'text-muted hover:text-text'}`}
              onClick={() => setDevice(d.id)}
              aria-pressed={device === d.id}
            >
              <d.icon className="w-3.5 h-3.5" /> {d.label}
            </button>
          ))}
        </div>
        <a className="btn btn-sm" href={preview.url} target="_blank" rel="noreferrer">
          Abrir <ExternalLink className="w-3 h-3" />
        </a>
        <CopyButton text={`${window.location.origin}${preview.url}`} label="Copiar link local" />
        <Button
          size="sm"
          icon={<Pencil className="w-3.5 h-3.5" />}
          onClick={() => nav(`/prospects/${preview.prospectId}?tab=previas&edit=${preview.id}`)}
        >
          Editar conteúdo
        </Button>
        {prospect && (
          <Button size="sm" icon={<Sparkles className="w-3.5 h-3.5" />} onClick={() => setDirOpen(true)}>
            Trocar direção
          </Button>
        )}
        <Button
          size="sm"
          icon={<RefreshCw className="w-3.5 h-3.5" />}
          loading={regen.isPending}
          onClick={() => regen.mutate(locks, { onError: (e) => toast.err(e.message) })}
          disabled={!dir}
        >
          Regenerar composição
        </Button>
        <Button
          size="sm"
          variant="primary"
          icon={<Globe className="w-3.5 h-3.5" />}
          loading={publish.isPending}
          disabled={pub ? !pub.configured : true}
          title={pub?.message}
          onClick={() => publish.mutate(undefined, { onError: (e) => toast.err(e.message) })}
        >
          {preview.published ? 'Atualizar publicação' : 'Publicar prévia'}
        </Button>
        {pub && !pub.configured && <span className="text-[11px] text-muted basis-full">{pub.message}</span>}
        {preview.published && (
          <span className="flex items-center gap-2 text-xs basis-full">
            <Check className="w-3.5 h-3.5 text-success" /> Publicado{' '}
            {relativeTime(preview.published.publishedAt)} via {preview.published.provider}:
            <a href={pubUrl} target="_blank" rel="noreferrer" className="underline truncate max-w-[320px]">
              {pubUrl}
            </a>
            <CopyButton text={pubUrl} label="Copiar link público" />
          </span>
        )}
      </div>
      <div className="grid xl:grid-cols-[1fr_320px] gap-4">
        <div className="card p-3 overflow-auto bg-panel-2">
          <div
            className="mx-auto border border-line bg-white shadow-lg"
            style={{ width: dev.w, maxWidth: '100%', height: '78vh' }}
          >
            <iframe
              key={`${preview.id}-${device}-${reload}`}
              src={preview.url}
              title="Prévia"
              className="w-full h-full"
            />
          </div>
        </div>
        <div className="grid gap-3 content-start">
          <Card title="Direção">
            {dir ? (
              <>
                <div className="flex gap-1 h-5 rounded overflow-hidden border border-line mb-2">
                  <span className="flex-1" style={{ background: dir.palette.bg }} />
                  <span className="w-6" style={{ background: dir.palette.accent }} />
                  <span className="w-3" style={{ background: dir.palette.text }} />
                </div>
                <div className="text-sm font-semibold">{dir.name}</div>
                <div className="text-[11px] text-muted">
                  hero {dir.hero} · motion {dir.motion} · seed {preview.meta.seed ?? 0}
                </div>
              </>
            ) : (
              <p className="text-xs text-muted">
                Prévia V1 (tema {preview.theme}). Use "Trocar direção" para gerar com o motor adaptativo.
              </p>
            )}
          </Card>
          {report && (
            <Card title={`Creative Quality Score: ${report.score}`}>
              <ul className="grid gap-1 text-xs">
                {report.checks.map((c) => (
                  <li key={c.id} className="flex items-start gap-2">
                    <StatusBadge status={c.status} />
                    <span>
                      {c.label}
                      {c.detail && <span className="text-muted"> — {c.detail}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <Card title="Bloqueios ao regenerar">
            <p className="text-[11px] text-muted mb-2">
              Itens com cadeado são mantidos quando você regenera a composição.
            </p>
            <ul className="grid gap-1 text-xs">
              {heroIdx >= 0 &&
                (['headline', 'subheadline'] as const).map((k) => {
                  const key = `pages.0.sections.${heroIdx}.props.${k}`;
                  const on = locks.includes(key);
                  return (
                    <li key={k} className="flex items-center gap-2">
                      <button
                        className={`inline-flex items-center gap-1 ${on ? 'text-accent' : 'text-muted hover:text-text'}`}
                        onClick={() => toggleLock(key)}
                        aria-pressed={on}
                        title={on ? 'Desbloquear' : 'Bloquear'}
                      >
                        {on ? <Lock className="w-3.5 h-3.5" /> : <LockOpen className="w-3.5 h-3.5" />}{' '}
                        {k === 'headline' ? 'Título do hero' : 'Subtítulo do hero'}
                      </button>
                    </li>
                  );
                })}
              {sections.map((s, i) => {
                if (['header', 'footer', 'whatsapp-float', 'sticky-cta'].includes(s.type)) return null;
                const key = `pages.0.sections.${i}`;
                const on = locks.includes(key);
                return (
                  <li key={i} className="flex items-center gap-2">
                    <button
                      className={`inline-flex items-center gap-1 ${on ? 'text-accent' : 'text-muted hover:text-text'}`}
                      onClick={() => toggleLock(key)}
                      aria-pressed={on}
                    >
                      {on ? <Lock className="w-3.5 h-3.5" /> : <LockOpen className="w-3.5 h-3.5" />} {s.type}
                      {s.variant ? ` · ${s.variant}` : ''}
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
          <Button size="sm" variant="ghost" onClick={() => setReload((n) => n + 1)}>
            Recarregar prévia
          </Button>
        </div>
      </div>
      {prospect && <DirectionModal p={prospect} open={dirOpen} onClose={() => setDirOpen(false)} />}
    </div>
  );
}

/* ---------------- Assets (fotos + vídeos) com papéis ---------------- */
const ROLES: { id: ProspectAsset['role']; label: string }[] = [
  { id: 'auto', label: 'Automático' },
  { id: 'hero', label: 'Hero (topo)' },
  { id: 'gallery', label: 'Galeria' },
  { id: 'background', label: 'Fundo' },
  { id: 'none', label: 'Não usar' },
];
export function AssetGrid({ p }: { p: ProspectFull }) {
  const toast = useToast();
  const remove = useApiMutation(
    (path: string) => api.del(`/prospects/${p.id}/uploads`, { path }),
    [['prospect', p.id]],
  );
  const role = useApiMutation(
    (a: { path: string; role: string }) => api.patch(`/prospects/${p.id}/uploads`, a),
    [['prospect', p.id]],
    () => toast.ok('Papel atualizado'),
  );
  if (!p.photos.length)
    return (
      <p className="text-xs text-muted">
        Sem fotos ou vídeos. As prévias usam placeholders até você enviar mídia real do negócio. Vídeos
        (MP4/MOV/WebM) viram o topo do site automaticamente.
      </p>
    );
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {p.photos.map((a) => {
        const v =
          a.kind === 'video'
            ? (a.analysis as { duration?: number; sizeWarning?: string; optimized?: string } | undefined)
            : undefined;
        return (
          <div
            key={a.path}
            className="rounded-md overflow-hidden bg-panel-2 border border-line flex flex-col"
          >
            <div className="relative aspect-[4/3]">
              {a.kind === 'video' ? (
                a.poster ? (
                  <img src={a.poster} alt={a.name} className="object-cover w-full h-full" loading="lazy" />
                ) : (
                  <div className="grid place-items-center h-full text-muted-2">
                    <Video className="w-6 h-6" />
                  </div>
                )
              ) : (
                <img src={a.path} alt={a.name} className="object-cover w-full h-full" loading="lazy" />
              )}
              {a.kind === 'video' && (
                <span className="absolute left-1 bottom-1 inline-flex items-center gap-1 rounded bg-black/70 text-white text-[10px] px-1.5 py-0.5">
                  <Video className="w-3 h-3" /> {v?.duration ? `${Math.round(v.duration)}s` : 'vídeo'}
                  {a.width ? ` · ${a.width}×${a.height}` : ''}
                </span>
              )}
              <button
                className="absolute top-1 right-1 grid place-items-center w-6 h-6 rounded bg-black/70 text-white"
                onClick={() => remove.mutate(a.path)}
                aria-label="Remover"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            <div className="p-1.5 grid gap-1">
              <div className="text-[11px] truncate" title={a.name}>
                {a.name}
              </div>
              <Select
                className="h-7 text-[11px]"
                value={a.role ?? 'auto'}
                onChange={(e) => role.mutate({ path: a.path, role: e.target.value })}
                aria-label={`Papel de ${a.name}`}
              >
                {ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </Select>
              {v?.sizeWarning && (
                <div className="text-[10px] text-warning">
                  {v.optimized ? 'Otimizado para web.' : v.sizeWarning}
                </div>
              )}
              {v?.optimized && !v.sizeWarning && (
                <div className="text-[10px] text-muted">Versão web (720p) pronta.</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Mensagens adaptativas ---------------- */
export function AdaptiveMessages({ p, onUse }: { p: ProspectFull; onUse: (text: string) => void }) {
  const [kinds, setKinds] = useState<{ id: string; label: string }[]>([]);
  const [kind, setKind] = useState('primeira-abordagem');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    api
      .get<{ id: string; label: string }[]>('/messages/adaptive/kinds')
      .then(setKinds)
      .catch(() => null);
  }, []);
  useEffect(() => {
    setLoading(true);
    api
      .post<{ text: string }>(`/prospects/${p.id}/messages/adaptive`, { kind })
      .then((r) => setText(r.text))
      .catch(() => setText(''))
      .finally(() => setLoading(false));
  }, [p.id, kind, p.previews.length, p.audits.length, p.proposals.length]);
  return (
    <Card
      title="Mensagem adaptativa"
      actions={<span className="text-[11px] text-muted">muda conforme o que existe na ficha</span>}
    >
      <div className="flex flex-wrap gap-1.5 mb-2">
        {kinds.map((k) => (
          <button
            key={k.id}
            className={`px-2.5 h-7 rounded-full text-xs border border-line ${kind === k.id ? 'bg-panel-2 text-accent' : 'text-muted hover:text-text'}`}
            onClick={() => setKind(k.id)}
          >
            {k.label}
          </button>
        ))}
      </div>
      {loading ? (
        <Loading text="Montando…" />
      ) : (
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} />
      )}
      <div className="flex gap-2 mt-2">
        <CopyButton text={text} label="Copiar" />
        <Button size="sm" onClick={() => onUse(text)}>
          Usar no editor
        </Button>
      </div>
    </Card>
  );
}

/* ---------------- Unidades (ficha) ---------------- */
export const emptyLocation = (): Location => ({
  name: '',
  address: '',
  city: '',
  state: '',
  phone: '',
  whatsapp: '',
  mapsUrl: '',
  openingHours: '',
});
export function LocationsEditor({
  value,
  onChange,
}: {
  value: Location[];
  onChange: (v: Location[]) => void;
}) {
  const set = (i: number, k: keyof Location, v: string) =>
    onChange(value.map((l, j) => (j === i ? { ...l, [k]: v } : l)));
  return (
    <div className="grid gap-3">
      {value.map((l, i) => (
        <div key={i} className="rounded-md border border-line p-3 grid sm:grid-cols-2 gap-2">
          <Input
            value={l.name ?? ''}
            onChange={(e) => set(i, 'name', e.target.value)}
            placeholder={`Nome da unidade ${i + 1} (ex.: Centro)`}
          />
          <Input
            value={l.address ?? ''}
            onChange={(e) => set(i, 'address', e.target.value)}
            placeholder="Endereço"
          />
          <div className="flex gap-2">
            <Input
              value={l.city ?? ''}
              onChange={(e) => set(i, 'city', e.target.value)}
              placeholder="Cidade"
            />
            <Input
              value={l.state ?? ''}
              onChange={(e) => set(i, 'state', e.target.value)}
              placeholder="UF"
              className="w-16"
              maxLength={2}
            />
          </div>
          <Input
            value={l.whatsapp ?? ''}
            onChange={(e) => set(i, 'whatsapp', e.target.value)}
            placeholder="WhatsApp da unidade"
            inputMode="tel"
          />
          <Input
            value={l.phone ?? ''}
            onChange={(e) => set(i, 'phone', e.target.value)}
            placeholder="Telefone"
            inputMode="tel"
          />
          <Input
            value={l.openingHours ?? ''}
            onChange={(e) => set(i, 'openingHours', e.target.value)}
            placeholder="Horário (ex.: seg–sex 8h–18h)"
          />
          <Input
            value={l.mapsUrl ?? ''}
            onChange={(e) => set(i, 'mapsUrl', e.target.value)}
            placeholder="Link do Google Maps"
            inputMode="url"
            className="sm:col-span-2"
          />
          <button
            type="button"
            className="text-xs text-muted hover:text-danger text-left"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
          >
            Remover unidade
          </button>
        </div>
      ))}
      <button
        type="button"
        className="text-xs text-accent text-left"
        onClick={() => onChange([...value, emptyLocation()])}
      >
        + Adicionar unidade
      </button>
    </div>
  );
}

/** Lista simples (serviços / diferenciais), uma linha por item. */
export function LinesField({
  label,
  hint,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} placeholder={placeholder} />
    </Field>
  );
}

export function useUploadButton(p: ProspectFull) {
  const toast = useToast();
  const upload = useApiMutation(
    (a: { files: FileList; category: string }) => {
      const fd = new FormData();
      fd.append('category', a.category);
      Array.from(a.files).forEach((f) => fd.append('files', f));
      return api.post(`/prospects/${p.id}/uploads`, fd);
    },
    [['prospect', p.id]],
    () => toast.ok('Arquivos enviados'),
  );
  return upload;
}
