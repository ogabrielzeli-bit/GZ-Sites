/**
 * GZ Site Factory — projeto real em disco (data/projects/<slug>), build estático, export e deploy.
 */
import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';
import type { Project, Prospect, Settings } from '@shared/schemas';
import { parseSiteConfig, type SiteConfig } from '@shared/site-config';
import { normalizeUrl } from '@shared/utils';
import { generateSiteConfig, renderSite, writeRenderedSite } from '../../../engine';
import { env } from '../../env';
import type { Repos } from '../../db/repos';
import { generateInputFromProspect, resolveUploadPath } from '../previews';

export interface CreateProjectInput {
  name: string;
  domain?: string;
  segment?: string;
  config?: unknown;
  notes?: string;
}

function siteUrlFromDomain(domain?: string): string | undefined {
  if (!domain) return undefined;
  const u = normalizeUrl(domain);
  return u ? u.replace(/\/$/, '') : undefined;
}

/** Copia imagens de uploads para dentro do projeto e reescreve os src para caminhos relativos. */
function internalizeAssets(config: SiteConfig, projectDir: string): SiteConfig {
  const imgDir = path.join(projectDir, 'assets', 'img');
  fs.mkdirSync(imgDir, { recursive: true });
  const rewrite = (src?: string | null): string | undefined => {
    if (!src) return src ?? undefined;
    const abs = resolveUploadPath(src);
    if (!abs || !fs.existsSync(abs)) return src;
    const name = path.basename(abs);
    fs.copyFileSync(abs, path.join(imgDir, name));
    return `assets/img/${name}`;
  };
  const walk = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      const o: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(v as Record<string, unknown>))
        o[k] = k === 'src' && typeof val === 'string' ? rewrite(val) : walk(val);
      return o;
    }
    return v;
  };
  return parseSiteConfig(walk(config));
}

export function createProject(
  repos: Repos,
  prospect: Prospect | null,
  input: CreateProjectInput,
  settings: Settings,
): Project {
  const slug = repos.projects.uniqueSlug(input.name);
  const dir = path.join(env.projectsDir, slug);
  fs.mkdirSync(dir, { recursive: true });
  const siteUrl = siteUrlFromDomain(input.domain);
  let config: SiteConfig;
  if (input.config) {
    config = parseSiteConfig({ ...(input.config as object), previewMode: false });
  } else if (prospect) {
    config = generateSiteConfig(generateInputFromProspect(prospect, settings, { previewMode: false })).config;
  } else {
    config = generateSiteConfig({
      name: input.name,
      segment: input.segment ?? 'servicos',
      previewMode: false,
      credits: { name: settings.agencyName, url: settings.website || undefined },
    }).config;
  }
  config.brand.name = config.brand.name || input.name;
  config.seo.siteUrl = siteUrl;
  config.seo.noindex = false;
  config.previewMode = false;
  config = internalizeAssets(config, dir);
  writeProjectFiles(dir, config, {
    name: input.name,
    slug,
    domain: input.domain,
    agency: settings.agencyName,
  });
  const project = repos.projects.create({
    prospectId: prospect?.id ?? null,
    name: input.name,
    slug,
    domain: input.domain,
    config,
    path: dir,
    notes: input.notes,
  });
  repos.activities.log(prospect?.id ?? null, 'project.created', `Projeto "${input.name}" criado`, {
    projectId: project.id,
    slug,
  });
  if (
    prospect &&
    (prospect.stage === 'fechado' || prospect.stage === 'negociacao' || prospect.stage === 'proposta')
  ) {
    repos.prospects.update(prospect.id, { stage: 'producao' });
    repos.activities.log(prospect.id, 'prospect.stage', 'Etapa alterada para Produção');
  }
  return project;
}

