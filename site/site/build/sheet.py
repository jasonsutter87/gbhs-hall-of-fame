import os, sys, hashlib
from PIL import Image, ImageDraw, ImageOps
try:
    import pillow_heif; pillow_heif.register_heif_opener(); HEIF=True
except Exception:
    HEIF=False
    print('NOTE: HEIC decoding unavailable on this machine.')

EXT = {'.jpg','.jpeg','.png','.webp','.heic','.heif','.avif','.gif','.bmp','.tif','.tiff'}
ROOT = 'inductees'
OUT  = '_extract/sheets'
COLS, TH = 5, 300

def collect(folder):
    files, seen = [], set()
    for dp, dn, fn in os.walk(folder):
        for f in sorted(fn):
            if os.path.splitext(f)[1].lower() not in EXT: continue
            p = os.path.join(dp, f)
            if 'plate' in f.lower(): continue
            try:
                h = hashlib.md5(open(p,'rb').read()).hexdigest()
            except Exception: continue
            if h in seen: continue
            seen.add(h); files.append(p)
    return files

manifest = {}
for d in sorted(os.listdir(ROOT), key=lambda s: int(s.split()[0]) if s.split()[0].isdigit() else 99):
    dp = os.path.join(ROOT, d)
    if not os.path.isdir(dp): continue
    files = collect(dp)
    tiles = []
    for p in files:
        try:
            im = Image.open(p); im = ImageOps.exif_transpose(im).convert('RGB')
            tiles.append((p, im.size, ImageOps.contain(im, (TH,TH))))
        except Exception as e:
            print('SKIP', p, e)
    if not tiles: continue
    rows = (len(tiles)+COLS-1)//COLS
    sheet = Image.new('RGB', (COLS*TH, rows*(TH+26)), (24,24,24))
    dr = ImageDraw.Draw(sheet)
    for i,(p,sz,th) in enumerate(tiles):
        r,c = divmod(i, COLS)
        x,y = c*TH, r*(TH+26)
        sheet.paste(th, (x+(TH-th.width)//2, y+(TH-th.height)//2))
        dr.text((x+4, y+TH+6), "%d  %dx%d" % (i, sz[0], sz[1]), fill=(255,230,120))
        dr.rectangle([x,y,x+TH-1,y+TH+25], outline=(80,80,80))
    idx = d.split()[0]
    sheet.save('%s/%s.jpg' % (OUT, idx), quality=82)
    manifest[idx] = {'folder': d, 'files': [p for p,_,_ in tiles]}
    print(idx, d, len(tiles))

import json
json.dump(manifest, open('_extract/manifest.json','w'), indent=1)
