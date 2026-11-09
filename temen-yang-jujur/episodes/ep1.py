"""Episode 1 - Temen yang Selalu Support (tapi Jujur)"""
CAPTION = "Temen yang selalu\nsupport (tapi jujur)!"
CREDIT_TITLE = "Temen yang selalu support\n(tapi jujur)!"
VOICE_SUBDIR = "voice"          # folder suara (sudah ada dari sebelumnya)
THUMB = dict(line1="TEMEN YANG SELALU", line2="SUPPORT", badge="(tapi JUJUR!)", eps="EPS. 1",
             bubbleL="Gue mau\nRESIGN!", bubbleR="Udah ada\nmodal?")

SEQS = [
    ("park", [
        ("raka", "Bim, gue kepikiran mau resign.", "wide"),
        ("bima", "Hah? Serius lu?", "close"),
        ("raka", "Serius. Gue mau buka usaha.", "close"),
        ("bima", "Udah ada modal?", "close"),
        ("raka", "Ada. Delapan puluh ribu.", "close"),
        ("bima", "Hmm.", "wide"),
        ("raka", "Tapi ide gue gila, Bim. Kopi literan, ada filosofinya.", "close"),
        ("bima", "Kopi literan di sini udah ada empat puluh.", "close"),
        ("raka", "Beda! Punya gue ada quotes di tutupnya.", "close"),
        ("bima", "Ya ampun.", "wide"),
    ]),
    ("warung", [
        ("raka", "Nih gerobaknya. Gue beli kemarin.", "wide"),
        ("bima", "Lu udah beli duluan?!", "close"),
        ("raka", "Cicilan, tenang. Dua belas bulan.", "close"),
        ("bima", "Lu mau bayar pake apa, filosofi?", "close"),
        ("raka", "Makanya gue mau resign, biar fokus.", "close"),
        ("bima", "Tunggu, tunggu. Gue support lu.", "wide"),
        ("bima", "Tapi jangan resign dulu. Kopi jalan, baru keluar.", "close"),
        ("raka", "Kalau kopinya nggak jalan?", "close"),
        ("bima", "Ya lu masih punya gaji, bisa traktir gue.", "close"),
        ("raka", "Itu mah lu doang yang untung.", "wide"),
    ]),
    ("stairs", [
        (None, "Temen yang bener-bener support,", "narr"),
        (None, "bukan yang selalu bilang \"gas\",", "narr"),
        (None, "tapi yang berani bilang \"pelan-pelan dulu\".", "narr"),
        (None, "Soalnya mimpi butuh dukungan,", "narr"),
        (None, "bukan cuma tepuk tangan.", "narr"),
    ]),
    ("road", [(None, "", "ride")]),
    ("phone", [
        ("raka", "Bim, gue udah ngomong sama bos.", "helmet"),
        ("raka", "Gue nggak jadi resign. Ambil lembur dulu.", "helmet"),
        ("raka", "Oh iya, gerobaknya gue taro di garasi lu, ya.", "helmet"),
        ("bima", "☎ Hah? Garasi gue?!", "helmet"),
        ("raka", "Makasih ya, Bim. Lu emang temen yang selalu support.", "helmet"),
        ("bima", "☎ Cicilannya bayar sendiri ya.", "helmet"),
    ]),
    ("credits", [(None, "", "credits")]),
]

EMO = {
    0:  ("gelisah", "Bim... gue kepikiran, mau resign."),
    1:  ("kaget",   "Hah?! Serius lu?"),
    2:  ("yakin",   "Serius! Gue mau buka usaha."),
    3:  ("tegas",   "Udah ada modal?"),
    4:  ("bangga",  "Ada! Delapan puluh ribu."),
    5:  ("sarkas",  "Hmm..."),
    6:  ("semangat", "Tapi ide gue gila, Bim! Kopi literan... ada filosofinya!"),
    7:  ("sarkas",  "Kopi literan di sini... udah ada empat puluh."),
    8:  ("protes",  "Beda! Punya gue, ada quotes di tutupnya!"),
    9:  ("pasrah",  "Ya ampun..."),
    10: ("bangga",  "Nih, gerobaknya! Gue beli kemarin."),
    11: ("kaget",   "Lu udah beli duluan?!"),
    12: ("santai",  "Cicilan, tenang... dua belas bulan."),
    13: ("sarkas",  "Lu mau bayar pake apa? Filosofi?"),
    14: ("protes",  "Makanya gue mau resign! Biar fokus."),
    15: ("hangat",  "Tunggu, tunggu. Gue support lu."),
    16: ("tegas",   "Tapi jangan resign dulu. Kopi jalan, baru keluar."),
    17: ("ragu",    "Kalau kopinya... nggak jalan?"),
    18: ("santai",  "Ya lu masih punya gaji. Bisa traktir gue."),
    19: ("protes",  "Itu mah lu doang yang untung!"),
    26: ("lega",    "Bim, gue udah ngomong sama bos."),
    27: ("tegas",   "Gue nggak jadi resign. Ambil lembur dulu."),
    28: ("santai",  "Oh iya, gerobaknya gue taro di garasi lu, ya."),
    29: ("kaget",   "Hah?! Garasi gue?!"),
    30: ("hangat",  "Makasih ya, Bim. Lu emang temen yang selalu support."),
    31: ("tegas",   "Cicilannya, bayar sendiri, ya."),
}
