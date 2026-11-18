"""Ganti 60 postingan pending 19-30 Nov (v11) dengan carousel bertema tren (v17): buat jadwal baru, verifikasi, lalu hapus yang lama."""
import json, os, sys, time
from datetime import datetime, timedelta, timezone
sys.argv = ['x']
import post_series_v8 as P
HERE = P.HERE; CHAT = os.path.join(HERE, '..', 'gaya-chat', 'v17')
STATE = os.path.join(HERE, 'schedule_state_v14.json')
state = json.load(open(STATE)) if os.path.exists(STATE) else {}
new = {m['id']: m for m in json.load(open(os.path.join(CHAT, 'manifest.json')))}
groups = [range(171, 186), range(186, 198), range(198, 206), range(206, 214), range(214, 221), range(221, 227), range(227, 231)]
order = []
for i in range(15):
    for g in groups:
        if i < len(g): order.append(list(g)[i])
cur = json.load(open(os.path.join(HERE, 'schedule_state_v11.json')))
slots = sorted((v['scheduleAt'], v['id'], k) for k, v in cur.items())
assert len(order) == len(slots) == 60, (len(order), len(slots))
limit = (datetime.now(timezone.utc) + timedelta(minutes=20)).strftime('%Y-%m-%dT%H:%M')
def up(path):
    for a in range(4):
        try: return P.upload(path, 'image/jpeg')
        except Exception as e:
            print('ulang upload', os.path.basename(path), str(e)[:60].replace('\n', ' ')); time.sleep(3 * (a + 1))
    raise SystemExit('upload gagal berulang: ' + path)
done = skip = 0
for (when, oid, oldkey), pid in zip(slots, order):
    if str(pid) in state: continue
    if when[:16] < limit: print('LEWATI (terlalu dekat/terlewat):', pid, when); skip += 1; continue
    c, old = P.call('GET', '/public/schedule/' + oid)
    if c != 200 or old.get('status') != 'pending': print('LEWATI (bukan pending):', pid, c, old.get('status') if isinstance(old, dict) else old); skip += 1; continue
    m = new[pid]
    urls = [up(os.path.join(CHAT, 'slides', f)) for f in m['files']]
    tmpl = old['medias'][0]; medias = []
    for u in urls:
        x = dict(tmpl); x['url'] = u; medias.append(x)
    body = {'title': '', 'description': m['caption'], 'topic': '', 'type': 'album', 'medias': medias,
            'meta': {'title': '', 'description': '', 'url': ''},
            'additionalInfo': {'isAiGenerated': False, 'isDraft': False, 'isAutoAddMusic': False, 'isShareToFeed': False, 'privacy': 'public', 'trialParams': {'graduationStrategy': ''}, 'collaborators': [], 'products': [], 'tags': [], 'mentions': [], 'targetCountries': []},
            'replies': [], 'accountId': P.ACCOUNT, 'scheduleAt': old['scheduleAt']}
    c, res = P.call('POST', '/public/schedule', body)
    if c >= 300: print('GAGAL buat', pid, c, res); sys.exit(2)
    nid = res.get('scheduleId') or res.get('id') or res.get('_id') or (res.get('data') or {}).get('_id')
    c2, chk = P.call('GET', '/public/schedule/' + nid)
    ok = c2 == 200 and chk.get('status') == 'pending' and len(chk.get('medias', [])) == 6 and chk.get('scheduleAt', '')[:16] == old['scheduleAt'][:16] and chk.get('description', '').startswith(m['caption'][:20])
    if not ok: print('VERIFIKASI GAGAL', pid, nid); sys.exit(3)
    c3, _ = P.call('DELETE', '/public/schedule/' + oid)
    state[str(pid)] = {'id': nid, 'old': oid, 'old_key': oldkey, 'scheduleAt': old['scheduleAt'], 'deleted_old': c3 in (200, 204)}
    json.dump(state, open(STATE, 'w'), indent=1); done += 1
    print('GANTI:', pid, old['scheduleAt'], m['caption'].split('\n')[0][:45], 'hapus lama', c3)
print('selesai', done, 'dilewati', skip)
