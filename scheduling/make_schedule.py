import json,sys,random,itertools,subprocess,time,datetime as dt
VIDEO='https://storage.repliz.com/uploads/69cfd7aafcfb33df529d325a/11e3e8f7-bb0f-4c89-98a8-7ec0861206af.mp4'
S=json.load(open('slide_urls.json'))
ACC={'IGA':('69dcc12a84ebdfba15dfdcb1','instagram','IG alamnurdiann'),
     'FBA':('6af9b531fc43f81b7893487d','facebook','FB Animasiredflag'),
     'FBN':('6ae9b1a2fc43f81b78518c4d','facebook','FB Netraya Media')}
SLOTS=[(7,30),(12,0),(16,30),(19,30),(21,0)]
START=dt.date(2026,11,18); DAYS=30
CYCLE=['V','C1','C2']
# ---- pool caption
P={
'V':dict(
 hooks=["Punya usaha, tapi belum punya website? 🚀","Calon pelangganmu cari di Google dulu, baru memutuskan. 🔍","Pernah merasa bisnis bagus tapi sepi yang tahu? 🚗","Bisnismu sudah tampil profesional di internet? 💻","Website bukan sekadar tampilan bagus. Ia bekerja untuk bisnismu 24 jam. ⏰","Dengar langsung dari klien kami. 💬"],
 bodies=["Kalau bisnismu tidak muncul di Google, calon pelanggan bisa pindah ke pesaing yang sudah punya website.","Di video ini ada testimoni nyata dari klien rental mobil, dibagikan dengan izin klien. 🙏","Website membantu bisnis tampil rapi, nyaman dibuka dari HP, dan punya tombol WhatsApp langsung ke kamu.","Kami bantu bikinkan website supaya calon pelanggan bisa lihat layananmu dan menghubungi langsung."],
 ctas=['Mau website untuk usahamu? DM kata "WEBSITE". 📩','Ceritakan bisnismu di komentar, kita bahas bareng. 👇','Simpan postingan ini, siapa tahu butuh nanti. 📌','Kirim ke teman yang baru merintis usaha. 🔁'],
 tags=["#JasaPembuatanWebsite #WebsiteUMKM #BisnisOnline #WebsiteProfesional","#WebsiteBisnis #JasaWebsite #UMKMIndonesia #TipsBisnis","#BuatWebsite #DigitalBisnis #UMKMNaikKelas #Testimoni","#WebsiteRentalMobil #CeritaKlien #BisnisLokal #JasaWebsiteIndonesia"]),
'C1':dict(
 hooks=["Pernah hitung berapa jam sebulan habis untuk membalas chat yang sama? ⏰","30 chat × 5 menit × 24 hari kerja = 60 jam. 😮","Kamu bukan kurang rajin, kerjaannya yang berulang. 🙌","Kerjaan berulang itu bisa jalan sendiri. ⚙️"],
 bodies=["Itu lebih dari 7 hari kerja penuh, hanya untuk pesan yang jawabannya itu-itu saja (hitungan contoh).","Pesanan dicatat manual, invoice diketik ulang, follow-up terlewat. Semua bisa diotomatisasi pakai n8n, Make, dan ChatGPT.","Aturan gampang: tugas yang kamu ulang lebih dari 3x seminggu dengan langkah yang sama layak diotomatisasi.","Contoh alurnya: form pesanan → Google Sheets → ChatGPT menulis balasan → terkirim ke WhatsApp."],
 ctas=['Geser untuk contohnya. 👉','📌 Simpan, 💬 komen kerjaan yang paling capek, 📩 DM "OTOMATIS" kalau mau dibantu.','Kerjaan apa yang paling menyita waktumu? Tulis di komentar. 👇','Bagikan ke teman yang masih serba manual. 🔁'],
 tags=["#AIAutomation #Otomatisasi #n8n #ChatGPT #UMKM","#MakeAutomation #Produktivitas #BisnisOnline #PemilikBisnis","#AutomasiBisnis #TipsBisnis #FreelancerIndonesia #DigitalBisnis","#WorkflowAutomation #HematWaktu #UsahaKecil #TeknologiBisnis"]),
'C2':dict(
 hooks=["Kerjaan apa di bisnismu yang rasanya diulang terus tiap hari? 🔁","5 kerjaan UMKM yang bisa jalan sendiri. ⚙️","Tidak perlu mengotomatisasi semuanya sekaligus. Pilih 1 dulu. ☝️"],
 bodies=["Balas chat yang sama, catat pesanan dan rekap, follow-up dan tagihan, jadwal konten, laporan mingguan.","Mulai dari yang paling sering diulang, lalu lanjut ke yang lain.","Geser untuk lihat cara manual vs pakai otomatisasi untuk tiap kerjaan.","Pakai alat seperti n8n, Make, ChatGPT, dan Google Sheets, tanpa harus jadi programmer."],
 ctas=['📌 Simpan sebagai checklist, 💬 komen nomor yang mau kamu otomatiskan duluan.','Mau dibantu? DM kata "OTOMATIS". 📩','Yang mana duluan menurutmu? Tulis nomornya di komentar. 👇','Kirim ke teman yang punya usaha. 🔁'],
 tags=["#AIAutomation #UMKM #n8n #Produktivitas #BisnisOnline","#Otomatisasi #MakeAutomation #ChatGPT #TipsBisnis","#AutomasiBisnis #PemilikBisnis #FreelancerIndonesia #UsahaKecil","#DigitalBisnis #HematWaktu #WorkflowAutomation #UMKMNaikKelas"]),
}
def combos(a):
    p=P[a]; out=[]
    for h in range(len(p['hooks'])):
        for b1,b2 in itertools.permutations(range(len(p['bodies'])),2):
            for c in range(len(p['ctas'])):
                for t in range(len(p['tags'])): out.append((h,b1,b2,c,t))
    random.Random(hash(a)%1000+42 if False else {'V':1,'C1':2,'C2':3}[a]).shuffle(out); return out
