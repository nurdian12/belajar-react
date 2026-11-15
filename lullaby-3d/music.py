import numpy as np, wave
sr=44100; dur=33.0
out=np.zeros(int(sr*dur))
bpm=66; beat=60/bpm
# C major pentatonic lullaby, notes as semitones from C4 (None=rest), each 1 beat
mel=[7,12,16,14,12,9,7,None, 9,12,14,12,9,7,4,None,
     7,12,16,19,16,14,12,None, 14,12,9,7,4,7,0,None,
     7,12,16,14,12,9,7,None, 9,12,14,16,14,12,9,7,
     4,7,9,12,14,12,9,7, 4,5,4,2,0,None,None,None]
bass=[0,-5,-3,-7]
def tone(f,t0,d,amp,dec):
    n=int(sr*d); t=np.arange(n)/sr
    s=(np.sin(2*np.pi*f*t)+.35*np.sin(2*np.pi*2*f*t)+.12*np.sin(2*np.pi*3.01*f*t))*np.exp(-t*dec)
    s[:200]*=np.linspace(0,1,200)
    i=int(t0*sr); e=min(len(out),i+n); out[i:e]+=amp*s[:e-i]
for k,m in enumerate(mel):
    if m is None: continue
    t0=1.0+k*beat*0.75*1.0
    if t0>dur-2: break
    tone(261.63*2**(m/12),t0,2.5,.22,2.2)
for k in range(int(dur/(beat*3))):
    t0=k*beat*3
    b=bass[k%4]
    tone(261.63*2**((b-12)/12),t0,3,.14,.9)
    tone(261.63*2**((b+7-12)/12),t0+beat*.5,3,.07,.9)
# fade in/out
n=len(out); out*=np.minimum(1,np.arange(n)/(sr*2))*np.minimum(1,(n-np.arange(n))/(sr*3))
# simple echo
d=int(sr*.35); e2=out.copy(); e2[d:]+=.3*out[:-d]
e2/=np.abs(e2).max()/.8
w=wave.open('public/music.wav','wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
w.writeframes((e2*32767).astype(np.int16).tobytes()); w.close()
