import * as THREE from "three";

/**
 * Kantor 3D isometrik (low-poly). Lima ruangan: Rina (riset), Maya (naskah), Dewi (studio video),
 * Putri (CS, belum dibangun = tembus pandang), Kamu (bos). Status tiap agent menghidupkan karakternya.
 */
const STATUS_TEKS = {
  rina: { kerja: "mencari topik…", siap: "siap", },
  maya: { kerja: "menulis naskah…", siap: "siap" },
  dewi: { kerja: "membuat video…", siap: "siap" },
  kamu: { tunggu: "ada yang menunggu kamu", siap: "tidak ada antrean" },
  putri: { belum: "belum dibangun" },
};

const mat = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });
const box = (p, w, h, d, c, x, y, z, o) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c, o)); m.position.set(x, y + h / 2, z); p.add(m); return m; };
const cyl = (p, rt, rb, h, c, x, y, z, seg = 18) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(c)); m.position.set(x, y + h / 2, z); p.add(m); return m; };
const sph = (p, r, c, x, y, z, o) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), mat(c, o)); m.position.set(x, y, z); p.add(m); return m; };
const cone = (p, r, h, c, x, y, z) => { const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 10), mat(c)); m.position.set(x, y + h / 2, z); p.add(m); return m; };

function orang(baju, rambut) {
  const g = new THREE.Group(), kulit = 0xf1c9a5;
  cyl(g, 0.27, 0.3, 0.72, baju, 0, 0.5, 0);
  box(g, 0.15, 0.15, 0.5, 0x3b4252, -0.1, 0.4, 0.2); box(g, 0.15, 0.15, 0.5, 0x3b4252, 0.1, 0.4, 0.2);
  box(g, 0.15, 0.42, 0.15, 0x3b4252, -0.1, 0, 0.45); box(g, 0.15, 0.42, 0.15, 0x3b4252, 0.1, 0, 0.45);
  const kepala = new THREE.Group(); kepala.position.set(0, 1.5, 0); g.add(kepala);
  sph(kepala, 0.25, kulit, 0, 0, 0);
  const r = new THREE.Mesh(new THREE.SphereGeometry(0.275, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(rambut)); r.position.set(0, 0.02, -0.02); kepala.add(r);
  sph(kepala, 0.035, 0x1b1b1b, -0.09, 0.02, 0.23); sph(kepala, 0.035, 0x1b1b1b, 0.09, 0.02, 0.23);
  const lengan = (x) => { const p = new THREE.Group(); p.position.set(x, 1.12, 0); box(p, 0.11, 0.5, 0.11, baju, -0.055, -0.5, -0.055); g.add(p); return p; };
  return { g, kepala, kiri: lengan(-0.36), kanan: lengan(0.36) };
}

export function mulaiKantor3D(el, ambilStatus) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  el.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -100, 100);
  cam.position.set(16, 14, 16); cam.lookAt(0, 0.6, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8fb09f, 2.1));
  const sun = new THREE.DirectionalLight(0xfff0da, 2.3); sun.position.set(9, 16, 5); scene.add(sun);

  // ---- tanah, gedung, dinding ----
  const dunia = new THREE.Group(); scene.add(dunia);
  box(dunia, 46, 0.2, 36, 0x93cf73, 0, -0.2, 0);
  box(dunia, 19, 0.3, 13, 0xe6dfd2, 0, 0, 0);
  const lantai = (x1, x2, z1, z2, c) => box(dunia, x2 - x1 - 0.1, 0.05, z2 - z1 - 0.1, c, (x1 + x2) / 2, 0.3, (z1 + z2) / 2);
  lantai(-9, -3, -6, 0, 0xcfe8dc); lantai(-3, 3, -6, 0, 0xf6e9c8); lantai(3, 9, -6, 0, 0xddd4f0);
  lantai(-9, -3, 0, 6, 0xdadada); lantai(-3, 3, 0, 6, 0xe0c7a0); lantai(3, 9, 0, 6, 0xf3d9d2);
  const dinding = 0xfaf6ef;
  box(dunia, 18.4, 3.2, 0.25, dinding, 0, 0.3, -6.1); box(dunia, 0.25, 3.2, 12.4, dinding, -9.1, 0.3, 0);       // dinding belakang & kiri (tinggi)
  box(dunia, 18.4, 0.45, 0.25, dinding, 0, 0.3, 6.1); box(dunia, 0.25, 0.45, 12.4, dinding, 9.1, 0.3, 0);        // sisi depan (rendah, potongan)
  for (const x of [-3, 3]) { box(dunia, 0.2, 1.4, 4.2, dinding, x, 0.3, -4); box(dunia, 0.2, 1.4, 2.2, dinding, x, 0.3, 4.8); box(dunia, 0.2, 1.4, 2.2, dinding, x, 0.3, 1); }
  for (const [a, b] of [[-9, -5], [-1, 1], [5, 9]]) box(dunia, b - a, 1.4, 0.2, dinding, (a + b) / 2, 0.3, 0);
  for (const x of [-6, 0, 6]) box(dunia, 1.8, 1.3, 0.1, 0xbfe3f5, x, 1.3, -5.95);                                       // jendela

  // ---- ruangan ----
  const ruang = {};
  const siapRuang = (id, cx, cz, baju, rambut, ghost) => {
    const g = new THREE.Group(); dunia.add(g);
    const meja = new THREE.Group(); meja.position.set(cx, 0.35, cz - 1.9); g.add(meja);
    box(meja, 2.4, 0.1, 1.1, 0xb68a5a, 0, 0.7, 0);
    for (const sx of [-1.1, 1.1]) box(meja, 0.12, 0.7, 0.9, 0x8a6a45, sx, 0, 0);
    cyl(g, 0.3, 0.3, 0.45, 0x4a5568, cx, 0.35, cz - 0.9);                                     // kursi
    const p = orang(baju, rambut); p.g.position.set(cx, 0.35, cz - 0.9); p.g.rotation.y = Math.PI; g.add(p.g);
    ruang[id] = { g, meja, p, layar: [], ghost, cx, cz, status: "siap", nama: id };
    return ruang[id];
  };
  const layar = (r, x, z, w = 0.9) => { const m = box(r.meja, w, 0.55, 0.06, 0x24303a, x, 0.8, z, { emissive: 0x2563eb, emissiveIntensity: 0.15 }); r.layar.push(m); box(r.meja, 0.1, 0.12, 0.1, 0x24303a, x, 0.8, z + 0.05); };

  const rina = siapRuang("rina", -6, -3, 0x2f9e8f, 0x3a2a1e);
  layar(rina, -0.55, -0.2); layar(rina, 0.55, -0.2);
  box(rina.g, 2.2, 2.4, 0.45, 0x8a6a45, -6, 0.3, -5.6);
  [0xe76f51, 0x2a9d8f, 0xe9c46a, 0x457b9d, 0xf4a261].forEach((c, i) => { box(rina.g, 0.35, 0.5, 0.3, c, -6.8 + i * 0.4, 0.45 + (i % 2) * 1.0, -5.45); });

  const maya = siapRuang("maya", 0, -3, 0xd9779b, 0x1f1b16);
  layar(maya, -0.5, -0.2, 0.7); box(maya.meja, 0.6, 0.04, 0.45, 0xffffff, 0.6, 0.8, 0.0); box(maya.meja, 0.5, 0.04, 0.4, 0xfff4b8, 0.65, 0.84, 0.05);
  cyl(maya.g, 0.04, 0.04, 0.9, 0x555555, 1.3, 0.35, -2.4); cone(maya.g, 0.3, 0.3, 0xffd166, 1.3, 1.2, -2.4);
  cyl(maya.g, 0.3, 0.22, 0.5, 0xc2693f, -2.1, 0.3, -5.3); sph(maya.g, 0.5, 0x3fa34d, -2.1, 1.1, -5.3);

  const dewi = siapRuang("dewi", 6, -3, 0xf0a04b, 0x6b3fa0);
  layar(dewi, 0, -0.2, 1.1);
  box(dewi.g, 3.2, 2.7, 0.1, 0x35c759, 6.5, 0.3, -5.8);                                           // layar hijau
  cyl(dewi.g, 0.04, 0.04, 2.0, 0x333333, 4.1, 0.3, -1.1);
  const cincin = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.07, 10, 28), mat(0xffffff, { emissive: 0xfff3c4, emissiveIntensity: 0.9 })); cincin.position.set(4.1, 2.5, -1.1); dewi.g.add(cincin);
  box(dewi.g, 0.5, 0.35, 0.4, 0x2b2b2b, 4.1, 1.5, -0.7);                                          // kamera

  const putri = siapRuang("putri", -6, 3, 0x5b7fd6, 0x2c2c2c, true);
  layar(putri, -0.4, -0.2, 0.8); box(putri.meja, 0.3, 0.05, 0.5, 0x111111, 0.7, 0.8, 0);
  const kamu = siapRuang("kamu", 0, 3, 0x2b2b3a, 0x7a5230);
  box(kamu.g, 3.6, 0.04, 2.4, 0xb23a48, 0, 0.3, 3.6);                                              // karpet
  layar(kamu, -0.5, -0.2, 0.8);
  const nampan = box(kamu.meja, 0.7, 0.12, 0.5, 0xe0b04b, 0.75, 0.8, 0.1); nampan.userData.y0 = nampan.position.y;
  const pesan = box(kamu.meja, 0.5, 0.05, 0.35, 0xffffff, 0.75, 0.92, 0.1);
  // ruang santai
  const lounge = new THREE.Group(); dunia.add(lounge);
  box(lounge, 2.6, 0.5, 1.0, 0x6d8fb3, 6, 0.3, 4.5); box(lounge, 2.6, 0.7, 0.25, 0x5b7a9c, 6, 0.8, 5.1); box(lounge, 1.2, 0.35, 0.8, 0xb68a5a, 6, 0.3, 3.2);
  cyl(lounge, 0.35, 0.28, 0.5, 0xc2693f, 8.3, 0.3, 1.5); sph(lounge, 0.55, 0x3fa34d, 8.3, 1.3, 1.5);

  // ---- halaman luar ----
  const pohon = (x, z, s = 1) => { cyl(dunia, 0.16 * s, 0.2 * s, 1.0 * s, 0x8a5a3a, x, 0, z); cone(dunia, 0.9 * s, 1.8 * s, 0x2f9d4c, x, 0.9 * s, z); cone(dunia, 0.7 * s, 1.4 * s, 0x3bb45a, x, 1.8 * s, z); };
  [[-12, -4, 1.2], [-13, 3, 1], [-11.5, 8, 1.1], [12.5, -5, 1.1], [13, 2, 1.3], [11.5, 9, 1], [-5, -10, 1.2], [3, -10.5, 1], [9, -9.5, 1.3], [0, 10, 1], [-8, 10, 1.1]].forEach(([x, z, s]) => pohon(x, z, s));
  const kolam = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.08, 32), mat(0x6ec6ea)); kolam.position.set(-13.5, 0.04, 9.5); dunia.add(kolam);
  const awan = [];
  for (let i = 0; i < 4; i++) { const a = new THREE.Group(); [[0, 0, 1], [1, 0.1, 0.8], [-1, 0, 0.7]].forEach(([x, y, s]) => sph(a, s, 0xffffff, x, y, 0, { transparent: true, opacity: 0.9 })); a.position.set(-22 + i * 12, 9 + (i % 2) * 2, -14 + i * 5); awan.push(a); scene.add(a); }

  // tembus pandang untuk ruang yang belum dibangun
  putri.g.traverse((o) => { if (o.material) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.32; } });

  // ---- label DOM di atas kepala ----
  const info = { rina: ["Rina", "Periset"], maya: ["Maya", "Penulis naskah"], dewi: ["Dewi", "Video"], putri: ["Putri", "CS WhatsApp"], kamu: ["Kamu", "Bos"] };
  for (const id of Object.keys(ruang)) {
    const r = ruang[id], d = document.createElement("div"); d.className = "lbl3d";
    d.innerHTML = `<b>${info[id][0]}</b> <span class="j">${info[id][1]}</span><span class="s"></span>`; el.appendChild(d); r.label = d; r.status = "siap";
  }

  const target = Object.fromEntries(Object.keys(ruang).map((k) => [k, k === "putri" ? "belum" : "siap"]));
  let demo = false, demoMulai = 0;
  async function sedot() { try { Object.assign(target, await ambilStatus()); } catch { /* biarkan status terakhir */ } }
  sedot(); const poll = setInterval(() => { if (!demo && !document.hidden) sedot(); }, 2500);

  function ukur() {
    const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); renderer.domElement.style.cssText = "width:100%;height:100%;display:block";
    const asp = w / h, H = Math.max(7.9, 11.2 / asp);
    Object.assign(cam, { left: -H * asp, right: H * asp, top: H, bottom: -H }); cam.updateProjectionMatrix();
  }
  new ResizeObserver(ukur).observe(el); ukur();

  const v = new THREE.Vector3(), t0 = performance.now();
  function frame(now) {
    const t = (now - t0) / 1000;
    if (demo) {   // siklus demo: Rina → Maya → kamu menyetujui → Dewi
      const f = Math.floor((now - demoMulai) / 2800) % 5;
      Object.assign(target, { rina: f === 0 ? "kerja" : "siap", maya: f === 1 ? "kerja" : "siap", kamu: f === 2 ? "tunggu" : "siap", dewi: f === 3 ? "kerja" : "siap" });
    }
    for (const id in ruang) {
      const r = ruang[id], s = target[id] ?? "siap"; r.status = s;
      const p = r.p, kerja = s === "kerja", tunggu = s === "tunggu";
      const idle = Math.sin(t * 1.6 + r.cx) * 0.02;
      p.g.position.y = 0.35 + (kerja ? Math.abs(Math.sin(t * 9)) * 0.015 : idle);
      p.kepala.rotation.y = kerja ? Math.sin(t * 2.2) * 0.12 : Math.sin(t * 0.7 + r.cx) * 0.35;
      p.kepala.rotation.x = kerja ? 0.12 : 0;
      p.kiri.rotation.x = -1.25 + (kerja ? Math.sin(t * 15) * 0.2 : 0); p.kanan.rotation.x = -1.25 + (kerja ? Math.sin(t * 15 + 2) * 0.2 : 0);
      if (tunggu) { p.kanan.rotation.x = -2.6 + Math.sin(t * 6) * 0.35; p.kanan.rotation.z = -0.3; } else p.kanan.rotation.z = 0;
      r.layar.forEach((m) => { m.material.emissiveIntensity = kerja ? 0.55 + Math.sin(t * 8) * 0.25 : 0.12; });
      // label
      v.set(r.cx, 3.3, r.cz - 0.9).project(cam);
      r.label.style.transform = `translate(-50%,-100%) translate(${((v.x + 1) / 2) * el.clientWidth}px, ${((1 - v.y) / 2) * el.clientHeight}px)`;
      r.label.dataset.s = s; r.label.querySelector(".s").textContent = (STATUS_TEKS[id] ?? {})[s] ?? s;
    }
    nampan.position.y = nampan.userData.y0 + (target.kamu === "tunggu" ? Math.abs(Math.sin(t * 5)) * 0.12 : 0);
    nampan.material.emissive = new THREE.Color(target.kamu === "tunggu" ? 0xf59e0b : 0x000000); nampan.material.emissiveIntensity = 0.6;
    pesan.visible = target.kamu === "tunggu";
    cincin.material.emissiveIntensity = target.dewi === "kerja" ? 1.2 + Math.sin(t * 6) * 0.4 : 0.6;
    awan.forEach((a, i) => { a.position.x += 0.004 + i * 0.001; if (a.position.x > 26) a.position.x = -26; });
    renderer.render(scene, cam); requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return {
    setDemo(on) { demo = on; demoMulai = performance.now(); if (!on) sedot(); },
    hentikan() { clearInterval(poll); renderer.dispose(); },
  };
}
