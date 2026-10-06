import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import { z } from 'zod';
import type { AppContext } from '../context';
import { badRequest, h, notFound, parse } from '../http';
import { ProjectInput } from '@shared/schemas';
import { parseSiteConfig } from '@shared/site-config';
import {
  buildProject,
  createProject,
  deleteProjectFiles,
  deployToNetlify,
  exportFullZip,
  exportNetlifyZip,
  projectDist,
} from '../modules/factory';
import { applyAutofix, runQa } from '../../qa';
import { resolveStaticFile } from '../../qa/static-server';

export function projectRoutes(ctx: AppContext) {
  const r = Router();
  const { repos, jobs, env } = ctx;
  const getProject = (id: string) => {
    const p = repos.projects.get(id);
    if (!p) throw notFound('Projeto');
    return p;
  };

  r.get(
    '/projects',
    h((_req, res) => res.json(repos.projects.list())),
  );
  r.post(
    '/projects',
    h((req, res) => {
      const input = parse(ProjectInput.extend({ prospectId: z.string().nullable().optional() }), req.body);
      const prospect = (input.prospectId ? repos.prospects.get(input.prospectId) : null) ?? null;
      if (input.prospectId && !prospect) throw notFound('Prospect');
      const project = createProject(repos, prospect, input, repos.settings.get());
      res.status(201).json(project);
    }),
  );
  r.get(
    '/projects/:id',
    h((req, res) => {
      const p = getProject(req.params.id as string);
      res.json({
        ...p,
        hasDist: !!projectDist(p),
        previewUrl: projectDist(p) ? `/projects-preview/${p.id}/` : null,
        qaReportUrl:
          p.lastQa?.reportPath && fs.existsSync(p.lastQa.reportPath)
            ? `/files/projects/${p.slug}/qa/report.html`
            : null,
        activeJobs: jobs
          .list()
          .filter((j) => j.refId === p.id && (j.status === 'running' || j.status === 'queued')),
      });
    }),
  );
  r.patch(
    '/projects/:id',
    h((req, res) => {
      const p = getProject(req.params.id as string);
      const patch = parse(
        z.object({
          name: z.string().min(1).max(200).optional(),
          domain: z.string().max(200).nullable().optional(),
          notes: z.string().max(5000).optional(),
          config: z.unknown().optional(),
          status: z.enum(['draft', 'built', 'qa-pass', 'qa-warning', 'qa-fail', 'exported']).optional(),
        }),
        req.body,
      );
      if (patch.config !== undefined) {
        const cfg = parseSiteConfig(patch.config);
        cfg.previewMode = false;
        patch.config = cfg;
        fs.writeFileSync(path.join(p.path, 'site.config.json'), JSON.stringify(cfg, null, 2));
      }
      res.json(repos.projects.update(p.id, { ...patch, domain: patch.domain ?? undefined }));
    }),
  );
  r.delete(
    '/projects/:id',
    h((req, res) => {
      const p = getProject(req.params.id as string);
      deleteProjectFiles(p);
      repos.projects.delete(p.id);
      res.json({ ok: true });
    }),
  );

  r.post(
    '/projects/:id/build',
    h((req, res) => {
      const p = getProject(req.params.id as string);
      const result = buildProject(repos, p);
      res.json({ ...result, project: repos.projects.get(p.id) });
    }),
  );

  r.post(
    '/projects/:id/qa',
    h((req, res) => {
      const p = getProject(req.params.id as string);
      const active = jobs.findActive('qa', p.id);
      if (active) return res.status(202).json({ job: active });
      const settings = repos.settings.get();
      const lighthouse = req.body?.lighthouse !== false && settings.audit.lighthouse;
      const job = jobs.enqueue('qa', p.id, async (_job, progress) => {
        let project = repos.projects.get(p.id)!;
        if (!projectDist(project)) {
          progress('Build…');
          buildProject(repos, project);
          project = repos.projects.get(p.id)!;
        }
        const outDir = path.join(project.path, 'qa');
        fs.rmSync(outDir, { recursive: true, force: true });
        const report = await runQa({
          distDir: projectDist(project)!,
          outDir,
          config: project.config,
          lighthouse,
          checkExternalLinks: !!req.body?.externalLinks,
          onProgress: progress,
        });
        const summary = {
          status: report.status,
          ranAt: report.ranAt,
          reportPath: path.join(outDir, 'report.html'),
          counts: report.counts,
          lighthouse: report.lighthouse.ran
            ? {
                performance: report.lighthouse.performance,
                accessibility: report.lighthouse.accessibility,
                seo: report.lighthouse.seo,
                bestPractices: report.lighthouse.bestPractices,
              }
            : undefined,
        };
        repos.projects.update(p.id, {
          lastQa: summary,
          status:
            report.status === 'pass' ? 'qa-pass' : report.status === 'warning' ? 'qa-warning' : 'qa-fail',
        });
        repos.activities.log(
          project.prospectId,
          'qa.ran',
          `QA do projeto "${project.name}": ${report.status.toUpperCase()} (${report.counts.fail} fail, ${report.counts.warning} warning)`,
          { projectId: p.id },
        );
        return summary;
      });
      res.status(202).json({ job });
    }),
  );
  r.get(
    '/projects/:id/qa',
    h((req, res) => {
      const p = getProject(req.params.id as string);
      const f = path.join(p.path, 'qa', 'report.json');
      if (!fs.existsSync(f)) return res.json(null);
      const report = JSON.parse(fs.readFileSync(f, 'utf8'));
      report.screenshots = (report.screenshots ?? []).map((s: any) => ({
        ...s,
        url: `/files/projects/${p.slug}/qa/${path.basename(s.path)}`,
      }));
      report.htmlUrl = `/files/projects/${p.slug}/qa/report.html`;
      res.json(report);
    }),
  );

  r.post(
    '/projects/:id/autofix',
    h((req, res) => {
      const p = getProject(req.params.id as string);
      const { only, rebuild } = parse(
        z.object({ only: z.array(z.string()).optional(), rebuild: z.boolean().default(true) }),
        req.body ?? {},
      );
      const result = applyAutofix(p.config, projectDist(p), only);
      repos.projects.update(p.id, { config: result.config });
      fs.writeFileSync(path.join(p.path, 'site.config.json'), JSON.stringify(result.config, null, 2));
      let built = false;
      if (rebuild && (result.needsRebuild || !projectDist(p))) {
        buildProject(repos, repos.projects.get(p.id)!);
        // reaplica ajustes de HTML após o rebuild
        applyAutofix(
          result.config,
          projectDist(repos.projects.get(p.id)!),
          only?.filter((o) => ['rel-noopener', 'lazy', 'alt', 'headers', 'robots'].includes(o)),
        );
        built = true;
      }
      repos.activities.log(p.prospectId, 'autofix.ran', `Auto-fix: ${result.applied.length} correção(ões)`, {
        projectId: p.id,
        applied: result.applied,
      });
      res.json({ applied: result.applied, rebuilt: built, project: repos.projects.get(p.id) });
    }),
  );

  r.post(
    '/projects/:id/export',
    h((req, res) => {
      const p = getProject(req.params.id as string);
      const kind = (req.body?.kind as string) === 'full' ? 'full' : 'netlify';
      if (!projectDist(p)) buildProject(repos, p);
      const file =
        kind === 'full'
          ? exportFullZip(repos.projects.get(p.id)!)
          : exportNetlifyZip(repos.projects.get(p.id)!);
      repos.projects.update(p.id, { status: 'exported' });
      repos.activities.log(
        p.prospectId,
        'deploy.prepared',
        `Export ${kind === 'full' ? 'do projeto completo' : 'para Netlify'} gerado`,
        { projectId: p.id, file: path.basename(file) },
      );
      res.json({
        file: path.basename(file),
        url: `/api/projects/${p.id}/export/${encodeURIComponent(path.basename(file))}`,
        bytes: fs.statSync(file).size,
      });
    }),
  );
  r.get(
    '/projects/:id/export/:file',
    h((req, res) => {
      getProject(req.params.id as string);
      const name = path.basename(String(req.params.file));
      const file = path.join(env.exportsDir, name);
      if (!file.startsWith(env.exportsDir) || !fs.existsSync(file)) throw notFound('Arquivo');
      res.download(file);
    }),
  );
  r.post(
    '/projects/:id/deploy/netlify',
    h(async (req, res) => {
      const p = getProject(req.params.id as string);
      const { token, siteId, siteName } = parse(
        z.object({
          token: z.string().optional(),
          siteId: z.string().optional(),
          siteName: z.string().optional(),
        }),
        req.body ?? {},
      );
      const tk = token || env.netlifyToken;
      if (!tk) throw badRequest('Informe um token da Netlify (ou configure NETLIFY_AUTH_TOKEN no .env)');
      if (!projectDist(p)) buildProject(repos, p);
      const result = await deployToNetlify(repos.projects.get(p.id)!, { token: tk, siteId, siteName });
      repos.activities.log(p.prospectId, 'deploy.prepared', `Deploy na Netlify: ${result.url}`, {
        projectId: p.id,
        siteId: result.siteId,
      });
      res.json(result);
    }),
  );

  // preview do dist do projeto
  r.get(
    '/projects/:id/files',
    h((req, res) => {
      const p = getProject(req.params.id as string);
      const files: { path: string; bytes: number }[] = [];
      const walk = (d: string) => {
        if (!fs.existsSync(d)) return;
        for (const e of fs.readdirSync(d, { withFileTypes: true })) {
          const full = path.join(d, e.name);
          if (e.isDirectory()) {
            if (['node_modules', 'qa'].includes(e.name)) continue;
            walk(full);
          } else
            files.push({
              path: path.relative(p.path, full).split(path.sep).join('/'),
              bytes: fs.statSync(full).size,
            });
        }
      };
      walk(p.path);
      res.json(files);
    }),
  );
  return r;
}

/** Middleware que serve o dist de um projeto em /projects-preview/:id/ */
export function projectPreviewHandler(ctx: AppContext) {
  const r = Router();
  r.get('/:id/{*rest}', (req, res) => {
    const p = ctx.repos.projects.get(req.params.id as string);
    const dist = p ? projectDist(p) : null;
    if (!dist) return res.status(404).send('Projeto sem build');
    const rest =
      '/' + ((req.params as any).rest ? ([] as string[]).concat((req.params as any).rest).join('/') : '');
    const file = resolveStaticFile(dist, rest || '/');
    if (!file) return res.status(404).send('Não encontrado');
    res.sendFile(file);
  });
  r.get('/:id', (req, res) => res.redirect(`/projects-preview/${req.params.id}/`));
  return r;
}