POOL={a:combos(a) for a in P}
def caption(asset,k,plat):
    h,b1,b2,c,t=POOL[asset][k%len(POOL[asset])]; p=P[asset]
    tags=p['tags'][t]
    if plat=='facebook': tags=' '.join(tags.split()[:4])
    return f"{p['hooks'][h]}\n\n{p['bodies'][b1]} {p['bodies'][b2]}\n\n{p['ctas'][c]}\n\n{tags}"
def day_sequence(d):
    pat=[{'IGA':2,'FBA':2,'FBN':1},{'IGA':1,'FBA':2,'FBN':2},{'IGA':2,'FBA':1,'FBN':2}][d%3]
    rem=dict(pat); seq=[]; prev=None
    for _ in range(5):
        order=sorted(rem,key=lambda a:(-rem[a],a==prev))
        a=next(x for x in order if rem[x]>0 and x!=prev) if any(rem[x]>0 and x!=prev for x in rem) else next(x for x in order if rem[x]>0)
        seq.append(a); rem[a]-=1; prev=a
    return seq
def build():
    plan=[]; use={a:0 for a in ACC}; use['IGA']=1; ncap={(a,s):0 for a in ACC for s in P}
    for d in range(DAYS):
        date=START+dt.timedelta(days=d); seq=day_sequence(d)
        for i,a in enumerate(seq):
            hh,mm=SLOTS[i]; mm+=(d*7+i*3)%12
            if date==START and i!=1: continue          # 18 Nov: sudah ada 4 jadwal, tambah 1 saja (12:00)
            if date==START: a='IGA'
            asset=CYCLE[use[a]%3]; use[a]+=1
            plat=ACC[a][1]; k=ncap[(a,asset)]+{'IGA':0,'FBA':7,'FBN':13}[a]; ncap[(a,asset)]+=1
            if asset=='V':
                body=dict(type='reel',medias=[dict(type='video',url=VIDEO,thumbnail='',customThumbnail=False,alt='')],
                          additionalInfo={'isShareToFeed':True} if plat=='instagram' else {'isAiGenerated':False})
            else:
                body=dict(type='album',medias=[dict(type='image',url=u,thumbnail='',customThumbnail=False,alt='') for u in S[asset.lower()]],additionalInfo={})
            body.update(title='',topic='',replies=[],description=caption(asset,k,plat),accountId=ACC[a][0],
                        scheduleAt=f"{date.isoformat()}T{hh:02d}:{mm:02d}:00+07:00")
            plan.append(dict(acc=a,asset=asset,body=body))
    return plan
def post(body):
    r=subprocess.run(['curl','-sS','-m','60','-X','POST','https://api.repliz.com/public/schedule','-H','Content-Type: application/json','-d',json.dumps(body),'-w','\n%{http_code}'],capture_output=True,text=True)
    out,_,code=r.stdout.rpartition('\n'); return code,out
if __name__=='__main__':
    plan=build()
    if sys.argv[1]=='dry':
        from collections import Counter
        print('total',len(plan)); print(Counter(p['acc'] for p in plan)); print(Counter(p['asset'] for p in plan))
        print(Counter(p['body']['scheduleAt'][:10] for p in plan).most_common(3))
        print('caption terpanjang',max(len(p['body']['description']) for p in plan),'| hashtag terbanyak',max(p['body']['description'].count('#') for p in plan))
        for a in ACC:
            for s in P:
                cs=[p['body']['description'] for p in plan if p['acc']==a and p['asset']==s]
                assert len(cs)==len(set(cs)),('duplikat',a,s)
        print('semua caption unik per akun+konten: OK')
        json.dump([dict(acc=p['acc'],asset=p['asset'],at=p['body']['scheduleAt']) for p in plan],open('plan_summary.json','w'),indent=1)
        for p in (plan[0],plan[1],plan[5]): print('---',p['acc'],p['asset'],p['body']['type'],p['body']['scheduleAt']); print(p['body']['description'])
    else:
        lo,hi=int(sys.argv[2]),int(sys.argv[3]); res=json.load(open('created.json')) if __import__('os').path.exists('created.json') else {}
        for i in range(lo,min(hi,len(plan))):
            if str(i) in res: continue
            code,out=post(plan[i]['body'])
            if code!='201': print('GAGAL',i,code,out[:200]); break
            res[str(i)]=dict(id=json.loads(out)['scheduleId'],acc=plan[i]['acc'],asset=plan[i]['asset'],at=plan[i]['body']['scheduleAt'])
            json.dump(res,open('created.json','w'),indent=1); time.sleep(0.4)
        print('dibuat',len(res))
