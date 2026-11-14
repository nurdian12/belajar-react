import clsx from 'clsx';
import type { ReactNode } from 'react';

export const cn = clsx;
const TONES: Record<string, string> = {
  available: 'bg-emerald-50 text-emerald-700 ring-emerald-200', working: 'bg-blue-50 text-blue-700 ring-blue-200', waiting_approval: 'bg-amber-50 text-amber-700 ring-amber-200', offline: 'bg-slate-100 text-slate-500 ring-slate-200',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200', approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200', published: 'bg-violet-50 text-violet-700 ring-violet-200',
  in_progress: 'bg-blue-50 text-blue-700 ring-blue-200', ready: 'bg-sky-50 text-sky-700 ring-sky-200', planning: 'bg-indigo-50 text-indigo-700 ring-indigo-200', review: 'bg-indigo-50 text-indigo-700 ring-indigo-200', revision: 'bg-orange-50 text-orange-700 ring-orange-200',
  pending_approval: 'bg-amber-50 text-amber-700 ring-amber-200', awaiting_ceo: 'bg-amber-50 text-amber-700 ring-amber-200', draft: 'bg-slate-100 text-slate-600 ring-slate-200', pending: 'bg-slate-100 text-slate-600 ring-slate-200', blocked: 'bg-slate-100 text-slate-500 ring-slate-200',
  rejected: 'bg-rose-50 text-rose-700 ring-rose-200', failed: 'bg-rose-50 text-rose-700 ring-rose-200', error: 'bg-rose-50 text-rose-700 ring-rose-200', warn: 'bg-amber-50 text-amber-700 ring-amber-200', info: 'bg-slate-100 text-slate-600 ring-slate-200',
  simulated: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200', real: 'bg-emerald-50 text-emerald-700 ring-emerald-200', active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};
export const LABEL: Record<string, string> = { available: 'Available', working: 'Working', waiting_approval: 'Waiting Approval', offline: 'Offline', pending_approval: 'Pending Approval', awaiting_ceo: 'Menunggu CEO', in_progress: 'In Progress' };
export function Badge({ v, children }: { v: string; children?: ReactNode }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset', TONES[v] ?? TONES.draft)}>
    {(v === 'working' || v === 'in_progress') && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />}{children ?? LABEL[v] ?? v.replace(/_/g, ' ')}</span>;
}
export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-semibold text-slate-900">{title}</h1>{sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}</div><div className="flex gap-2">{children}</div></div>;
}
export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: string; tone?: 'sim' }) {
  return <div className="card p-4"><div className="text-xs font-medium text-slate-500">{label}</div><div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>{hint && <div className={cn('mt-0.5 text-[11px]', tone === 'sim' ? 'text-fuchsia-600' : 'text-slate-400')}>{hint}</div>}</div>;
}
export function Progress({ value }: { value: number }) {
  return <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand transition-all duration-700" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}
export function Empty({ children }: { children: ReactNode }) { return <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">{children}</div>; }
export function ago(iso: string | null) {
  if (!iso) return '—'; const s = Math.max(0, (Date.now() - Date.parse(iso)) / 1000);
  return s < 60 ? 'baru saja' : s < 3600 ? `${Math.floor(s / 60)} mnt lalu` : s < 86400 ? `${Math.floor(s / 3600)} jam lalu` : `${Math.floor(s / 86400)} hari lalu`;
}
/** Minimal safe Markdown renderer (no raw HTML injection — everything is escaped first). */
export function Markdown({ text }: { text: string }) {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/`(.+?)`/g, '<code>$1</code>').replace(/_(.+?)_/g, '<em>$1</em>');
  const lines = text.split('\n'); const out: string[] = []; let list: 'ul' | 'ol' | null = null; let i = 0;
  const close = () => { if (list) { out.push(`</${list}>`); list = null; } };
  while (i < lines.length) {
    const l = lines[i];
    if (/^\s*\|.*\|\s*$/.test(l) && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1] ?? '')) {
      close(); const cells = (r: string) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => inline(c.trim()));
      let t = `<table><thead><tr>${cells(l).map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>`; i += 2;
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) { t += `<tr>${cells(lines[i]).map((c) => `<td>${c}</td>`).join('')}</tr>`; i++; }
      out.push(t + '</tbody></table>'); continue;
    }
    let m;
    if ((m = /^(#{1,3})\s+(.*)/.exec(l))) { close(); out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`); }
    else if ((m = /^\s*[-*]\s+(.*)/.exec(l))) { if (list !== 'ul') { close(); out.push('<ul>'); list = 'ul'; } out.push(`<li>${inline(m[1])}</li>`); }
    else if ((m = /^\s*\d+\.\s+(.*)/.exec(l))) { if (list !== 'ol') { close(); out.push('<ol>'); list = 'ol'; } out.push(`<li>${inline(m[1])}</li>`); }
    else if ((m = /^>\s?(.*)/.exec(l))) { close(); out.push(`<blockquote>${inline(m[1])}</blockquote>`); }
    else if (l.trim() === '') close(); else { close(); out.push(`<p>${inline(l)}</p>`); }
    i++;
  }
  close();
  return <div className="md" dangerouslySetInnerHTML={{ __html: out.join('') }} />;
}
