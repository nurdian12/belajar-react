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

## Struktur

- `agents/<id>/AGENT.md` peran & aturan · `skills/*.md` skill · `config.json` nama, model, tools
- `core/runner.ts` jalankan agent · `core/pipeline.ts` alur naskah → persetujuan · `core/server.ts` API + dashboard
- `dashboard/index.html` UI persetujuan · `data/` SQLite (tidak di-commit)
- `info-bisnis.md` bahan agent CS (tahap 5)

Edit `agents/penulis/skills/gaya-channel.md` dulu supaya naskah sesuai niche kamu.

## Roadmap

- [x] 1. Penulis → naskah → Setujui / Revisi / Tolak
- [ ] 2. Periset + scheduler (cron, "setelah agent X selesai")
- [ ] 3. Video: template Remotion (`../src`) + ElevenLabs
- [ ] 4. Posting terjadwal lewat Repliz
- [ ] 5. CS WhatsApp
