# Blueprint Animasi: "Tidak Semua Pelukan Itu Kasih Sayang"

Referensi: video 720×1280 (9:16), 30 fps, ±88 detik, gaya *stick-figure cartoon storytelling* (watermark "milyty").
Format: narasi suara + subtitle kata-per-kata (highlight hijau) + ilustrasi flat 2D dengan outline tebal.

---

## 1. Ringkasan Gaya

| Aspek | Detail |
|---|---|
| Rasio / resolusi | 9:16, 720×1280 (disarankan produksi di 1080×1920) |
| Karakter | Badan tabung/kapsul, kepala bulat putih, tangan-kaki garis tipis, outline hitam tebal, tanpa shading kompleks |
| Palet | Kayu coklat hangat (rumah), hijau (kebun sawit), merah marun (baju Pak Ian), krem-emas (ular), biru gelap neon (adegan X-ray) |
| Latar | Flat vector + tekstur papan kayu, parallax ringan, partikel debu/bokeh kecil melayang |
| Kamera | Semua gerak kamera *digital*: zoom in/out, pan, shake, whip-blur transisi |
| Teks | Subtitle bawah, putih tebal, kata yang sedang diucapkan diberi kotak hijau (karaoke) |
| Pacing | Potong tiap 2–4 detik, hampir tiap frasa narasi = 1 shot baru |

## 2. Cast & Aset Karakter

| ID | Karakter | Ciri | Ekspresi yang dibutuhkan |
|---|---|---|---|
| `ian` | Pak Ian (petani sawit, Kalimantan) | Peci hitam, baju marun, kumis/bibir | senyum mata tertutup, netral, panik+keringat, bingung (tanda tanya), marah (alis turun), kaget |
| `snake` | Ular piton (peliharaan) | Pola sisik diamond krem-emas, kepala bisa muncul dari bawah frame | senyum, bulat-mata penasaran, "lapar/menatap" |
| `doctor` | Dokter | Kacamata, jas putih, dasi merah, stetoskop | netral, curiga, kaget, bingung |
| `couple` | 2 warga lewat | Cewek hijau rambut hitam, cowok oranye + topi biru | senyum, jalan |
| `shady` | Pria berjas abu (pembeli ular) | Dasi, senyum menyeringai | senyum licik, nyodorin uang |
| `kid` | Anak kecil di jalan (jauh) | siluet kecil | – |

**Rig minimal per karakter:** head, body, arm L/R, leg L/R, mouth (3–5 shape), eyes (open/closed/wide/angry), brow. Ular: rig *spline/path* dengan N segmen (lihat §6).

## 3. Properti & Background

- `bg_sawit` – hamparan sawit, langit gradasi hijau-kuning, papan "KEBUN SAWIT IAN"
- `bg_ruang_dalam` – dinding papan kayu, jendela hijau + pemandangan sawit (siang/malam), bingkai foto (ular+hati), jam dinding, lantai karpet kotak krem
- `bg_teras` – rumah panggung atap merah, pintu, lampu gantung, kursi, meja + kopi beruap, semak berbuah, tangga
- `bg_jalan_sore` – jalan tanah ke horizon, sawit siluet, matahari terbenam, rambu peringatan kuning (segitiga)
- `bg_teras_malam` – langit malam bintang, lampu menyala hangat
- `bg_xray` – grid biru tua, wireframe tubuh cyan, penggaris emas (172 cm), ukur lingkar (45 cm)
- Prop: kalender "HARI KE 3", ayam, mangkuk, ranjang pasien, tas dokter, ponsel, uang merah muda, hati merah, bubble dialog/pikiran, bubble foto bulat (dokter bergelar)

## 4. Storyboard (Shot List)

Timestamp kira-kira (dari sampling 1 frame / 4 detik; sesuaikan dengan voice-over final).

