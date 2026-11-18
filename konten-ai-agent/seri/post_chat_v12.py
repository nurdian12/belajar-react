"""Jadwalkan 85 carousel model chat (id 71-155) ke IG @alamnurdiann: 1-17 Des 2026, 5 per hari (07, 12, 16, 19, 21 WIB). Aman diulang."""
import json, os, sys, time
from datetime import datetime, timedelta, timezone
sys.argv = ['x']
import post_series_v8 as P
HERE = P.HERE; CHAT = os.path.join(HERE, '..', 'gaya-chat', 'v15')
STATE = os.path.join(HERE, 'schedule_state_v12.json')
state = json.load(open(STATE)) if os.path.exists(STATE) else {}
man = {m['id']: m for m in json.load(open(os.path.join(CHAT, 'manifest.json')))}
groups = [range(71, 85), range(85, 100), range(100, 115), range(115, 130), range(130, 140), range(140, 150), range(150, 156)]
order = []
for i in range(15):
    for g in groups:
        if i < len(g): order.append(list(g)[i])
assert len(order) == 85 and len(set(order)) == 85
WIB = timezone(timedelta(hours=7)); SLOTS = ['07:00', '12:00', '16:00', '19:00', '21:00']
times = []
day = datetime(2026, 12, 1, tzinfo=WIB)
while len(times) < 85:
    for sl in SLOTS:
        hh, mm = sl.split(':'); times.append(day.replace(hour=int(hh), minute=int(mm)))
    day += timedelta(days=1)
code, info = P.call('GET', '/public/account/' + P.ACCOUNT)
if code != 200 or not info.get('isConnected'): print('Akun Instagram tidak terhubung'); sys.exit(1)
def up(path):
    for a in range(4):
        try: return P.upload(path, 'image/jpeg')
        except Exception as e:
            print('ulang upload', os.path.basename(path), str(e)[:60].replace('\n', ' ')); time.sleep(3 * (a + 1))
    raise SystemExit('upload gagal berulang: ' + path)
go = '--go' in os.environ.get('MODE', '')
for pid, t in zip(order, times):
    when = t.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:00.000Z'); m = man[pid]
    if str(pid) in state: continue
    if not go: print('SIMULASI:', pid, t.strftime('%d %b %H:%M'), m['caption'].split('\n')[0][:50]); continue
    urls = [up(os.path.join(CHAT, 'slides', f)) for f in m['files']]
    medias = [{'alt': '', 'customThumbnail': False, 'type': 'image', 'thumbnail': '', 'url': u} for u in urls]
    body = {'title': '', 'description': m['caption'], 'topic': '', 'type': 'album', 'medias': medias,
            'meta': {'title': '', 'description': '', 'url': ''},
            'additionalInfo': {'isAiGenerated': False, 'isDraft': False, 'isAutoAddMusic': False, 'isShareToFeed': False, 'privacy': 'public', 'trialParams': {'graduationStrategy': ''}, 'collaborators': [], 'products': [], 'tags': [], 'mentions': [], 'targetCountries': []},
            'replies': [], 'accountId': P.ACCOUNT, 'scheduleAt': when}
    c, res = P.call('POST', '/public/schedule', body)
    if c >= 300: print('GAGAL', pid, c, res); sys.exit(2)
    sid = res.get('scheduleId') or res.get('id') or res.get('_id') or (res.get('data') or {}).get('_id')
    state[str(pid)] = {'id': sid, 'scheduleAt': when}
    json.dump(state, open(STATE, 'w'), indent=1); print('TERJADWAL:', pid, when, m['caption'].split('\n')[0][:50], sid)
print('selesai', len(state))
