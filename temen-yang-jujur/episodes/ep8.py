"""Episode 8 - Kopi Seadanya Viral (4 karakter) - versi naskah, tanpa voice over"""
CAPTION = "Temen yang selalu support:\nKopi Seadanya Viral!"
CREDIT_TITLE = "Temen yang selalu support:\nKopi Seadanya Viral!"
VOICE_SUBDIR = "voice_ep8"          # tidak dibuat; Anda yang merekam
GESTURE = 0.25
CAST = {"rapat": ("raka", "fajar", "bima", "naila"), "park": ("raka", "fajar", "bima", "naila"),
        "tamu": ("fajar", "naila")}
THUMB = dict(line1="KOPI SEADANYA", line2="VIRAL!", badge="(kewalahan!)", eps="EPS. 8",
             bubbleL="Go\nINTERNATIONAL!", bubbleR="Gelas kita\ntinggal 3!", bg="park",
             cast=("fajar", "raka", "bima", "naila"), seated=True)

SEQS = [
    ("rapat", [
        ("raka", "Guys, antrean udah sampai tiang listrik!", "wide"),
        ("fajar", "Gue bilang apa? Go international!", "close"),
        ("naila", "Itu antrean, bukan prestasi. Gelas kita tinggal tiga.", "close"),
        ("bima", "Tinggal tiga? Tadi pagi seratus.", "close"),
        ("raka", "Siapa yang pegang kasir?", "close"),
        ("fajar", "Gue! Tapi gue lupa nyatet.", "close"),
        ("naila", "Lupa nyatet, tapi inget minta foto bareng pelanggan.", "wide"),
        ("fajar", "Itu branding.", "close"),
        ("bima", "Itu bikin antrean makin panjang.", "close"),
        ("raka", "Oke, tenang. Kita bagi tugas.", "wide"),
    ]),
    ("park", [
        ("raka", "Bima, kasir. Naila, keuangan.", "wide"),
        ("bima", "Setuju. Gue pegang uang, lu pegang senyum.", "close"),
        ("naila", "Gue pegang catatan. Yang sentuh uang sebelum dicatat, gue jitak.", "close"),
        ("fajar", "Terus gue?", "close"),
        ("raka", "Lu jadi penyambut.", "close"),
        ("fajar", "Penyambut? Jabatan paling keren!", "close"),
        ("naila", "Itu biar lu nggak sentuh apa-apa.", "wide"),
        ("fajar", "Gue denger itu.", "close"),
    ]),
    ("tamu", [
        ("fajar", "Nai, hari ini gue seneng banget.", "wide"),
        ("naila", "Gue juga. Walau capek.", "close"),
        ("fajar", "Tanpa lu yang ngerem, gue udah nabrak.", "close"),
        ("naila", "Dan tanpa lu yang ngegas, gue nggak bakal berani.", "close"),
        ("fajar", "Jadi kita ini... tim?", "close"),
        ("naila", "Tim. Tapi jangan norak.", "wide"),
    ]),
    ("stairs", [
        (None, "Yang ngegas dan yang ngerem,", "narr"),
        (None, "bukan musuh.", "narr"),
        (None, "Mereka saling jaga,", "narr"),
        (None, "biar nggak nabrak,", "narr"),
        (None, "dan biar nggak diem di tempat.", "narr"),
    ]),
    ("road", [(None, "", "ride")]),
    ("phone", [
        ("raka", "Bim, stok gelas udah masuk?", "helmet"),
        ("bima", "☎ Udah. Dua ribu gelas.", "helmet"),
        ("raka", "Dua ribu? Gue pesennya dua ratus!", "helmet"),
        ("bima", "☎ Fajar nambah nol. Katanya biar go international.", "helmet"),
        ("raka", "Fajar!", "helmet"),
        ("fajar", "☎ Santai, Rak! Itu investasi!", "helmet"),
        ("naila", "☎ Investasi pakai uang siapa, Jar?", "helmet"),
        ("fajar", "☎ ...Uang kas. Tapi gue catat!", "helmet"),
    ]),
    ("credits", [(None, "", "credits")]),
]

# arahan emosi per baris (index global -> (preset, catatan ucapan))
EMO = {
    0:  ("semangat", "panik senang, napas pendek"),
    1:  ("bangga",   "pede, dagu naik"),
    2:  ("datar",    "datar, tanpa ekspresi, tekan kata 'tinggal tiga'"),
    3:  ("kaget",    "terkejut, nada naik di 'seratus'"),
    4:  ("tegas",    "cepat, menunjuk ke semua orang"),
    5:  ("ragu",     "nyengir bersalah, pelan di 'lupa nyatet'"),
    6:  ("sarkas",   "menyindir, ritme lambat"),
    7:  ("bangga",   "yakin, seolah itu jawaban paling masuk akal"),
    8:  ("tegas",    "capek tapi jelas"),
    9:  ("yakin",    "tenang, mengambil kendali"),
    10: ("yakin",    "memberi komando"),
    11: ("hangat",   "bercanda hangat"),
    12: ("tegas",    "serius, sedikit mengancam"),
    13: ("ragu",     "kebingungan"),
    14: ("santai",   "ragu-ragu cari jabatan"),
    15: ("semangat", "girang berlebihan"),
    16: ("sarkas",   "deadpan"),
    17: ("pasrah",   "lemas, tapi ketawa kecil"),
    18: ("hangat",   "pelan, tulus, lelah senang"),
    19: ("hangat",   "lembut"),
    20: ("hangat",   "jujur, lebih pelan"),
    21: ("hangat",   "jujur tapi tetap datar khasnya"),
    22: ("ragu",     "sedikit malu"),
    23: ("datar",    "tegas-tapi-hangat, menutup momen"),
    29: ("santai",   ""),
    30: ("santai",   "tenang, mau konfirmasi"),
    31: ("santai",   "santai, belum sadar masalahnya"),
    32: ("kaget",    "panik, nada naik"),
    33: ("sarkas",   "datar, melempar kesalahan"),
    34: ("protes",   "teriak kecil"),
    35: ("semangat", "pede, tanpa dosa"),
    36: ("datar",    "dingin, menusuk"),
    37: ("ragu",     "mengecil, buru-buru nambah 'tapi gue catat'"),
}
