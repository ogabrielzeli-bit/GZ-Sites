/**
 * App Express do GZ OS: API JSON, arquivos (uploads/auditorias/projetos), prévias e dashboard compilado.
 */
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { AppContext } from './context';
import { errorMiddleware, HttpError } from './http';
import { prospectRoutes } from './routes/prospects';
import { projectPreviewHandler, projectRoutes } from './routes/projects';
import { systemRoutes } from './routes/system';
import { resolveStaticFile } from '../qa/static-server';

export function createApp(ctx: AppContext) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 'loopback');

  // headers de segurança do painel
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (
      !req.path.startsWith('/previews/') &&
      !req.path.startsWith('/projects-preview/') &&
      !req.path.startsWith('/files/')
    )
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    next();
  });

  // token de acesso opcional (para hospedagem). Prévias ficam públicas para enviar a clientes.
  if (ctx.env.accessToken) {
    app.use((req, res, next) => {
      if (req.path.startsWith('/previews/') || req.path === '/api/health') return next();
      const header = req.get('authorization');
      const token = header?.startsWith('Bearer ')
        ? header.slice(7)
        : (req.query.token as string) || req.cookies?.gz_token;
      const cookie = req.headers.cookie?.match(/gz_token=([^;]+)/)?.[1];
      if (token === ctx.env.accessToken || cookie === ctx.env.accessToken) {
        if (req.query.token && !cookie)
          res.setHeader('Set-Cookie', `gz_token=${ctx.env.accessToken}; Path=/; HttpOnly; SameSite=Lax`);
        return next();
      }
      if (req.path.startsWith('/api/'))
        return res.status(401).json({
          error: 'Não autorizado. Informe o token de acesso (?token=... ou Authorization: Bearer).',
        });
      res
        .status(401)
        .type('html')
        .send(
          `<!doctype html><meta charset="utf-8"><title>GZ OS</title><body style="font-family:system-ui;background:#111;color:#eee;display:grid;place-items:center;height:100vh;margin:0"><form method="get" style="text-align:center"><h1>GZ OS</h1><p>Informe o token de acesso.</p><input name="token" type="password" style="padding:10px;border-radius:8px;border:1px solid #444;background:#222;color:#fff"> <button style="padding:10px 16px;border-radius:8px;border:0;background:#d4ff2b;font-weight:700">Entrar</button></form></body>`,
        );
    });
  }

  // rate limit simples por IP para a API (sem dependências)
  const hits = new Map<string, { n: number; t: number }>();
  app.use('/api', (req, res, next) => {
    const ip = req.ip || 'local';
    const now = Date.now();
    const h = hits.get(ip);
    if (!h || now - h.t > 60_000) hits.set(ip, { n: 1, t: now });
    else if (++h.n > 600) return res.status(429).json({ error: 'Muitas requisições. Tente em instantes.' });
    next();
  });

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: false, limit: '2mb' }));

  // ---- API ----
  app.use('/api', systemRoutes(ctx));
  app.use('/api', prospectRoutes(ctx));
  app.use('/api', projectRoutes(ctx));

  // ---- arquivos de dados (uploads, auditorias, projetos/qa) ----
  const serveDir = (urlBase: string, dir: string) => {
    app.use(urlBase, (req, res, next) => {
      const file = resolveStaticFile(dir, req.path);
      if (!file) return next();
      res.setHeader('Cache-Control', 'private, max-age=3600');
      res.sendFile(file);
    });
  };
  serveDir('/files/uploads', ctx.env.uploadsDir);
  serveDir('/files/audits', ctx.env.auditsDir);
  serveDir('/files/projects', ctx.env.projectsDir);
  serveDir('/previews', ctx.env.previewsDir);
  serveDir('/published', path.join(ctx.env.dataDir, 'published'));
  app.use('/projects-preview', projectPreviewHandler(ctx));

  // ---- dashboard compilado (produção) ----
  const webDist = path.join(ctx.env.root, 'dist-web');
  if (fs.existsSync(path.join(webDist, 'index.html'))) {
    app.use(express.static(webDist, { index: false, maxAge: '1h' }));
    app.get('/{*splat}', (req, res, next) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/files/') || req.path.startsWith('/previews/'))
        return next();
      res.sendFile(path.join(webDist, 'index.html'));
    });
  } else {
    app.get('/', (_req, res) =>
      res
        .type('html')
        .send(
          `<!doctype html><meta charset="utf-8"><title>GZ OS</title><body style="font-family:system-ui;padding:40px;background:#111;color:#eee"><h1>GZ OS — API ativa</h1><p>O dashboard não foi compilado. Em desenvolvimento, acesse <a style="color:#d4ff2b" href="http://localhost:5173">http://localhost:5173</a> (npm run dev). Em produção, rode <code>npm run build</code>.</p></body>`,
        ),
    );
  }

  app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Rota não encontrada')));
  app.use(errorMiddleware);
  return app;
}
