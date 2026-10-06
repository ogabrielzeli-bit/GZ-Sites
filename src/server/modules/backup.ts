/**
 * Backup/restore: JSON (só banco) ou ZIP (banco + uploads + auditorias + prévias + projetos).
 */
import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';
import type { Repos } from '../db/repos';
import type { Database } from '../db/database';
import { env } from '../env';

export const BACKUP_VERSION = 1;

export interface BackupJson {
  version: number;
  exportedAt: string;
  app: 'gz-os';
  data: {
    settings: unknown;
    prospects: unknown[];
    audits: unknown[];
    previews: unknown[];
    proposals: unknown[];
    projects: unknown[];
    tasks: unknown[];
    activities: unknown[];
    templates: unknown[];
  };
}

export function exportJson(repos: Repos): BackupJson {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'gz-os',
    data: {
      settings: repos.settings.get(),
      prospects: repos.prospects.all(),
      audits: repos.audits.all(),
      previews: repos.previews.all(),
      proposals: repos.proposals.all(),
      projects: repos.projects.all(),
      tasks: repos.tasks.all(),
      activities: repos.activities.all(),
      templates: repos.templates.list(),
    },
  };
}

export function exportZip(repos: Repos, opts: { includeFiles: boolean }): string {
  fs.mkdirSync(env.backupsDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const out = path.join(env.backupsDir, `gz-os-backup-${stamp}.zip`);
  const zip = new AdmZip();
  zip.addFile('backup.json', Buffer.from(JSON.stringify(exportJson(repos), null, 2)));
  if (opts.includeFiles) {
    for (const [dir, name] of [
      [env.uploadsDir, 'uploads'],
      [env.auditsDir, 'audits'],
      [env.previewsDir, 'previews'],
      [env.projectsDir, 'projects'],
    ] as const) {
      if (fs.existsSync(dir)) zip.addLocalFolder(dir, name, (p) => !p.includes('node_modules'));
    }
  }
  zip.writeZip(out);
  return out;
}

/** Restaura um backup JSON. `mode: replace` apaga tudo antes; `merge` insere só o que não existe. */
export function importJson(
  db: Database,
  repos: Repos,
  backup: BackupJson,
  mode: 'replace' | 'merge',
): { imported: Record<string, number> } {
  if (backup.app !== 'gz-os' || !backup.data) throw new Error('Arquivo de backup inválido');
  const counts: Record<string, number> = {};
  const insert = (
    table: string,
    rows: Record<string, unknown>[],
    map: (r: any) => Record<string, unknown>,
  ) => {
    let n = 0;
    for (const r of rows) {
      const row = map(r);
      const cols = Object.keys(row);
      const exists = db.get(`SELECT 1 FROM ${table} WHERE id = ?`, [row.id]);
      if (exists && mode === 'merge') continue;
      if (exists) db.run(`DELETE FROM ${table} WHERE id = ?`, [row.id]);
      db.run(
        `INSERT INTO ${table} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`,
        cols.map((c) => row[c]),
      );
      n++;
    }
    counts[table] = n;
  };
  const j = (v: unknown) => JSON.stringify(v ?? null);
  db.transaction(() => {
    if (mode === 'replace')
      for (const t of [
        'activities',
        'tasks',
        'projects',
        'proposals',
        'previews',
        'audits',
        'prospects',
        'templates',
      ])
        db.run(`DELETE FROM ${t}`);
    const d = backup.data;
    insert('prospects', d.prospects as any[], (p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      segment: p.segment,
      city: p.city ?? null,
      state: p.state ?? null,
      country: p.country ?? 'Brasil',
      instagram: p.instagram ?? null,
      website: p.website ?? null,
      whatsapp: p.whatsapp ?? null,
      phone: p.phone ?? null,
      email: p.email ?? null,
      contact_name: p.contactName ?? null,
      notes: p.notes ?? '',
      links: j(p.links ?? []),
      lead_source: p.leadSource ?? null,
      stage: p.stage ?? 'lead',
      potential_value: p.potentialValue ?? null,
      closed_value: p.closedValue ?? null,
      last_contact_at: p.lastContactAt ?? null,
      next_followup_at: p.nextFollowupAt ?? null,
      tags: j(p.tags ?? []),
      logo_path: p.logoPath ?? null,
      photos: j(p.photos ?? []),
      services: j(p.services ?? []),
      differentials: j(p.differentials ?? []),
      brand_colors: j(p.brandColors ?? []),
      locations: j(p.locations ?? []),
      research: p.research ? j(p.research) : null,
      creative: p.creative ? j(p.creative) : null,
      created_at: p.createdAt,
      updated_at: p.updatedAt,
    }));
    insert('audits', d.audits as any[], (a) => ({
      id: a.id,
      prospect_id: a.prospectId,
      url: a.url,
      status: a.status,
      scores: j(a.scores),
      report: j(a.report),
      screenshots: j(
        (a.screenshots ?? []).map((s: any) => ({
          ...s,
          path: path.join(env.auditsDir, a.id, path.basename(s.path)),
        })),
      ),
      opportunities: j(a.opportunities ?? []),
      error: a.error ?? null,
      created_at: a.createdAt,
      finished_at: a.finishedAt ?? null,
    }));
    insert('previews', d.previews as any[], (p) => ({
      id: p.id,
      prospect_id: p.prospectId,
      theme: p.theme,
      segment: p.segment,
      layout_variant: p.layoutVariant ?? 0,
      config: j(p.config),
      path: path.join(env.previewsDir, p.id),
      notes: p.notes ?? '',
      meta: j(p.meta ?? {}),
      published: p.published ? j(p.published) : null,
      created_at: p.createdAt,
    }));
    insert('proposals', d.proposals as any[], (p) => {
      const { id, prospectId, number, createdAt, updatedAt, sentAt, ...data } = p;
      return {
        id,
        prospect_id: prospectId,
        number,
        data: j(data),
        status: data.status ?? 'draft',
        created_at: createdAt,
        updated_at: updatedAt,
        sent_at: sentAt ?? null,
      };
    });
    insert('projects', d.projects as any[], (p) => ({
      id: p.id,
      prospect_id: p.prospectId ?? null,
      name: p.name,
      slug: p.slug,
      domain: p.domain ?? null,
      config: j(p.config),
      path: path.join(env.projectsDir, p.slug),
      status: p.status,
      last_build_at: p.lastBuildAt ?? null,
      last_qa: j(
        p.lastQa
          ? { ...p.lastQa, reportPath: path.join(env.projectsDir, p.slug, 'qa', 'report.html') }
          : null,
      ),
      notes: p.notes ?? '',
      created_at: p.createdAt,
      updated_at: p.updatedAt,
    }));
    insert('tasks', d.tasks as any[], (t) => ({
      id: t.id,
      prospect_id: t.prospectId ?? null,
      title: t.title,
      due_at: t.dueAt ?? null,
      done: t.done ? 1 : 0,
      created_at: t.createdAt,
    }));
    insert('activities', d.activities as any[], (a) => ({
      id: a.id,
      prospect_id: a.prospectId ?? null,
      type: a.type,
      description: a.description,
      data: j(a.data ?? {}),
      created_at: a.createdAt,
    }));
    insert('templates', d.templates as any[], (t) => ({
      id: t.id,
      kind: t.kind,
      key: t.key,
      name: t.name,
      body: t.body,
      category: t.category ?? '',
      sort_order: t.sortOrder ?? 0,
      updated_at: t.updatedAt,
    }));
    if (d.settings) repos.settings.save(d.settings as any);
  });
  return { imported: counts };
}

/** Restaura um ZIP (backup.json + pastas). Arquivos são extraídos para a pasta de dados. */
export function importZip(db: Database, repos: Repos, zipPath: string, mode: 'replace' | 'merge') {
  const zip = new AdmZip(zipPath);
  const entry = zip.getEntry('backup.json');
  if (!entry) throw new Error('ZIP sem backup.json');
  const backup = JSON.parse(entry.getData().toString('utf8')) as BackupJson;
  const result = importJson(db, repos, backup, mode);
  const base = path.resolve(env.dataDir);
  for (const e of zip.getEntries()) {
    if (e.isDirectory || e.entryName === 'backup.json') continue;
    const top = e.entryName.split('/')[0];
    if (!['uploads', 'audits', 'previews', 'projects'].includes(top)) continue;
    const target = path.resolve(base, e.entryName);
    if (!target.startsWith(base + path.sep)) continue; // anti zip-slip
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, e.getData());
  }
  return result;
}
