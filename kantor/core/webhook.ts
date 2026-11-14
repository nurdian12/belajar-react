import { createServer } from "node:http";
import { createHmac, timingSafeEqual } from "node:crypto";
import { pesanMasuk } from "./cs.ts";

/**
 * Webhook WhatsApp Cloud API. BELUM DITES dengan akun Meta asli.
 * Sengaja dijalankan di port terpisah yang HANYA melayani /webhook/whatsapp, supaya tunnel publik
 * (cloudflared/ngrok) ke port ini tidak membuka dashboard. Aktif hanya bila WA_VERIFY_TOKEN dan WA_APP_SECRET terisi.
 */
export function mulaiWebhook() {
  const { WA_VERIFY_TOKEN, WA_APP_SECRET } = process.env;
  if (!WA_VERIFY_TOKEN || !WA_APP_SECRET) return;
  const port = Number(process.env.WEBHOOK_PORT ?? 4322);

  createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://x");
    if (url.pathname !== "/webhook/whatsapp") { res.writeHead(404); return res.end(); }

    if (req.method === "GET") {   // verifikasi langganan oleh Meta
      const ok = url.searchParams.get("hub.mode") === "subscribe" && url.searchParams.get("hub.verify_token") === WA_VERIFY_TOKEN;
      res.writeHead(ok ? 200 : 403); return res.end(ok ? url.searchParams.get("hub.challenge") ?? "" : "");
    }
    if (req.method !== "POST") { res.writeHead(405); return res.end(); }

    const potong: Buffer[] = []; let ukuran = 0;
    req.on("data", (d: Buffer) => { ukuran += d.length; if (ukuran > 1_000_000) req.destroy(); else potong.push(d); });
    req.on("end", () => {
      const mentah = Buffer.concat(potong);
      const tanda = Buffer.from(String(req.headers["x-hub-signature-256"] ?? ""));
      const harap = Buffer.from("sha256=" + createHmac("sha256", WA_APP_SECRET).update(mentah).digest("hex"));
      if (tanda.length !== harap.length || !timingSafeEqual(tanda, harap)) { res.writeHead(401); return res.end(); }
      res.writeHead(200); res.end();   // balas cepat; Meta mengulang kirim bila lambat
      try {
        const j = JSON.parse(mentah.toString("utf8"));
        for (const e of j.entry ?? []) for (const c of e.changes ?? []) for (const m of c.value?.messages ?? [])
          if (m.type === "text" && m.from && m.text?.body) pesanMasuk("whatsapp", String(m.from), String(m.text.body));
      } catch (err) { console.error("[webhook] payload tidak valid:", err instanceof Error ? err.message : err); }
    });
  }).listen(port, "127.0.0.1", () => console.log(`Webhook WhatsApp di http://127.0.0.1:${port}/webhook/whatsapp (arahkan tunnel ke port ini saja)`));
}
