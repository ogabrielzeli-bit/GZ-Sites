export type QaStatus = 'pass' | 'warning' | 'fail';

export interface QaCheck {
  id: string;
  group:
    | 'build'
    | 'lint'
    | 'links'
    | 'console'
    | 'mobile'
    | 'images'
    | 'buttons'
    | 'form'
    | 'security'
    | 'seo'
    | 'performance'
    | 'a11y';
  status: QaStatus;
  title: string;
  detail?: string;
  items?: string[];
  /** id de auto-fix disponível (ver autofix.ts) */
  fix?: string;
}

export interface QaScreenshot {
  viewport: string;
  width: number;
  height: number;
  path: string;
  overflow: number;
}

export interface QaReport {
  status: QaStatus;
  ranAt: string;
  durationMs: number;
  target: { distDir: string; url: string };
  counts: { pass: number; warning: number; fail: number };
  checks: QaCheck[];
  screenshots: QaScreenshot[];
  lighthouse: {
    ran: boolean;
    error?: string;
    performance?: number;
    accessibility?: number;
    bestPractices?: number;
    seo?: number;
    lcp?: number;
    cls?: number;
    tbt?: number;
  };
  pages: string[];
}