| # | Waktu | Visual | Narasi (inti) | Animasi / efek |
|---|---|---|---|---|
| 1 | 0–4s | Pak Ian berdiri di kebun sawit, tangan di pinggang, papan nama | "…sawit di Kalimantan," | Tubuh *squash & stretch* ringan, daun sawit goyang |
| 2 | 4–8s | Pak Ian duduk di kursi di dalam rumah | "Ular itu ia pelihara sendiri." | **Whip-pan blur** transisi, ular menjalar naik kursi |
| 3 | 8–12s | Ular melilit kursi, hati melayang, foto di dinding | – | Hati pop + float, kepala ular goyang |
| 4 | 12–22s | **Sore di teras**, ngopi, ular melilit kaki kursi. Sepasang warga lewat tersenyum, hati muncul | "Suatu sore… ngopi. Ularnya terlihat kirinya. …melihat persahabatan dan ular itu." | Zoom in bertahap (wide → medium → close) tiap frasa, uap kopi loop, pasangan jalan masuk dari kiri |
| 5 | 22–26s | Kepala ular muncul dari bawah frame, jendela malam→pagi | "Lalu esoknya," | Slide-up kepala ular, perpindahan malam→siang |
| 6 | 26–30s | Ular di karpet, kalender **HARI KE 3**, mangkuk makanan kosong | "…tiga hari." | Kalender flip/pop-in, zoom in |
| 7 | 30–34s | Pak Ian panik (keringat) pegang ayam, ular menatap, tanda tanya | "…sekali." | Shake kecil, tanda tanya bouncing |
| 8 | 34–38s | Pak Ian pegang ponsel, bubble bulat dokter bersertifikat + piala | "…kabupaten itu." | Bubble scale-in + sparkle |
| 9 | 38–46s | Dokter datang; ular melingkar di ranjang; dokter bertanya | "lalu bertanya satu hal. 'Pak, belakangan ini ularnya sering melilit badan Bapak, ya?'" | Bubble dialog typewriter/pop, kamera diam (2-shot) |
| 10 | 46–52s | Pak Ian menjawab | "memang tidak seperti biasanya, langsung berubah." | Dokter close-up, ekspresi berubah; ular menggeser |
| 11 | 52–58s | Debat: Pak Ian marah | "Loh, dia ini sahabat saya! Kenapa harus dilepas?" | Bubble "Loh…" lalu "Kenapa…", alis turun, shake marah |
| 12 | 58–64s | Ular close-up di ranjang | "…dengan sengaja." | Slow zoom ke kepala ular |
| 13 | 64–70s | **Adegan X-ray** biru: tubuh wireframe dililit, penggaris 172 cm, lingkar 45 cm | "…badan bapak." | Scanline, garis tubuh *draw-on*, penggaris tumbuh, angka *count-up* |
| 14 | 70–74s | Kembali ke ruang; Pak Ian terdiam | "Pak Ian pun terdiam," | Ekspresi berubah ke ragu, hening 0.5 s |
| 15 | 74–78s | Thought bubble: ular peluk Pak Ian + hati; Dokter cemas, Pak Ian berkeringat | "…ia kira kasih…" | Bubble besar pop, hati naik-turun |
| 16 | 78–82s | Jalan sore, anak kecil jauh, rambu peringatan, Pak Ian bayangan di depan | "…terbesar bukan…" | Dolly-in lambat, rambu berkedip |
| 17 | 82–85s | Teras malam, Pak Ian & pembeli berjas senyum lebar | "…tiba-tiba penuh…" | Cahaya lampu hangat, zoom in pembeli |
| 18 | 85–88s | Pembeli menyodorkan uang | "…hati tanpa alasan." | Uang slide-in, hold + fade out |

> Catatan: shot 16–18 mengubah arah cerita (penjualan ular / peringatan). Sesuaikan ending dengan pesan yang lo mau.

## 5. Teknik Animasi yang Dipakai

1. **Cut-out / rigged 2D** untuk karakter (bukan frame-by-frame).
2. **Squash & stretch + overshoot** pada pop-in elemen (hati, bubble, kalender).
3. **Camera moves digital**: scale + translate pada container scene, ease-in-out; shake = noise 6–10 px, 8–12 frame.
4. **Whip-pan transition**: translate cepat + motion-blur horizontal (blur 0→40→0) dalam 6–8 frame.
5. **Parallax**: 3 layer (BG jauh, BG tengah, foreground semak) bergerak 0.2× / 0.6× / 1×.
6. **Partikel ambient**: titik debu emas lambat melayang, loop.
7. **Loop micro-animation**: kedip mata, uap kopi, goyang daun sawit, kepala ular bobbing.
8. **Subtitle karaoke**: kata aktif dibungkus kotak hijau (`#3FD33A`-ish), sinkron per kata dari timestamp transkripsi.
9. **Adegan X-ray**: grid + glow cyan, stroke-dashoffset untuk *draw-on*, count-up angka.

## 6. Animasi Ular (bagian tersulit)

