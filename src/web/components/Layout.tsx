import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { FolderKanban, Kanban, LayoutDashboard, Menu, Settings, Users, X } from 'lucide-react';
import { useSettings } from '../api';
import { cx } from './ui';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/pipeline', label: 'Pipeline', icon: Kanban },
  { to: '/prospects', label: 'Prospects', icon: Users },
  { to: '/projects', label: 'Projetos', icon: FolderKanban },
  { to: '/settings', label: 'Configurações', icon: Settings },
];

export function Layout() {
  const [open, setOpen] = useState(false);
  const { data: settings } = useSettings();
  const loc = useLocation();
  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.end}
          className={({ isActive }) => cx('nav-link', isActive && 'active')}
          onClick={() => setOpen(false)}
        >
          <n.icon /> {n.label}
        </NavLink>
      ))}
    </nav>
  );
  return (
    <div className="min-h-full flex">
      <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-line bg-bg-2 p-4 gap-6 sticky top-0 h-screen">
        <Brand name={settings?.agencyName} slogan={settings?.slogan} logo={settings?.logoPath} />
        {nav}
        <div className="mt-auto text-[11px] text-muted-2 leading-relaxed">
          GZ OS v0.1
          <br />
          Site Factory · Auditor · Sales OS
        </div>
      </aside>
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-line bg-bg-2 sticky top-0 z-40">
          <Brand name={settings?.agencyName} slogan={settings?.slogan} logo={settings?.logoPath} compact />
          <button className="btn btn-ghost btn-icon" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>
        {open && (
          <div className="lg:hidden fixed inset-0 top-14 z-30 bg-bg-2 p-4" onClick={() => setOpen(false)}>
            {nav}
          </div>
        )}
        <main key={loc.pathname} className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto fade-up">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Brand({
  name,
  slogan,
  logo,
  compact,
}: {
  name?: string;
  slogan?: string;
  logo?: string | null;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      {logo ? (
        <img src={logo} alt="" className="h-8 w-8 rounded-lg object-contain bg-panel-2" />
      ) : (
        <div className="h-8 w-8 rounded-lg bg-accent text-accent-ink grid place-items-center font-black text-xs">
          GZ
        </div>
      )}
      <div className="min-w-0">
        <div className="font-bold leading-tight truncate">{name ?? 'GZ Sites'}</div>
        {!compact && (
          <div className="text-[11px] text-muted truncate">{slogan ?? 'Sua loja fecha. Seu site não.'}</div>
        )}
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  sub,
  actions,
}: {
  title: string;
  sub?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {sub && <div className="text-muted text-sm mt-1">{sub}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
