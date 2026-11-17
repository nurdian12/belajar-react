"""Jadwalkan 6 video ke TikTok lewat Repliz (https://api.repliz.com/public).

Autentikasi (Basic) disuntikkan oleh proxy sesi, jadi skrip ini TIDAK menyimpan atau membaca kunci apa pun.

  python3 upload_repliz.py --date 2026-11-05            # simulasi: cek akun + tampilkan rencana
  python3 upload_repliz.py --date 2026-11-05 --go       # benar-benar upload + jadwalkan
Opsi: --username kenalipolanya  --only 1,3  --dir out3
"""
import argparse, json, os, re, ssl, subprocess, sys, urllib.request, urllib.error, urllib.parse
from datetime import datetime, timedelta, timezone

API = 'https://api.repliz.com'
HERE = os.path.dirname(os.path.abspath(__file__))
WIB = timezone(timedelta(hours=7))
SLOTS = ['07:00', '10:00', '12:30', '16:00', '19:00', '21:30']
FILES = ['video1-cek-hp-cemburu-vs-percaya.mp4', 'video2-dia-sibuk-pembalikan.mp4', 'video3-utang-12jt-hitungan.mp4',
         'video4-ransel-batu-guilt-trip.mp4', 'video5-rantai-pertemanan.mp4', 'video6-diamin-vs-10-menit.mp4']
CTX = ssl.create_default_context(cafile=os.environ.get('SSL_CERT_FILE') or '/root/.ccr/ca-bundle.crt')


def call(method, path, body=None, raw=None, headers=None, absolute=False):
    url = path if absolute else API + path
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    h = dict(headers or {})
    if body is not None: h['Content-Type'] = 'application/json'
    req = urllib.request.Request(url, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=300, context=CTX) as r:
            t = r.read().decode() or ''
            return r.status, (json.loads(t) if t.startswith(('{', '[')) else t)
    except urllib.error.HTTPError as e:
        t = e.read().decode(errors='ignore')
        try: return e.code, json.loads(t)
        except Exception: return e.code, t


def captions():
    md = open(os.path.join(HERE, 'CAPTION_V3.md'), encoding='utf-8').read()
    out = {}
    for m in re.finditer(r'^## (\d)\. .*?\n(.*?)(?=^---|^## Ajakan)', md, re.S | re.M):
        n, blk = int(m.group(1)), m.group(2)
        cap = re.search(r'\*\*Caption:\*\*\s*(.*?)\n\*\*Ajakan', blk, re.S)
        ajk = re.search(r'\*\*Ajakan komen:\*\*\s*(.*?)\n\*\*Hashtag', blk, re.S)
        tag = re.search(r'\*\*Hashtag:\*\*\s*(.*)', blk)
        out[n] = '\n\n'.join(x.group(1).strip() if hasattr(x, 'group') and x.lastindex else x.group(0) for x in [cap, ajk, tag] if x)
    return {k: v.replace('**', '') for k, v in out.items()}


def find_account(username):
    code, res = call('GET', '/public/account?page=1&limit=50&types[]=tiktok&search=' + urllib.parse.quote(username))
    if code != 200:
        print(f'GAGAL cek akun: HTTP {code} {res}'); return None
    items = res.get('docs') or res.get('data') or res.get('items') or (res if isinstance(res, list) else [])
    hit = [a for a in items if username.lower() in json.dumps(a).lower()]
    if not hit:
        print('Akun TikTok @%s belum tersambung di Repliz. Sambungkan lewat dasbor Repliz (login TikTok), lalu ulangi.' % username); return None
    a = hit[0]; print('Akun ditemukan:', a.get('_id'), a.get('name') or a.get('username'), '| status:', a.get('status'))
    return a


def upload(path, mimetype):
    size = os.path.getsize(path)
    code, init = call('POST', '/public/storage/file/init', {'filename': os.path.basename(path), 'size': size, 'mimetype': mimetype})
    if code != 200: raise SystemExit(f'init gagal {code}: {init}')
    with open(path, 'rb') as f: raw = f.read()
    c2, r2 = call('PUT', init['upload'], raw=raw, headers={'Content-Type': mimetype}, absolute=True)
    if c2 not in (200, 204): raise SystemExit(f'PUT file gagal {c2}: {r2}')
    c3, r3 = call('POST', f"/public/storage/file/{init['id']}/complete")
    if c3 not in (200, 204): raise SystemExit(f'complete gagal {c3}: {r3}')
    return init['url']


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--date', required=True, help='tanggal tayang (WIB), mis. 2026-11-05')
    ap.add_argument('--username', default='kenalipolanya'); ap.add_argument('--account-id', default='69dcc12a84ebdfba15dfdcb1', help='ID akun Repliz (bawaan: Instagram @alamnurdiann). TikTok @kenalipolanya.id = 6aeb121dfc43f81b7855b2ff'); ap.add_argument('--dir', default='out3')
    ap.add_argument('--only', default='1,2,3,4,5,6'); ap.add_argument('--go', action='store_true')
    a = ap.parse_args()
    caps = captions()
    if a.account_id:
        code, info = call('GET', '/public/account/' + a.account_id)
        if code != 200 or not isinstance(info, dict):
            print(f'GAGAL cek akun {a.account_id}: HTTP {code} {info}'); sys.exit(1)
        print(f"Akun: {info.get('type')} @{info.get('username')} ({info.get('name')}) | terhubung: {info.get('isConnected')}")
        if not info.get('isConnected'): print('Akun belum terhubung di Repliz. Sambungkan dulu.'); sys.exit(1)
        acc = {'_id': a.account_id}
    else:
        acc = find_account(a.username)
    if not acc: sys.exit(1)
    plan = []
    for n in [int(x) for x in a.only.split(',')]:
        hh, mm = SLOTS[n - 1].split(':'); dt = datetime.fromisoformat(a.date).replace(hour=int(hh), minute=int(mm), tzinfo=WIB)
        plan.append((n, FILES[n - 1], dt.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:00.000Z'), caps.get(n, '')))
    print('\nRENCANA (%s):' % ('UPLOAD' if a.go else 'SIMULASI, tidak ada yang diposting'))
    for n, f, when, cap in plan: print(f'  video {n}: {f} -> {when} UTC | caption {len(cap)} karakter')
    if not a.go: print('\nJalankan lagi dengan --go untuk mengunggah dan menjadwalkan.'); return
    for n, f, when, cap in plan:
        p = os.path.join(HERE, a.dir, f); thumb = f'/tmp/thumb{n}.jpg'
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-ss', '18', '-i', p, '-frames:v', '1', thumb], check=True)
        vurl, turl = upload(p, 'video/mp4'), upload(thumb, 'image/jpeg')
        body = {'title': cap.split('\n')[0][:90], 'description': cap, 'topic': '', 'type': 'video',
                'medias': [{'alt': '', 'customThumbnail': True, 'type': 'video', 'thumbnail': turl, 'url': vurl}],
                'meta': {'title': '', 'description': '', 'url': ''},
                'additionalInfo': {'isAiGenerated': False, 'isDraft': False, 'isAutoAddMusic': False, 'isShareToFeed': False, 'privacy': 'public',
                                   'trialParams': {'graduationStrategy': ''}, 'collaborators': [], 'products': [], 'tags': [], 'mentions': [], 'targetCountries': []},
                'replies': [], 'accountId': acc['_id'], 'scheduleAt': when}
        code, res = call('POST', '/public/schedule', body)
        print(f'video {n}: HTTP {code}', res if code >= 300 else 'terjadwal')


if __name__ == '__main__':
    main()
