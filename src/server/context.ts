import { Database } from './db/database';
import { createRepos, type Repos } from './db/repos';
import { env, ensureDataDirs } from './env';
import { JobQueue } from './jobs';
import { seedTemplates } from './modules/messages/seed';

export interface AppContext {
  db: Database;
  repos: Repos;
  jobs: JobQueue;
  env: typeof env;
}

export function createContext(opts: { dbPath?: string } = {}): AppContext {
  ensureDataDirs();
  const db = new Database(opts.dbPath ?? env.dbPath);
  const { applied } = db.migrate();
  if (applied.length) console.log(`[db] migrations aplicadas: ${applied.join(', ')}`);
  const repos = createRepos(db);
  seedTemplates(repos.templates);
  repos.audits.failStale();
  return { db, repos, jobs: new JobQueue(), env };
}
