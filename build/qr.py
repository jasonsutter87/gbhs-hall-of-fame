import os, sys, json, re
import qrcode
from qrcode.constants import ERROR_CORRECT_Q

BASE = (sys.argv[1] if len(sys.argv) > 1 else "https://USERNAME.github.io/gbhs-hall-of-fame").rstrip("/")
FG, BG = "#0A2E19", "#FFFFFF"

data = open('site/assets/js/data.js', encoding='utf8').read()
people = [{'slug': s, 'name': n} for s, n in
          zip(re.findall(r'slug: "([a-z-]+)"', data), re.findall(r'name: "([^"]+)"', data))]

def make(url, path, box=10):
    q = qrcode.QRCode(version=None, error_correction=ERROR_CORRECT_Q, box_size=box, border=2)
    q.add_data(url); q.make(fit=True)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    q.make_image(fill_color=FG, back_color=BG).save(path)

make(BASE + "/", 'site/assets/img/ui/qr-book.png', 12)
print("book QR ->", BASE + "/")

cards = []
for p in people:
    url = BASE + "/#/" + p['slug']
    make(url, 'site/qr/%s.png' % p['slug'])
    cards.append(
      '<figure><img src="%s.png" alt="QR code for %s">'
      '<figcaption><b>%s</b><span>%s</span></figcaption></figure>'
      % (p['slug'], p['name'], p['name'], url))
    print("  %-20s %s" % (p['slug'], url))

open('site/qr/sheet.html', 'w', encoding='utf8').write("""<!doctype html>
<meta charset="utf-8"><title>GBHS Hall of Fame — QR codes</title>
<style>
 @page { size: letter; margin: 12mm; }
 body { font: 13px system-ui, sans-serif; color:#14562F; margin:0; padding:16mm 10mm; }
 h1 { font-size:17px; letter-spacing:.14em; text-transform:uppercase; margin:0 0 4px; }
 p.sub { color:#868F95; font-size:11px; margin:0 0 18px; letter-spacing:.08em; }
 .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10mm 8mm; }
 figure { margin:0; text-align:center; border:1px solid #DDE2E4; border-radius:6px; padding:9px; break-inside:avoid; }
 img { width:100%%; max-width:150px; height:auto; display:block; margin:0 auto 6px; }
 figcaption b { display:block; font-size:12.5px; }
 figcaption span { display:block; font-size:7.5px; color:#A6AFB4; word-break:break-all; margin-top:3px; }
</style>
<h1>GBHS Sports Hall of Fame &mdash; Inaugural Class</h1>
<p class="sub">Scan any code to open that inductee's pages. Cut along the cards for table tents.</p>
<div class="grid">%s</div>
""" % "\n".join(cards))
print("printable sheet -> site/qr/sheet.html")
