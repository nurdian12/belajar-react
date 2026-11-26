"""Hentikan penjadwalan: cadangkan lalu hapus semua jadwal pending @alamnurdiann di Repliz. Aman diulang (jadwal yang sudah terhapus dilewati)."""
import json, os, sys
sys.argv = ['x']
import post_series_v8 as P
H = P.HERE; BK = os.path.join(H, 'backup_pending_2026-11-26.json'); ST = os.path.join(H, 'schedule_state_stop.json')
ids = json.load(open('/tmp/pending_ids.json')) if os.path.exists('/tmp/pending_ids.json') else []
backup = json.load(open(BK)) if os.path.exists(BK) else {}
for i in ids:  # 1) cadangkan dulu
    if i in backup: continue
    c, r = P.call('GET', '/public/schedule/' + i)
    if c == 200 and r.get('status') == 'pending': backup[i] = r
json.dump(backup, open(BK, 'w'), ensure_ascii=False)
print('dicadangkan:', len(backup))
state = json.load(open(ST)) if os.path.exists(ST) else {}
for i in list(backup):  # 2) hapus
    if state.get(i) == 'deleted': continue
    c, _ = P.call('DELETE', '/public/schedule/' + i)
    if c not in (200, 204): print('GAGAL hapus', i, c); continue
    c2, r2 = P.call('GET', '/public/schedule/' + i)
    state[i] = 'deleted' if (c2 == 404 or (c2 == 200 and r2.get('status') != 'pending')) else 'cek'
    json.dump(state, open(ST, 'w'), indent=1)
from collections import Counter
print(Counter(state.values()))
