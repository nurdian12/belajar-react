'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Activity, BarChart3, Briefcase, Building2, CheckSquare, Cog, Factory, FolderKanban, LayoutDashboard, Megaphone, Menu, UserCog, Users, X } from 'lucide-react';
import { cn } from './ui';

const NAV = [
  { href: '/', label: 'CEO Command Center', icon: LayoutDashboard }, { href: '/office', label: 'AI Office Room', icon: Building2 },
  { href: '/employees', label: 'AI Employees', icon: Users }, { href: '/manager', label: 'AI Manager', icon: UserCog },
  { href: '/projects', label: 'Projects', icon: FolderKanban }, { href: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { href: '/content', label: 'Content Factory', icon: Factory }, { href: '/clients', label: 'Client Management', icon: Briefcase },
  { href: '/approvals', label: 'Approval Center', icon: CheckSquare }, { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/logs', label: 'Agent Activity Logs', icon: Activity }, { href: '/settings', label: 'Settings', icon: Cog },
];
export function Sidebar({ pending, org, demo }: { pending: number; org: string; demo: boolean }) {
  const path = usePathname(); const [open, setOpen] = useState(false);
  const nav = (
    <nav className="flex h-full flex-col bg-navy-900 text-slate-300">
      <div className="px-5 py-5"><div className="text-[11px] font-semibold uppercase tracking-widest text-indigo-300">AI Digital Marketing</div><div className="text-lg font-semibold text-white">Agency</div><div className="mt-0.5 truncate text-xs text-slate-500">{org}{demo && ' · demo'}</div></div>
      <div className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {NAV.map((n) => { const on = n.href === '/' ? path === '/' : path.startsWith(n.href);
          return <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className={cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition', on ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white')}>
            <n.icon size={16} className={on ? 'text-indigo-300' : ''} /><span className="flex-1">{n.label}</span>
            {n.href === '/approvals' && pending > 0 && <span className="rounded-full bg-amber-400 px-1.5 text-[10px] font-bold text-navy-950">{pending}</span>}</Link>; })}
      </div>
      <div className="p-4 text-[11px] text-slate-500">CEO workspace</div>
    </nav>);
  return <>
    <button className="fixed left-3 top-3 z-40 rounded-lg bg-navy-900 p-2 text-white lg:hidden" onClick={() => setOpen(!open)} aria-label="menu">{open ? <X size={18} /> : <Menu size={18} />}</button>
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{nav}</aside>
    {open && <aside className="fixed inset-y-0 left-0 z-30 w-64 shadow-2xl lg:hidden">{nav}</aside>}
  </>;
}
