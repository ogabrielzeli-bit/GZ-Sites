#!/usr/bin/env tsx
/**
 * GZ CLI — mesmas funções do painel, pela linha de comando.
 *
 *   npm run gz -- qa <slug|id> [--no-lighthouse]     QA de um projeto
 *   npm run gz -- build <slug|id>                    build de um projeto
 *   npm run gz -- export <slug|id> [--full]          ZIP para Netlify (ou projeto completo)
 *   npm run gz -- preview <nome> <segmento> [cidade] [--theme=x] [--out=dir]   prévia avulsa
 *   npm run gz -- audit <url> [--out=dir] [--no-lighthouse]                     auditoria avulsa
 *   npm run gz -- backup [--json]                    backup ZIP (ou JSON)
 *   npm run gz -- migrate                            aplica migrations
 *   npm run gz:qa                                    QA do próprio GZ OS (typecheck + lint + testes + QA de um site gerado)
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const [cmd, ...rest] = process.argv.slice(2);
const flags = Object.fromEntries(
  rest
    .filter((a) => a.startsWith('--'))
    .map((a) => a.slice(2).split('='))
    .map(([k, v]) => [k, v ?? true]),
);
const args = rest.filter((a) => !a.startsWith('--'));

function fail(msg: string): never {
  console.error('✖', msg);
  process.exit(1);
}

async function main() {
  switch (cmd) {
    case 'migrate': {
      const { createContext } = await import('../server/context');
      const ctx = createContext();
      console.log('✔ banco pronto em', ctx.env.dbPath);
      ctx.db.close();
      return;
    }
    case 'build':
    case 'export':
    case 'qa': {
      const { createContext } = await import('../server/context');
      const { buildProject, exportFullZip, exportNetlifyZip, projectDist } =
        await import('../server/modules/factory');
      const ctx = createContext();
      try {
        if (!args[0] && cmd === 'qa') return await selfQa(ctx);
        const key = args[0] ?? fail('informe o slug ou id do projeto');
        const project =
          ctx.repos.projects.list().find((p) => p.slug === key || p.id === key) ??
          fail(`projeto "${key}" não encontrado`);
        if (cmd === 'build' || !projectDist(project)) {
          const r = buildProject(ctx.repos, project);
          console.log(`✔ build: ${r.files} arquivos em ${r.distDir}`);
          r.warnings.forEach((w) => console.warn('  aviso:', w));
          if (cmd === 'build') return;
        }
        if (cmd === 'export') {
          const out = flags.full
            ? exportFullZip(ctx.repos.projects.get(project.id)!)
            : exportNetlifyZip(ctx.repos.projects.get(project.id)!);
          console.log('✔ export:', out);
          return;
        }
        const { runQa } = await import('../qa');
        const p = ctx.repos.projects.get(project.id)!;
        const outDir = path.join(p.path, 'qa');
        const report = await runQa({
          distDir: projectDist(p)!,
          outDir,
          config: p.config,
          lighthouse: !flags['no-lighthouse'],
          onProgress: (m) => console.log('  …', m),
        });
        ctx.repos.projects.update(p.id, {
          lastQa: {
            status: report.status,
            ranAt: report.ranAt,
            reportPath: path.join(outDir, 'report.html'),
            counts: report.counts,
          },
          status:
            report.status === 'pass' ? 'qa-pass' : report.status === 'warning' ? 'qa-warning' : 'qa-fail',
        });
        printQa(report);
        console.log('relatório:', path.join(outDir, 'report.html'));
        process.exitCode = report.status === 'fail' ? 1 : 0;
      } finally {
        ctx.db.close();
      }
      return;
    }
    case 'preview': {
      const [name, segment, city] = args;
      if (!name || !segment) fail('uso: preview <nome> <segmento> [cidade] [--theme=x] [--out=dir]');
      const { generateSiteConfig, renderSite, writeRenderedSite, ensureRuntime } = await import('../engine');
      await ensureRuntime();
      const { config, theme, layout } = generateSiteConfig({
        name,
        segment,
        city,
        theme: flags.theme as string | undefined,
        layout: flags.layout as string | undefined,
        previewMode: !flags.final,
        credits: { name: 'GZ Sites' },
      });
      const site = renderSite(config);
      const out = path.resolve((flags.out as string) || `data/previews/cli-${Date.now()}`);
      writeRenderedSite(site, out);
      fs.writeFileSync(path.join(out, 'site.config.json'), JSON.stringify(config, null, 2));
      console.log(`✔ prévia gerada (${theme} / ${layout}) em ${out}`);
      site.warnings.forEach((w) => console.warn('  aviso:', w));
      console.log(`  abra com: npx serve "${out}"  (ou qualquer servidor estático)`);
      return;
    }
    case 'audit': {
      const url = args[0] ?? fail('uso: audit <url>');
      const { runAudit } = await import('../server/modules/auditor');
      const out = path.resolve((flags.out as string) || `data/audits/cli-${Date.now()}`);
      const r = await runAudit({
        url,
        outDir: out,
        lighthouse: !flags['no-lighthouse'],
        onProgress: (m) => console.log('  …', m),
      });
      console.log('\nNOTA GZ:', r.report.scores.overall, r.report.scores);
      console.log('\nOportunidades:');
      r.report.opportunities.forEach((o, i) => console.log(`  ${i + 1}. [${o.severity}] ${o.title}`));
      console.log('\nrelatório:', path.join(out, 'report.json'));
      return;
    }
    case 'backup': {
      const { createContext } = await import('../server/context');
      const { exportJson, exportZip } = await import('../server/modules/backup');
      const ctx = createContext();
      if (flags.json) {
        const f = path.join(ctx.env.backupsDir, `gz-os-backup-${Date.now()}.json`);
        fs.mkdirSync(ctx.env.backupsDir, { recursive: true });
        fs.writeFileSync(f, JSON.stringify(exportJson(ctx.repos), null, 2));
        console.log('✔ backup JSON:', f);
      } else console.log('✔ backup ZIP:', exportZip(ctx.repos, { includeFiles: true }));
      ctx.db.close();
      return;
    }
    default:
      console.log(
        `GZ CLI\n\n  migrate | build <proj> | qa [proj] | export <proj> [--full] | preview <nome> <segmento> [cidade] | audit <url> | backup [--json]\n`,
      );
  }
}

function printQa(report: import('../qa/types').QaReport) {
  const icon = { pass: '✔', warning: '⚠', fail: '✖' } as const;
  for (const c of report.checks)
    console.log(
      ` ${icon[c.status]} ${c.title}${c.items?.length ? `\n     - ${c.items.slice(0, 3).join('\n     - ')}` : ''}`,
    );
  console.log(
    `\nGZ QUALITY REPORT: ${report.status.toUpperCase()} — ${report.counts.pass} pass · ${report.counts.warning} warning · ${report.counts.fail} fail (${(report.durationMs / 1000).toFixed(0)}s)`,
  );
  if (report.lighthouse.ran)
    console.log(
      `Lighthouse: perf ${report.lighthouse.performance} · a11y ${report.lighthouse.accessibility} · seo ${report.lighthouse.seo} · bp ${report.lighthouse.bestPractices}`,
    );
}

/** QA do próprio GZ OS: typecheck, lint, testes unitários e QA completo de um site gerado. */
async function selfQa(ctx: import('../server/context').AppContext) {
  const run = (label: string, c: string, a: string[]) => {
    console.log(`\n▶ ${label}`);
    const r = spawnSync(c, a, { stdio: 'inherit', shell: process.platform === 'win32' });
    if (r.status !== 0) fail(`${label} falhou`);
  };
  run('TypeScript', 'npx', ['tsc', '-p', 'tsconfig.node.json', '--noEmit']);
  run('TypeScript (web)', 'npx', ['tsc', '-p', 'tsconfig.web.json', '--noEmit']);
  run('ESLint', 'npx', ['eslint', '.']);
  run('Testes unitários', 'npx', ['vitest', 'run']);
  console.log('\n▶ Site gerado + QA completo');
  const { generateSiteConfig, renderSite, writeRenderedSite, ensureRuntime } = await import('../engine');
  const { runQa } = await import('../qa');
  await ensureRuntime();
  const out = path.join(ctx.env.tmpDir, 'self-qa');
  fs.rmSync(out, { recursive: true, force: true });
  const { config } = generateSiteConfig({
    name: 'GZ Self QA',
    segment: 'servicos',
    city: 'Curitiba',
    whatsapp: '41999999999',
    previewMode: false,
  });
  writeRenderedSite(renderSite(config), path.join(out, 'dist'));
  const report = await runQa({
    distDir: path.join(out, 'dist'),
    outDir: path.join(out, 'qa'),
    config,
    lighthouse: !flags['no-lighthouse'],
    onProgress: (m) => console.log('  …', m),
  });
  printQa(report);
  process.exitCode = report.status === 'fail' ? 1 : 0;
}

main().catch((e) => fail(e.stack || e.message));
