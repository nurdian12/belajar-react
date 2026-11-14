'use client';
import { useRef, useState } from 'react';
export function AgentChat({ agentId, name, initial, conversationId }: { agentId: string; name: string; initial: { role: string; content: string }[]; conversationId: string | null }) {
  const [msgs, setMsgs] = useState(initial); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [cid, setCid] = useState(conversationId); const box = useRef<HTMLDivElement>(null);
  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = e.currentTarget; const text = String(new FormData(f).get('m') ?? '').trim(); if (!text || busy) return;
    f.reset(); setErr(''); setBusy(true); setMsgs((m) => [...m, { role: 'user', content: text }]);
    try {
      const r = await fetch(`/api/agents/${agentId}/chat`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: text, conversationId: cid }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error ?? 'Gagal'); setCid(j.conversationId); setMsgs((m) => [...m, { role: 'assistant', content: j.reply }]);
    } catch (x) { setErr((x as Error).message); } finally { setBusy(false); setTimeout(() => box.current?.scrollTo({ top: 1e6, behavior: 'smooth' }), 50); }
  }
  return <div className="flex h-[420px] flex-col"><div ref={box} className="flex-1 space-y-3 overflow-y-auto rounded-lg bg-slate-50 p-3">
    {msgs.length === 0 && <p className="text-center text-sm text-slate-400">Mulai percakapan dengan {name}.</p>}
    {msgs.map((m, i) => <div key={i} className={m.role === 'user' ? 'text-right' : ''}><div className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-left text-sm ${m.role === 'user' ? 'bg-brand text-white' : 'bg-white shadow-card'}`}>{m.content}</div></div>)}
    {busy && <div className="text-sm text-slate-400">{name} sedang mengetik…</div>}</div>
    {err && <p className="mt-1 text-xs text-rose-600">{err}</p>}
    <form onSubmit={send} className="mt-2 flex gap-2"><input name="m" className="input" placeholder={`Pesan untuk ${name}…`} autoComplete="off" /><button className="btn" disabled={busy}>Kirim</button></form></div>;
}
