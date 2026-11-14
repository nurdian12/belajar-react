// Merekam tangkapan layar dashboard untuk video tur -> public/tur/*.jpg + manifest.json.
// Butuh: dashboard berjalan dengan data contoh (lihat seed.ts) dan paket `playwright` (npm i -D playwright).
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

const OUT = path.join(__dirname, "..", "..", "public", "tur");
const URL = process.env.KANTOR_URL || "http://127.0.0.1:4321/";
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 }, deviceScaleFactor: 2 });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));

  let status = { rina: "siap", maya: "siap", dewi: "siap", kamu: "siap", putri: "belum" };
  await page.route("**/api/status", (r) => r.fulfill({ json: status }));
  await page.route("**/api/repliz/akun", (r) => r.fulfill({ json: { adaKunci: true, mentah: {}, akun: [
    { id: "a1", nama: "TikTok utama", platform: "tiktok" }, { id: "a2", nama: "Instagram Reels", platform: "instagram" }] } }));
  await page.goto(URL);
  await page.addStyleTag({ content: "main{max-width:1400px!important} #scene3d{height:640px!important} #demo3d{display:none!important} .lbl3d{font-size:15px!important;padding:4px 10px!important}" });
  await page.waitForTimeout(2500);

  // Tangkapan berdasarkan koordinat halaman (tidak menunggu elemen "stabil": adegan 3D selalu bergerak).
  const klip = async (loc, file) => {
    const b = await loc.evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height }; });
    await page.screenshot({ path: path.join(OUT, file), fullPage: true, clip: b, type: "jpeg", quality: 88 });
    return { w: b.width, h: b.height };
  };
  const manifest = {};
  const simpan = async (nama, hasil) => { manifest[nama] = hasil; console.log("ok", nama, hasil.w + "x" + hasil.h); };
  const jpg = { type: "jpeg", quality: 88 };

  for (const [nama, ubah] of [["kantor-idle", {}], ["kantor-rina", { rina: "kerja" }], ["kantor-maya", { maya: "kerja" }], ["kantor-dewi", { dewi: "kerja" }], ["kantor-kamu", { kamu: "tunggu" }]]) {
    status = { rina: "siap", maya: "siap", dewi: "siap", kamu: "siap", putri: "belum", ...ubah };
    await page.waitForTimeout(3600);                       // dashboard membaca status tiap 2,5 dtk
    await simpan(nama, await klip(page.locator("#scene3d"), nama + ".jpg"));
  }

  // daftar topik: dari judul "Topik dari Rina" sampai akhir daftar
  {
    const h = await page.locator("h2", { hasText: "Topik dari Rina" }).boundingBox(), l = await page.locator("#topik-list").boundingBox();
    const clip = { x: h.x - 14, y: h.y - 10, width: l.width + 28, height: l.y + l.height - h.y + 24 };
    await page.screenshot({ path: path.join(OUT, "topik.jpg"), fullPage: true, clip, ...jpg }); await simpan("topik", { w: clip.width, h: clip.height });
  }
  // kartu naskah yang menunggu persetujuan (id terbesar = paling atas)
  {
    await simpan("naskah", await klip(page.locator("#naskah .card").first(), "naskah.jpg"));
  }
  // kartu video + form jadwal: loncat ke detik 2 supaya bingkainya berisi teks, bukan hitam
  {
    await page.evaluate(() => new Promise((ok) => { const v = document.querySelector("#video-list video"); if (!v) return ok(); v.addEventListener("seeked", () => ok(), { once: true }); v.currentTime = 2.4; setTimeout(ok, 3000); }));
    await page.waitForTimeout(500);
    await simpan("kartu-video", await klip(page.locator("#video-list .card").first(), "kartu-video.jpg"));
  }

  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log("galat halaman:", JSON.stringify(errs));
  await browser.close();
})();
