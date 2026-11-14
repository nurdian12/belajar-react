'use client';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
export function TrendChart({ data, keys }: { data: Record<string, number | string>[]; keys: string[] }) {
  const colors = ['#5b5bf0', '#0ea5e9', '#10b981'];
  return <div className="h-64"><ResponsiveContainer><AreaChart data={data} margin={{ left: -10, right: 8, top: 8 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} /><XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#94a3b8" /><YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" /><Tooltip />
    {keys.map((k, i) => <Area key={k} type="monotone" dataKey={k} stroke={colors[i]} fill={colors[i]} fillOpacity={0.12} strokeWidth={2} />)}</AreaChart></ResponsiveContainer></div>;
}
export function BarsChart({ data, dataKey }: { data: Record<string, number | string>[]; dataKey: string }) {
  return <div className="h-64"><ResponsiveContainer><BarChart data={data} margin={{ left: -10, right: 8, top: 8 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" interval={0} angle={-25} textAnchor="end" height={60} /><YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" /><Tooltip /><Bar dataKey={dataKey} fill="#5b5bf0" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>;
}
