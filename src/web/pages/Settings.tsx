import { useEffect, useRef, useState } from 'react';
import { Download, RotateCcw, Save, Upload } from 'lucide-react';
import {
  api,
  useApiMutation,
  useMeta,
  useSettings,
  useTemplates,
  type Settings,
  type Template,
} from '../api';
import { Button, Card, Field, Input, Loading, Select, Tabs, Textarea, useToast } from '../components/ui';
import { PageHeader } from '../components/Layout';
import { THEME_IDS } from '@shared/site-config';

type Tab = 'agency' | 'pricing' | 'messages' | 'proposals' | 'ai' | 'backup';

export function SettingsPage() {
  const [tab, setTab] = useState<Tab>('agency');
  const { data, isLoading } = useSettings();
  if (isLoading || !data) return <Loading />;
  return (
    <>
      <PageHeader title="Configurações" sub="Agência, preços, templates, IA opcional e backup." />
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: 'agency', label: 'Agência' },
          { id: 'pricing', label: 'Preços' },
          { id: 'messages', label: 'Mensagens' },
          { id: 'proposals', label: 'Propostas' },
          { id: 'ai', label: 'IA opcional' },
          { id: 'backup', label: 'Backup' },
        ]}
      />
      <div className="mt-5">
        {tab === 'agency' && <AgencyTab s={data} />}
        {tab === 'pricing' && <PricingTab s={data} />}
        {tab === 'messages' && <TemplatesTab kind="message" />}
        {tab === 'proposals' && <TemplatesTab kind="proposal" />}
        {tab === 'ai' && <AiTab s={data} />}
        {tab === 'backup' && <BackupTab />}
      </div>
    </>
  );
}

function useSave() {
  const toast = useToast();
  return useApiMutation(
    (patch: Partial<Settings>) => api.put<Settings>('/settings', patch),
    [['settings']],
    () => toast.ok('Configurações salvas'),
  );
}

