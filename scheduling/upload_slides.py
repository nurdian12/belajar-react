import json,subprocess,os,sys
BASE='/home/user/belajar-react'
def curl(args):
    r=subprocess.run(['curl','-sS','-m','90']+args,capture_output=True,text=True); return r.stdout,r.returncode,r.stderr
def upload(path,mime):
    size=os.path.getsize(path)
    out,rc,err=curl(['-X','POST','https://api.repliz.com/public/storage/file/init','-H','Content-Type: application/json','-d',json.dumps({'filename':os.path.basename(path)+'','size':size,'mimetype':mime})])
    d=json.loads(out)
    out,rc,err=curl(['-X','PUT',d['upload'],'-H','Content-Type: '+mime,'--data-binary','@'+path,'-o','/dev/null','-w','%{http_code}'])
    assert out=='200',(out,err)
    out,rc,err=curl(['-X','POST',f"https://api.repliz.com/public/storage/file/{d['id']}/complete",'-o','/dev/null','-w','%{http_code}'])
    assert out in('200','204'),(out,err)
    return d['url']
res={}
for name,folder in (('c1','carousel'),('c2','carousel2')):
    res[name]=[]
    for i in range(1,7):
        p=f'{BASE}/{folder}/slide-{i}.png'
        url=upload(p,'image/png'); res[name].append(url); print(name,i,'ok')
json.dump(res,open('slide_urls.json','w'),indent=1)
