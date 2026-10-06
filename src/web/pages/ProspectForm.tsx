import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, useApiMutation, useMeta, type Prospect, type ProspectInput } from '../api';
import { Button, Field, Input, Modal, Select, Textarea, useToast } from '../components/ui';
import { STAGES } from '@shared/stages';
import { LocationsEditor } from './Creative';
import type { Location } from '@shared/v2';

type FormState = {
  name: string;
  segment: string;
  city: string;
  state: string;
  country: string;
  instagram: string;
  website: string;
  whatsapp: string;
  phone: string;
  email: string;
  contactName: string;
  notes: string;
  leadSource: string;
  stage: string;
  potentialValue: string;
  nextFollowupAt: string;
  links: string;
  services: string;
  differentials: string;
  brandColors: string;
  locations: Location[];
};

const empty: FormState = {
  name: '',
  segment: 'servicos',
  city: '',
  state: '',
  country: 'Brasil',
  instagram: '',
  website: '',
  whatsapp: '',
  phone: '',
  email: '',
  contactName: '',
  notes: '',
  leadSource: '',
  stage: 'lead',
  potentialValue: '',
  nextFollowupAt: '',
  links: '',
  services: '',
  differentials: '',
  brandColors: '',
  locations: [],
};

function toForm(p?: Prospect | null): FormState {
  if (!p) return empty;
  return {
    name: p.name,
    segment: p.segment,
    city: p.city ?? '',
    state: p.state ?? '',
    country: p.country,
    instagram: p.instagram ?? '',
    website: p.website ?? '',
    whatsapp: p.whatsapp ?? '',
    phone: p.phone ?? '',
    email: p.email ?? '',
    contactName: p.contactName ?? '',
    notes: p.notes,
    leadSource: p.leadSource ?? '',
    stage: p.stage,
    potentialValue: p.potentialValue != null ? String(p.potentialValue) : '',
    nextFollowupAt: p.nextFollowupAt ? p.nextFollowupAt.slice(0, 10) : '',
    links: p.links.map((l) => (l.label ? `${l.label} ${l.url}` : l.url)).join('\n'),
    services: (p.services ?? [])
      .map((s) => (s.description ? `${s.title}: ${s.description}` : s.title))
      .join('\n'),
    differentials: (p.differentials ?? []).join('\n'),
    brandColors: (p.brandColors ?? []).join(', '),
    locations: p.locations ?? [],
  };
}
const lines = (t: string) =>
  t
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

function toInput(f: FormState): Partial<ProspectInput> {
  return {
    name: f.name,
    segment: f.segment as ProspectInput['segment'],
    city: f.city || undefined,
    state: f.state || undefined,
    country: f.country || 'Brasil',
    instagram: f.instagram || undefined,
    website: f.website || undefined,
    whatsapp: f.whatsapp || undefined,
    phone: f.phone || undefined,
    email: f.email || undefined,
    contactName: f.contactName || undefined,
    notes: f.notes,
    leadSource: f.leadSource || undefined,
    stage: f.stage as ProspectInput['stage'],
    potentialValue: f.potentialValue ? Number(f.potentialValue.replace(',', '.')) : null,
    nextFollowupAt: f.nextFollowupAt ? new Date(f.nextFollowupAt + 'T09:00:00').toISOString() : null,
    links: f.links
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const parts = l.split(/\s+/);
        const url = parts.find((p) => /^https?:\/\/|\./.test(p)) ?? parts[parts.length - 1];
        const label = parts.filter((p) => p !== url).join(' ');
        return { label, url };
      }),
    services: lines(f.services).map((l) => {
      const [title, ...rest] = l.split(':');
      return { title: title.trim(), description: rest.join(':').trim() };
    }),
    differentials: lines(f.differentials),
    brandColors: f.brandColors
      .split(/[,\s]+/)
      .map((c) => c.trim())
      .filter((c) => /^#[0-9a-fA-F]{6}$/.test(c)),
    locations: f.locations.filter((l) => l.name || l.address || l.city),
  };
}

