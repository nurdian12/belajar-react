# belajar-react

Animasi "Tidak Semua Pelukan Itu Kasih Sayang" dengan [Remotion](https://www.remotion.dev).
Rencana lengkap: [docs/animation-blueprint.md](docs/animation-blueprint.md).

## Menjalankan

```bash
npm install
npm run dev        # Remotion Studio (preview + timeline)
npm run build      # render out/pelukan.mp4 (1080x1920, 30fps)
npm run typecheck
```

Jika Chrome tidak bisa diunduh (jaringan terbatas), pakai browser lokal:

```bash
npx remotion still src/index.ts PelukanVideo out/still.png --frame=30 \
  --browser-executable=/opt/pw-browsers/chromium --chrome-mode=chrome-for-testing --gl=swangle
```

## Status milestone

- [x] M0 Setup Remotion (komposisi 1080x1920@30fps, 18 shot placeholder)
- [~] M1–M3 Style guide (`src/theme.ts`), Ian, Snake (follow-the-leader), Heart, Camera, Particles, Subtitle karaoke
- [~] M4 Shot 01–02 (kasar); shot 03–18 masih placeholder
- [ ] M7 Audio (`public/audio/vo.mp3`) + timestamp kata di `src/data/script.ts`
