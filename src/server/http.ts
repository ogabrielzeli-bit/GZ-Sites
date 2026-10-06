import path from 'node:path';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodType } from 'zod';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const notFound = (what = 'Registro') => new HttpError(404, `${what} não encontrado`);
export const badRequest = (msg: string, details?: unknown) => new HttpError(400, msg, details);

/** Envolve handlers async para propagar erros ao middleware de erro. */
export function h(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown> | unknown,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function parse<T>(schema: ZodType<T>, data: unknown): T {
  const r = schema.safeParse(data);
  if (!r.success) {
    throw new HttpError(
      400,
      'Dados inválidos',
      r.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    );
  }
  return r.data;
}

export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details ?? null });
    return;
  }
  const e = err as Error & { status?: number; type?: string };
  if (e?.type === 'entity.too.large') {
    res.status(413).json({ error: 'Arquivo ou payload grande demais' });
    return;
  }
  console.error('[http]', e);
  res.status(e?.status && e.status >= 400 ? e.status : 500).json({ error: e?.message || 'Erro interno' });
}

/** Garante que um caminho resolvido fique dentro de uma pasta base (anti path traversal). */
export function safeJoin(base: string, ...parts: string[]): string {
  const target = path.resolve(base, ...parts);
  if (target !== path.resolve(base) && !target.startsWith(path.resolve(base) + path.sep))
    throw new HttpError(400, 'Caminho inválido');
  return target;
}
