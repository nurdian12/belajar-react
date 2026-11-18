"""Ganti isi 62 postingan pending ke format tweet + skrip (6 slide): buat jadwal baru, verifikasi, lalu hapus yang lama."""
import json, os, sys
from datetime import datetime, timedelta, timezone
sys.argv = ['x']
import post_series_v8 as P
HERE = P.HERE; CHAT = os.path.join(HERE, '..', 'gaya-chat', 'v10')
STATE = os.path.join(HERE, 'schedule_state_v10.json')
state = json.load(open(STATE)) if os.path.exists(STATE) else {}
new = {m['id']: m for m in json.load(open(os.path.join(CHAT, 'manifest.json')))}
cur = json.load(open(os.path.join(HERE, 'schedule_state_v9.json')))
ids = {}
for tag, md in (('v7', 'v7h'), ('v8', 'v8h')):
    man = json.load(open(os.path.join(HERE, md, 'manifest.json')))
    for k, m in enumerate(man, 1): ids[f'{tag}:{k}'] = m['n']
items = sorted((v['scheduleAt'], ids[k], v['id']) for k, v in cur.items())
limit = (datetime.now(timezone.utc) + timedelta(minutes=20)).strftime('%Y-%m-%dT%H:%M')
done = skip = 0
for when, pid, oid in items:
    if str(pid) in state: continue
    if when[:16] < limit: print('LEWATI (terlalu dekat/terlewat):', pid, when); skip += 1; continue
    if pid not in new: print('LEWATI (tidak ada konten baru):', pid); skip += 1; continue
    c, old = P.call('GET', '/public/schedule/' + oid)
    if c != 200 or old.get('status') != 'pending': print('LEWATI (bukan pending):', pid, c, old.get('status') if isinstance(old, dict) else old); skip += 1; continue
    m = new[pid]
    urls = [P.upload(os.path.join(CHAT, 'slides', f), 'image/jpeg') for f in m['files']]
    tmpl = old['medias'][0]
    medias = []
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
    state[str(pid)] = {'id': nid, 'old': oid, 'scheduleAt': old['scheduleAt'], 'deleted_old': c3 in (200, 204)}
    json.dump(state, open(STATE, 'w'), indent=1); done += 1
    print('GANTI:', pid, old['scheduleAt'], m['caption'][:45].replace('\n', ' '), 'hapus lama', c3)
print('selesai', done, 'dilewati', skip)
