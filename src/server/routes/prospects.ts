import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import type { AppContext } from '../context';
import { badRequest, h, notFound, parse } from '../http';
import { PreviewInput, ProposalInput, ProspectInput, ProspectUpdate, TaskInput } from '@shared/schemas';
import { STAGE_IDS, isWonStage, stageLabel } from '@shared/stages';
import { normalizeUrl } from '@shared/utils';
import { runAudit } from '../modules/auditor';
import { createPreview, deletePreview, updatePreview } from '../modules/previews';
import {
  defaultProposalData,
  renderProposalHtml,
  renderProposalPdf,
  renderProposalText,
  renderProposalWhatsapp,
} from '../modules/proposals';
import { buildMessageVars, renderMessage, renderTemplate } from '../modules/messages';
import { deleteAsset, MAX_VIDEO_BYTES, storeAsset } from '../modules/uploads';
import { brandPaletteFromLogo, optimizeVideo, publicPathOf } from '../modules/assets';
import { AssetRole, type ImageAnalysis, type VideoAnalysis } from '@shared/v2';
import {
  createComposedPreview,
  prepareDirections,
  previewCreativeReport,
  regeneratePreview,
  setPreviewLocks,
} from '../modules/creative';
import { publishPreview, publishStatus } from '../modules/publish';
import { ADAPTIVE_KINDS, composeMessage, type AdaptiveKind } from '../modules/messages/adaptive';
import { createAIProvider } from '../modules/ai';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_VIDEO_BYTES, files: 20 } });

