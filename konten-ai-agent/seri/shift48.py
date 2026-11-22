"""Geser semua jadwal pending @alamnurdiann maju 48 jam (jam tayang sama). Buat jadwal baru dengan media dan caption yang sama, verifikasi, lalu hapus yang lama. Aman diulang."""
import json, os, sys
from datetime import datetime, timedelta, timezone
sys.argv = ['x']
import post_series_v8 as P
HERE = P.HERE; STATE = os.path.join(HERE, 'schedule_state_shift48.json')
state = json.load(open(STATE)) if os.path.exists(STATE) else {}
ids = []
for f in ('schedule_state_v14.json', 'schedule_state_v12.json', 'schedule_state_v13.json', 'schedule_state_brief.json', 'schedule_state_kasus.json'):
    p = os.path.join(HERE, f)
    if os.path.exists(p):
        for k, v in json.load(open(p)).items(): ids.append((v['scheduleAt'], v['id']))
now = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M')
todo = []
for when, oid in ids:
    if oid in state: continue
    c, r = P.call('GET', '/public/schedule/' + oid)
    if c != 200 or r.get('status') != 'pending' or r.get('scheduleAt', '')[:16] <= now: continue
    todo.append((r['scheduleAt'], oid, r))
todo.sort(reverse=True)  # yang paling akhir dulu, supaya tidak menabrak jadwal yang belum digeser
print('perlu digeser:', len(todo))
done = 0
for when, oid, old in todo:
    t = datetime.fromisoformat(old['scheduleAt'].replace('Z', '+00:00')) + timedelta(hours=48)
    new_at = t.strftime('%Y-%m-%dT%H:%M:00.000Z')
    body = {'title': old.get('title', ''), 'description': old.get('description', ''), 'topic': old.get('topic', ''), 'type': old['type'], 'medias': old['medias'],
            'meta': old.get('meta') or {'title': '', 'description': '', 'url': ''}, 'additionalInfo': old.get('additionalInfo') or {},
            'replies': old.get('replies') or [], 'accountId': old['accountId'], 'scheduleAt': new_at}
    c, res = P.call('POST', '/public/schedule', body)
    if c >= 300: print('GAGAL buat', oid, c, str(res)[:200]); sys.exit(2)
    nid = res.get('scheduleId') or res.get('id') or res.get('_id') or (res.get('data') or {}).get('_id')
    c2, chk = P.call('GET', '/public/schedule/' + nid)
    ok = c2 == 200 and chk.get('status') == 'pending' and len(chk.get('medias', [])) == len(old['medias']) and chk.get('scheduleAt', '')[:16] == new_at[:16] and chk.get('description') == old.get('description')
    if not ok: print('VERIFIKASI GAGAL', oid, nid); sys.exit(3)
    c3, _ = P.call('DELETE', '/public/schedule/' + oid)
    state[oid] = {'id': nid, 'old_at': old['scheduleAt'], 'new_at': new_at, 'deleted_old': c3 in (200, 204)}
    json.dump(state, open(STATE, 'w'), indent=1); done += 1
    if done % 10 == 0: print('digeser', done, 'dari', len(todo))
print('selesai', done)
