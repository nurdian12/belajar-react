"""Ganti hook (cover + caption) postingan yang masih pending: buat jadwal baru (cover baru + 7 slide lama), verifikasi, lalu hapus yang lama."""
import json, os, sys, time
from datetime import datetime, timedelta, timezone
sys.argv = ['x']
import post_series_v8 as P
HERE = P.HERE; STATE = os.path.join(HERE, 'schedule_state_v9.json')
state = json.load(open(STATE)) if os.path.exists(STATE) else {}
items = []
for tag, sf, md in (('v7', 'schedule_state_v7.json', 'v7h'), ('v8', 'schedule_state_v8.json', 'v8h')):
    st = json.load(open(os.path.join(HERE, sf))); man = json.load(open(os.path.join(HERE, md, 'manifest.json')))
    for k, v in st.items(): items.append((v['scheduleAt'], tag + ':' + k, v['id'], man[int(k) - 1], md))
items.sort()
limit = (datetime.now(timezone.utc) + timedelta(minutes=20)).strftime('%Y-%m-%dT%H:%M')
done = skip = 0
for when, key, oid, m, md in items:
    if key in state: continue
    if when[:16] < limit: print('LEWATI (terlalu dekat/terlewat):', key, when); skip += 1; continue
    c, old = P.call('GET', '/public/schedule/' + oid)
    if c != 200 or old.get('status') != 'pending': print('LEWATI (bukan pending):', key, c, old.get('status') if isinstance(old, dict) else old); skip += 1; continue
    cover = P.upload(os.path.join(HERE, md, 'slides', m['files'][0]), 'image/jpeg')
    medias = [dict(x) for x in old['medias']]; medias[0]['url'] = cover
    body = {'title': '', 'description': m['caption'], 'topic': '', 'type': 'album', 'medias': medias,
            'meta': {'title': '', 'description': '', 'url': ''},
            'additionalInfo': {'isAiGenerated': False, 'isDraft': False, 'isAutoAddMusic': False, 'isShareToFeed': False, 'privacy': 'public', 'trialParams': {'graduationStrategy': ''}, 'collaborators': [], 'products': [], 'tags': [], 'mentions': [], 'targetCountries': []},
            'replies': [], 'accountId': P.ACCOUNT, 'scheduleAt': old['scheduleAt']}
    c, res = P.call('POST', '/public/schedule', body)
    if c >= 300: print('GAGAL buat', key, c, res); sys.exit(2)
    nid = res.get('scheduleId') or res.get('id') or res.get('_id') or (res.get('data') or {}).get('_id')
    c2, chk = P.call('GET', '/public/schedule/' + nid)
    ok = c2 == 200 and chk.get('status') == 'pending' and len(chk.get('medias', [])) == len(old['medias']) and chk.get('scheduleAt', '')[:16] == old['scheduleAt'][:16] and chk.get('description', '').startswith(m['caption'][:20])
    if not ok: print('VERIFIKASI GAGAL', key, nid); sys.exit(3)
    c3, _ = P.call('DELETE', '/public/schedule/' + oid)
    state[key] = {'id': nid, 'old': oid, 'scheduleAt': old['scheduleAt'], 'deleted_old': c3 in (200, 204)}
    json.dump(state, open(STATE, 'w'), indent=1); done += 1
    print('GANTI:', key, old['scheduleAt'], m['title'][:50], 'hapus lama', c3)
print('selesai', done, 'dilewati', skip)