export function writeProjectFiles(
  dir: string,
  config: SiteConfig,
  meta: { name: string; slug: string; domain?: string; agency: string },
) {
  fs.writeFileSync(path.join(dir, 'site.config.json'), JSON.stringify(config, null, 2));
  fs.writeFileSync(path.join(dir, 'netlify.toml'), netlifyToml());
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify(
      {
        name: meta.slug,
        private: true,
        type: 'module',
        description: `Site de ${meta.name} — gerado pelo GZ OS (${meta.agency})`,
        scripts: { build: 'tsx scripts/build.ts', preview: 'npx serve dist', qa: 'tsx scripts/qa.ts' },
        devDependencies: { tsx: '^4.20.6', esbuild: '^0.25.10', typescript: '^5.9.3' },
        dependencies: { gsap: '^3.13.0', zod: '^4.1.11' },
        engines: { node: '>=20' },
      },
      null,
      2,
    ),
  );
  fs.mkdirSync(path.join(dir, 'scripts'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'scripts', 'build.ts'), STANDALONE_BUILD);
  fs.writeFileSync(
    path.join(dir, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'Bundler',
          strict: true,
          skipLibCheck: true,
          esModuleInterop: true,
          resolveJsonModule: true,
          baseUrl: '.',
          paths: { '@shared/*': ['engine/shared/*'], '@engine/*': ['engine/engine/*'] },
          types: ['node'],
        },
        include: ['scripts', 'engine'],
      },
      null,
      2,
    ),
  );
  fs.writeFileSync(path.join(dir, 'README.md'), projectReadme(meta));
  fs.writeFileSync(path.join(dir, '.gitignore'), 'node_modules/\ndist/\n.env\n');
}

const STANDALONE_BUILD = `/**
 * Build do site: lê site.config.json e gera a pasta dist/ (HTML/CSS/JS estáticos).
 * Dentro do GZ OS este script não é necessário (o painel faz o build). Fora dele: npm install && npm run build
 */
import fs from 'node:fs';
import path from 'node:path';
import { renderSite, writeRenderedSite, ensureRuntime } from '../engine/engine/index';

const root = path.resolve(import.meta.dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'site.config.json'), 'utf8'));
await ensureRuntime();
const site = renderSite(config, { localFile: (src) => (src.startsWith('assets/') ? path.join(root, src) : null) });
const dist = path.join(root, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
writeRenderedSite(site, dist);
fs.copyFileSync(path.join(root, 'netlify.toml'), path.join(dist, 'netlify.toml'));
for (const w of site.warnings) console.warn('aviso:', w);
console.log('✔ site gerado em', dist, '(' + site.files.length + ' arquivos)');
`;

function projectReadme(meta: { name: string; slug: string; domain?: string; agency: string }): string {
  return `# ${meta.name}

Site gerado pelo GZ OS (${meta.agency}).

## Estrutura
- \`site.config.json\` — TODO o conteúdo e configuração do site (textos, seções, tema, contato). Edite aqui.
- \`assets/img/\` — fotos e logo usados pelo site.
- \`dist/\` — site compilado (HTML/CSS/JS estáticos). É o que vai para o ar.
- \`netlify.toml\` — configuração de deploy (headers de segurança, cache, redirects).
- \`engine/\` — (só no export completo) o motor que transforma o config em site.

## Como editar
1. Abra \`site.config.json\` e altere textos, telefone, serviços, seções.
2. No GZ OS: clique em **Build Site** → **Rodar QA** → **Exportar**.
3. Fora do GZ OS (export completo): \`npm install && npm run build\`.

## Deploy
- **Netlify (arrastar e soltar):** envie a pasta \`dist/\` (ou o ZIP exportado) em app.netlify.com → Add new site → Deploy manually.
- **Netlify CLI:** \`npx netlify deploy --dir=dist --prod\`.
${meta.domain ? `- Domínio: ${meta.domain}` : ''}

## Formulário
O formulário envia por WhatsApp (abre a conversa com os dados) por padrão. Para usar Netlify Forms, defina \`integrations.form = "netlify"\` no config e refaça o build.
`;
}

export function netlifyToml(): string {
  return `# Gerado pelo GZ OS — deploy estático
[build]
  publish = "."

# Headers de segurança e cache (duplicados em _headers para deploy manual)
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=(), payment=()"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
`;
}

export interface BuildResult {
  distDir: string;
  files: number;
  warnings: string[];
}