- Bangun sebagai **path SVG/spline** dengan ketebalan tetap + pola sisik (pattern fill atau tekstur yang di-*clip* ke path).
- Gerak: *follow-the-leader* — kepala bergerak, tiap titik kontrol mengikuti titik sebelumnya dengan delay (sine offset).
- Lilitan: path melingkar di sekitar objek (kursi/tubuh); animasikan `stroke-dashoffset` / progress sepanjang path supaya terlihat melilit bertahap.
- Fallback sederhana: ular = rangkaian N lingkaran/kapsul bertumpuk dengan pola, urut dari ekor ke kepala.

## 7. Audio

| Layer | Detail |
|---|---|
| Voice-over | Narator pria santai, bahasa Indonesia, jeda dramatis sebelum plot twist (shot 14) |
| BGM | Ambient lo-fi/misteri lembut, naik tipis saat X-ray, turun saat dialog |
| SFX | pop (hati/bubble), whoosh (transisi), *swish* ular, kalender flip, "ting" sparkle, beep scan (X-ray), cash sound (uang) |

Alur sinkron: **Script → VO → transkripsi per kata (timestamp) → subtitle karaoke → timing shot → animasi.**

## 8. Rekomendasi Tech Stack (repo ini: React)

| Opsi | Cocok untuk | Catatan |
|---|---|---|
| **Remotion** (React → video) ⭐ rekomendasi | Hasil akhir MP4 9:16 deterministik, subtitle & timeline berbasis frame | Tiap shot = komponen `<Sequence>`; karakter = SVG React |
| **React + SVG + GSAP** | Preview interaktif di browser | Perlu screen-record / ffmpeg untuk jadi video |
| Lottie / After Effects | Kalau lo sudah nyaman AE | Bisa dikombinasi, tapi kurang "React-native" |

### Struktur proyek yang diusulkan (Remotion)

```
src/
  Root.tsx                 // register composition 1080x1920 @30fps
  Video.tsx                // urutan <Sequence> semua shot
  data/
    script.ts              // narasi + timestamp per kata
    timeline.ts            // durasi & shot list
  components/
    characters/ Ian.tsx Snake.tsx Doctor.tsx Couple.tsx Shady.tsx
    props/      Heart.tsx Bubble.tsx Calendar.tsx Steam.tsx
    backgrounds/ Sawit.tsx Interior.tsx Porch.tsx XRay.tsx
    fx/         Camera.tsx Parallax.tsx WhipPan.tsx Particles.tsx
    Subtitle.tsx           // karaoke highlight
  shots/ Shot01.tsx … Shot18.tsx
public/audio/ vo.mp3 bgm.mp3 sfx/*.wav
```

## 9. Rencana Kerja (Milestone)

1. **M0 – Setup**: Init Remotion/React, komposisi 1080×1920@30fps, preview jalan.
2. **M1 – Design system**: palet, ketebalan outline, proporsi karakter, style guide 1 halaman.
3. **M2 – Aset statis**: semua karakter (pose dasar), background, prop dalam SVG.
4. **M3 – Rig & loop**: kedip, mulut, goyang, ular path-follow, partikel.
5. **M4 – Shot 1–6** (intro + establishing) lengkap dengan kamera.
6. **M5 – Shot 7–15** (konflik + dokter + X-ray).
7. **M6 – Shot 16–18** + transisi.
8. **M7 – Audio & subtitle**: VO, BGM, SFX, karaoke subtitle.
9. **M8 – Polish & render**: koreksi timing, color, export MP4 (H.264, 1080×1920, 30fps).

Estimasi kasar solo: 3–5 hari kerja kalau aset di-vektor sendiri; ular + X-ray paling makan waktu.

## 10. Checklist Kualitas

- [ ] Setiap shot ≤ 4 detik, tidak ada frame diam > 1.5 detik tanpa micro-motion
- [ ] Subtitle tidak keluar safe area (margin bawah ±15% untuk UI platform)
- [ ] Highlight kata sinkron dengan VO (toleransi ±2 frame)
- [ ] Konsisten outline & palet antar shot
- [ ] Ekspresi karakter berubah tepat saat plot-point (shot 9, 11, 14)
- [ ] Audio -14 LUFS, VO jelas di atas BGM
- [ ] Hindari watermark/aset pihak lain; semua aset original

## 11. Pertanyaan Terbuka

1. Cerita mau sama persis atau diganti (karakter, setting, pesan)?
2. Output: video MP4 (Remotion) atau animasi interaktif di web?
3. Voice-over: rekam sendiri, TTS, atau pakai audio referensi?
4. Aset: gambar sendiri (Figma/Illustrator) atau dibuat langsung sebagai SVG di kode?
