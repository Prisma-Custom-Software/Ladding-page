import re,json,base64,gzip,sys,os
src=sys.argv[1]; out=sys.argv[2]
h=open(src,encoding='utf-8').read()
def blk(t):
    m=re.search(r'<script type="'+re.escape(t)+r'">(.*?)</script>',h,re.S); return m.group(1) if m else None
man=json.loads(blk('__bundler/manifest'))
tpl=json.loads(blk('__bundler/template'))
open(os.path.join(out,'template.html'),'w').write(tpl)
ext={'image/jpeg':'jpg','image/png':'png','text/javascript':'js','application/javascript':'js','text/html':'html','text/css':'css','image/svg+xml':'svg'}
for k,v in man.items():
    b=base64.b64decode(v['data'])
    if v.get('compressed'): b=gzip.decompress(b)
    e=ext.get(v['mime'],v['mime'].replace('/','_'))
    open(os.path.join(out,f"{k}.{e}"),'wb').write(b)
    print(k,v['mime'],len(b))
print('ext_resources:',(blk('__bundler/ext_resources') or '')[:500])
print('page_order:',blk('__bundler/page_order'))
