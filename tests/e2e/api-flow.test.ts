/**
 * E2E: sobe o servidor real com dados em pasta temporária e percorre o fluxo completo pela API,
 * incluindo auditoria (sem Lighthouse) de um site gerado e QA do projeto.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import type { AddressInfo } from 'node:net';

process.env.GZ_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'gz-e2e-'));
process.env.AUDIT_LIGHTHOUSE = 'false';

let base = '';
let close: () => void = () => {};
const api = async <T>(method: string, url: string, body?: unknown): Promise<T> => {
  const res = await fetch(base + '/api' + url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  if (!res.ok)
    throw new Error(
      `${method} ${url} → ${res.status}: ${typeof json === 'string' ? json.slice(0, 200) : json.error}`,
    );
  return json as T;
};
const waitJobs = async (url: string, max = 120000) => {
  const t = Date.now();
  while (Date.now() - t < max) {
    const d = await api<any>('GET', url);
    if (!d.activeJobs?.length) return d;
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error('timeout esperando jobs');
};

beforeAll(async () => {
  const { createContext } = await import('../../src/server/context');
  const { createApp } = await import('../../src/server/app');
  const { ensureRuntime } = await import('../../src/engine');
  await ensureRuntime();
  const ctx = createContext();
  const app = createApp(ctx);
  await new Promise<void>((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
      close = () => {
        server.close();
        ctx.db.close();
      };
      resolve();
    });
  });
}, 120000);
afterAll(() => close());

describe('fluxo completo pela API', () => {
  let prospectId = '';
  let previewUrl = '';
  let proposalId = '';
  let projectId = '';

  it('health, meta e dashboard vazio', async () => {
    expect((await api<any>('GET', '/health')).ok).toBe(true);
    const meta = await api<any>('GET', '/meta');
    expect(meta.segments.length).toBe(20);
    expect(meta.themes.length).toBe(10);
    expect(meta.ai.provider).toBe('none');
    const d = await api<any>('GET', '/dashboard');
    expect(d.counts.prospects).toBe(0);
  });

  it('cria prospect e valida entrada', async () => {
    await expect(api('POST', '/prospects', { name: '' })).rejects.toThrow(/400/);
    const p = await api<any>('POST', '/prospects', {
      name: 'Clínica Vida',
      segment: 'clinica',
      city: 'Curitiba',
      whatsapp: '41999990000',
      contactName: 'Dra. Ana',
    });
    prospectId = p.id;
    expect(p.slug).toBe('clinica-vida');
    const list = await api<any[]>('GET', '/prospects?q=Vida');
    expect(list).toHaveLength(1);
  });

  it('gera prévia servida publicamente', async () => {
    const pv = await api<any>('POST', `/prospects/${prospectId}/previews`, {});
    previewUrl = pv.url;
    expect(pv.theme).toBe('medical-clean');
    const html = await (await fetch(base + previewUrl)).text();
    expect(html).toContain('Clínica Vida');
    expect(html).toContain('gz-preview-bar');
    const css = await fetch(base + previewUrl + 'assets/site.css');
    expect(css.status).toBe(200);
    const p = await api<any>('GET', `/prospects/${prospectId}`);
    expect(p.stage).toBe('previa');
    expect(p.previews).toHaveLength(1);
    // edição da prévia
    const cfg = { ...pv.config, brand: { ...pv.config.brand, name: 'Clínica Vida Editada' } };
    await api('PUT', `/previews/${pv.id}`, { config: cfg });
    expect(await (await fetch(base + previewUrl)).text()).toContain('Clínica Vida Editada');
  });

  it('audita a própria prévia (sem Lighthouse) e gera oportunidades', async () => {
    const r = await api<any>('POST', `/prospects/${prospectId}/audit`, { url: base + previewUrl });
    expect(r.audit.status).toBe('pending');
    const p = await waitJobs(`/prospects/${prospectId}`);
    const audit = await api<any>('GET', `/audits/${p.audits[0].id}`);
    expect(audit.status).toBe('done');
    expect(audit.scores.overall).toBeGreaterThan(50);
    expect(audit.scores.mobile).toBeGreaterThanOrEqual(90);
    expect(audit.screenshots.map((s: any) => s.device)).toEqual(
      expect.arrayContaining(['desktop', 'tablet', 'mobile']),
    );
    expect(audit.report.page.hasWhatsappLink).toBe(true);
    const s = await api<any>('GET', `/audits/${audit.id}/summary`);
    expect(s.provider).toBe('none');
    expect(s.text).toContain('/100');
  }, 150000);

  it('mensagens usam dados da auditoria', async () => {
    const m = await api<any>('GET', `/prospects/${prospectId}/messages`);
    expect(m.vars.nota).not.toBe('—');
    expect(m.messages.find((x: any) => x.key === 'enviar-previa').text).toContain(previewUrl);
    const r = await api<any>('POST', `/prospects/${prospectId}/messages/render`, {
      body: 'Oi {nome}, nota {nota}',
    });
    expect(r.text).toMatch(/^Oi Dra\., nota \d+$/);
  });

  it('proposta: cria, exporta html/text/whatsapp, marca enviada', async () => {
    const pr = await api<any>('POST', `/prospects/${prospectId}/proposals`, { price: 3200 });
    proposalId = pr.id;
    expect(pr.problems.length).toBeGreaterThan(0);
    expect(await (await fetch(`${base}/api/proposals/${proposalId}/html`)).text()).toContain('Clínica Vida');
    expect(await (await fetch(`${base}/api/proposals/${proposalId}/text`)).text()).toContain('3.200');
    expect((await api<any>('GET', `/proposals/${proposalId}/whatsapp`)).text).toContain('R$');
    await api('PUT', `/proposals/${proposalId}`, { status: 'sent' });
    const d = await api<any>('GET', '/dashboard');
    expect(d.counts.proposalsSent).toBe(1);
  });

  it('fecha cliente, cria projeto, build, QA (sem Lighthouse), autofix e export', async () => {
    await api('POST', `/prospects/${prospectId}/stage`, { stage: 'fechado' });
    const pj = await api<any>('POST', '/projects', {
      prospectId,
      name: 'Clínica Vida',
      domain: 'clinicavida.com.br',
    });
    projectId = pj.id;
    expect(fs.existsSync(path.join(pj.path, 'site.config.json'))).toBe(true);
    expect(fs.existsSync(path.join(pj.path, 'netlify.toml'))).toBe(true);
    expect(pj.config.seo.siteUrl).toBe('https://clinicavida.com.br');
    expect((await api<any>('GET', `/prospects/${prospectId}`)).stage).toBe('producao');
    const b = await api<any>('POST', `/projects/${projectId}/build`);
    expect(b.files).toBeGreaterThan(8);
    expect(b.warnings).toEqual([]);
    const site = await fetch(`${base}/projects-preview/${projectId}/`);
    expect(site.status).toBe(200);
    expect(await site.text()).not.toContain('gz-preview-bar');
    await api('POST', `/projects/${projectId}/qa`, { lighthouse: false });
    const after = await waitJobs(`/projects/${projectId}`, 180000);
    expect(['qa-pass', 'qa-warning']).toContain(after.status);
    const report = await api<any>('GET', `/projects/${projectId}/qa`);
    expect(report.counts.fail).toBe(0);
    expect(report.checks.find((c: any) => c.id === 'form').status).toBe('pass');
    expect(report.checks.find((c: any) => c.id === 'overflow').status).toBe('pass');
    expect(report.screenshots.length).toBe(5);
    const fix = await api<any>('POST', `/projects/${projectId}/autofix`, {});
    expect(Array.isArray(fix.applied)).toBe(true);
    const ex = await api<any>('POST', `/projects/${projectId}/export`, { kind: 'netlify' });
    expect(ex.bytes).toBeGreaterThan(10000);
    const dl = await fetch(base + ex.url);
    expect(dl.status).toBe(200);
    const full = await api<any>('POST', `/projects/${projectId}/export`, { kind: 'full' });
    expect(full.bytes).toBeGreaterThan(ex.bytes);
  }, 240000);

  it('dashboard, tarefas e backup refletem o fluxo', async () => {
    const t = await api<any>('POST', '/tasks', { prospectId, title: 'Enviar acesso' });
    const d = await api<any>('GET', '/dashboard');
    expect(d.counts.closed).toBe(1);
    expect(d.counts.tasksPending).toBe(1);
    expect(d.soldValue).toBe(3200);
    await api('PATCH', `/tasks/${t.id}`, { done: true });
    const json = (await (await fetch(`${base}/api/backup/json`)).json()) as any;
    expect(json.data.prospects).toHaveLength(1);
    expect(json.data.projects).toHaveLength(1);
    const zip = await api<any>('POST', '/backup/zip', { includeFiles: true });
    expect(zip.bytes).toBeGreaterThan(1000);
  });

  it('segurança: path traversal e rotas inexistentes', async () => {
    // o cliente normaliza ../ antes de enviar; o importante é nunca servir arquivos fora da pasta
    expect(await (await fetch(`${base}/files/uploads/../../package.json`)).text()).not.toContain(
      '"name": "gz-os"',
    );
    expect((await fetch(`${base}/files/uploads/..%2F..%2Fpackage.json`)).status).toBe(404);
    expect((await fetch(`${base}/previews/..%2F..%2Fpackage.json`)).status).toBe(404);
    expect((await fetch(`${base}/api/nope`)).status).toBe(404);
    expect((await fetch(`${base}/api/projects/${projectId}/export/..%2F..%2Fgz.db`)).status).toBe(404);
  });
});
