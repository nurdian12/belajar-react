#!/usr/bin/env python3
"""Buat naskah rekaman (Markdown) dari episode. Pakai: EPISODE=ep8 python3 make_naskah.py out.md"""
import sys, render as r

ARAH = {  # preset -> arahan intonasi (Bahasa Indonesia)
    "gelisah": "ragu, agak pelan", "kaget": "kaget, nada naik, volume keras", "yakin": "yakin, tegas penuh semangat",
    "tegas": "tegas, jelas, agak berat, tekan kata kunci", "bangga": "bangga, ceria", "semangat": "semangat, cepat, nada tinggi",
    "sarkas": "menyindir, datar, pelan", "pasrah": "menghela napas, lemas", "santai": "santai, natural",
    "hangat": "hangat, tulus, pelan", "ragu": "ragu, pelan, nada turun", "protes": "protes, nada naik, agak keras",
    "lega": "lega, tenang", "datar": "datar (deadpan), tanpa ekspresi",
}
NAMA = {"raka": "RAKA", "bima": "BIMA", "fajar": "FAJAR", "naila": "NAILA"}
SUARA = {"raka": "cowok, nada sedang-tinggi, cepat, mudah panik", "bima": "cowok, nada rendah, tenang, agak datar",
         "fajar": "cowok, nada cerah, ceplas-ceplos, penuh percaya diri", "naila": "cewek, nada datar, dingin, jujur"}
ADEGAN = {"rapat": "Warung kopi (rapat 4 orang)", "park": "Taman berpagar hijau", "warung": "Warung kopi", "garasi": "Garasi Bima",
          "tamu": "Ruang tamu (sofa)", "stairs": "Lorong tangga (monolog)", "road": "Motor melintas", "phone": "Telepon (Raka pakai helm)", "credits": "Kredit"}

def mmss(t): return f"{int(t // 60)}:{int(t % 60):02d}"

def main(out):
    ep = r.EP
    title = ep.CAPTION.replace("\n", " ")
    L = [f"# Naskah Rekaman: {title}", "",
         f"Durasi panduan: **±{mmss(r.TOTAL)}** · Jumlah baris dialog: **{sum(1 for e in r.TL if e['who'] and e['text'])}**", "",
         "## Tips rekam", "- Rekam **per baris** (satu file per kalimat), di ruangan yang tidak bergema.",
         "- Beri jeda ±0,3 detik sebelum dan sesudah tiap kalimat supaya mudah dipotong.",
         "- Timestamp di bawah hanya **panduan** dari video animasi; sesuaikan dengan tempo rekaman Anda.",
         "- Baris bertanda ☎ = suara lewat telepon (nanti diberi efek telepon).", "",
         "## Karakter dan suara", "", "| Karakter | Arahan suara |", "|---|---|"]
    used = []
    for e in r.TL:
        if e["who"] and e["who"] not in used: used.append(e["who"])
    for w in used: L.append(f"| {NAMA[w]} | {SUARA[w]} |")
    L += ["", "## Naskah", ""]
    idx = 0; cur = None
    for e in r.TL:
        if e["seq"] != cur:
            cur = e["seq"]; L += ["", f"### Adegan: {ADEGAN.get(cur, cur)}", "", "| # | Waktu | Karakter | Dialog | Arahan intonasi |", "|---|---|---|---|---|"]
        if e["who"] and e["text"]:
            preset, note = ep.EMO.get(idx, ("santai", ""))
            arah = ARAH[preset] + (f" — {note}" if note else "")
            txt = e["text"].replace("☎ ", "☎ ").replace("|", "/")
            L.append(f"| {idx} | {mmss(e['t0'])} | {NAMA[e['who']]} | {txt} | {arah} |")
        elif e["view"] == "narr":
            L.append(f"| {idx} | {mmss(e['t0'])} | (teks di layar) | {e['text']} | dibaca sebagai narasi tenang, atau tanpa suara |")
        idx += 1
    open(out, "w", encoding="utf-8").write("\n".join(L) + "\n")
    print("ok", out)

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "naskah.md")
