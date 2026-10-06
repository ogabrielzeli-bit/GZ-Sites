/** GZ Quality Report em HTML (autocontido, abre em qualquer navegador). */
import path from 'node:path';
import { escapeHtml } from '@shared/utils';
import type { QaReport } from './types';

const COLORS = { pass: '#1f9d55', warning: '#d9a02a', fail: '#e5484d' };
const LABELS = { pass: 'PASS', warning: 'WARNING', fail: 'FAIL' };
const GROUPS: Record<string, string> = {
  build: 'Build',
  lint: 'Lint HTML',
  links: 'Links & recursos',
  console: 'Console',
  mobile: 'Mobile',
  images: 'Imagens',
  buttons: 'Botões',
  form: 'Formulário',
  security: 'Segurança',
  seo: 'SEO',
  performance: 'Performance',
  a11y: 'Acessibilidade',
};

export function renderQaReportHtml(r: QaReport, outDir: string): string {
  const byGroup = new Map<string, QaReport['checks']>();
  for (const c of r.checks) byGroup.set(c.group, [...(byGroup.get(c.group) ?? []), c]);
  const lh = r.lighthouse;
  const lhHtml = lh.ran
    ? `<div class="scores">${[
        ['Performance', lh.performance],
        ['Acessibilidade', lh.accessibility],
        ['Best Practices', lh.bestPractices],
        ['SEO', lh.seo],
      ]
        .map(
          ([l, v]) =>
            `<div class="score" style="--c:${(v as number) >= 90 ? COLORS.pass : (v as number) >= 60 ? COLORS.warning : COLORS.fail}"><strong>${v ?? '—'}</strong><span>${l}</span></div>`,
        )
        .join(
          '',
        )}</div><p class="muted">LCP ${lh.lcp ? (lh.lcp / 1000).toFixed(1) + 's' : '—'} · CLS ${lh.cls?.toFixed(2) ?? '—'} · TBT ${lh.tbt ? Math.round(lh.tbt) + 'ms' : '—'}</p>`
    : `<p class="muted">Lighthouse não executado${lh.error ? ` (${escapeHtml(lh.error)})` : ''}.</p>`;
  const shots = r.screenshots
    .map(
      (s) =>
        `<figure><img src="${escapeHtml(path.relative(outDir, s.path))}" alt="${s.viewport}" loading="lazy"><figcaption>${s.viewport} · ${s.width}px${s.overflow > 4 ? ` · <b style="color:${COLORS.fail}">overflow +${s.overflow}px</b>` : ''}</figcaption></figure>`,
    )
    .join('');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GZ Quality Report</title>
<style>body{margin:0;font:15px/1.5 Inter,system-ui,sans-serif;background:#0f0f10;color:#eee}header{padding:40px 32px;border-bottom:1px solid #222}h1{margin:0;font-size:28px;letter-spacing:-.02em}.badge{display:inline-block;padding:6px 14px;border-radius:999px;font-weight:800;letter-spacing:.08em;color:#000;background:${COLORS[r.status]}}main{padding:32px;max-width:1100px}
.summary{display:flex;gap:16px;margin:16px 0 0;color:#aaa}.scores{display:flex;gap:16px;flex-wrap:wrap}.score{padding:16px 20px;border:1px solid #2a2a2a;border-radius:12px;min-width:120px}.score strong{display:block;font-size:32px;color:var(--c)}.score span{color:#999;font-size:12px}
h2{font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:#888;margin:36px 0 12px}.check{display:grid;grid-template-columns:90px 1fr;gap:12px;padding:12px 0;border-top:1px solid #222}.st{font-size:11px;font-weight:800;letter-spacing:.1em;padding:3px 8px;border-radius:6px;color:#000;align-self:start;text-align:center}.check ul{margin:6px 0 0;padding-left:18px;color:#aaa;font-size:13px}.muted{color:#888}.fix{font-size:11px;color:#d4ff2b;margin-left:8px}
.shots{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px}figure{margin:0;border:1px solid #222;border-radius:10px;overflow:hidden;background:#161616}figure img{width:100%;height:300px;object-fit:cover;object-position:top;display:block}figcaption{padding:8px 10px;font-size:12px;color:#aaa}</style></head>
<body><header><span class="badge">${LABELS[r.status]}</span><h1 style="margin-top:12px">GZ Quality Report</h1><div class="summary"><span>${new Date(r.ranAt).toLocaleString('pt-BR')}</span><span>${(r.durationMs / 1000).toFixed(0)}s</span><span style="color:${COLORS.pass}">${r.counts.pass} pass</span><span style="color:${COLORS.warning}">${r.counts.warning} warning</span><span style="color:${COLORS.fail}">${r.counts.fail} fail</span><span>${r.pages.length} página(s)</span></div></header>
<main><h2>Lighthouse (mobile)</h2>${lhHtml}
${Array.from(byGroup.entries())
  .map(
    ([g, list]) =>
      `<h2>${GROUPS[g] ?? g}</h2>${list.map((c) => `<div class="check"><span class="st" style="background:${COLORS[c.status]}">${LABELS[c.status]}</span><div><div>${escapeHtml(c.title)}${c.fix ? `<span class="fix">auto-fix: ${c.fix}</span>` : ''}</div>${c.detail ? `<div class="muted">${escapeHtml(c.detail)}</div>` : ''}${c.items?.length ? `<ul>${c.items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>` : ''}</div></div>`).join('')}`,
  )
  .join('')}
<h2>Screenshots</h2><div class="shots">${shots}</div></main></body></html>`;
}
