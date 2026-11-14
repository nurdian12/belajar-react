# AI Digital Marketing Agency (multi-agent)

CEO (manusia) → AI Manager (Maya) → 11 AI karyawan berprompt/tools berbeda. Next.js 15 App Router, TypeScript, Tailwind, Supabase, adapter Anthropic/OpenAI.

## Jalankan
```
cd agency && npm i && cp .env.example .env.local && npm run dev
```
- Tanpa env: **mode demo** (store JSON di `.data/`, tanpa login) + **Local Template Engine** (tanpa API key; template terstruktur terisi dari instruksi, bukan LLM).
- Isi `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` untuk AI nyata (server-side saja).
- Produksi: isi 3 env Supabase, jalankan `supabase/migrations/0001_schema.sql` (22+ tabel, FK, index, RLS per-org, bucket storage).
- Worker queue: in-process poller (server Node) atau panggil `GET /api/worker/tick` dengan `Authorization: Bearer $CRON_SECRET` dari cron.

## Arsitektur
- `lib/agents/roster.ts` – 12 agent, masing-masing system prompt, skill, tools.
- `lib/agents/manager.ts` – plan (structured output, validasi zod, deteksi siklus) → task dependency → review kualitas → laporan CEO → approval/revisi.
- `lib/agents/runner.ts` + `tools.ts` – loop tool-calling, delegasi antar-agent, memori, kalkulator ROI/KPI/budget, approval.
- `lib/queue.ts` – job queue DB (retry backoff, lock, concurrency). `lib/ai/*` – adapter, timeout, retry, fallback provider, rate limit, biaya/token, batas bulanan.
- `lib/memory.ts` – retrieval leksikal terfilter tenant & klien (siap diganti pgvector).
- Tes: `npm test` (orkestrasi, isolasi tenant/klien, approval).

## Batasan jujur
Belum ada konektor publish/iklan/email/video; AI tidak pernah mengklaim terkirim/terbit (cuma "tandai terbit manual"). Generate gambar butuh `OPENAI_API_KEY`. Metrik marketing real diinput manual; data simulasi berlabel. Rate limit & lock per-proyek bersifat in-process (gunakan Redis jika multi-instance). Auth Supabase belum diuji terhadap proyek Supabase sungguhan.
