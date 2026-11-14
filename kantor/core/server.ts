import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { db, ROOT } from "./db.ts";
import { listAgents, detailAgent, loadAgent } from "./agents.ts";
import { buatNaskah, revisiNaskah, setStatus, simpanManual, riset, sedangRiset, tulisDariTopik, buangTopik } from "./pipeline.ts";
import { mulaiScheduler } from "./scheduler.ts";
import { pesanMasuk, buatDraf, kirimBalasan, selesaikan, simpanHasil, promptManual, sedangMembalas } from "./cs.ts";
import { mulaiWebhook } from "./webhook.ts";
import { tugasAktif, langgan, riwayat } from "./aktivitas.ts";
import { susunRencana, simpanRencana, sedangMenyusun, promptRencanaManual, promptCaptionManual, buatCaption, PLATFORM } from "./marketing.ts";
import { tanya, urai, promptManual as promptPandu, ubahBerkas } from "./pandu.ts";
import { buatVideo, VIDEO_DIR } from "./video.ts";
import { buatPosting } from "./posting.ts";
import { adaKunciRepliz, daftarAkun } from "./repliz.ts";
import { bacaPengaturan } from "./pipeline.ts";
import { createReadStream, existsSync, statSync } from "node:fs";

function kirimBerkas(res: any, file: string, tipe: string) {
  if (!existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": tipe, "cache-control": "no-cache" });
  createReadStream(file).pipe(res);
}

/** Kirim mp4 dengan dukungan Range supaya bisa di-seek di browser. */
function kirimVideo(req: any, res: any, file: string) {
  if (!existsSync(file)) { res.writeHead(404); return res.end(); }
  const size = statSync(file).size;
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range ?? "");
  if (!m) {
    res.writeHead(200, { "content-type": "video/mp4", "content-length": size, "accept-ranges": "bytes" });
    return createReadStream(file).pipe(res);
  }
  const start = m[1] ? Number(m[1]) : 0, end = m[2] ? Number(m[2]) : size - 1;
  res.writeHead(206, { "content-type": "video/mp4", "content-range": `bytes ${start}-${end}/${size}`, "content-length": end - start + 1, "accept-ranges": "bytes" });
  createReadStream(file, { start, end }).pipe(res);
}

const PORT = Number(process.env.PORT ?? 4321);

/** Status tiap karyawan, dihitung dari tugas yang BENAR-BENAR sedang berjalan di server ini. */
function statusKantor() {
  const t = tugasAktif();
  const n = (sql: string) => (db.prepare(sql).get() as { n: number }).n;
  const naskahTunggu = n("SELECT COUNT(*) n FROM naskah WHERE status='menunggu'"), chatTunggu = n("SELECT COUNT(*) n FROM percakapan WHERE status='butuh-kamu'");
  const st = (k: string, tunggu = false) => (t[k] ? "kerja" : tunggu ? "tunggu" : "siap");
  const tugas: Record<string, { teks: string; detik: number }> = {};
  for (const [k, v] of Object.entries(t)) tugas[k] = { teks: v.teks, detik: Math.round((Date.now() - v.sejak) / 1000) };
  if (naskahTunggu || chatTunggu) tugas.kamu = { teks: [naskahTunggu && `${naskahTunggu} naskah menunggu persetujuan`, chatTunggu && `${chatTunggu} chat butuh kamu`].filter(Boolean).join(", "), detik: 0 };
  return {
    rina: st("rina"), maya: st("maya"), dewi: st("dewi"), laras: st("laras"), pandu: st("pandu"),
    putri: st("putri", chatTunggu > 0), kamu: naskahTunggu || chatTunggu ? "tunggu" : "siap", _tugas: tugas,
  };
}

/** Pekerjaan yang terputus saat server mati tidak boleh terlihat "sedang berjalan" selamanya. */
function bersihkanYatim() {
  db.prepare("UPDATE jobs SET status='gagal', error='terputus: server dimulai ulang', selesai=datetime('now') WHERE status='berjalan'").run();
  db.prepare("UPDATE naskah SET status='gagal' WHERE status='menyusun'").run();
  db.prepare("UPDATE video SET status='gagal', error='terputus: server dimulai ulang', selesai=datetime('now') WHERE status IN ('menyiapkan','suara','render')").run();
}
bersihkanYatim();

