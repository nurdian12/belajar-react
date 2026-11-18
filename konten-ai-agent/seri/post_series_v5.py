"""Jadwalkan carousel seri AI agent (gaya putih-merah v4) ke Instagram @alamnurdiann lewat Repliz, N postingan per hari.
  python3 post_series.py --start 2026-11-18                 # simulasi
  python3 post_series.py --start 2026-11-18 --go --days 1   # unggah + jadwalkan hari ke-1
  python3 post_series.py --start 2026-11-18 --go            # semua 30 hari (aman diulang, tidak membuat jadwal ganda)
Tayang 19.00 WIB (12.00 UTC) tiap hari. Status disimpan di schedule_state.json."""
import argparse, json, os, ssl, sys, time, urllib.request, urllib.error
from datetime import datetime, timedelta, timezone

API = 'https://api.repliz.com'; HERE = os.path.dirname(os.path.abspath(__file__))
ACCOUNT = '69dcc12a84ebdfba15dfdcb1'   # Instagram @alamnurdiann
CTX = ssl.create_default_context(cafile=os.environ.get('SSL_CERT_FILE') or '/root/.ccr/ca-bundle.crt')
STATE = os.path.join(HERE, 'schedule_state_v5.json')
SLOTS_WIB = ['07:00', '12:00', '16:00', '19:00', '21:00']

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
    code, init = call('POST', '/public/storage/file/init', {'filename': 'v5-' + os.path.basename(path), 'size': size, 'mimetype': mimetype})
    if code not in (200, 201): raise RuntimeError(f'init gagal {code}: {init}')
    c2, r2 = call('PUT', init['upload'], raw=open(path, 'rb').read(), headers={'Content-Type': mimetype}, absolute=True)
    if c2 not in (200, 204): raise RuntimeError(f'PUT gagal {c2}: {r2}')
    c3, r3 = call('POST', f"/public/storage/file/{init['id']}/complete")
    if c3 not in (200, 204): raise RuntimeError(f'complete gagal {c3}: {r3}')
    return init['url']

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--go', action='store_true'); ap.add_argument('--days', default='all')
    a = ap.parse_args()
    manifest = json.load(open(os.path.join(HERE, 'v5', 'manifest.json')))
    state = json.load(open(STATE)) if os.path.exists(STATE) else {}
    code, info = call('GET', '/public/account/' + ACCOUNT)
    if code != 200 or not info.get('isConnected'): print('Akun Instagram tidak terhubung:', code, info); sys.exit(1)
    print(f"Akun: {info.get('type')} @{info.get('username')} | terhubung: {info.get('isConnected')}")
    want = range(1, len(manifest) + 1) if a.days == 'all' else [int(x) for x in a.days.split(',')]
    WIB = timezone(timedelta(hours=7)); now = datetime(2026, 11, 25, 7, 30, tzinfo=WIB)  # setelah slot terakhir v4 (25 Nov 07.00)
    times = []; day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    while len(times) < len(manifest):
        for sl in SLOTS_WIB:
            hh, mm = sl.split(':'); t = day.replace(hour=int(hh), minute=int(mm))
            if t >= now: times.append(t)
        day += timedelta(days=1)
    for d in want:
        m = manifest[d - 1]; t = times[d - 1]; di = (t.date() - times[0].date()).days
        when = t.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:00.000Z')
        tag = f"post {d:02d} (hari {di + 1}) | {m['kind']} #{m['n']} | {when} | {m['title'][:46]}"
        if str(d) in state: print('LEWATI (sudah terjadwal):', tag, state[str(d)]['id']); continue
        if not a.go: print('SIMULASI:', tag); continue
        urls = [upload(os.path.join(HERE, 'v5', 'slides', f), 'image/jpeg') for f in m['files']]
        body = {'title': '', 'description': m['caption'], 'topic': '', 'type': 'album',
                'medias': [{'alt': '', 'customThumbnail': False, 'type': 'image', 'thumbnail': '', 'url': u} for u in urls],
                'meta': {'title': '', 'description': '', 'url': ''},
                'additionalInfo': {'isAiGenerated': False, 'isDraft': False, 'isAutoAddMusic': False, 'isShareToFeed': False, 'privacy': 'public', 'trialParams': {'graduationStrategy': ''}, 'collaborators': [], 'products': [], 'tags': [], 'mentions': [], 'targetCountries': []},
                'replies': [], 'accountId': ACCOUNT, 'scheduleAt': when}
        code, res = call('POST', '/public/schedule', body)
        if code >= 300: print('GAGAL', tag, code, res); sys.exit(2)
        sid = res.get('scheduleId') or res.get('id') or res.get('_id') or (res.get('data') or {}).get('_id') if isinstance(res, dict) else None
        state[str(d)] = {'id': sid, 'scheduleAt': when, 'raw': res if not sid else None}
        json.dump(state, open(STATE, 'w'), indent=1); print('TERJADWAL:', tag, sid)
if __name__ == '__main__': main()
