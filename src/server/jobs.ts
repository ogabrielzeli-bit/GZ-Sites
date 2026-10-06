/**
 * Fila de jobs em processo (auditorias, builds, QA). Executa com concorrência limitada
 * e mantém status em memória para o dashboard consultar progresso.
 */
import { randomUUID } from 'node:crypto';

export interface Job {
  id: string;
  kind: string;
  refId: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  progress: string;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  error?: string;
  result?: unknown;
}

type Runner = (job: Job, progress: (msg: string) => void) => Promise<unknown>;

export class JobQueue {
  private jobs = new Map<string, Job>();
  private queue: { job: Job; run: Runner }[] = [];
  private running = 0;
  constructor(private concurrency = 1) {}

  enqueue(kind: string, refId: string, run: Runner): Job {
    const job: Job = {
      id: randomUUID(),
      kind,
      refId,
      status: 'queued',
      progress: 'Na fila',
      createdAt: new Date().toISOString(),
    };
    this.jobs.set(job.id, job);
    this.queue.push({ job, run });
    this.pump();
    // limpa jobs antigos
    if (this.jobs.size > 200) {
      const old = Array.from(this.jobs.values())
        .filter((j) => j.status === 'done' || j.status === 'failed')
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .slice(0, 100);
      old.forEach((j) => this.jobs.delete(j.id));
    }
    return job;
  }

  get(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  findActive(kind: string, refId: string): Job | undefined {
    return Array.from(this.jobs.values()).find(
      (j) => j.kind === kind && j.refId === refId && (j.status === 'queued' || j.status === 'running'),
    );
  }

  list(): Job[] {
    return Array.from(this.jobs.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  private pump() {
    while (this.running < this.concurrency && this.queue.length) {
      const { job, run } = this.queue.shift()!;
      this.running++;
      job.status = 'running';
      job.startedAt = new Date().toISOString();
      job.progress = 'Iniciando…';
      run(job, (msg) => (job.progress = msg))
        .then((result) => {
          job.status = 'done';
          job.result = result;
          job.progress = 'Concluído';
        })
        .catch((e: Error) => {
          job.status = 'failed';
          job.error = e.message;
          job.progress = 'Falhou';
          console.error(`[job ${job.kind}] falhou:`, e);
        })
        .finally(() => {
          job.finishedAt = new Date().toISOString();
          this.running--;
          this.pump();
        });
    }
  }
}
