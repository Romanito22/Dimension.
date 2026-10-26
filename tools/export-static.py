# Export statique : rend tous les chemins relatifs pour que le site fonctionne
# à n'importe quelle adresse (GitHub Pages dans un sous-dossier, simple dossier…).
# Usage : STATIC_EXPORT=1 npx astro build && python3 tools/export-static.py dist
import os, re, sys, pathlib
root = pathlib.Path(sys.argv[1])
os.rename(root/'index.html', root/'accueil.html')
for p in root.rglob('.gitkeep'): p.unlink()

def map_path(path, prefix=''):
    # path sans le slash initial ; sépare query/hash
    m = re.match(r'([^?#]*)(.*)', path)
    base, rest = m.group(1), m.group(2)
    if base == '':
        base = 'accueil.html'
    elif '.' not in base.rsplit('/', 1)[-1]:
        base = base.rstrip('/') + '.html'
    return prefix + base + rest

for f in root.rglob('*.html'):
    rel = f.relative_to(root).as_posix()
    depth = rel.count('/')
    s = f.read_text()
    prefix = '../' * depth
    s = s.replace('<meta name="astro-view-transitions-enabled" content="true">', '')
    s = s.replace('<head>', f'<head><meta name="dim-root" content="{prefix}">', 1)
    s = re.sub(r'href="/(?!/)([^"]*)"', lambda m: f'href="{map_path(m.group(1), prefix)}" data-rp="{map_path(m.group(1))}"', s)
    s = re.sub(r'src="/(?!/)([^"]*)"', lambda m: f'src="{map_path(m.group(1), prefix)}"', s)
    # srcset : chaque candidat « /chemin largeur »
    s = re.sub(r'srcset="([^"]*)"', lambda m: 'srcset="' + re.sub(r'(^|,\s*)/(?!/)([^\s,]+)', lambda c: c.group(1) + map_path(c.group(2), prefix), m.group(1)) + '"', s)
    s = s.replace('"image":"/ph/', '"image":"' + prefix + 'ph/')
    # url() dans une variable CSS : résolue depuis la feuille de style (assets/)
    # CSS intégré à la page : chemins relatifs à la page
    s = s.replace('url(/ph/', 'url(' + prefix + 'ph/')
    s = s.replace('url(/_astro/', 'url(' + prefix + '_astro/')
    # JSON_PATHS : chemins dans les données JSON (attributs data-qa, scène du hero)
    s = re.sub(r'(&quot;|")/((?:ph|produit|images|img)/[^"&]+)(&quot;|")', lambda m: m.group(1) + map_path(m.group(2), prefix) + m.group(3), s)
    f.write_text(s)

for f in (root/'_astro').glob('*.css'):
    f.write_text(f.read_text().replace('url(/_astro/', 'url(./'))
for f in (root/'_astro').glob('*.js'):
    s = f.read_text()
    R = '${document.querySelector(`meta[name=dim-root]`)?.content??``}'
    s = re.sub(r'href="/produit/\$\{([^}]*)\}"', lambda m: 'href="' + R + 'produit/${' + m.group(1) + '}.html"', s)
    s = s.replace('class="btn" data-cart-close>Voir', 'class="btn" data-cart-close>Voir')
    s = s.replace('<a href="/boutique" class="btn" data-cart-close>', '<a href="' + R + 'boutique.html" class="btn" data-cart-close>')
    s = s.replace('[data-nav][href="/boutique"]', '[data-nav][href$="boutique.html"]')
    if f.name.startswith('Base.astro'):
        s += ';document.addEventListener("astro:after-swap",()=>{const r=document.querySelector("meta[name=dim-root]")?.content??"";document.querySelectorAll("[data-rp]").forEach(a=>a.setAttribute("href",r+a.dataset.rp))});'
    s = s.replace('startsWith("/produit")', 'includes("/produit/")')
    f.write_text(s)

# L'adresse racine ouvre directement l'accueil
(root/'index.html').write_text((root/'accueil.html').read_text())
# Pas de traitement Jekyll sur GitHub Pages (dossier _astro)
(root/'.nojekyll').write_text('')
