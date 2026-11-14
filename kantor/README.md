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

## Pandu (asisten kantor)

Tombol **Tanya Pandu** di kanan bawah semua tab. Ketik apa yang kamu mau ("aku mulai dari mana?", "ganti niche jadi kuliner", "kenapa videoku senyap?"), Pandu menjawab singkat dan menawarkan tombol aksi:
buka tab, minta Rina riset, minta Maya menulis naskah, atau mengusulkan isi baru untuk `gaya-channel.md` / `info-bisnis.md`. Pandu **tidak menjalankan apa pun sendiri**: tiap aksi harus kamu klik, dan perubahan berkas
tampil sebagai pratinjau dengan tombol **Terapkan** (file lama dicadangkan di `kantor/data/cadangan/`). Pandu hanya mendapat ringkasan angka dan status kunci (bukan isi kunci, naskah, atau chat pelanggan), dan aksinya divalidasi di server dengan daftar putih.
Dengan `KANTOR_OTAK=manual`, permintaan disalin otomatis untuk ditempel di Claude, lalu balasannya ditempel kembali.

## Tanpa AI di komputer ini (mode manual)

Kalau Claude Code tidak bisa jalan dan kamu belum punya kunci API: isi `kantor\.env` dengan `KANTOR_OTAK=manual`. Naskah ditulis lewat Claude biasa (claude.ai, langganan kamu)
lalu ditempel di tab **Konten**: isi topik, **Salin permintaan untuk Claude**, tempel di Claude, salin balasannya, **Simpan sebagai naskah**. Setelah itu setujui dan buat video seperti biasa.
Tanpa `ELEVENLABS_API_KEY` video dibuat senyap (hanya teks bergerak).

## Dashboard

Lima tab seperti di video contoh: **Beranda** (kantor 3D + panel "Perlu keputusan kamu"), **Agent** (tim, status, job desk), **Channel** (pengaturan, hanya baca), **Konten** (topik, naskah, video, jadwal posting), **Jadwal**.
Di Beranda ada kantor 3D: kantor isometrik (Three.js, low-poly) dengan lima ruangan. Karakter bergerak sesuai status asli
(`/api/status`): Rina riset, Maya menulis, Dewi merender, dan meja Kamu menyala amber saat ada naskah menunggu persetujuan.
Putri tembus pandang karena belum dibangun. Tombol **Demo animasi** memutar siklus contoh. Bila WebGL tidak ada, dashboard tetap jalan tanpa adegan.

## Video tur

Video tur gaya Kantorin (jendela dashboard, zoom, lencana langkah, subtitle kata menyala, narasi) dibuat dari papan cerita `tur/skrip.ts`:

```bash
# 1. (opsional) rekam ulang tangkapan layar: isi data contoh, jalankan dashboard, lalu rekam
KANTOR_MOCK=1 KANTOR_DATA=/folder/kosong node kantor/tur/seed.ts
KANTOR_MOCK=1 KANTOR_DATA=/folder/kosong npm run kantor     # terminal lain
KANTOR_URL=http://127.0.0.1:4321/ node kantor/tur/rekam.cjs  # butuh: npm i -D playwright
# 2. render (suara ElevenLabs bila ada kunci, kalau tidak senyap)  ->  kantor/data/tur.mp4
npm run kantor:tur
```
Gambar hasil rekam sudah ada di `public/tur/`, jadi langkah 2 bisa langsung dijalankan. Satu kalimat narasi = satu adegan; ubah teks dan fokus zoom di `skrip.ts`.
Preview/edit visual: `npm run dev`, komposisi `TurKantor`.

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
- [x] 5. CS (Putri): inbox di tab **CS**, balasan dari `info-bisnis.md`, eskalasi ke kamu bila di luar info/komplain/diskon.
  - Mode `cs.mode` di `pengaturan.json`: `draf` (default, Putri membuat draf, kamu yang menekan Kirim) atau `otomatis` (kecuali yang butuh kamu).
  - Saluran **simulasi** langsung bisa dicoba di dashboard. Saluran **WhatsApp Cloud API** (resmi) sudah ada kodenya tapi **belum dites dengan akun Meta asli** dan mati (dry-run) sampai `cs.kirimNyata: true`.
  - Isi `kantor/.env` untuk WhatsApp: `WA_TOKEN`, `WA_PHONE_NUMBER_ID`, `WA_VERIFY_TOKEN`, `WA_APP_SECRET`. Webhook jalan di port terpisah `4322` (`/webhook/whatsapp`, tanda tangan HMAC wajib); arahkan tunnel publik ke port itu saja, jangan ke dashboard (dashboard tidak punya login).
  - Pesan pelanggan diperlakukan sebagai data, bukan perintah. Tanpa AI di komputer ini (`KANTOR_OTAK=manual`), pakai tombol "Salin permintaan untuk Claude" di tiap percakapan.