const json = (res: any, data: unknown, code = 200) => {
  res.writeHead(code, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
};
const body = (req: any) =>
  new Promise<any>((ok) => {
    let s = "";
    req.on("data", (d: Buffer) => (s += d));
    req.on("end", () => { try { ok(JSON.parse(s || "{}")); } catch { ok({}); } });
  });

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://x");
  const p = url.pathname;
  try {
    if (req.method === "GET" && p === "/") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      return res.end(readFileSync(join(ROOT, "dashboard", "index.html")));
    }
    if (req.method === "GET" && p === "/vendor/three.module.js")
      return kirimBerkas(res, join(ROOT, "..", "node_modules", "three", "build", "three.module.js"), "text/javascript; charset=utf-8");
    if (req.method === "GET" && p === "/kantor3d.js")
      return kirimBerkas(res, join(ROOT, "dashboard", "kantor3d.js"), "text/javascript; charset=utf-8");
    if (req.method === "GET" && p === "/api/status") return json(res, statusKantor());
    if (req.method === "GET" && p === "/api/aktivitas") return json(res, riwayat(Math.min(100, Number(url.searchParams.get("n")) || 30)));
    if (req.method === "GET" && p === "/api/aliran") {   // Server-Sent Events: status dan aktivitas langsung ke dashboard
      res.writeHead(200, { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache", connection: "keep-alive", "x-accel-buffering": "no" });
      const kirim = (ev: string, d: unknown) => { if (!res.writableEnded) res.write(`event: ${ev}\ndata: ${JSON.stringify(d)}\n\n`); };
      kirim("riwayat", riwayat(20)); kirim("status", statusKantor());
      const lepas = langgan((ev, d) => { if (ev === "aktivitas") kirim("aktivitas", d); kirim("status", statusKantor()); });
      const detak = setInterval(() => kirim("status", statusKantor()), 3000);   // menjaga koneksi hidup dan memperbarui lama tugas
      req.on("close", () => { clearInterval(detak); lepas(); });
      return;
    }
    // ---- Laras, marketing ----
    if (req.method === "GET" && p === "/api/rencana")
      return json(res, { sedang: sedangMenyusun(), ide: db.prepare("SELECT * FROM rencana ORDER BY id DESC LIMIT 40").all() });
    if (req.method === "POST" && p === "/api/rencana/susun") {
      const { tempel } = await body(req);
      try {
        if (typeof tempel === "string" && tempel.trim()) return json(res, { n: simpanRencana(tempel) });   // balasan Claude yang ditempel (mode manual)
        if (sedangMenyusun()) return json(res, { error: "Laras sedang menyusun rencana" }, 409);
        susunRencana().catch((e) => console.error("[marketing] gagal:", e instanceof Error ? e.message : e));
        return json(res, { ok: true }, 202);
      } catch (e) { return json(res, { error: e instanceof Error ? e.message : String(e) }, 400); }
    }
    if (req.method === "POST" && p === "/api/rencana/prompt") return json(res, { teks: promptRencanaManual() });
    const rn = p.match(/^\/api\/rencana\/(\d+)\/(tulis|buang)$/);
    if (req.method === "POST" && rn) {
      const r = db.prepare("SELECT * FROM rencana WHERE id=?").get(Number(rn[1])) as any;
      if (!r) return json(res, { error: "tidak ditemukan" }, 404);
      if (rn[2] === "buang") { db.prepare("UPDATE rencana SET status='dibuang' WHERE id=? AND status='baru'").run(r.id); return json(res, { ok: true }); }
      db.prepare("UPDATE rencana SET status='dipakai' WHERE id=?").run(r.id);
      return json(res, { naskahId: buatNaskah(`${r.judul}. ${r.sudut ?? ""}`.trim()) }, 202);
    }
    const vc = p.match(/^\/api\/video\/(\d+)\/caption(\/prompt)?$/);
    if (req.method === "POST" && vc) {
      const { platform, tempel } = await body(req);
      const plat = (PLATFORM as readonly string[]).includes(platform) ? platform : "umum";
      try {
        if (vc[2]) return json(res, { teks: promptCaptionManual(Number(vc[1]), plat) });
        return json(res, { caption: await buatCaption(Number(vc[1]), plat, tempel) });
      } catch (e) { return json(res, { error: e instanceof Error ? e.message : String(e) }, 400); }
    }
    // ---- Pandu, asisten kantor ----
    if (req.method === "POST" && p === "/api/pandu") {
      const { pesan, riwayat, tempel } = await body(req);
      try {
        if (typeof tempel === "string" && tempel.trim()) return json(res, urai(tempel));   // balasan Claude yang ditempel (mode manual)
        return json(res, await tanya(String(pesan ?? ""), riwayat));
      } catch (e) { return json(res, { error: e instanceof Error ? e.message : String(e) }, 400); }
    }
    if (req.method === "POST" && p === "/api/pandu/prompt") {
      const { pesan, riwayat } = await body(req);
      return json(res, { teks: promptPandu(String(pesan ?? ""), riwayat) });
    }
    if (req.method === "POST" && p === "/api/pandu/ubah") {
      const { berkas, teks } = await body(req);
      try { ubahBerkas(String(berkas ?? ""), String(teks ?? "")); return json(res, { ok: true }); }
      catch (e) { return json(res, { error: e instanceof Error ? e.message : String(e) }, 400); }
    }
    // ---- customer service ----
    if (req.method === "GET" && p === "/api/cs")
      return json(res, db.prepare(`SELECT c.*, (SELECT teks FROM pesan WHERE percakapan_id=c.id AND arah!='draf' ORDER BY id DESC LIMIT 1) AS terakhir
        FROM percakapan c ORDER BY CASE c.status WHEN 'butuh-kamu' THEN 0 WHEN 'draf' THEN 1 WHEN 'baru' THEN 2 ELSE 3 END, c.diperbarui DESC LIMIT 60`).all()
        .map((c: any) => ({ ...c, membalas: sedangMembalas(c.id) })));
    if (req.method === "POST" && p === "/api/cs/masuk") {
      const { kontak, teks } = await body(req);
      try { return json(res, { id: pesanMasuk("simulasi", String(kontak ?? ""), String(teks ?? "")) }, 202); }
      catch (e) { return json(res, { error: e instanceof Error ? e.message : String(e) }, 400); }
    }
    const cs = p.match(/^\/api\/cs\/(\d+)(?:\/(draf|kirim|selesai|prompt|balasan-manual))?$/);
    if (cs) {
      const id = Number(cs[1]), aksi = cs[2];
      try {
        if (req.method === "GET" && !aksi) {
          const c = db.prepare("SELECT * FROM percakapan WHERE id=?").get(id);
          if (!c) return json(res, { error: "tidak ditemukan" }, 404);
          return json(res, { percakapan: { ...c, membalas: sedangMembalas(id) }, pesan: db.prepare("SELECT * FROM pesan WHERE percakapan_id=? ORDER BY id").all(id) });
        }
        if (req.method === "GET" && aksi === "prompt") return json(res, { teks: promptManual(id) });
        if (req.method === "POST" && aksi === "draf") { void buatDraf(id); return json(res, { ok: true }, 202); }
        if (req.method === "POST" && aksi === "kirim") { await kirimBalasan(id, String((await body(req)).teks ?? "")); return json(res, { ok: true }); }
        if (req.method === "POST" && aksi === "selesai") { selesaikan(id); return json(res, { ok: true }); }
        if (req.method === "POST" && aksi === "balasan-manual") { await simpanHasil(id, String((await body(req)).teks ?? "")); return json(res, { ok: true }); }
      } catch (e) { return json(res, { error: e instanceof Error ? e.message : String(e) }, 400); }
    }
    if (req.method === "GET" && p === "/api/prompt") {
      const topik = (url.searchParams.get("topik") ?? "").trim();
      if (!topik) return json(res, { error: "topik wajib diisi" }, 400);
      return json(res, { teks: `${loadAgent("penulis").systemPrompt}\n\n---\n\nTulis naskah video pendek tentang topik: ${topik}` });
    }
    if (req.method === "POST" && p === "/api/naskah/manual") {
      const { topik, teks } = await body(req);
      try { return json(res, { id: simpanManual(String(topik ?? "").trim(), String(teks ?? "")) }, 201); }
      catch (e) { return json(res, { error: e instanceof Error ? e.message : String(e) }, 400); }
    }
    if (req.method === "GET" && p === "/api/agents") return json(res, listAgents());
    const da = p.match(/^\/api\/agents\/([a-z-]+)$/);
    if (req.method === "GET" && da) return json(res, detailAgent(da[1]));
    if (req.method === "GET" && p === "/api/pengaturan") {
      const e = process.env;   // hanya status ada/tidaknya kunci, tidak pernah nilainya
      return json(res, {
        ...bacaPengaturan(),
        otak: e.KANTOR_MOCK === "1" ? "mock" : e.KANTOR_OTAK === "api" ? "api" : e.KANTOR_OTAK === "manual" ? "manual" : "claude",
        model: e.KANTOR_MODEL || null,
        suara: { voice: e.ELEVENLABS_VOICE_ID || null, model: e.ELEVENLABS_MODEL || "eleven_v3" },
        kunci: { elevenlabs: Boolean(e.ELEVENLABS_API_KEY), repliz: adaKunciRepliz(), anthropic: Boolean(e.ANTHROPIC_API_KEY), whatsapp: Boolean(e.WA_TOKEN && e.WA_PHONE_NUMBER_ID), webhook: Boolean(e.WA_VERIFY_TOKEN && e.WA_APP_SECRET) },
        maksVideoPerHari: Number(e.KANTOR_MAKS_VIDEO_PER_HARI ?? 5),
      });
    }
    if (req.method === "GET" && p === "/api/jobs")
      return json(res, db.prepare("SELECT id,agent,status,error,biaya_usd,dibuat,selesai FROM jobs ORDER BY id DESC LIMIT 50").all());
    if (req.method === "GET" && p === "/api/naskah")
      return json(res, db.prepare("SELECT * FROM naskah ORDER BY id DESC LIMIT 50").all());
    if (req.method === "GET" && p === "/api/video")
      return json(res, db.prepare("SELECT * FROM video ORDER BY id DESC LIMIT 30").all());
    if (req.method === "GET" && p === "/api/repliz/akun") {
      try { return json(res, { adaKunci: adaKunciRepliz(), ...(await daftarAkun()) }); }
      catch (e) { return json(res, { adaKunci: adaKunciRepliz(), akun: [], error: e instanceof Error ? e.message : String(e) }); }
    }
    if (req.method === "GET" && p === "/api/posting")
      return json(res, { jamPosting: bacaPengaturan().repliz?.jamPosting ?? [], kirimNyata: Boolean(bacaPengaturan().repliz?.kirimNyata),
        posting: db.prepare("SELECT * FROM posting ORDER BY id DESC LIMIT 30").all() });
    const vp = p.match(/^\/api\/video\/(\d+)\/posting$/);
    if (req.method === "POST" && vp) {
      const { akunId, caption, jadwal } = await body(req);
      try { return json(res, { id: await buatPosting(Number(vp[1]), String(akunId ?? ""), String(caption ?? ""), String(jadwal ?? "")) }, 202); }
      catch (e) { return json(res, { error: e instanceof Error ? e.message : String(e) }, 400); }
    }
    const vn = p.match(/^\/api\/naskah\/(\d+)\/video$/);
    if (req.method === "POST" && vn) {
      try { return json(res, { id: buatVideo(Number(vn[1])) }, 202); }
      catch (e) { return json(res, { error: e instanceof Error ? e.message : String(e) }, 400); }
    }
    const vf = p.match(/^\/video\/(\d+\.mp4)$/);
    if (req.method === "GET" && vf) return kirimVideo(req, res, join(VIDEO_DIR, vf[1]));
    if (req.method === "GET" && p === "/api/topik")
      return json(res, { sedangRiset: sedangRiset(), topik: db.prepare("SELECT * FROM topik ORDER BY id DESC LIMIT 60").all() });
    if (req.method === "POST" && p === "/api/riset") {
      if (sedangRiset()) return json(res, { error: "Riset sedang berjalan" }, 409);
      riset().catch((e) => console.error("[periset] gagal:", e instanceof Error ? e.message : e));
      return json(res, { ok: true }, 202);
    }
    const t = p.match(/^\/api\/topik\/(\d+)\/(tulis|buang)$/);
    if (req.method === "POST" && t) {
      if (t[2] === "tulis") return json(res, { naskahId: tulisDariTopik(Number(t[1])) }, 202);
      buangTopik(Number(t[1]));
      return json(res, { ok: true });
    }
    if (req.method === "POST" && p === "/api/naskah") {
      const { topik } = await body(req);
      if (!topik?.trim()) return json(res, { error: "topik wajib diisi" }, 400);
      return json(res, { id: buatNaskah(topik.trim()) }, 202);
    }
    const m = p.match(/^\/api\/naskah\/(\d+)\/(setujui|tolak|revisi)$/);
    if (req.method === "POST" && m) {
      const id = Number(m[1]);
      if (m[2] === "revisi") {
        const { catatan } = await body(req);
        if (!catatan?.trim()) return json(res, { error: "catatan revisi wajib diisi" }, 400);
        revisiNaskah(id, catatan.trim());
      } else setStatus(id, m[2] === "setujui" ? "disetujui" : "ditolak");
      return json(res, { ok: true });
    }
    json(res, { error: "tidak ditemukan" }, 404);
  } catch (e) {
    json(res, { error: e instanceof Error ? e.message : String(e) }, 500);
  }
}).listen(PORT, "127.0.0.1", () => {
  console.log(`Kantor berjalan di http://127.0.0.1:${PORT}${process.env.KANTOR_MOCK === "1" ? " (MOCK)" : ""}`);
  mulaiScheduler();
  mulaiWebhook();
});