export function prospectRoutes(ctx: AppContext) {
  const r = Router();
  const { repos, jobs, env } = ctx;
  const getProspect = (id: string) => {
    const p = repos.prospects.get(id);
    if (!p) throw notFound('Prospect');
    return p;
  };

  // ---------- CRUD ----------
  r.get(
    '/prospects',
    h((req, res) => {
      const list = repos.prospects.list({
        q: String(req.query.q ?? '') || undefined,
        stage: String(req.query.stage ?? '') || undefined,
        segment: String(req.query.segment ?? '') || undefined,
      });
      const audits = new Map<string, number>();
      for (const a of repos.audits.all())
        if (a.status === 'done' && a.scores) audits.set(a.prospectId, a.scores.overall);
      const previews = new Map<string, number>();
      for (const p of repos.previews.all()) previews.set(p.prospectId, (previews.get(p.prospectId) ?? 0) + 1);
      res.json(
        list.map((p) => ({
          ...p,
          auditScore: audits.get(p.id) ?? null,
          previewsCount: previews.get(p.id) ?? 0,
        })),
      );
    }),
  );
  r.post(
    '/prospects',
    h((req, res) => {
      const input = parse(ProspectInput, req.body);
      if (input.website) input.website = normalizeUrl(input.website) ?? input.website;
      const p = repos.prospects.create(input);
      repos.activities.log(p.id, 'prospect.created', `Prospect "${p.name}" criado`);
      res.status(201).json(p);
    }),
  );
  r.get(
    '/prospects/:id',
    h((req, res) => {
      const p = getProspect(req.params.id as string);
      res.json({
        ...p,
        audits: repos.audits
          .listByProspect(p.id)
          .map((a) => ({ ...a, report: undefined, job: jobs.findActive('audit', p.id) ?? null })),
        previews: repos.previews.listByProspect(p.id),
        proposals: repos.proposals.listByProspect(p.id),
        projects: repos.projects.listByProspect(p.id),
        tasks: repos.tasks.list({ prospectId: p.id }),
        activities: repos.activities.list({ prospectId: p.id, limit: 100 }),
        activeJobs: jobs
          .list()
          .filter((j) => j.refId === p.id && (j.status === 'running' || j.status === 'queued')),
      });
    }),
  );
  r.patch(
    '/prospects/:id',
    h((req, res) => {
      const p = getProspect(req.params.id as string);
      const patch = parse(ProspectUpdate, req.body);
      if (patch.website) patch.website = normalizeUrl(patch.website) ?? patch.website;
      if (patch.stage && patch.stage !== p.stage) {
        repos.activities.log(
          p.id,
          isWonStage(patch.stage) && !isWonStage(p.stage) ? 'client.closed' : 'prospect.stage',
          `Etapa: ${stageLabel(p.stage)} → ${stageLabel(patch.stage)}`,
          { from: p.stage, to: patch.stage },
        );
        if (
          patch.stage === 'fechado' &&
          patch.closedValue === undefined &&
          p.closedValue == null &&
          p.potentialValue != null
        )
          patch.closedValue = p.potentialValue;
      }
      if (patch.potentialValue !== undefined && patch.potentialValue !== p.potentialValue)
        repos.activities.log(
          p.id,
          'prospect.price',
          `Valor potencial alterado para ${patch.potentialValue ?? '—'}`,
          { from: p.potentialValue, to: patch.potentialValue },
        );
      if (patch.lastContactAt && patch.lastContactAt !== p.lastContactAt)
        repos.activities.log(p.id, 'prospect.contact', 'Contato registrado');
      const updated = repos.prospects.update(p.id, patch);
      res.json(updated);
    }),
  );
  r.delete(
    '/prospects/:id',
    h((req, res) => {
      const p = getProspect(req.params.id as string);
      for (const pv of repos.previews.listByProspect(p.id)) deletePreview(repos, pv.id);
      for (const a of repos.audits.listByProspect(p.id))
        fs.rmSync(path.join(env.auditsDir, a.id), { recursive: true, force: true });
      repos.prospects.delete(p.id);
      res.json({ ok: true });
    }),
  );
  r.post(
    '/prospects/:id/stage',
    h((req, res) => {
      const p = getProspect(req.params.id as string);
      const { stage } = parse(z.object({ stage: z.enum(STAGE_IDS) }), req.body);
      if (stage !== p.stage)
        repos.activities.log(
          p.id,
          isWonStage(stage) && !isWonStage(p.stage) ? 'client.closed' : 'prospect.stage',
          `Etapa: ${stageLabel(p.stage)} → ${stageLabel(stage)}`,
          { from: p.stage, to: stage },
        );
      const patch: Record<string, unknown> = { stage };
      if (stage === 'fechado' && p.closedValue == null && p.potentialValue != null)
        patch.closedValue = p.potentialValue;
      res.json(repos.prospects.update(p.id, patch));
    }),
  );
  r.post(
    '/prospects/:id/notes',
    h((req, res) => {
      const p = getProspect(req.params.id as string);
      const { text } = parse(z.object({ text: z.string().min(1).max(5000) }), req.body);
      repos.activities.log(p.id, 'note', text);
      res.json({ ok: true });
    }),
  );

  // ---------- Uploads ----------
  r.post(
    '/prospects/:id/uploads',
    upload.array('files', 20),
    h(async (req, res) => {
      const p = getProspect(req.params.id as string);
      const category = String(req.body?.category ?? 'photo') as 'logo' | 'photo' | 'icon' | 'video';
      if (!['logo', 'photo', 'icon', 'video'].includes(category)) throw badRequest('Categoria inválida');
      const files = (req.files as Express.Multer.File[]) ?? [];
      if (!files.length) throw badRequest('Nenhum arquivo enviado');
      const stored = [];
      for (const f of files)
        stored.push(
          await storeAsset({
            clientSlug: p.slug,
            buffer: f.buffer,
            originalName: f.originalname,
            mimetype: f.mimetype,
            category,
          }),
        );
      if (category === 'logo') {
        if (p.logoPath) deleteAsset(p.logoPath);
        // cores da marca extraídas do logo (só se o usuário ainda não informou)
        const analysis = stored[0].analysis as ImageAnalysis | undefined;
        const palette = analysis?.dominantColors ? brandPaletteFromLogo(analysis).colors : [];
        repos.prospects.update(p.id, {
          logoPath: stored[0].path,
          ...(p.brandColors.length === 0 && palette.length ? { brandColors: palette } : {}),
        });
      } else {
        // registro completo do asset (tipo, papel, poster, análise) — vídeos entram em photos com kind 'video'
        repos.prospects.update(p.id, {
          photos: [...p.photos, ...stored.map(({ absPath: _a, needsOptimization: _n, ...s }) => s)],
        });
        // otimização de vídeo em segundo plano (MOV/pesado/4K → MP4 720p); a prévia usa o otimizado se existir
        for (const s of stored.filter((x) => x.kind === 'video' && x.needsOptimization && x.absPath)) {
          jobs.enqueue('video', p.id, async (_job, progress) => {
            progress(`Otimizando ${s.name}…`);
            const out = s.absPath!.replace(/\.(mp4|mov|webm|m4v)$/i, '') + '-web.mp4';
            const ok = await optimizeVideo(s.absPath!, out, 720);
            if (!ok) return null;
            const cur = repos.prospects.get(p.id);
            if (!cur) return null;
            repos.prospects.update(p.id, {
              photos: cur.photos.map((ph) =>
                ph.path === s.path
                  ? {
                      ...ph,
                      analysis: {
                        ...(ph.analysis as VideoAnalysis),
                        optimized: publicPathOf(out),
                        sizeWarning: undefined,
                      },
                    }
                  : ph,
              ),
            });
            repos.activities.log(p.id, 'video.optimized', `Vídeo otimizado para web: ${s.name}`);
            return publicPathOf(out);
          });
        }
      }
      res.status(201).json({ files: stored, prospect: repos.prospects.get(p.id) });
    }),
  );
  // papel do asset: auto | hero | gallery | background | none
  r.patch(
    '/prospects/:id/uploads',
    h((req, res) => {
      const p = getProspect(req.params.id as string);
      const {
        path: pth,
        role,
        name,
      } = parse(
        z.object({ path: z.string(), role: AssetRole.optional(), name: z.string().max(120).optional() }),
        req.body,
      );
      if (!p.photos.some((ph) => ph.path === pth)) throw notFound('Arquivo');
      repos.prospects.update(p.id, {
        photos: p.photos.map((ph) =>
          ph.path === pth ? { ...ph, ...(role ? { role } : {}), ...(name ? { name } : {}) } : ph,
        ),
      });
      res.json(repos.prospects.get(p.id));
    }),
  );
  r.delete(
    '/prospects/:id/uploads',
    h((req, res) => {
      const p = getProspect(req.params.id as string);
      const { path: pth } = parse(z.object({ path: z.string() }), req.body);
      if (p.logoPath === pth) {
        deleteAsset(pth);
        repos.prospects.update(p.id, { logoPath: null });
      } else if (p.photos.some((ph) => ph.path === pth)) {
        deleteAsset(pth);
        repos.prospects.update(p.id, { photos: p.photos.filter((ph) => ph.path !== pth) });
      }
      res.json(repos.prospects.get(p.id));
    }),
  );

  // ---------- Auditoria ----------
  r.post(
    '/prospects/:id/audit',
    h((req, res) => {
      const p = getProspect(req.params.id as string);
      const url = normalizeUrl((req.body?.url as string) || p.website);
      if (!url) throw badRequest('Informe um site válido para auditar');
      if (!p.website) repos.prospects.update(p.id, { website: url });
      const active = jobs.findActive('audit', p.id);
      if (active)
        return res
          .status(202)
          .json({ job: active, audit: repos.audits.get(active.result as string) ?? null });
      const settings = repos.settings.get();
      const audit = repos.audits.create(p.id, url);
      repos.activities.log(p.id, 'audit.started', `Auditoria iniciada: ${url}`, { auditId: audit.id });
      const job = jobs.enqueue('audit', p.id, async (job, progress) => {
        repos.audits.setStatus(audit.id, 'running');
        const outDir = path.join(env.auditsDir, audit.id);
        try {
          const result = await runAudit({
            url,
            outDir,
            timeoutMs: settings.audit.timeoutMs || env.audit.timeoutMs,
            lighthouse: settings.audit.lighthouse && env.audit.lighthouse,
            onProgress: progress,
          });
          repos.audits.finish(audit.id, {
            scores: result.report.scores,
            report: result.report,
            screenshots: result.screenshots,
            opportunities: result.report.opportunities,
          });
          repos.activities.log(
            p.id,
            'audit.done',
            `Auditoria concluída: nota GZ ${result.report.scores.overall}/100`,
            { auditId: audit.id, scores: result.report.scores },
          );
          return audit.id;
        } catch (e) {
          repos.audits.fail(audit.id, (e as Error).message);
          repos.activities.log(
            p.id,
            'audit.failed',
            `Auditoria falhou: ${(e as Error).message.slice(0, 120)}`,
            { auditId: audit.id },
          );
          throw e;
        }
      });
      job.result = audit.id;
      res.status(202).json({ job, audit });
    }),
  );
  r.get(
    '/audits/:id',
    h((req, res) => {
      const a = repos.audits.get(req.params.id as string);
      if (!a) throw notFound('Auditoria');
      res.json({
        ...a,
        screenshots: a.screenshots.map((s) => ({
          ...s,
          url: `/files/audits/${a.id}/${path.basename(s.path)}`,
        })),
        job: jobs.findActive('audit', a.prospectId) ?? null,
      });
    }),
  );
  r.delete(
    '/audits/:id',
    h((req, res) => {
      const a = repos.audits.get(req.params.id as string);
      if (!a) throw notFound('Auditoria');
      fs.rmSync(path.join(env.auditsDir, a.id), { recursive: true, force: true });
      repos.audits.delete(a.id);
      res.json({ ok: true });
    }),
  );
  r.get(
    '/audits/:id/summary',
    h(async (req, res) => {
      const a = repos.audits.get(req.params.id as string);
      if (!a || !a.report) throw notFound('Auditoria');
      const p = getProspect(a.prospectId);
      const ai = createAIProvider(repos.settings.get());
      const text = await ai.summarizeAudit(
        {
          url: a.url,
          scores: a.report.scores as unknown as Record<string, number>,
          opportunities: a.opportunities,
        },
        { company: p.name, segment: p.segment, city: p.city },
      );
      res.json({ text, provider: ai.id });
    }),
  );

  // ---------- Direção criativa (V2) ----------
  // Pesquisa fontes públicas (se houver), deriva o BusinessDNA e propõe 3 direções. Sem IA.
  r.post(
    '/prospects/:id/directions',
    h(async (req, res) => {
      const p = getProspect(req.params.id as string);
      const { refresh, research } = parse(
        z.object({ refresh: z.boolean().optional(), research: z.boolean().optional() }),
        req.body ?? {},
      );
      res.json(await prepareDirections(repos, p, { refresh, research }));
    }),
  );

  // ---------- Prévias ----------
  r.post(
    '/prospects/:id/previews',
    h((req, res) => {
      const p = getProspect(req.params.id as string);
      const input = parse(PreviewInput, req.body ?? {});
      // V2: com direção (ou 'auto') usa o motor adaptativo; sem direção e sem config, mantém o fluxo V1 (tema/variante)
      const preview =
        !input.config && (input.directionId || input.seed !== undefined)
          ? createComposedPreview(repos, p, {
              directionId: input.directionId ?? 'auto',
              seed: input.seed,
              locks: input.locks,
              notes: input.notes,
            })
          : createPreview(repos, p, {
              theme: input.theme,
              layoutVariant: input.layoutVariant,
              config: input.config,
              notes: input.notes,
            });
      res.status(201).json(preview);
    }),
  );
  r.post(
    '/previews/:id/regenerate',
    h((req, res) => {
      const { locks, directionId } = parse(
        z.object({ locks: z.array(z.string()).optional(), directionId: z.string().optional() }),
        req.body ?? {},
      );
      res.status(201).json(regeneratePreview(repos, req.params.id as string, { locks, directionId }));
    }),
  );
  r.put(
    '/previews/:id/locks',
    h((req, res) => {
      const { locks } = parse(z.object({ locks: z.array(z.string()).max(200) }), req.body);
      res.json(setPreviewLocks(repos, req.params.id as string, locks));
    }),
  );
  r.get(
    '/previews/:id/creative-qa',
    h((req, res) => {
      res.json(previewCreativeReport(repos, req.params.id as string));
    }),
  );
  r.get(
    '/publish/status',
    h((_req, res) => res.json(publishStatus())),
  );
  r.post(
    '/previews/:id/publish',
    h(async (req, res) => {
      const st = publishStatus();
      if (!st.configured) return res.status(409).json({ error: st.message, configured: false });
      res.json(await publishPreview(repos, req.params.id as string));
    }),
  );
  // mensagens adaptativas (condicionais ao que existe no prospect)
  r.get(
    '/messages/adaptive/kinds',
    h((_req, res) => res.json(ADAPTIVE_KINDS)),
  );
  r.post(
    '/prospects/:id/messages/adaptive',
    h((req, res) => {
      const p = getProspect(req.params.id as string);
      const { kind, previewId, proposalId } = parse(
        z.object({
          kind: z.enum(ADAPTIVE_KINDS.map((k) => k.id) as [AdaptiveKind, ...AdaptiveKind[]]),
          previewId: z.string().optional(),
          proposalId: z.string().optional(),
        }),
        req.body ?? {},
      );
      const preview = previewId ? repos.previews.get(previewId) : repos.previews.listByProspect(p.id)[0];
      const proposal = proposalId ? repos.proposals.get(proposalId) : repos.proposals.listByProspect(p.id)[0];
      const text = composeMessage(kind, {
        prospect: p,
        settings: repos.settings.get(),
        audit: repos.audits.latestForProspect(p.id),
        preview,
        proposal,
        baseUrl: `${req.protocol}://${req.get('host')}`,
      });
      res.json({ text, kind });
    }),
  );
  r.get(
    '/previews/:id',
    h((req, res) => {
      const pv = repos.previews.get(req.params.id as string);
      if (!pv) throw notFound('Prévia');
      res.json(pv);
    }),
  );
  r.put(
    '/previews/:id',
    h((req, res) => {
      const { config, notes } = parse(
        z.object({ config: z.unknown(), notes: z.string().optional() }),
        req.body,
      );
      res.json(updatePreview(repos, req.params.id as string, config, notes));
    }),
  );
  r.delete(
    '/previews/:id',
    h((req, res) => {
      deletePreview(repos, req.params.id as string);
      res.json({ ok: true });
    }),
  );

  // ---------- Propostas ----------
  r.get(
    '/prospects/:id/proposals/defaults',
    h((req, res) => {
      const p = getProspect(req.params.id as string);
      const audit = repos.audits.latestForProspect(p.id);
      const preview = repos.previews.listByProspect(p.id)[0];
      res.json(defaultProposalData(p, repos.settings.get(), audit, preview?.id ?? null));
    }),
  );
  r.post(
    '/prospects/:id/proposals',
    h((req, res) => {
      const p = getProspect(req.params.id as string);
      const data = parse(ProposalInput, {
        ...defaultProposalData(p, repos.settings.get(), repos.audits.latestForProspect(p.id)),
        ...(req.body ?? {}),
      });
      const proposal = repos.proposals.create(p.id, data);
      repos.activities.log(
        p.id,
        'proposal.created',
        `Proposta nº ${proposal.number} criada (${data.price})`,
        { proposalId: proposal.id },
      );
      if (!['proposta', 'negociacao', 'fechado', 'producao', 'entregue'].includes(p.stage)) {
        repos.prospects.update(p.id, { stage: 'proposta', potentialValue: p.potentialValue ?? data.price });
        repos.activities.log(p.id, 'prospect.stage', 'Etapa alterada para Proposta');
      }
      res.status(201).json(proposal);
    }),
  );
  r.get(
    '/proposals/:id',
    h((req, res) => {
      const pr = repos.proposals.get(req.params.id as string);
      if (!pr) throw notFound('Proposta');
      res.json(pr);
    }),
  );
  r.put(
    '/proposals/:id',
    h((req, res) => {
      const cur = repos.proposals.get(req.params.id as string);
      if (!cur) throw notFound('Proposta');
      const data = parse(ProposalInput, { ...cur, ...(req.body ?? {}) });
      const updated = repos.proposals.update(cur.id, data);
      if (data.status === 'sent' && cur.status !== 'sent') {
        repos.activities.log(cur.prospectId, 'proposal.sent', `Proposta nº ${cur.number} enviada`, {
          proposalId: cur.id,
        });
        const p = repos.prospects.get(cur.prospectId);
        if (p && !['negociacao', 'fechado', 'producao', 'entregue'].includes(p.stage))
          repos.prospects.update(p.id, { stage: 'proposta', lastContactAt: new Date().toISOString() });
      } else if (data.price !== cur.price)
        repos.activities.log(
          cur.prospectId,
          'prospect.price',
          `Preço da proposta nº ${cur.number} alterado: ${cur.price} → ${data.price}`,
        );
      else repos.activities.log(cur.prospectId, 'proposal.updated', `Proposta nº ${cur.number} atualizada`);
      res.json(updated);
    }),
  );
  r.delete(
    '/proposals/:id',
    h((req, res) => {
      repos.proposals.delete(req.params.id as string);
      res.json({ ok: true });
    }),
  );
  const proposalBundle = (id: string) => {
    const pr = repos.proposals.get(id);
    if (!pr) throw notFound('Proposta');
    const p = getProspect(pr.prospectId);
    const settings = repos.settings.get();
    const template = repos.templates.get('proposal', pr.template) ?? repos.templates.list('proposal')[0];
    if (!template) throw badRequest('Nenhum template de proposta cadastrado');
    return { pr, p, settings, template };
  };
  r.get(
    '/proposals/:id/html',
    h((req, res) => {
      const { pr, p, settings, template } = proposalBundle(req.params.id as string);
      res.type('html').send(renderProposalHtml(pr, p, settings, template));
    }),
  );
  r.get(
    '/proposals/:id/text',
    h((req, res) => {
      const { pr, p, settings } = proposalBundle(req.params.id as string);
      res.type('text/plain; charset=utf-8').send(renderProposalText(pr, p, settings));
    }),
  );
  r.get(
    '/proposals/:id/whatsapp',
    h((req, res) => {
      const { pr, p, settings } = proposalBundle(req.params.id as string);
      const link = String(req.query.link ?? '') || undefined;
      res.json({ text: renderProposalWhatsapp(pr, p, settings, link) });
    }),
  );
  r.get(
    '/proposals/:id/pdf',
    h(async (req, res) => {
      const { pr, p, settings, template } = proposalBundle(req.params.id as string);
      const html = renderProposalHtml(pr, p, settings, template);
      const out = path.join(env.exportsDir, `proposta-${String(pr.number).padStart(3, '0')}-${p.slug}.pdf`);
      await renderProposalPdf(html, out);
      res.download(out);
    }),
  );
  r.post(
    '/proposals/:id/ai-solution',
    h(async (req, res) => {
      const { pr, p, settings } = proposalBundle(req.params.id as string);
      const ai = createAIProvider(settings);
      const text = await ai.proposalText({
        company: p.name,
        segment: p.segment,
        city: p.city,
        problems: pr.problems,
        pages: pr.pages,
      });
      res.json({ text, provider: ai.id });
    }),
  );

  // ---------- Mensagens ----------
  r.get(
    '/prospects/:id/messages',
    h((req, res) => {
      const p = getProspect(req.params.id as string);
      const settings = repos.settings.get();
      const audit = repos.audits.latestForProspect(p.id);
      const preview = repos.previews.listByProspect(p.id)[0];
      const proposal = repos.proposals.listByProspect(p.id)[0];
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const mctx = { prospect: p, settings, audit, preview, proposal, baseUrl };
      const templates = repos.templates.list('message');
      res.json({
        vars: buildMessageVars(mctx),
        messages: templates.map((t) => ({
          key: t.key,
          name: t.name,
          category: t.category,
          text: renderMessage(t, mctx),
        })),
      });
    }),
  );
  r.post(
    '/prospects/:id/messages/render',
    h((req, res) => {
      const p = getProspect(req.params.id as string);
      const { body, tone } = parse(
        z.object({
          body: z.string().max(10000),
          tone: z.enum(['formal', 'amigavel', 'direto', 'premium', 'descontraido']).optional(),
        }),
        req.body,
      );
      const settings = repos.settings.get();
      const mctx = {
        prospect: p,
        settings,
        audit: repos.audits.latestForProspect(p.id),
        preview: repos.previews.listByProspect(p.id)[0],
        proposal: repos.proposals.listByProspect(p.id)[0],
        baseUrl: `${req.protocol}://${req.get('host')}`,
      };
      const text = renderTemplate(body, buildMessageVars(mctx));
      if (tone) {
        const ai = createAIProvider(settings);
        return ai
          .adaptTone(text, tone, { company: p.name, segment: p.segment, city: p.city })
          .then((t) => res.json({ text: t, provider: ai.id }));
      }
      repos.activities.log(p.id, 'message.generated', 'Mensagem gerada');
      res.json({ text, provider: 'none' });
    }),
  );

  // ---------- Tarefas ----------
  r.get(
    '/tasks',
    h((req, res) =>
      res.json(
        repos.tasks.list({
          prospectId: String(req.query.prospectId ?? '') || undefined,
          pendingOnly: req.query.pending === '1',
        }),
      ),
    ),
  );
  r.post(
    '/tasks',
    h((req, res) => {
      const t = parse(TaskInput, req.body);
      if (t.prospectId) getProspect(t.prospectId);
      res.status(201).json(repos.tasks.create(t));
    }),
  );
  r.patch(
    '/tasks/:id',
    h((req, res) => {
      const patch = parse(TaskInput.partial(), req.body);
      if (!repos.tasks.get(req.params.id as string)) throw notFound('Tarefa');
      res.json(repos.tasks.update(req.params.id as string, patch));
    }),
  );
  r.delete(
    '/tasks/:id',
    h((req, res) => {
      repos.tasks.delete(req.params.id as string);
      res.json({ ok: true });
    }),
  );

  // ---------- Histórico ----------
  r.get(
    '/activities',
    h((req, res) =>
      res.json(
        repos.activities.list({
          prospectId: String(req.query.prospectId ?? '') || undefined,
          limit: Number(req.query.limit ?? 50),
        }),
      ),
    ),
  );

  return r;
}