function AgencyTab({ s }: { s: Settings }) {
  const [f, setF] = useState(s);
  const save = useSave();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const logo = useApiMutation(
    (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      return api.post<Settings>('/settings/logo', fd);
    },
    [['settings']],
    () => toast.ok('Logo atualizado'),
  );
  const set =
    (k: keyof Settings) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setF({ ...f, [k]: e.target.value });
  return (
    <Card
      title="Dados da agência"
      actions={
        <Button
          variant="primary"
          icon={<Save className="w-4 h-4" />}
          loading={save.isPending}
          onClick={() => save.mutate(f)}
        >
          Salvar
        </Button>
      }
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Nome da agência">
          <Input value={f.agencyName} onChange={set('agencyName')} />
        </Field>
        <Field label="Slogan">
          <Input value={f.slogan} onChange={set('slogan')} />
        </Field>
        <Field label="Seu nome (aparece nas mensagens)">
          <Input value={f.ownerName} onChange={set('ownerName')} placeholder="Ex.: Gabriel" />
        </Field>
        <Field label="Assinatura">
          <Input value={f.signature} onChange={set('signature')} />
        </Field>
        <Field label="WhatsApp da agência">
          <Input value={f.whatsapp} onChange={set('whatsapp')} />
        </Field>
        <Field label="E-mail">
          <Input value={f.email} onChange={set('email')} />
        </Field>
        <Field label="Site da agência">
          <Input value={f.website} onChange={set('website')} placeholder="https://gzsites.com.br" />
        </Field>
        <Field label="Instagram">
          <Input value={f.instagram} onChange={set('instagram')} />
        </Field>
        <Field label="Moeda / Locale">
          <div className="flex gap-2">
            <Input value={f.currency} onChange={set('currency')} className="w-24" />
            <Input value={f.locale} onChange={set('locale')} className="w-28" />
          </div>
        </Field>
        <Field label="Tema padrão das prévias">
          <Select value={f.defaultTheme} onChange={set('defaultTheme')}>
            {THEME_IDS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Logo da agência" hint="PNG/SVG. Usado no painel." className="sm:col-span-2">
          <div className="flex items-center gap-3">
            {s.logoPath && (
              <img src={s.logoPath} alt="" className="h-10 w-10 object-contain rounded bg-panel-2" />
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && logo.mutate(e.target.files[0])}
            />
            <Button
              onClick={() => fileRef.current?.click()}
              loading={logo.isPending}
              icon={<Upload className="w-4 h-4" />}
            >
              Enviar logo
            </Button>
          </div>
        </Field>
      </div>
    </Card>
  );
}

function PricingTab({ s }: { s: Settings }) {
  const [p, setP] = useState(s.pricing);
  const [maint, setMaint] = useState(s.maintenanceDescription);
  const [audit, setAudit] = useState(s.audit);
  const save = useSave();
  const num = (k: keyof typeof p) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setP({ ...p, [k]: Number(e.target.value) });
  return (
    <Card
      title="Preços padrão e manutenção"
      actions={
        <Button
          variant="primary"
          icon={<Save className="w-4 h-4" />}
          loading={save.isPending}
          onClick={() => save.mutate({ pricing: p, maintenanceDescription: maint, audit })}
        >
          Salvar
        </Button>
      }
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Field label="Landing page (R$)">
          <Input type="number" value={p.landingPage} onChange={num('landingPage')} />
        </Field>
        <Field label="Site institucional (R$)">
          <Input type="number" value={p.institutional} onChange={num('institutional')} />
        </Field>
        <Field label="Site premium (R$)">
          <Input type="number" value={p.premium} onChange={num('premium')} />
        </Field>
        <Field label="E-commerce (R$)">
          <Input type="number" value={p.ecommerce} onChange={num('ecommerce')} />
        </Field>
        <Field label="Manutenção mensal (R$)">
          <Input type="number" value={p.maintenanceMonthly} onChange={num('maintenanceMonthly')} />
        </Field>
        <Field label="Hospedagem mensal (R$)">
          <Input type="number" value={p.hostingMonthly} onChange={num('hostingMonthly')} />
        </Field>
        <Field label="Prazo padrão (dias úteis)">
          <Input type="number" value={p.defaultDeadlineDays} onChange={num('defaultDeadlineDays')} />
        </Field>
        <Field label="Pagamento padrão" className="sm:col-span-2 lg:col-span-4">
          <Input
            value={p.defaultPaymentTerms}
            onChange={(e) => setP({ ...p, defaultPaymentTerms: e.target.value })}
          />
        </Field>
        <Field label="Descrição da manutenção" className="sm:col-span-2 lg:col-span-4">
          <Textarea value={maint} onChange={(e) => setMaint(e.target.value)} rows={2} />
        </Field>
        <Field
          label="Auditoria: rodar Lighthouse"
          hint="Desligue para auditorias mais rápidas (~10s em vez de ~40s)."
        >
          <Select
            value={audit.lighthouse ? '1' : '0'}
            onChange={(e) => setAudit({ ...audit, lighthouse: e.target.value === '1' })}
          >
            <option value="1">Sim</option>
            <option value="0">Não</option>
          </Select>
        </Field>
        <Field label="Auditoria: timeout (ms)">
          <Input
            type="number"
            value={audit.timeoutMs}
            onChange={(e) => setAudit({ ...audit, timeoutMs: Number(e.target.value) })}
          />
        </Field>
      </div>
    </Card>
  );
}

function TemplatesTab({ kind }: { kind: 'message' | 'proposal' }) {
  const { data, isLoading } = useTemplates(kind);
  const [sel, setSel] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [name, setName] = useState('');
  const toast = useToast();
  const current = data?.find((t) => t.key === sel) ?? data?.[0];
  useEffect(() => {
    if (current) {
      setSel(current.key);
      setBody(current.body);
      setName(current.name);
    }
  }, [current?.key]);
  const save = useApiMutation(
    (t: Partial<Template>) => api.put('/templates', t),
    [['templates']],
    () => toast.ok('Template salvo'),
  );
  const reset = useApiMutation(
    (key: string) => api.post('/templates/reset', { key, kind }),
    [['templates']],
    () => toast.ok('Template restaurado'),
  );
  const [newKey, setNewKey] = useState('');
  if (isLoading || !data) return <Loading />;
  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-4">
      <Card title={kind === 'message' ? 'Modelos de mensagem' : 'Templates de proposta'} pad={false}>
        <ul className="flex flex-col">
          {data.map((t) => (
            <li key={t.id}>
              <button
                className={`w-full text-left px-4 py-2.5 text-sm border-b border-line hover:bg-panel-2 ${sel === t.key ? 'bg-panel-2 text-accent' : ''}`}
                onClick={() => setSel(t.key)}
              >
                {t.name}
                <div className="text-[11px] text-muted">{t.category}</div>
              </button>
            </li>
          ))}
        </ul>
        <div className="p-3 flex gap-2">
          <Input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="novo-modelo"
            className="h-8 text-xs"
          />
          <Button
            size="sm"
            onClick={() =>
              newKey &&
              save.mutate(
                {
                  kind,
                  key: newKey.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                  name: newKey,
                  body: 'Oi, {nome}! ',
                  category: 'Personalizado',
                },
                { onSuccess: () => setSel(newKey) },
              )
            }
          >
            +
          </Button>
        </div>
      </Card>
      {current && (
        <Card
          title={<Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 w-64" />}
          actions={
            <>
              <Button
                size="sm"
                icon={<RotateCcw className="w-3.5 h-3.5" />}
                onClick={() => reset.mutate(current.key)}
              >
                Restaurar padrão
              </Button>
              <Button
                size="sm"
                variant="primary"
                icon={<Save className="w-3.5 h-3.5" />}
                loading={save.isPending}
                onClick={() =>
                  save.mutate({
                    kind,
                    key: current.key,
                    name,
                    body,
                    category: current.category,
                    sortOrder: current.sortOrder,
                  })
                }
              >
                Salvar
              </Button>
            </>
          }
        >
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={kind === 'message' ? 14 : 24}
            className="mono text-xs"
          />
          <p className="text-xs text-muted mt-2">
            {kind === 'message'
              ? 'Variáveis: {saudacao} {nome} {empresa} {cidade} {segmento} {site_atual} {agencia} {apresentacao} {responsavel_agencia} {assinatura} {whatsapp_agencia} {nota} {problema1} {problema2} {problema3} {link_previa} {link_proposta} {preco} {prazo} {pagamento} {manutencao}'
              : 'HTML com {{variavel}} e blocos {{#lista}}…{{/lista}}. Variáveis: numero data empresa cliente cidade site_atual titulo slogan agencia whatsapp_agencia email_agencia assinatura problemas solucao paginas funcionalidades preco preco_cheio desconto prazo pagamento manutencao manutencao_preco manutencao_descricao observacoes validade'}
          </p>
        </Card>
      )}
    </div>
  );
}

function AiTab({ s }: { s: Settings }) {
  const { data: meta } = useMeta();
  const [ai, setAi] = useState(s.ai);
  const save = useSave();
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card
        title="Provider de IA (opcional)"
        actions={
          <Button
            variant="primary"
            icon={<Save className="w-4 h-4" />}
            loading={save.isPending}
            onClick={() => save.mutate({ ai })}
          >
            Salvar
          </Button>
        }
      >
        <div className="grid gap-4">
          <div className="text-sm text-muted">
            Status atual:{' '}
            <strong className="text-text">
              {meta?.ai.available ? `ativo (${meta.ai.provider})` : 'desligado — tudo funciona sem IA'}
            </strong>
          </div>
          <Field
            label="Provider preferido"
            hint="A chave fica só no arquivo .env (OPENAI_API_KEY / ANTHROPIC_API_KEY). Sem chave, cai automaticamente no modo sem IA."
          >
            <Select
              value={ai.provider}
              onChange={(e) => setAi({ ...ai, provider: e.target.value as Settings['ai']['provider'] })}
            >
              <option value="none">Nenhum (padrão)</option>
              <option value="openai">
                OpenAI {meta?.ai.configured.openai ? '· chave detectada' : '· sem chave no .env'}
              </option>
              <option value="anthropic">
                Anthropic {meta?.ai.configured.anthropic ? '· chave detectada' : '· sem chave no .env'}
              </option>
              <option value="openai-compatible">Compatível OpenAI (Ollama, Groq, LM Studio…)</option>
            </Select>
          </Field>
          <Field label="Modelo (opcional)">
            <Input
              value={ai.model}
              onChange={(e) => setAi({ ...ai, model: e.target.value })}
              placeholder="deixe vazio para usar o padrão do .env"
            />
          </Field>
          <Field label="Base URL (só para compatível)">
            <Input
              value={ai.baseUrl}
              onChange={(e) => setAi({ ...ai, baseUrl: e.target.value })}
              placeholder="http://localhost:11434/v1"
            />
          </Field>
        </div>
      </Card>
      <Card title="O que a IA faz (quando ligada)">
        <ul className="text-sm text-muted leading-relaxed list-disc pl-5">
          <li>Melhorar textos de copy e headlines das prévias</li>
          <li>Adaptar o tom das mensagens (formal, amigável, direto…)</li>
          <li>Resumir a auditoria em linguagem de venda</li>
          <li>Escrever o parágrafo “solução” da proposta</li>
          <li>Sugerir estrutura de seções</li>
        </ul>
        <p className="text-xs text-muted mt-4">
          Tudo isso tem versão sem IA (biblioteca de copy, regras e templates). Nenhuma auditoria, prévia,
          proposta ou build depende de IA.
        </p>
      </Card>
    </div>
  );
}

function BackupTab() {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const zip = useApiMutation(
    () => api.post<{ url: string; bytes: number }>('/backup/zip', { includeFiles: true }),
    [],
    (r) => {
      window.location.href = r.url;
      toast.ok(`Backup gerado (${(r.bytes / 1024 / 1024).toFixed(1)} MB)`);
    },
  );
  const imp = useApiMutation(
    (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('mode', mode);
      return api.post<{ imported: Record<string, number> }>('/backup/import', fd);
    },
    [['dashboard'], ['prospects'], ['projects'], ['settings'], ['templates']],
    (r) =>
      toast.ok(
        `Importado: ${Object.entries(r.imported)
          .map(([k, v]) => `${v} ${k}`)
          .join(', ')}`,
      ),
  );
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card title="Exportar">
        <p className="text-sm text-muted mb-4">
          Seus dados ficam em <span className="mono">data/</span>, separados do código. Atualizar o GZ OS
          nunca apaga prospects. Mesmo assim, faça backups.
        </p>
        <div className="flex flex-wrap gap-2">
          <a className="btn btn-secondary" href="/api/backup/json">
            <Download className="w-4 h-4" /> JSON (só o banco)
          </a>
          <Button
            variant="primary"
            icon={<Download className="w-4 h-4" />}
            loading={zip.isPending}
            onClick={() => zip.mutate(undefined)}
          >
            ZIP completo (banco + arquivos)
          </Button>
        </div>
      </Card>
      <Card title="Importar">
        <Field label="Modo">
          <Select value={mode} onChange={(e) => setMode(e.target.value as 'merge' | 'replace')}>
            <option value="merge">Mesclar (não sobrescreve o que já existe)</option>
            <option value="replace">Substituir tudo (apaga os dados atuais)</option>
          </Select>
        </Field>
        <input
          ref={fileRef}
          type="file"
          accept=".json,.zip"
          className="hidden"
          onChange={(e) =>
            e.target.files?.[0] && imp.mutate(e.target.files[0], { onError: (er) => toast.err(er.message) })
          }
        />
        <Button
          className="mt-4"
          icon={<Upload className="w-4 h-4" />}
          loading={imp.isPending}
          onClick={() =>
            mode === 'replace' && !confirm('Isso apaga todos os dados atuais. Continuar?')
              ? null
              : fileRef.current?.click()
          }
        >
          Escolher arquivo (.json ou .zip)
        </Button>
      </Card>
    </div>
  );
}
