import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import type { AppContext } from '../context';
import { badRequest, h, notFound, parse } from '../http';
import { SettingsUpdate, TemplateInput, type DashboardData } from '@shared/schemas';
import { OPEN_STAGES, STAGES } from '@shared/stages';
import { SEGMENTS } from '@shared/segments';
import { THEME_LIST, LAYOUT_INFO, LAYOUT_LIST, sectionCatalog, generateSiteConfig } from '../../engine';
import { aiStatus, createAIProvider } from '../modules/ai';
import { exportJson, exportZip, importJson, importZip } from '../modules/backup';
import { storeAsset } from '../modules/uploads';
import { DEFAULT_MESSAGE_TEMPLATES, DEFAULT_PROPOSAL_TEMPLATES } from '../modules/messages/seed';
import { listAutofixes } from '../../qa';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } });

export function systemRoutes(ctx: AppContext) {
  const r = Router();
  const { repos, jobs, env, db } = ctx;

  r.get('/health', (_req, res) => res.json({ ok: true, version: '0.1.0', time: new Date().toISOString() }));

  // ---------- Dashboard ----------
  r.get(
    '/dashboard',
    h((_req, res) => {
      const prospects = repos.prospects.all();
      const byStage = STAGES.map((s) => {
        const list = prospects.filter((p) => p.stage === s.id);
        return {
          stage: s.id,
          count: list.length,
          value: list.reduce(
            (a, p) => a + (s.won ? (p.closedValue ?? p.potentialValue ?? 0) : (p.potentialValue ?? 0)),
            0,
          ),
        };
      });
      const pipelineValue = prospects
        .filter((p) => (OPEN_STAGES as string[]).includes(p.stage))
        .reduce((a, p) => a + (p.potentialValue ?? 0), 0);
      const soldValue = prospects
        .filter((p) => ['fechado', 'producao', 'entregue'].includes(p.stage))
        .reduce((a, p) => a + (p.closedValue ?? p.potentialValue ?? 0), 0);
      const now = Date.now();
      const data: DashboardData = {
        counts: {
          prospects: prospects.length,
          audited: repos.audits.countAuditedProspects(),
          previews: repos.previews.count(),
          proposalsSent: repos.proposals.countSent(),
          closed: prospects.filter((p) => ['fechado', 'producao', 'entregue'].includes(p.stage)).length,
          inProduction:
            prospects.filter((p) => p.stage === 'producao').length +
            repos.projects.list().filter((pj) => !pj.prospectId && pj.status !== 'exported').length,
          delivered: prospects.filter((p) => p.stage === 'entregue').length,
          tasksPending: repos.tasks.countPending(),
        },
        pipelineValue,
        soldValue,
        byStage,
        recentActivity: repos.activities.list({ limit: 12 }),
        tasks: repos.tasks.list({ pendingOnly: true }).slice(0, 8),
        followups: prospects
          .filter(
            (p) =>
              p.nextFollowupAt &&
              new Date(p.nextFollowupAt).getTime() < now + 3 * 86400000 &&
              !['entregue'].includes(p.stage),
          )
          .sort((a, b) => a.nextFollowupAt!.localeCompare(b.nextFollowupAt!))
          .slice(0, 8)
          .map((p) => ({ id: p.id, name: p.name, nextFollowupAt: p.nextFollowupAt!, stage: p.stage })),
      };
      res.json(data);
    }),
  );

  // ---------- Metadados (segmentos, temas, seções, layouts) ----------
  r.get('/meta', (_req, res) =>
    res.json({
      segments: SEGMENTS,
      stages: STAGES,
      themes: THEME_LIST.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        mode: t.mode,
        colors: t.colors,
        fonts: { display: t.fonts.display.family, body: t.fonts.body.family },
      })),
      layouts: LAYOUT_LIST.map((id) => ({ id, ...LAYOUT_INFO[id] })),
      sections: sectionCatalog(),
      autofixes: listAutofixes(),
      ai: aiStatus(repos.settings.get()),
    }),
  );
  r.post(
    '/meta/generate-config',
    h((req, res) => {
      const input = parse(
        z.object({
          name: z.string().min(1),
          segment: z.string(),
          city: z.string().optional(),
          theme: z.string().optional(),
          layout: z.string().optional(),
          layoutVariant: z.number().int().optional(),
        }),
        req.body,
      );
      res.json(generateSiteConfig({ ...input, previewMode: true }));
    }),
  );

  // ---------- Configurações ----------
  r.get(
    '/settings',
    h((_req, res) => res.json(repos.settings.get())),
  );
  r.put(
    '/settings',
    h((req, res) => {
      const patch = parse(SettingsUpdate, req.body);
      res.json(repos.settings.save(patch));
    }),
  );
  r.post(
    '/settings/logo',
    upload.single('file'),
    h(async (req, res) => {
      if (!req.file) throw badRequest('Envie um arquivo');
      const stored = await storeAsset({
        clientSlug: '_agencia',
        buffer: req.file.buffer,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        category: 'logo',
      });
      res.json(repos.settings.save({ logoPath: stored.path }));
    }),
  );

  // ---------- Templates ----------
  r.get(
    '/templates',
    h((req, res) => res.json(repos.templates.list(String(req.query.kind ?? '') || undefined))),
  );
  r.put(
    '/templates',
    h((req, res) => {
      const t = parse(TemplateInput, req.body);
      res.json(repos.templates.upsert(t));
    }),
  );
  r.delete(
    '/templates/:id',
    h((req, res) => {
      if (!repos.templates.getById(req.params.id as string)) throw notFound('Template');
      repos.templates.delete(req.params.id as string);
      res.json({ ok: true });
    }),
  );
  r.post(
    '/templates/reset',
    h((req, res) => {
      const { key, kind } = parse(
        z.object({ key: z.string(), kind: z.enum(['message', 'proposal']) }),
        req.body,
      );
      const def = (kind === 'message' ? DEFAULT_MESSAGE_TEMPLATES : DEFAULT_PROPOSAL_TEMPLATES).find(
        (t) => t.key === key,
      );
      if (!def) throw notFound('Template padrão');
      res.json(repos.templates.upsert({ kind, ...def }));
    }),
  );

  // ---------- IA opcional ----------
  r.get('/ai/status', (_req, res) => res.json(aiStatus(repos.settings.get())));
  r.post(
    '/ai/copy',
    h(async (req, res) => {
      const body = parse(
        z.object({
          action: z.enum(['improve', 'headlines', 'tone', 'structure']),
          text: z.string().max(5000).optional(),
          tone: z.enum(['formal', 'amigavel', 'direto', 'premium', 'descontraido']).optional(),
          company: z.string(),
          segment: z.string(),
          city: z.string().optional(),
          count: z.number().int().min(1).max(8).optional(),
        }),
        req.body,
      );
      const ai = createAIProvider(repos.settings.get());
      const c = { company: body.company, segment: body.segment, city: body.city };
      let result: unknown;
      if (body.action === 'improve') result = await ai.improveCopy(body.text ?? '', c);
      else if (body.action === 'headlines') result = await ai.headlines(c, body.count ?? 3);
      else if (body.action === 'tone') result = await ai.adaptTone(body.text ?? '', body.tone ?? 'direto', c);
      else result = await ai.suggestStructure(c);
      res.json({ result, provider: ai.id });
    }),
  );

  // ---------- Jobs ----------
  r.get('/jobs', (_req, res) => res.json(jobs.list().slice(0, 50)));
  r.get(
    '/jobs/:id',
    h((req, res) => {
      const j = jobs.get(req.params.id as string);
      if (!j) throw notFound('Job');
      res.json(j);
    }),
  );

  // ---------- Backup ----------
  r.get(
    '/backup/json',
    h((_req, res) =>
      res.attachment(`gz-os-backup-${new Date().toISOString().slice(0, 10)}.json`).json(exportJson(repos)),
    ),
  );
  r.post(
    '/backup/zip',
    h((req, res) => {
      const file = exportZip(repos, { includeFiles: req.body?.includeFiles !== false });
      res.json({
        file: path.basename(file),
        url: `/api/backup/download/${encodeURIComponent(path.basename(file))}`,
        bytes: fs.statSync(file).size,
      });
    }),
  );
  r.get(
    '/backup/download/:file',
    h((req, res) => {
      const name = path.basename(String(req.params.file));
      const file = path.join(env.backupsDir, name);
      if (!file.startsWith(env.backupsDir) || !fs.existsSync(file)) throw notFound('Backup');
      res.download(file);
    }),
  );
  r.post(
    '/backup/import',
    upload.single('file'),
    h((req, res) => {
      if (!req.file) throw badRequest('Envie o arquivo de backup (.json ou .zip)');
      const mode = req.body?.mode === 'replace' ? 'replace' : 'merge';
      let result;
      if (req.file.originalname.endsWith('.zip') || req.file.mimetype.includes('zip')) {
        const tmp = path.join(env.tmpDir, `import-${Date.now()}.zip`);
        fs.mkdirSync(env.tmpDir, { recursive: true });
        fs.writeFileSync(tmp, req.file.buffer);
        try {
          result = importZip(db, repos, tmp, mode);
        } finally {
          fs.rmSync(tmp, { force: true });
        }
      } else {
        const json = JSON.parse(req.file.buffer.toString('utf8'));
        result = importJson(db, repos, json, mode);
      }
      res.json(result);
    }),
  );
  return r;
}
