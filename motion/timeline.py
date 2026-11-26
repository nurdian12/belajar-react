import re, subprocess, json
wav = [l for l in __import__('glob').glob('/root/.claude/uploads/*/d47c*.wav')][0]
out = subprocess.run(['ffmpeg','-i',wav,'-af','silencedetect=noise=-32dB:d=0.3','-f','null','-'],capture_output=True,text=True).stderr
ends=[float(x) for x in re.findall(r'silence_end: ([\d.]+)',out)]
starts=[float(x) for x in re.findall(r'silence_start: ([\d.]+)',out)]
total=124.92
onsets=[0.0]+ends            # speech onsets
offs=starts+[total]          # speech offsets
segs=list(zip(onsets,offs))
lines=open('script.txt').read().strip().split('\n')
W=[len(l) for l in lines]; T=sum(W)
spk=sum(b-a for a,b in segs)
def speech_to_time(s):
    acc=0
    for a,b in segs:
        if acc+(b-a)>=s: return a+(s-acc)
        acc+=b-a
    return total
res=[];c=0;last=-1
for i,l in enumerate(lines):
    t=speech_to_time(spk*c/T)
    # snap to nearest onset
    cand=min(range(len(onsets)),key=lambda k:abs(onsets[k]-t))
    if cand<=last: cand=last+1
    last=cand
    res.append({'text':l,'t':round(onsets[cand],2)})
    c+=W[i]
for i,r in enumerate(res):
    r['end']=res[i+1]['t'] if i+1<len(res) else total
json.dump({'duration':total,'lines':res},open('timeline.json','w'),ensure_ascii=False,indent=1)
for r in res: print(r['t'],r['text'][:50])
