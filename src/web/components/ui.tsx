/**
 * Componentes de UI do GZ OS (pequenos, sem dependência de biblioteca de componentes).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Info, Loader2, X, XCircle } from 'lucide-react';

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}

// ---------- Button ----------
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export function Button({
  variant = 'secondary',
  size,
  loading,
  className,
  children,
  icon,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant;
  size?: 'sm' | 'lg' | 'icon';
  loading?: boolean;
  icon?: ReactNode;
}) {
  return (
    <button
      className={cx(
        'btn',
        `btn-${variant}`,
        size === 'sm' && 'btn-sm',
        size === 'lg' && 'btn-lg',
        size === 'icon' && 'btn-icon',
        className,
      )}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading ? <Loader2 className="w-4 h-4 spin" /> : icon}
      {children}
    </button>
  );
}

// ---------- Badge ----------
export function Badge({
  color = '#8e8e9a',
  children,
  className,
}: {
  color?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cx('badge', className)} style={{ background: `${color}22`, color }}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: 'pass' | 'warning' | 'fail' | 'warn' | 'info' | string }) {
  const map: Record<string, { c: string; l: string }> = {
    pass: { c: '#36c27a', l: 'PASS' },
    warning: { c: '#f2a93b', l: 'WARNING' },
    warn: { c: '#f2a93b', l: 'WARN' },
    fail: { c: '#ef5a5a', l: 'FAIL' },
    info: { c: '#5b8def', l: 'INFO' },
  };
  const m = map[status] ?? { c: '#8e8e9a', l: status.toUpperCase() };
  return <Badge color={m.c}>{m.l}</Badge>;
}

// ---------- Fields ----------
export function Field({
  label,
  hint,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      {children}
      {hint && <p className="text-xs text-muted mt-1">{hint}</p>}
    </div>
  );
}
export const Input = (p: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...p} className={cx('input', p.className)} />
);
export const Textarea = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...p} className={cx('textarea', p.className)} />
);
export const Select = (p: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...p} className={cx('select', p.className)} />
);

// ---------- Card ----------
export function Card({
  title,
  actions,
  children,
  className,
  pad = true,
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <section className={cx('card', className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-line">
          <h3 className="text-sm font-semibold">{title}</h3>
          <div className="flex items-center gap-2">{actions}</div>
        </header>
      )}
      <div className={pad ? 'card-pad' : ''}>{children}</div>
    </section>
  );
}

// ---------- Modal ----------
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg' | 'xl';
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cx(
          'card w-full max-h-[92vh] flex flex-col fade-up rounded-b-none sm:rounded-b-xl',
          size === 'md' && 'sm:max-w-xl',
          size === 'lg' && 'sm:max-w-3xl',
          size === 'xl' && 'sm:max-w-5xl',
        )}
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 className="font-semibold">{title}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Fechar">
            <X className="w-4 h-4" />
          </button>
        </header>
        <div className="p-5 overflow-y-auto">{children}</div>
        {footer && (
          <footer className="flex items-center justify-end gap-2 px-5 py-4 border-t border-line">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}

export function Confirm({
  open,
  onClose,
  onConfirm,
  title,
  text,
  danger,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  text?: string;
  danger?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            Confirmar
          </Button>
        </>
      }
    >
      <p className="text-muted">{text}</p>
    </Modal>
  );
}

// ---------- Tabs ----------
export function Tabs<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange: (v: T) => void;
  items: { id: T; label: string; count?: number }[];
}) {
  return (
    <div role="tablist" className="flex gap-1 border-b border-line overflow-x-auto">
      {items.map((it) => (
        <button
          key={it.id}
          role="tab"
          aria-selected={value === it.id}
          className="tab"
          onClick={() => onChange(it.id)}
        >
          {it.label}
          {it.count !== undefined && (
            <span className="text-[11px] bg-panel-2 rounded px-1.5 py-0.5 text-muted">{it.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

// ---------- Empty ----------
export function Empty({
  icon,
  title,
  text,
  action,
}: {
  icon?: ReactNode;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 gap-2">
      {icon && <div className="text-muted-2 mb-1">{icon}</div>}
      <h4 className="font-semibold">{title}</h4>
      {text && <p className="text-muted text-sm max-w-sm">{text}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

// ---------- Score ring ----------
export function Score({
  value,
  label,
  size = 56,
  color,
}: {
  value: number | null | undefined;
  label?: string;
  size?: number;
  color?: string;
}) {
  const v = value ?? 0;
  const c = color ?? (v >= 80 ? '#36c27a' : v >= 55 ? '#f2a93b' : '#ef5a5a');
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="score-ring rounded-full grid place-items-center"
        style={{ width: size, height: size, ['--p' as string]: v, ['--c' as string]: c }}
      >
        <div
          className="rounded-full bg-panel grid place-items-center font-bold"
          style={{ width: size - 8, height: size - 8, fontSize: size / 3.6 }}
        >
          {value == null ? '—' : v}
        </div>
      </div>
      {label && <span className="text-[11px] text-muted uppercase tracking-wide">{label}</span>}
    </div>
  );
}

// ---------- Toasts ----------
interface Toast {
  id: number;
  kind: 'ok' | 'err' | 'info';
  text: string;
}
const ToastCtx = createContext<{ push: (kind: Toast['kind'], text: string) => void }>({ push: () => {} });
export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast['kind'], text: string) => {
    const id = Date.now() + Math.random();
    setList((l) => [...l, { id, kind, text }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), kind === 'err' ? 7000 : 3500);
  }, []);
  const value = useMemo(() => ({ push }), [push]);
  return (
    <ToastCtx.Provider value={value}>
      {children}
      {createPortal(
        <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-sm">
          {list.map((t) => (
            <div
              key={t.id}
              className={cx(
                'card px-4 py-3 text-sm flex items-start gap-2 fade-up shadow-xl',
                t.kind === 'ok' && 'border-ok/40',
                t.kind === 'err' && 'border-bad/40',
              )}
            >
              {t.kind === 'ok' ? (
                <CheckCircle2 className="w-4 h-4 text-ok shrink-0 mt-0.5" />
              ) : t.kind === 'err' ? (
                <XCircle className="w-4 h-4 text-bad shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 text-info shrink-0 mt-0.5" />
              )}
              <span>{t.text}</span>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastCtx.Provider>
  );
}
export function useToast() {
  const { push } = useContext(ToastCtx);
  return {
    ok: (t: string) => push('ok', t),
    err: (t: string) => push('err', t),
    info: (t: string) => push('info', t),
    error: (e: unknown) => push('err', e instanceof Error ? e.message : String(e)),
  };
}

// ---------- Misc ----------
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cx('w-4 h-4 spin', className)} />;
}
export function Loading({ text = 'Carregando…' }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 text-muted py-10 justify-center">
      <Spinner /> {text}
    </div>
  );
}
export function ErrorBox({ error }: { error: unknown }) {
  return (
    <div className="card border-bad/40 p-4 flex items-start gap-2 text-sm">
      <AlertTriangle className="w-4 h-4 text-bad shrink-0 mt-0.5" />
      <span>{error instanceof Error ? error.message : String(error)}</span>
    </div>
  );
}
export function Kpi({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="kpi">
      <span>{label}</span>
      <strong className={accent ? 'text-accent' : ''}>{value}</strong>
      {sub && <span className="text-muted-2">{sub}</span>}
    </div>
  );
}
export function CopyButton({ text, label = 'Copiar' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  const toast = useToast();
  return (
    <Button
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          toast.err('Não foi possível copiar');
        }
      }}
    >
      {done ? 'Copiado!' : label}
    </Button>
  );
}
export function useDebounce<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  const t = useRef<number | undefined>(undefined);
  useEffect(() => {
    window.clearTimeout(t.current);
    t.current = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(t.current);
  }, [value, ms]);
  return v;
}
