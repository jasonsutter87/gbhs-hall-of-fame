import os, json, shutil
from PIL import Image, ImageOps, ImageChops

man   = json.load(open('_extract/manifest.json'))
picks = json.load(open('build/picks.json'))
SITE  = 'site'
IMG   = os.path.join(SITE,'assets','img')

PLATES = {
 'natalie-gulbis':'Gulbis plate.png','betsy-barr':'2 Betsy Barr Plate.png',
 'adam-jennings':'Adam Jennings Plate - Copy.png','dallas-sartz':'Dallas Sartz Plate.png',
 'caitlin-chock':'5 Caitlin Chock Plate.png','scott-roth':'6 Scott Roth Plate.png',
 'alyssa-anderson':'Alyssa Anderson Plate.png','haley-anderson':'Haley Anderson Plate.png',
 'ryan-hollingshead':'Ryan Hollinshead Plate.png','ryan-loder':'Ryan Loder Plate.png',
 'spencer-hamby':'Hamby.png','andrew-knapp':'Andrew Knapp Plate.png',
 'taylor-nelson':'Taylor Nelson Plate.png','ernie-cooper':'14 Ernie Cooper  Plate.png',
}

def save(im, path, longest, q):
    im = ImageOps.contain(im, (longest, longest), Image.LANCZOS)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path, 'WEBP', quality=q, method=6)
    return im.size

def trim(im):
    """Trim fully-transparent border."""
    if im.mode != 'RGBA': return im
    bbox = im.getchannel('A').getbbox()
    return im.crop(bbox) if bbox else im

out = {}
for idx, meta in picks.items():
    slug  = meta['slug']
    files = man[idx]['files']
    rec   = {'slug': slug, 'photos': []}
    for n, i in enumerate(meta['pics'], 1):
        src = files[i]
        im  = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
        w,h = save(im, f'{IMG}/photos/{slug}/p{n}.webp', 1500, 80)
        save(im, f'{IMG}/photos/{slug}/t{n}.webp', 500, 72)
        rec['photos'].append({'n':n,'w':w,'h':h,'src':src.replace(chr(92),'/')})
    hi = meta['pics'].index(meta['hero']) + 1
    rec['hero'] = hi
    # nameplate
    pf = os.path.join('elements','badges', PLATES[slug])
    if os.path.exists(pf):
        pl = trim(Image.open(pf).convert('RGBA'))
        os.makedirs(f'{IMG}/plates', exist_ok=True)
        ImageOps.contain(pl,(900,900),Image.LANCZOS).save(f'{IMG}/plates/{slug}.webp','WEBP',quality=88,method=6)
        rec['plate'] = True
    else:
        print('MISSING PLATE', slug); rec['plate'] = False
    out[slug] = rec
    print('%-20s %d photos' % (slug, len(rec['photos'])))

# shared UI art
os.makedirs(f'{IMG}/ui', exist_ok=True)
for src, dst, size in [('logo.png','logo',900), ('grizzly.png','grizzly',900),
                       ('GBHS HOF FLYER.png','flyer',1400)]:
    if os.path.exists(src):
        im = Image.open(src).convert('RGBA')
        ImageOps.contain(trim(im),(size,size),Image.LANCZOS).save(f'{IMG}/ui/{dst}.webp','WEBP',quality=88,method=6)
        print('ui/'+dst)

json.dump(out, open('build/exported.json','w'), indent=1)
tot = sum(os.path.getsize(os.path.join(dp,f)) for dp,_,fn in os.walk(IMG) for f in fn)
print('TOTAL IMAGE PAYLOAD: %.1f MB' % (tot/1048576))