export function ProspectFormModal({
  open,
  onClose,
  prospect,
}: {
  open: boolean;
  onClose: () => void;
  prospect?: Prospect | null;
}) {
  const { data: meta } = useMeta();
  const [f, setF] = useState<FormState>(toForm(prospect));
  const [more, setMore] = useState(!!prospect);
  const nav = useNavigate();
  const toast = useToast();
  useEffect(() => {
    if (open) {
      setF(toForm(prospect));
      setMore(!!prospect);
    }
  }, [open, prospect]);
  const create = useApiMutation(
    (input: Partial<ProspectInput>) => api.post<Prospect>('/prospects', input),
    [['prospects']],
    (p) => {
      toast.ok('Prospect criado');
      onClose();
      nav(`/prospects/${p.id}`);
    },
  );
  const update = useApiMutation(
    (input: Partial<ProspectInput>) => api.patch<Prospect>(`/prospects/${prospect!.id}`, input),
    [['prospects'], ['prospect', prospect?.id]],
    () => {
      toast.ok('Ficha atualizada');
      onClose();
    },
  );
  const set =
    (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setF((s) => ({ ...s, [k]: e.target.value }));
  const m = prospect ? update : create;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim()) return toast.err('Informe o nome da empresa');
    m.mutate(toInput(f), { onError: (err) => toast.err(err.message) });
  };
  const groups = new Map<string, { id: string; label: string }[]>();
  for (const s of meta?.segments ?? []) groups.set(s.group, [...(groups.get(s.group) ?? []), s]);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={prospect ? 'Editar ficha' : 'Novo Prospect'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" form="prospect-form" type="submit" loading={m.isPending}>
            {prospect ? 'Salvar' : 'Criar prospect'}
          </Button>
        </>
      }
    >
      <form id="prospect-form" onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
        <Field label="Nome da empresa *" className="sm:col-span-2">
          <Input
            value={f.name}
            onChange={set('name')}
            placeholder="Ex.: Serralheria Dois Irmãos"
            autoFocus
            required
          />
        </Field>
        <Field label="Segmento">
          <Select value={f.segment} onChange={set('segment')}>
            {Array.from(groups.entries()).map(([g, list]) => (
              <optgroup key={g} label={g}>
                {list.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </Field>
        <Field label="Cidade / UF">
          <div className="flex gap-2">
            <Input value={f.city} onChange={set('city')} placeholder="Cidade" />
            <Input value={f.state} onChange={set('state')} placeholder="UF" className="w-20" maxLength={2} />
          </div>
        </Field>
        <Field label="Site atual" hint="Deixe em branco se a empresa não tem site.">
          <Input value={f.website} onChange={set('website')} placeholder="empresa.com.br" inputMode="url" />
        </Field>
        <Field label="Instagram">
          <Input value={f.instagram} onChange={set('instagram')} placeholder="@empresa" />
        </Field>
        <Field label="WhatsApp">
          <Input
            value={f.whatsapp}
            onChange={set('whatsapp')}
            placeholder="(41) 99999-9999"
            inputMode="tel"
          />
        </Field>
        <Field label="Nome do responsável">
          <Input value={f.contactName} onChange={set('contactName')} placeholder="Quem decide" />
        </Field>
        {!more && (
          <button
            type="button"
            className="text-xs text-muted hover:text-text text-left sm:col-span-2"
            onClick={() => setMore(true)}
          >
            + mais campos (serviços, unidades, cores, telefone, e-mail, origem, valor, links)
          </button>
        )}
        {more && (
          <>
            <Field
              label="Serviços principais (um por linha)"
              className="sm:col-span-2"
              hint="Ex.: Polimento técnico: remove riscos e devolve o brilho. O site e as mensagens usam estes nomes reais."
            >
              <Textarea value={f.services} onChange={set('services')} rows={3} />
            </Field>
            <Field label="Diferenciais (um por linha)">
              <Textarea
                value={f.differentials}
                onChange={set('differentials')}
                rows={2}
                placeholder="Garantia de 1 ano, atendimento com hora marcada…"
              />
            </Field>
            <Field label="Cores da marca" hint="Hex separados por vírgula. Se vazio, extraímos do logo.">
              <Input value={f.brandColors} onChange={set('brandColors')} placeholder="#d4a017, #0b0b0d" />
            </Field>
            <Field
              label="Unidades / endereços"
              className="sm:col-span-2"
              hint="Com mais de uma unidade, o site ganha a seção “Nossas unidades”."
            >
              <LocationsEditor
                value={f.locations}
                onChange={(locations) => setF((st) => ({ ...st, locations }))}
              />
            </Field>
            <Field label="Telefone">
              <Input value={f.phone} onChange={set('phone')} inputMode="tel" />
            </Field>
            <Field label="E-mail">
              <Input value={f.email} onChange={set('email')} inputMode="email" />
            </Field>
            <Field label="Origem do lead">
              <Input
                value={f.leadSource}
                onChange={set('leadSource')}
                placeholder="Google Maps, Instagram, indicação…"
                list="lead-sources"
              />
              <datalist id="lead-sources">
                {[
                  'Google Maps',
                  'Instagram',
                  'Indicação',
                  'Rua / placa',
                  'Facebook',
                  'Site antigo',
                  'Evento',
                ].map((o) => (
                  <option key={o} value={o} />
                ))}
              </datalist>
            </Field>
            <Field label="Valor potencial (R$)">
              <Input
                value={f.potentialValue}
                onChange={set('potentialValue')}
                inputMode="decimal"
                placeholder="2500"
              />
            </Field>
            <Field label="Etapa">
              <Select value={f.stage} onChange={set('stage')}>
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Próximo follow-up">
              <Input type="date" value={f.nextFollowupAt} onChange={set('nextFollowupAt')} />
            </Field>
            <Field
              label="Links (um por linha)"
              className="sm:col-span-2"
              hint="Ex.: Google Maps https://maps.google.com/..."
            >
              <Textarea value={f.links} onChange={set('links')} rows={2} />
            </Field>
            <Field label="Observações" className="sm:col-span-2">
              <Textarea
                value={f.notes}
                onChange={set('notes')}
                rows={3}
                placeholder="O que você sabe sobre a empresa, horários, quem atende…"
              />
            </Field>
          </>
        )}
      </form>
    </Modal>
  );
}
