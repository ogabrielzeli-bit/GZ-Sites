/**
 * Repositórios: traduzem linhas SQL ↔ objetos do domínio. Toda escrita passa por aqui.
 */
import { randomUUID } from 'node:crypto';
import type { Database, Row } from './database';
import type {
  Activity,
  ActivityType,
  Audit,
  Preview,
  Project,
  Proposal,
  ProposalInput,
  Prospect,
  ProspectInput,
  Settings,
  Task,
  Template,
} from '@shared/schemas';
import { SettingsSchema } from '@shared/schemas';
import { slugify } from '@shared/utils';

export const now = () => new Date().toISOString();
export const newId = () => randomUUID();
const j = (v: unknown) => JSON.stringify(v ?? null);
const pj = <T>(v: unknown, fallback: T): T => {
  if (typeof v !== 'string') return fallback;
  try {
    const parsed = JSON.parse(v);
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
};

// ---------------- Prospects ----------------
function rowToProspect(r: Row): Prospect {
  return {
    id: r.id as string,
    name: r.name as string,
    slug: r.slug as string,
    segment: r.segment as string,
    city: (r.city as string) || undefined,
    state: (r.state as string) || undefined,
    country: (r.country as string) || 'Brasil',
    instagram: (r.instagram as string) || undefined,
    website: (r.website as string) || undefined,
    whatsapp: (r.whatsapp as string) || undefined,
    phone: (r.phone as string) || undefined,
    email: (r.email as string) || undefined,
    contactName: (r.contact_name as string) || undefined,
    notes: (r.notes as string) || '',
    links: pj(r.links, []),
    leadSource: (r.lead_source as string) || undefined,
    stage: r.stage as string,
    potentialValue: (r.potential_value as number) ?? null,
    closedValue: (r.closed_value as number) ?? null,
    lastContactAt: (r.last_contact_at as string) ?? null,
    nextFollowupAt: (r.next_followup_at as string) ?? null,
    tags: pj(r.tags, []),
    logoPath: (r.logo_path as string) ?? null,
    photos: pj(r.photos, []),
    services: pj(r.services, []),
    differentials: pj(r.differentials, []),
    brandColors: pj(r.brand_colors, []),
    locations: pj(r.locations, []),
    research: pj(r.research, null),
    creative: pj(r.creative, null),
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

export class ProspectRepo {
  constructor(private db: Database) {}

  list(opts: { q?: string; stage?: string; segment?: string } = {}): Prospect[] {
    const where: string[] = [];
    const params: unknown[] = [];
    if (opts.q) {
      where.push('(name LIKE ? OR city LIKE ? OR instagram LIKE ? OR website LIKE ? OR contact_name LIKE ?)');
      const like = `%${opts.q}%`;
      params.push(like, like, like, like, like);
    }
    if (opts.stage) {
      where.push('stage = ?');
      params.push(opts.stage);
    }
    if (opts.segment) {
      where.push('segment = ?');
      params.push(opts.segment);
    }
    const sql = `SELECT * FROM prospects ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY updated_at DESC`;
    return this.db.all(sql, params).map(rowToProspect);
  }

  get(id: string): Prospect | undefined {
    const r = this.db.get('SELECT * FROM prospects WHERE id = ?', [id]);
    return r ? rowToProspect(r) : undefined;
  }

  count(): number {
    return (this.db.get<{ c: number }>('SELECT COUNT(*) c FROM prospects')?.c as number) ?? 0;
  }

  private uniqueSlug(name: string, excludeId?: string): string {
    const base = slugify(name);
    let slug = base;
    let i = 2;
    while (this.db.get('SELECT id FROM prospects WHERE slug = ? AND id != ?', [slug, excludeId ?? ''])) {
      slug = `${base}-${i++}`;
    }
    return slug;
  }

  create(input: ProspectInput): Prospect {
    const id = newId();
    const ts = now();
    this.db.run(
      `INSERT INTO prospects (id,name,slug,segment,city,state,country,instagram,website,whatsapp,phone,email,contact_name,notes,links,lead_source,stage,potential_value,closed_value,last_contact_at,next_followup_at,tags,logo_path,photos,services,differentials,brand_colors,locations,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id,
        input.name,
        this.uniqueSlug(input.name),
        input.segment,
        input.city ?? null,
        input.state ?? null,
        input.country || 'Brasil',
        input.instagram ?? null,
        input.website ?? null,
        input.whatsapp ?? null,
        input.phone ?? null,
        input.email ?? null,
        input.contactName ?? null,
        input.notes ?? '',
        j(input.links ?? []),
        input.leadSource ?? null,
        input.stage ?? 'lead',
        input.potentialValue ?? null,
        input.closedValue ?? null,
        input.lastContactAt ?? null,
        input.nextFollowupAt ?? null,
        j(input.tags ?? []),
        null,
        '[]',
        j(input.services ?? []),
        j(input.differentials ?? []),
        j(input.brandColors ?? []),
        j(input.locations ?? []),
        ts,
        ts,
      ],
    );
    return this.get(id)!;
  }

  update(
    id: string,
    patch: Partial<ProspectInput> & {
      logoPath?: string | null;
      photos?: Prospect['photos'];
      research?: Prospect['research'];
      creative?: Prospect['creative'];
    },
  ): Prospect {
    const current = this.get(id);
    if (!current) throw new Error('Prospect não encontrado');
    const map: Record<string, unknown> = {};
    const set = (col: string, v: unknown) => {
      map[col] = v;
    };
    if (patch.name !== undefined) {
      set('name', patch.name);
      if (patch.name !== current.name) set('slug', this.uniqueSlug(patch.name, id));
    }
    for (const [k, col] of [
      ['segment', 'segment'],
      ['city', 'city'],
      ['state', 'state'],
      ['country', 'country'],
      ['instagram', 'instagram'],
      ['website', 'website'],
      ['whatsapp', 'whatsapp'],
      ['phone', 'phone'],
      ['email', 'email'],
      ['contactName', 'contact_name'],
      ['notes', 'notes'],
      ['leadSource', 'lead_source'],
      ['stage', 'stage'],
      ['potentialValue', 'potential_value'],
      ['closedValue', 'closed_value'],
      ['lastContactAt', 'last_contact_at'],
      ['nextFollowupAt', 'next_followup_at'],
      ['logoPath', 'logo_path'],
    ] as const) {
      if ((patch as any)[k] !== undefined) set(col, (patch as any)[k] ?? null);
    }
    if (patch.links !== undefined) set('links', j(patch.links));
    if (patch.tags !== undefined) set('tags', j(patch.tags));
    if (patch.photos !== undefined) set('photos', j(patch.photos));
    if (patch.services !== undefined) set('services', j(patch.services));
    if (patch.differentials !== undefined) set('differentials', j(patch.differentials));
    if (patch.brandColors !== undefined) set('brand_colors', j(patch.brandColors));
    if (patch.locations !== undefined) set('locations', j(patch.locations));
    if (patch.research !== undefined) set('research', j(patch.research));
    if (patch.creative !== undefined) set('creative', j(patch.creative));
    set('updated_at', now());
    const cols = Object.keys(map);
    this.db.run(`UPDATE prospects SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`, [
      ...cols.map((c) => map[c]),
      id,
    ]);
    return this.get(id)!;
  }

  delete(id: string) {
    this.db.run('DELETE FROM prospects WHERE id = ?', [id]);
  }

  all(): Prospect[] {
    return this.db.all('SELECT * FROM prospects').map(rowToProspect);
  }
}

// ---------------- Audits ----------------
function rowToAudit(r: Row): Audit {
  return {
    id: r.id as string,
    prospectId: r.prospect_id as string,
    url: r.url as string,
    status: r.status as Audit['status'],
    scores: pj(r.scores, null),
    report: pj(r.report, null),
    screenshots: pj(r.screenshots, []),
    opportunities: pj(r.opportunities, []),
    error: (r.error as string) ?? null,
    createdAt: r.created_at as string,
    finishedAt: (r.finished_at as string) ?? null,
  };
}

export class AuditRepo {
  constructor(private db: Database) {}
  create(prospectId: string, url: string): Audit {
    const id = newId();
    this.db.run(`INSERT INTO audits (id,prospect_id,url,status,created_at) VALUES (?,?,?,?,?)`, [
      id,
      prospectId,
      url,
      'pending',
      now(),
    ]);
    return this.get(id)!;
  }
  get(id: string): Audit | undefined {
    const r = this.db.get('SELECT * FROM audits WHERE id = ?', [id]);
    return r ? rowToAudit(r) : undefined;
  }
  listByProspect(prospectId: string): Audit[] {
    return this.db
      .all('SELECT * FROM audits WHERE prospect_id = ? ORDER BY created_at DESC', [prospectId])
      .map(rowToAudit);
  }
  latestForProspect(prospectId: string): Audit | undefined {
    const r = this.db.get(
      `SELECT * FROM audits WHERE prospect_id = ? AND status = 'done' ORDER BY created_at DESC LIMIT 1`,
      [prospectId],
    );
    return r ? rowToAudit(r) : undefined;
  }
  setStatus(id: string, status: Audit['status'], error?: string) {
    this.db.run('UPDATE audits SET status = ?, error = ? WHERE id = ?', [status, error ?? null, id]);
  }
  finish(id: string, data: Pick<Audit, 'scores' | 'report' | 'screenshots' | 'opportunities'>) {
    this.db.run(
      `UPDATE audits SET status='done', scores=?, report=?, screenshots=?, opportunities=?, finished_at=?, error=NULL WHERE id=?`,
      [j(data.scores), j(data.report), j(data.screenshots), j(data.opportunities), now(), id],
    );
  }
  fail(id: string, error: string) {
    this.db.run(`UPDATE audits SET status='failed', error=?, finished_at=? WHERE id=?`, [error, now(), id]);
  }
  countAuditedProspects(): number {
    return (
      this.db.get<{ c: number }>(`SELECT COUNT(DISTINCT prospect_id) c FROM audits WHERE status='done'`)?.c ??
      0
    );
  }
  all(): Audit[] {
    return this.db.all('SELECT * FROM audits').map(rowToAudit);
  }
  delete(id: string) {
    this.db.run('DELETE FROM audits WHERE id = ?', [id]);
  }
  /** Marca como falha auditorias que ficaram "running" após um restart. */
  failStale() {
    this.db.run(
      `UPDATE audits SET status='failed', error='Interrompida (servidor reiniciado)', finished_at=? WHERE status IN ('pending','running')`,
      [now()],
    );
  }
}

// ---------------- Previews ----------------
function rowToPreview(r: Row): Preview {
  return {
    id: r.id as string,
    prospectId: r.prospect_id as string,
    theme: r.theme as string,
    segment: r.segment as string,
    layoutVariant: (r.layout_variant as number) ?? 0,
    config: pj(r.config, {}),
    path: r.path as string,
    url: `/previews/${r.id as string}/`,
    notes: (r.notes as string) || '',
    meta: pj(r.meta, {}),
    published: pj(r.published, null),
    createdAt: r.created_at as string,
  };
}
export class PreviewRepo {
  constructor(private db: Database) {}
  create(p: Omit<Preview, 'createdAt' | 'url' | 'meta' | 'published'> & { meta?: Preview['meta'] }): Preview {
    this.db.run(
      `INSERT INTO previews (id,prospect_id,theme,segment,layout_variant,config,path,notes,meta,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        p.id,
        p.prospectId,
        p.theme,
        p.segment,
        p.layoutVariant,
        j(p.config),
        p.path,
        p.notes,
        j(p.meta ?? {}),
        now(),
      ],
    );
    return this.get(p.id)!;
  }
  get(id: string): Preview | undefined {
    const r = this.db.get('SELECT * FROM previews WHERE id = ?', [id]);
    return r ? rowToPreview(r) : undefined;
  }
  updateConfig(id: string, config: unknown, notes?: string, meta?: Preview['meta']) {
    this.db.run(
      'UPDATE previews SET config = ?, notes = COALESCE(?, notes), meta = COALESCE(?, meta) WHERE id = ?',
      [j(config), notes ?? null, meta ? j(meta) : null, id],
    );
  }
  setPublished(id: string, published: Preview['published']) {
    this.db.run('UPDATE previews SET published = ? WHERE id = ?', [j(published), id]);
  }
  listByProspect(prospectId: string): Preview[] {
    return this.db
      .all('SELECT * FROM previews WHERE prospect_id = ? ORDER BY created_at DESC', [prospectId])
      .map(rowToPreview);
  }
  count(): number {
    return this.db.get<{ c: number }>('SELECT COUNT(*) c FROM previews')?.c ?? 0;
  }
  all(): Preview[] {
    return this.db.all('SELECT * FROM previews').map(rowToPreview);
  }
  delete(id: string) {
    this.db.run('DELETE FROM previews WHERE id = ?', [id]);
  }
}

// ---------------- Proposals ----------------
function rowToProposal(r: Row): Proposal {
  const data = pj<ProposalInput>(r.data, {} as ProposalInput);
  return {
    ...data,
    id: r.id as string,
    prospectId: r.prospect_id as string,
    number: r.number as number,
    status: (r.status as Proposal['status']) ?? 'draft',
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
    sentAt: (r.sent_at as string) ?? null,
  };
}
export class ProposalRepo {
  constructor(private db: Database) {}
  create(prospectId: string, data: ProposalInput): Proposal {
    const id = newId();
    const ts = now();
    const number =
      (this.db.get<{ m: number }>('SELECT COALESCE(MAX(number),0) m FROM proposals')?.m ?? 0) + 1;
    this.db.run(
      `INSERT INTO proposals (id,prospect_id,number,data,status,created_at,updated_at,sent_at) VALUES (?,?,?,?,?,?,?,?)`,
      [id, prospectId, number, j(data), data.status ?? 'draft', ts, ts, null],
    );
    return this.get(id)!;
  }
  update(id: string, data: ProposalInput): Proposal {
    const cur = this.get(id);
    if (!cur) throw new Error('Proposta não encontrada');
    const sentAt = data.status === 'sent' && cur.status !== 'sent' ? now() : cur.sentAt;
    this.db.run(`UPDATE proposals SET data=?, status=?, updated_at=?, sent_at=? WHERE id=?`, [
      j(data),
      data.status,
      now(),
      sentAt,
      id,
    ]);
    return this.get(id)!;
  }
  get(id: string): Proposal | undefined {
    const r = this.db.get('SELECT * FROM proposals WHERE id = ?', [id]);
    return r ? rowToProposal(r) : undefined;
  }
  listByProspect(prospectId: string): Proposal[] {
    return this.db
      .all('SELECT * FROM proposals WHERE prospect_id = ? ORDER BY created_at DESC', [prospectId])
      .map(rowToProposal);
  }
  countSent(): number {
    return (
      this.db.get<{ c: number }>(
        `SELECT COUNT(*) c FROM proposals WHERE status IN ('sent','viewed','accepted')`,
      )?.c ?? 0
    );
  }
  all(): Proposal[] {
    return this.db.all('SELECT * FROM proposals').map(rowToProposal);
  }
  delete(id: string) {
    this.db.run('DELETE FROM proposals WHERE id = ?', [id]);
  }
}

// ---------------- Projects ----------------
function rowToProject(r: Row): Project {
  return {
    id: r.id as string,
    prospectId: (r.prospect_id as string) ?? null,
    name: r.name as string,
    slug: r.slug as string,
    domain: (r.domain as string) || undefined,
    config: pj(r.config, {}),
    path: r.path as string,
    status: r.status as Project['status'],
    lastBuildAt: (r.last_build_at as string) ?? null,
    lastQa: pj(r.last_qa, null),
    notes: (r.notes as string) || '',
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}
export class ProjectRepo {
  constructor(private db: Database) {}
  uniqueSlug(name: string): string {
    const base = slugify(name);
    let slug = base;
    let i = 2;
    while (this.db.get('SELECT id FROM projects WHERE slug = ?', [slug])) slug = `${base}-${i++}`;
    return slug;
  }
  create(p: {
    prospectId: string | null;
    name: string;
    slug: string;
    domain?: string;
    config: unknown;
    path: string;
    notes?: string;
  }): Project {
    const id = newId();
    const ts = now();
    this.db.run(
      `INSERT INTO projects (id,prospect_id,name,slug,domain,config,path,status,last_build_at,last_qa,notes,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id,
        p.prospectId,
        p.name,
        p.slug,
        p.domain ?? null,
        j(p.config),
        p.path,
        'draft',
        null,
        null,
        p.notes ?? '',
        ts,
        ts,
      ],
    );
    return this.get(id)!;
  }
  get(id: string): Project | undefined {
    const r = this.db.get('SELECT * FROM projects WHERE id = ?', [id]);
    return r ? rowToProject(r) : undefined;
  }
  list(): Project[] {
    return this.db.all('SELECT * FROM projects ORDER BY updated_at DESC').map(rowToProject);
  }
  listByProspect(prospectId: string): Project[] {
    return this.db
      .all('SELECT * FROM projects WHERE prospect_id = ? ORDER BY created_at DESC', [prospectId])
      .map(rowToProject);
  }
  update(
    id: string,
    patch: Partial<
      Pick<Project, 'name' | 'domain' | 'config' | 'status' | 'lastBuildAt' | 'lastQa' | 'notes'>
    >,
  ): Project {
    const sets: string[] = [];
    const params: unknown[] = [];
    if (patch.name !== undefined) {
      sets.push('name = ?');
      params.push(patch.name);
    }
    if (patch.domain !== undefined) {
      sets.push('domain = ?');
      params.push(patch.domain ?? null);
    }
    if (patch.config !== undefined) {
      sets.push('config = ?');
      params.push(j(patch.config));
    }
    if (patch.status !== undefined) {
      sets.push('status = ?');
      params.push(patch.status);
    }
    if (patch.lastBuildAt !== undefined) {
      sets.push('last_build_at = ?');
      params.push(patch.lastBuildAt);
    }
    if (patch.lastQa !== undefined) {
      sets.push('last_qa = ?');
      params.push(j(patch.lastQa));
    }
    if (patch.notes !== undefined) {
      sets.push('notes = ?');
      params.push(patch.notes);
    }
    sets.push('updated_at = ?');
    params.push(now());
    params.push(id);
    this.db.run(`UPDATE projects SET ${sets.join(', ')} WHERE id = ?`, params);
    return this.get(id)!;
  }
  countByStatus(statuses: Project['status'][]): number {
    const q = statuses.map(() => '?').join(',');
    return (
      this.db.get<{ c: number }>(`SELECT COUNT(*) c FROM projects WHERE status IN (${q})`, statuses)?.c ?? 0
    );
  }
  all(): Project[] {
    return this.db.all('SELECT * FROM projects').map(rowToProject);
  }
  delete(id: string) {
    this.db.run('DELETE FROM projects WHERE id = ?', [id]);
  }
}

// ---------------- Tasks ----------------
function rowToTask(r: Row): Task {
  return {
    id: r.id as string,
    prospectId: (r.prospect_id as string) ?? null,
    prospectName: (r.prospect_name as string) ?? null,
    title: r.title as string,
    dueAt: (r.due_at as string) ?? null,
    done: !!(r.done as number),
    createdAt: r.created_at as string,
  };
}
export class TaskRepo {
  constructor(private db: Database) {}
  create(t: { prospectId?: string | null; title: string; dueAt?: string | null }): Task {
    const id = newId();
    this.db.run(`INSERT INTO tasks (id,prospect_id,title,due_at,done,created_at) VALUES (?,?,?,?,0,?)`, [
      id,
      t.prospectId ?? null,
      t.title,
      t.dueAt ?? null,
      now(),
    ]);
    return this.get(id)!;
  }
  get(id: string): Task | undefined {
    const r = this.db.get(
      'SELECT t.*, p.name prospect_name FROM tasks t LEFT JOIN prospects p ON p.id = t.prospect_id WHERE t.id = ?',
      [id],
    );
    return r ? rowToTask(r) : undefined;
  }
  list(opts: { prospectId?: string; pendingOnly?: boolean } = {}): Task[] {
    const where: string[] = [];
    const params: unknown[] = [];
    if (opts.prospectId) {
      where.push('t.prospect_id = ?');
      params.push(opts.prospectId);
    }
    if (opts.pendingOnly) where.push('t.done = 0');
    return this.db
      .all(
        `SELECT t.*, p.name prospect_name FROM tasks t LEFT JOIN prospects p ON p.id = t.prospect_id ${
          where.length ? 'WHERE ' + where.join(' AND ') : ''
        } ORDER BY t.done ASC, COALESCE(t.due_at, '9999') ASC, t.created_at DESC`,
        params,
      )
      .map(rowToTask);
  }
  update(id: string, patch: { title?: string; dueAt?: string | null; done?: boolean }): Task {
    const sets: string[] = [];
    const params: unknown[] = [];
    if (patch.title !== undefined) {
      sets.push('title = ?');
      params.push(patch.title);
    }
    if (patch.dueAt !== undefined) {
      sets.push('due_at = ?');
      params.push(patch.dueAt);
    }
    if (patch.done !== undefined) {
      sets.push('done = ?');
      params.push(patch.done ? 1 : 0);
    }
    if (!sets.length) return this.get(id)!;
    params.push(id);
    this.db.run(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`, params);
    return this.get(id)!;
  }
  delete(id: string) {
    this.db.run('DELETE FROM tasks WHERE id = ?', [id]);
  }
  countPending(): number {
    return this.db.get<{ c: number }>('SELECT COUNT(*) c FROM tasks WHERE done = 0')?.c ?? 0;
  }
  all(): Task[] {
    return this.db.all('SELECT t.*, NULL prospect_name FROM tasks t').map(rowToTask);
  }
}

// ---------------- Activities ----------------
function rowToActivity(r: Row): Activity {
  return {
    id: r.id as string,
    prospectId: (r.prospect_id as string) ?? null,
    type: r.type as ActivityType,
    description: r.description as string,
    data: pj(r.data, {}),
    createdAt: r.created_at as string,
  };
}
export class ActivityRepo {
  constructor(private db: Database) {}
  log(
    prospectId: string | null,
    type: ActivityType,
    description: string,
    data: Record<string, unknown> = {},
  ) {
    this.db.run(
      `INSERT INTO activities (id,prospect_id,type,description,data,created_at) VALUES (?,?,?,?,?,?)`,
      [newId(), prospectId, type, description, j(data), now()],
    );
  }
  list(opts: { prospectId?: string; limit?: number } = {}): Activity[] {
    const params: unknown[] = [];
    let where = '';
    if (opts.prospectId) {
      where = 'WHERE prospect_id = ?';
      params.push(opts.prospectId);
    }
    params.push(opts.limit ?? 50);
    return this.db
      .all(`SELECT * FROM activities ${where} ORDER BY created_at DESC LIMIT ?`, params)
      .map(rowToActivity);
  }
  all(): Activity[] {
    return this.db.all('SELECT * FROM activities').map(rowToActivity);
  }
}

// ---------------- Templates ----------------
function rowToTemplate(r: Row): Template {
  return {
    id: r.id as string,
    kind: r.kind as Template['kind'],
    key: r.key as string,
    name: r.name as string,
    body: r.body as string,
    category: (r.category as string) || '',
    sortOrder: (r.sort_order as number) ?? 0,
    updatedAt: r.updated_at as string,
  };
}
export class TemplateRepo {
  constructor(private db: Database) {}
  list(kind?: string): Template[] {
    return this.db
      .all(
        kind
          ? 'SELECT * FROM templates WHERE kind = ? ORDER BY sort_order, name'
          : 'SELECT * FROM templates ORDER BY kind, sort_order, name',
        kind ? [kind] : [],
      )
      .map(rowToTemplate);
  }
  get(kind: string, key: string): Template | undefined {
    const r = this.db.get('SELECT * FROM templates WHERE kind = ? AND key = ?', [kind, key]);
    return r ? rowToTemplate(r) : undefined;
  }
  getById(id: string): Template | undefined {
    const r = this.db.get('SELECT * FROM templates WHERE id = ?', [id]);
    return r ? rowToTemplate(r) : undefined;
  }
  upsert(t: {
    kind: string;
    key: string;
    name: string;
    body: string;
    category?: string;
    sortOrder?: number;
  }): Template {
    const existing = this.get(t.kind, t.key);
    if (existing) {
      this.db.run(`UPDATE templates SET name=?, body=?, category=?, sort_order=?, updated_at=? WHERE id=?`, [
        t.name,
        t.body,
        t.category ?? existing.category,
        t.sortOrder ?? existing.sortOrder,
        now(),
        existing.id,
      ]);
      return this.getById(existing.id)!;
    }
    const id = newId();
    this.db.run(
      `INSERT INTO templates (id,kind,key,name,body,category,sort_order,updated_at) VALUES (?,?,?,?,?,?,?,?)`,
      [id, t.kind, t.key, t.name, t.body, t.category ?? '', t.sortOrder ?? 0, now()],
    );
    return this.getById(id)!;
  }
  /** Insere apenas se não existir (seed inicial, não sobrescreve edições do usuário) */
  seed(t: { kind: string; key: string; name: string; body: string; category?: string; sortOrder?: number }) {
    if (!this.get(t.kind, t.key)) this.upsert(t);
  }
  delete(id: string) {
    this.db.run('DELETE FROM templates WHERE id = ?', [id]);
  }
}

// ---------------- Settings ----------------
export class SettingsRepo {
  constructor(private db: Database) {}
  get(): Settings {
    const r = this.db.get<{ data: string }>('SELECT data FROM settings WHERE id = 1');
    const parsed = SettingsSchema.safeParse(r ? pj(r.data, {}) : {});
    return parsed.success ? parsed.data : SettingsSchema.parse({});
  }
  save(patch: Partial<Settings>): Settings {
    const merged = SettingsSchema.parse({ ...this.get(), ...patch });
    this.db.run(
      `INSERT INTO settings (id, data, updated_at) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
      [j(merged), now()],
    );
    return merged;
  }
}

export interface Repos {
  prospects: ProspectRepo;
  audits: AuditRepo;
  previews: PreviewRepo;
  proposals: ProposalRepo;
  projects: ProjectRepo;
  tasks: TaskRepo;
  activities: ActivityRepo;
  templates: TemplateRepo;
  settings: SettingsRepo;
}

export function createRepos(db: Database): Repos {
  return {
    prospects: new ProspectRepo(db),
    audits: new AuditRepo(db),
    previews: new PreviewRepo(db),
    proposals: new ProposalRepo(db),
    projects: new ProjectRepo(db),
    tasks: new TaskRepo(db),
    activities: new ActivityRepo(db),
    templates: new TemplateRepo(db),
    settings: new SettingsRepo(db),
  };
}
