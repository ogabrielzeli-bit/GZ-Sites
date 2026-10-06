/**
 * Cliente da API do GZ OS + hooks (TanStack Query).
 */
import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type {
  Activity,
  Audit,
  DashboardData,
  Preview,
  Project,
  Proposal,
  ProposalInput,
  Prospect,
  ProspectInput,
  Settings,
  Task,
  Template,
} from '@shared/schemas';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

async function request<T>(method: string, url: string, body?: unknown, raw?: boolean): Promise<T> {
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  const res = await fetch(`/api${url}`, {
    method,
    headers: isForm || body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: isForm ? (body as FormData) : body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = res.statusText;
    let details: unknown;
    try {
      const j = await res.json();
      msg = j.error || msg;
      details = j.details;
    } catch {}
    throw new ApiError(res.status, msg, details);
  }
  if (raw) return (await res.text()) as unknown as T;
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(url: string) => request<T>('GET', url),
  post: <T>(url: string, body?: unknown) => request<T>('POST', url, body),
  put: <T>(url: string, body?: unknown) => request<T>('PUT', url, body),
  patch: <T>(url: string, body?: unknown) => request<T>('PATCH', url, body),
  del: <T>(url: string, body?: unknown) => request<T>('DELETE', url, body),
  text: (url: string) => request<string>('GET', url, undefined, true),
};

// ---------- tipos de resposta ----------
export type ProspectRow = Prospect & { auditScore: number | null; previewsCount: number };
export interface Job {
  id: string;
  kind: string;
  refId: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  progress: string;
  error?: string;
  result?: unknown;
}
export type ProspectFull = Prospect & {
  audits: (Omit<Audit, 'report'> & { report?: undefined })[];
  previews: Preview[];
  proposals: Proposal[];
  projects: Project[];
  tasks: Task[];
  activities: Activity[];
  activeJobs: Job[];
};
export type AuditFull = Omit<Audit, 'screenshots'> & {
  screenshots: (Audit['screenshots'][number] & { url: string })[];
  job: Job | null;
};
export type ProjectFull = Project & {
  hasDist: boolean;
  previewUrl: string | null;
  qaReportUrl: string | null;
  activeJobs: Job[];
};
export interface Meta {
  segments: { id: string; label: string; group: string }[];
  stages: { id: string; label: string; color: string; won: boolean }[];
  themes: {
    id: string;
    name: string;
    description: string;
    mode: string;
    colors: Record<string, string>;
    fonts: { display: string; body: string };
  }[];
  layouts: { id: string; name: string; description: string }[];
  sections: {
    type: string;
    name: string;
    description: string;
    variants: { id: string; label: string }[];
    overlay: boolean;
  }[];
  autofixes: { id: string; description: string }[];
  ai: { provider: string; available: boolean; configured: Record<string, boolean>; envProvider: string };
}

// ---------- hooks ----------
const q = <T>(key: unknown[], url: string, opts: Partial<UseQueryOptions<T>> = {}) =>
  useQuery<T>({ queryKey: key, queryFn: () => api.get<T>(url), ...opts });

export const useDashboard = () => q<DashboardData>(['dashboard'], '/dashboard', { refetchInterval: 15000 });
export const useMeta = () => q<Meta>(['meta'], '/meta', { staleTime: 5 * 60_000 });
export const useSettings = () => q<Settings>(['settings'], '/settings');
export const useProspects = (params: { q?: string; stage?: string; segment?: string } = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v) as [string, string][],
  ).toString();
  return q<ProspectRow[]>(['prospects', params], `/prospects${qs ? '?' + qs : ''}`);
};
export const useProspect = (id: string | undefined, poll = false) =>
  q<ProspectFull>(['prospect', id], `/prospects/${id}`, {
    enabled: !!id,
    refetchInterval: poll ? 2500 : false,
  });
export const useAudit = (id: string | undefined, poll = false) =>
  q<AuditFull>(['audit', id], `/audits/${id}`, { enabled: !!id, refetchInterval: poll ? 2500 : false });
export const useProjects = () => q<Project[]>(['projects'], '/projects');
export const useProject = (id: string | undefined, poll = false) =>
  q<ProjectFull>(['project', id], `/projects/${id}`, { enabled: !!id, refetchInterval: poll ? 2500 : false });

export const useTemplates = (kind?: string) =>
  q<Template[]>(['templates', kind], `/templates${kind ? '?kind=' + kind : ''}`);
export const useTasks = (prospectId?: string) =>
  q<Task[]>(['tasks', prospectId], `/tasks${prospectId ? '?prospectId=' + prospectId : ''}`);
export const useJob = (id: string | undefined) =>
  q<Job>(['job', id], `/jobs/${id}`, {
    enabled: !!id,
    refetchInterval: (query) =>
      query.state.data && (query.state.data.status === 'done' || query.state.data.status === 'failed')
        ? false
        : 2000,
  });

/** Invalida tudo relacionado a um prospect/projeto após mutações */
export function useInvalidate() {
  const qc = useQueryClient();
  return (keys: unknown[][] = [['dashboard'], ['prospects'], ['projects']]) =>
    Promise.all(keys.map((k) => qc.invalidateQueries({ queryKey: k })));
}

export function useApiMutation<TArgs, TRes>(
  fn: (args: TArgs) => Promise<TRes>,
  invalidate: unknown[][] = [],
  onSuccess?: (r: TRes, a: TArgs) => void,
) {
  const qc = useQueryClient();
  return useMutation<TRes, ApiError, TArgs>({
    mutationFn: fn,
    onSuccess: async (r, a) => {
      await Promise.all([...invalidate, ['dashboard']].map((k) => qc.invalidateQueries({ queryKey: k })));
      onSuccess?.(r, a);
    },
  });
}

export type {
  Prospect,
  ProspectInput,
  Settings,
  Proposal,
  ProposalInput,
  Preview,
  Project,
  Task,
  Template,
  Activity,
  Audit,
};
