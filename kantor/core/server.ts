import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { db, ROOT } from "./db.ts";
import { listAgents } from "./agents.ts";
import { buatNaskah, revisiNaskah, setStatus, riset, sedangRiset, tulisDariTopik, buangTopik } from "./pipeline.ts";
import { mulaiScheduler } from "./scheduler.ts";
import { buatVideo, VIDEO_DIR } from "./video.ts";
import { createReadStream, existsSync, statSync } from "node:fs";

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
    if (req.method === "GET" && p === "/api/agents") return json(res, listAgents());
    if (req.method === "GET" && p === "/api/jobs")
      return json(res, db.prepare("SELECT id,agent,status,error,biaya_usd,dibuat,selesai FROM jobs ORDER BY id DESC LIMIT 50").all());
    if (req.method === "GET" && p === "/api/naskah")
      return json(res, db.prepare("SELECT * FROM naskah ORDER BY id DESC LIMIT 50").all());
    if (req.method === "GET" && p === "/api/video")
      return json(res, db.prepare("SELECT * FROM video ORDER BY id DESC LIMIT 30").all());
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
});
