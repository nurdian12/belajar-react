import Link from 'next/link';
import { getCtx } from '@/lib/auth';
import { agentsWithState, fmtUsd } from '@/lib/queries';
import { Badge, PageHeader } from '@/components/ui';

export default async function Employees() {
  const ctx = await getCtx(); const st = await agentsWithState(ctx.orgId);
  return <div><PageHeader title="AI Employees" sub={`${st.length} karyawan AI dengan prompt, skill, tools, dan memori masing-masing.`} />
    <div className="card overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-left text-xs text-slate-500"><tr>{['Karyawan', 'Departemen', 'Tools', 'Selesai', 'Token', 'Biaya', 'Status'].map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr></thead>
      <tbody className="divide-y divide-slate-100">{st.map(({ agent: a, status }) => <tr key={a.id} className="hover:bg-slate-50"><td className="px-4 py-3"><Link href={`/employees/${a.id}`} className="flex items-center gap-3"><span className="text-xl">{a.avatar}</span><span><span className="block font-medium">{a.name}</span><span className="text-xs text-slate-500">{a.job_title}</span></span></Link></td>
        <td className="px-4 py-3 text-slate-600">{a.department}</td><td className="px-4 py-3 text-xs text-slate-500">{a.tools.length}</td><td className="px-4 py-3">{a.metrics.tasks_completed}</td><td className="px-4 py-3">{a.metrics.tokens.toLocaleString()}</td><td className="px-4 py-3">{fmtUsd(a.metrics.cost_usd)}</td><td className="px-4 py-3"><Badge v={status} /></td></tr>)}</tbody></table></div></div>;
}
