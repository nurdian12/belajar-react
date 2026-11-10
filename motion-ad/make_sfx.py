import numpy as np, wave
SR=44100; DUR=25.0
mix=np.zeros(int(SR*DUR)+SR)
rng=np.random.default_rng(7)

def put(t0,sig,g=1.0):
    i=int(t0*SR); mix[i:i+len(sig)]+=sig[:len(mix)-i]*g

def lp(x,fc):  # one-pole lowpass, fc scalar or array
    fc=np.broadcast_to(fc,x.shape); a=1-np.exp(-2*np.pi*fc/SR); y=np.empty_like(x); s=0.0
    for n in range(len(x)):
        s+=a[n]*(x[n]-s); y[n]=s
    return y

def whoosh(t0,dur=.5,g=.4,f0=250,f1=5000):
    n=int(SR*dur); x=rng.standard_normal(n)
    ph=np.linspace(0,1,n); fc=f0+(f1-f0)*np.sin(np.pi*ph)**1.5
    y=lp(x,fc); y-=lp(y,150)
    env=np.sin(np.pi*ph)**2
    y=y*env; y/=np.max(np.abs(y))+1e-9; put(t0,y,g)

def pop(t0,f=700,g=.5,dur=.14):
    n=int(SR*dur); t=np.arange(n)/SR
    fr=f*(1-.45*t/dur); ph=2*np.pi*np.cumsum(fr)/SR
    put(t0,np.sin(ph)*np.exp(-t/.035)*(1-np.exp(-t/.001)),g)

def tick(t0,g=.35):
    n=int(SR*.03); t=np.arange(n)/SR
    x=rng.standard_normal(n); x-=lp(x,1500)
    put(t0,(x*np.exp(-t/.004)*3+np.sin(2*np.pi*2400*t)*np.exp(-t/.006)),g*.5)

def ding(t0,f=880,g=.3,dur=.9):
    n=int(SR*dur); t=np.arange(n)/SR
    y=(np.sin(2*np.pi*f*t)+.35*np.sin(2*np.pi*2*f*t)+.15*np.sin(2*np.pi*3.01*f*t))*np.exp(-t/.28)
    put(t0,y*(1-np.exp(-t/.002)),g)

def thud(t0,f=110,g=.5,dur=.35):
    n=int(SR*dur); t=np.arange(n)/SR
    ph=2*np.pi*np.cumsum(f*(1-.4*t/dur))/SR
    put(t0,np.sin(ph)*np.exp(-t/.09)*(1-np.exp(-t/.002)),g)

# --- timeline (sinkron dengan animasi di ad.html) ---
# Scene 1
for i,t in enumerate([.15,.37,.59,.81]): whoosh(t,.32,.2,300,3500)
whoosh(1.1,1.5,.38,200,2200)                      # mobil lewat
# transisi scene
for t in [3.25,7.05,11.85,16.05,21.85]: whoosh(t,.5,.34,250,4500)
# Scene 2
whoosh(3.5,.35,.18); pop(4.0,700,.35)
for k in range(21): tick(4.3+k*(1.3/21))
for t,f in [(5.7,800),(5.95,900),(6.2,1000)]: pop(t,f,.3)
pop(6.45,600,.4); thud(6.6,95,.55); thud(6.95,85,.35)
# Scene 3
whoosh(7.3,.35,.18)
whoosh(8.0,.55,.32,300,3000); pop(8.55,520,.4)
whoosh(9.0,.5,.3,300,3500); pop(9.55,640,.4)
# Scene 4
whoosh(12.1,.35,.18)
for t,f in zip([12.7,13.2,13.7,14.2],[880,988,1109,1319]):
    whoosh(t,.3,.2,300,3000); ding(t+.45,f,.28)
# Scene 5
whoosh(16.3,.35,.18); pop(16.9,500,.45)
pop(17.75,820,.4); tick(17.75,.3)                 # terkirim
pop(18.75,520,.4); pop(18.85,680,.4)              # diterima
pop(19.95,820,.4); tick(19.95,.3)
pop(20.75,520,.4); pop(20.85,680,.4)
ding(20.95,1175,.18,.6)
# Scene 6
whoosh(22.2,.4,.28); whoosh(22.45,.4,.24)
whoosh(23.0,.35,.16); pop(23.55,480,.55,.2)
for f in (1047,1319,1568): ding(24.0,f,.17,1.0)
pop(24.35,400,.3)

mix=mix[:int(SR*DUR)]
fade=int(SR*.5); mix[-fade:]*=np.linspace(1,0,fade)
mix=np.tanh(mix*1.2)                              # soft limiter
mix*=0.85/np.max(np.abs(mix))
pcm=(mix*32767).astype('<i2')
with wave.open('sfx.wav','wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('ok',len(mix)/SR,'s')