export function buildProject(repos: Repos, project: Project): BuildResult {
  const config = parseSiteConfig(project.config);
  const dist = path.join(project.path, 'dist');
  const site = renderSite(config, {
    localFile: (src) => (src.startsWith('assets/') ? path.join(project.path, src) : resolveUploadPath(src)),
  });
  fs.rmSync(dist, { recursive: true, force: true });
  writeRenderedSite(site, dist);
  fs.writeFileSync(path.join(dist, 'netlify.toml'), netlifyToml());
  // mantém config no disco sincronizado com o banco
  fs.writeFileSync(path.join(project.path, 'site.config.json'), JSON.stringify(config, null, 2));
  repos.projects.update(project.id, { status: 'built', lastBuildAt: new Date().toISOString() });
  repos.activities.log(
    project.prospectId,
    'project.built',
    `Build do projeto "${project.name}" (${site.files.length} arquivos)`,
    { projectId: project.id, warnings: site.warnings },
  );
  return { distDir: dist, files: site.files.length, warnings: site.warnings };
}

export function projectDist(project: Project): string | null {
  const dist = path.join(project.path, 'dist');
  return fs.existsSync(path.join(dist, 'index.html')) ? dist : null;
}

/** ZIP para deploy manual na Netlify (conteúdo do dist na raiz do zip) */
export function exportNetlifyZip(project: Project): string {
  const dist = projectDist(project);
  if (!dist) throw new Error('Faça o build antes de exportar');
  fs.mkdirSync(env.exportsDir, { recursive: true });
  const out = path.join(env.exportsDir, `${project.slug}-netlify.zip`);
  const zip = new AdmZip();
  zip.addLocalFolder(dist);
  zip.writeZip(out);
  return out;
}

/** ZIP do projeto completo: config, assets, scripts, engine (para editar e buildar fora do GZ OS) */
export function exportFullZip(project: Project): string {
  fs.mkdirSync(env.exportsDir, { recursive: true });
  const out = path.join(env.exportsDir, `${project.slug}-projeto.zip`);
  const zip = new AdmZip();
  const skip = new Set(['node_modules', 'dist']);
  for (const entry of fs.readdirSync(project.path)) {
    if (skip.has(entry)) continue;
    const full = path.join(project.path, entry);
    if (fs.statSync(full).isDirectory()) zip.addLocalFolder(full, entry);
    else zip.addLocalFile(full);
  }
  // engine (src/engine + src/shared) para build standalone
  const engineSrc = path.join(env.root, 'src', 'engine');
  const sharedSrc = path.join(env.root, 'src', 'shared');
  zip.addLocalFolder(engineSrc, 'engine/engine', (p) => !p.includes('runtime/dist'));
  zip.addLocalFolder(sharedSrc, 'engine/shared');
  const dist = projectDist(project);
  if (dist) zip.addLocalFolder(dist, 'dist');
  zip.writeZip(out);
  return out;
}

/** Deploy via API da Netlify (zip). Token nunca é persistido: vem do .env ou da requisição. */
export async function deployToNetlify(
  project: Project,
  opts: { token: string; siteId?: string; siteName?: string },
): Promise<{ siteId: string; url: string; deployId: string; adminUrl?: string }> {
  const zipPath = exportNetlifyZip(project);
  const headers = { Authorization: `Bearer ${opts.token}` };
  let siteId = opts.siteId;
  if (!siteId) {
    const res = await fetch('https://api.netlify.com/api/v1/sites', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: opts.siteName || project.slug }),
    });
    if (!res.ok)
      throw new Error(
        `Netlify: não foi possível criar o site (${res.status}): ${(await res.text()).slice(0, 200)}`,
      );
    const site = (await res.json()) as { id: string };
    siteId = site.id;
  }
  const res = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/zip' },
    body: fs.readFileSync(zipPath),
  });
  if (!res.ok)
    throw new Error(`Netlify: falha no deploy (${res.status}): ${(await res.text()).slice(0, 200)}`);
  const deploy = (await res.json()) as {
    id: string;
    ssl_url?: string;
    url?: string;
    deploy_ssl_url?: string;
    admin_url?: string;
  };
  return {
    siteId,
    url: deploy.ssl_url || deploy.url || deploy.deploy_ssl_url || '',
    deployId: deploy.id,
    adminUrl: deploy.admin_url,
  };
}

export function deleteProjectFiles(project: Project) {
  if (project.path.startsWith(env.projectsDir)) fs.rmSync(project.path, { recursive: true, force: true });
}
