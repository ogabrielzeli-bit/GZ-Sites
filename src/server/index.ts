/**
 * Ponto de entrada do servidor GZ OS.
 */
import { createContext } from './context';
import { createApp } from './app';
import { ensureRuntime } from '../engine/runtime/build';

async function main() {
  const ctx = createContext();
  try {
    await ensureRuntime();
  } catch (e) {
    console.warn('[runtime] não foi possível compilar o runtime do engine:', (e as Error).message);
  }
  const app = createApp(ctx);
  const { port, host } = ctx.env;
  app.listen(port, host, () => {
    console.log(`\n  GZ OS pronto → http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
    console.log(`  Dados em: ${ctx.env.dataDir}`);
    console.log(
      `  IA: ${ctx.env.ai.provider}${ctx.env.ai.provider === 'none' ? ' (desligada — tudo funciona sem IA)' : ''}\n`,
    );
  });
  const shutdown = () => {
    ctx.db.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((e) => {
  console.error('Falha ao iniciar o GZ OS:', e);
  process.exit(1);
});
