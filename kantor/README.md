# Kantor (tahap 1)

Kantor AI pribadi: agent = folder berisi `AGENT.md` + `skills/*.md`, dijalankan lewat
Claude Code headless (`claude -p`) memakai langganan Claude kamu.

## Menjalankan

```bash
npm run kantor                          # dashboard di http://127.0.0.1:4321
npm run kantor:mock                     # sama, tapi tanpa memanggil Claude (tes UI)
npm run kantor:tulis -- "topik video"   # buat naskah dari terminal
```

Butuh Node 22.18+ (memakai `node:sqlite` dan TypeScript langsung tanpa build) dan `claude` terpasang & sudah login.

## Di laptop yang tidak bisa menjalankan Claude Code (Windows)

Claude Code butuh CPU dengan SSE4.2. Di mesin lama, pakai mode API (biaya per pemakaian, terpisah dari langganan Claude):

```cmd
git clone https://github.com/nurdian12/belajar-react.git
cd belajar-react
git checkout claude/animation-blueprint-9req4g
npm install
copy kantor\.env.example kantor\.env
```

Edit `kantor\.env` (Notepad): `KANTOR_OTAK=api`, `ANTHROPIC_API_KEY=...`, lalu `ELEVENLABS_API_KEY=...`. Jalankan `npm run kantor`, buka http://127.0.0.1:4321.
Render video memakai Chromium (diunduh Remotion saat pertama) dan bisa lambat di mesin lama.

## Struktur

- `agents/<id>/AGENT.md` peran & aturan · `skills/*.md` skill · `config.json` nama, model, tools
- `core/runner.ts` jalankan agent · `core/pipeline.ts` alur naskah → persetujuan · `core/server.ts` API + dashboard
- `dashboard/index.html` UI persetujuan · `data/` SQLite (tidak di-commit)
- `info-bisnis.md` bahan agent CS (tahap 5)

Edit `agents/penulis/skills/gaya-channel.md` dulu supaya naskah sesuai niche kamu.

## Roadmap

- [x] 1. Penulis → naskah → Setujui / Revisi / Tolak
- [x] 2. Periset (Rina) + scheduler harian. Jadwal & mode di `pengaturan.json`:
  `jadwal` (agent + jam lokal), `naskahOtomatis` (true = topik hasil riset langsung ditulis Maya).
  Topik muncul di dashboard: **Tulis naskah** atau **Buang**. Niche saat ini: keseharian (`agents/penulis/skills/gaya-channel.md`).
- [x] 3. Video: template **Teks Kinetik** (`../src/kantor/KantorVideo.tsx`, 1080x1920@30) + ElevenLabs.
  Naskah disetujui → **Buat video** → suara (kata-per-kata dari alignment ElevenLabs) → render Remotion → `data/video/<id>.mp4`, bisa diputar di dashboard.
  - Isi `kantor/.env`: `ELEVENLABS_API_KEY` (wajib untuk suara), `ELEVENLABS_VOICE_ID` (opsional; pilih suara yang fasih bahasa Indonesia).
  - **Tanpa API key** video tetap dibuat tapi senyap, dengan waktu kata diperkirakan (berguna untuk uji tampilan).
  - Batas video per hari: `KANTOR_MAKS_VIDEO_PER_HARI` (default 5). Render pertama mengunduh Chrome (agak lama).
  - Preview/edit template: `npm run dev` lalu pilih komposisi `KantorVideo`.
- [~] 4. Posting terjadwal lewat Repliz. Alur & UI selesai; **kirim nyata belum aktif** (cara unggah video ke Repliz belum diketahui).
  - Isi `kantor/.env`: `REPLIZ_ACCESS_KEY`, `REPLIZ_SECRET_KEY`. Tes baca akun (aman, tidak membuat posting): `npm run kantor:tes-repliz`.
  - Di dashboard tiap video selesai punya form: akun, waktu, caption, **Jadwalkan** (= persetujuan kamu).
  - Default **dry-run**: hanya mencatat body yang akan dikirim. Kirim nyata aktif bila `repliz.kirimNyata: true` di `pengaturan.json`.
  - Semua kode spesifik Repliz ada di `core/repliz.ts`; bentuk request berasal dari rujukan pihak ketiga dan belum diverifikasi.
- [ ] 5. CS WhatsApp
