import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { db, ROOT } from "./db.ts";
import { listAgents } from "./agents.ts";
import { buatNaskah, revisiNaskah, setStatus } from "./pipeline.ts";

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
}).listen(PORT, "127.0.0.1", () =>
  console.log(`Kantor berjalan di http://127.0.0.1:${PORT}${process.env.KANTOR_MOCK === "1" ? " (MOCK)" : ""}`),
);
