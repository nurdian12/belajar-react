"""Jadwalkan 100 video animasi (video/NNN.mp4) ke fanpage Facebook 'Financial freedom' (Repliz), 5 postingan per hari.
  python3 jadwal_fb.py                 # simulasi (tanpa mengunggah)
  python3 jadwal_fb.py --go --limit 1  # unggah + jadwalkan 1 postingan pertama (uji)
  python3 jadwal_fb.py --go            # semua (aman diulang, tidak membuat jadwal ganda)
Slot 07.00, 12.00, 16.00, 19.00, 21.00 WIB. Status di schedule_state.json."""
import argparse, json, os, ssl, subprocess, sys, time, urllib.request, urllib.error
from datetime import datetime, timedelta, timezone

API = 'https://api.repliz.com'; HERE = os.path.dirname(os.path.abspath(__file__))
ACCOUNT = '6b03ca0bfc43f81b78b9ea9b'   # Facebook "Financial freedom"
CTX = ssl.create_default_context(cafile=os.environ.get('SSL_CERT_FILE') or '/root/.ccr/ca-bundle.crt')
STATE = os.path.join(HERE, 'schedule_state.json')
SLOTS_WIB = ['07:00', '12:00', '16:00', '19:00', '21:00']
WIB = timezone(timedelta(hours=7))

def call(method, path, body=None, raw=None, headers=None, absolute=False):
    url = path if absolute else API + path
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    h = dict(headers or {})
    if body is not None: h['Content-Type'] = 'application/json'
    req = urllib.request.Request(url, data=data, method=method, headers=h)
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=120, context=CTX) as r:
                t = r.read().decode() or ''
                return r.status, (json.loads(t) if t.strip()[:1] in ('{', '[') else t)
        except urllib.error.HTTPError as e:
            t = e.read().decode(errors='ignore')
            try: j = json.loads(t)
            except Exception: j = t
            if e.code >= 500 and attempt < 2: time.sleep(2 * (attempt + 1)); continue
            return e.code, j
        except Exception as e:
            if attempt < 2: time.sleep(2 * (attempt + 1)); continue
            return 0, str(e)

def upload(path, mimetype='image/jpeg'):
    size = os.path.getsize(path)
    code, init = call('POST', '/public/storage/file/init', {'filename': 'ff-' + os.path.basename(path), 'size': size, 'mimetype': mimetype})
    if code not in (200, 201): raise RuntimeError(f'init gagal {code}: {init}')
    c2, r2 = call('PUT', init['upload'], raw=open(path, 'rb').read(), headers={'Content-Type': mimetype}, absolute=True)
    if c2 not in (200, 204): raise RuntimeError(f'PUT gagal {c2}: {r2}')
    c3, r3 = call('POST', f"/public/storage/file/{init['id']}/complete")
    if c3 not in (200, 204): raise RuntimeError(f'complete gagal {c3}: {r3}')
    return init['url']

def slot_times(n, start):
    times, day = [], start.replace(hour=0, minute=0, second=0, microsecond=0)
    while len(times) < n:
        for sl in SLOTS_WIB:
            hh, mm = sl.split(':'); t = day.replace(hour=int(hh), minute=int(mm))
            if t >= start: times.append(t)
        day += timedelta(days=1)
    return times[:n]

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--go', action='store_true'); ap.add_argument('--limit', type=int, default=0)
    ap.add_argument('--start', default='')  # ISO WIB, bawaan: 30 menit dari sekarang
    a = ap.parse_args()
    manifest = json.load(open(os.path.join(HERE, 'manifest.json'), encoding='utf8'))
    state = json.load(open(STATE)) if os.path.exists(STATE) else {}
    code, info = call('GET', '/public/account/' + ACCOUNT)
    if code != 200 or not info.get('isConnected'): print('Akun Facebook tidak terhubung:', code, info); sys.exit(1)
    print(f"Akun: {info.get('type')} | {info.get('name')} | @{info.get('username')} | terhubung: {info.get('isConnected')}")
    start = datetime.fromisoformat(a.start).replace(tzinfo=WIB) if a.start else datetime.now(WIB) + timedelta(minutes=30)
    times = slot_times(len(manifest), start)
    done = 0
    for m, t in zip(manifest, times):
        key = str(m['n']); when = t.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:00.000Z')
        tag = f"post {m['n']:03d} | {m['kategori']} | {t:%d %b %H:%M} WIB | {m['hook'][:44]}"
        if key in state: print('LEWATI (sudah terjadwal):', tag, state[key]['id']); continue
        if a.limit and done >= a.limit: break
        if not a.go: print('SIMULASI:', tag); continue
        vp = os.path.join(HERE, 'video', f"{m['n']:03d}.mp4")
        if not os.path.exists(vp): print('VIDEO BELUM ADA, berhenti di', tag); break
        thumb = f"/tmp/ff-thumb-{m['n']:03d}.jpg"
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-ss', '1.6', '-i', vp, '-frames:v', '1', '-q:v', '3', thumb], check=True)
        vurl, turl = upload(vp, 'video/mp4'), upload(thumb, 'image/jpeg')
        body = {'title': m['hook'][:90], 'description': m['caption'], 'topic': '', 'type': 'video',
                'medias': [{'alt': '', 'customThumbnail': True, 'type': 'video', 'thumbnail': turl, 'url': vurl}],
                'meta': {'title': '', 'description': '', 'url': ''},
                'additionalInfo': {'isAiGenerated': False, 'isDraft': False, 'isAutoAddMusic': False, 'isShareToFeed': False, 'privacy': 'public', 'trialParams': {'graduationStrategy': ''}, 'collaborators': [], 'products': [], 'tags': [], 'mentions': [], 'targetCountries': []},
                'replies': [], 'accountId': ACCOUNT, 'scheduleAt': when}
        code, res = call('POST', '/public/schedule', body)
        if code >= 300: print('GAGAL', tag, code, res); sys.exit(2)
        sid = (res.get('scheduleId') or res.get('id') or res.get('_id') or (res.get('data') or {}).get('_id')) if isinstance(res, dict) else None
        state[key] = {'id': sid, 'scheduleAt': when, 'raw': res if not sid else None}
        json.dump(state, open(STATE, 'w'), indent=1); print('TERJADWAL:', tag, sid); done += 1
if __name__ == '__main__': main()
