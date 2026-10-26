# Étape 2 — compose les visuels du site à partir des vêtements détourés (detoures/ → public/images/).
# Fonds aux couleurs de la marque (studio clair, framboise), ombre portée douce, aucun élément extérieur.
# Dépendances : pip install pillow numpy
# Usage : python tools/visuels/composer.py
import os
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
CUT = os.path.join(HERE, 'detoures')
SRC = os.path.join(HERE, 'originales')
PUB = os.path.join(HERE, '..', '..', 'public', 'images')

IDS = ['dim-001', 'dim-002', 'dim-003', 'dim-004', 'dim-005']
# Pas de photo de dos pour le Doodle et le pull Camo : la face sert pour les deux.
BACK = {i: f'{i}-back' if os.path.exists(os.path.join(CUT, f'{i}-back.webp')) else f'{i}-front' for i in IDS}

STUDIO = ((236, 233, 231), (208, 204, 202))
BRAND = ((214, 40, 98), (172, 12, 66))


def cut(name):
    return Image.open(os.path.join(CUT, f'{name}.webp')).convert('RGBA')


def background(w, h, colors, seed=1):
    inner, outer = colors
    y, x = np.mgrid[0:h, 0:w]
    d = np.sqrt(((x - w * 0.5) / w) ** 2 + ((y - h * 0.42) / h) ** 2) / 0.75
    d = np.clip(d, 0, 1)[..., None]
    img = np.array(inner) * (1 - d) + np.array(outer) * d
    grain = np.random.default_rng(seed).normal(0, 3.2, (h, w, 1))
    return Image.fromarray(np.clip(img + grain, 0, 255).astype(np.uint8), 'RGB').convert('RGBA')


def place(canvas, garment, cx, cy, height, rot=0, max_w=None, shadow=0.3):
    """Pose un vêtement centré en (cx, cy), à la hauteur voulue, avec ombre portée."""
    g = garment
    if rot:
        g = g.rotate(-rot, expand=True, resample=Image.BICUBIC)
        g = g.crop(g.getbbox())
    scale = height / g.height
    if max_w and g.width * scale > max_w:
        scale = max_w / g.width
    g = g.resize((max(1, round(g.width * scale)), max(1, round(g.height * scale))), Image.LANCZOS)
    x, y = round(cx - g.width / 2), round(cy - g.height / 2)
    if shadow:
        a = g.getchannel('A').point(lambda v: int(v * shadow))
        sh = Image.new('RGBA', g.size, (20, 10, 14, 0))
        sh.putalpha(a)
        pad = round(max(g.size) * 0.08)
        layer = Image.new('RGBA', (g.width + 2 * pad, g.height + 2 * pad), (0, 0, 0, 0))
        layer.alpha_composite(sh, (pad, pad))
        layer = layer.filter(ImageFilter.GaussianBlur(max(4, max(g.size) * 0.018)))
        off = round(max(g.size) * 0.018)
        canvas.alpha_composite(layer, (x - pad + off, y - pad + off * 2)) if x - pad >= 0 and y - pad >= 0 else canvas.paste(layer, (x - pad + off, y - pad + off * 2), layer)
    canvas.alpha_composite(g, (x, y)) if x >= 0 and y >= 0 else canvas.paste(g, (x, y), g)
    return canvas


def save(img, key, quality=84):
    path = os.path.join(PUB, f'{key}.webp')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, quality=quality, method=6)
    print(key, img.size, os.path.getsize(path) // 1024, 'Ko')


def product_shot(name, colors=STUDIO, w=1600, h=2000, seed=1):
    g = cut(name)
    return place(background(w, h, colors, seed), g, w / 2, h * 0.5, h * 0.62, max_w=w * 0.84).convert('RGB')


def detail(name, cx, cy, fw, w=1040, h=1300):
    """Gros plan dans le tissu : fenêtre 4:5 de largeur fw (fraction du vêtement)."""
    g = cut(name)
    ww = fw * g.width
    hh = ww * 5 / 4
    box = (round(cx * g.width - ww / 2), round(cy * g.height - hh / 2), round(cx * g.width + ww / 2), round(cy * g.height + hh / 2))
    crop = g.crop(box).resize((w, h), Image.LANCZOS)
    bg = background(w, h, STUDIO)
    bg.alpha_composite(crop)
    return bg.convert('RGB')


# Fenêtres de gros plan (centre x, centre y, largeur) dans chaque vêtement détouré
DETAILS = {
    'dim-001': ('dim-001-shop-back', 0.5, 0.36, 0.56),
    'dim-002': ('dim-002-back', 0.5, 0.6, 0.5),
    'dim-003': ('dim-003-back', 0.46, 0.47, 0.56),
    'dim-004': ('dim-004-front', 0.5, 0.48, 0.42),
    'dim-005': ('dim-005-front', 0.55, 0.5, 0.4),
}


def main():
    # 1. Détourés seuls (PNG transparent au format 4:5) : scène d'accueil, devant / dos, table
    for i in IDS:
        for view, name in (('front', f'{i}-front'), ('back', BACK[i])):
            canvas = Image.new('RGBA', (1600, 2000), (0, 0, 0, 0))
            place(canvas, cut(name), 800, 1000, 1500, max_w=1480, shadow=0)
            save(canvas, f'cutout/{i}-{view}', quality=86)

    # 2. Boutique et fiches produit : face, dos, gros plan du print.
    #    Le Love utilise son mockup sur cintre (cintre retiré) ; ses photos sur gravier
    #    servent au reste du site (accueil, devant / dos, table, lookbook…).
    SHOP = {'dim-001': ('dim-001-shop-front', 'dim-001-shop-back')}
    for n, i in enumerate(IDS):
        front, back = SHOP.get(i, (f'{i}-front', BACK[i]))
        save(product_shot(front, seed=n), f'products/{i}-1')
        if back != front:
            save(product_shot(back, seed=n + 10), f'products/{i}-2')
    # Le monogramme du Love est brodé (le cœur au dos est imprimé) : vraie photo de la broderie
    mono = Image.open(os.path.join(SRC, 'dim-001-monogramme.jpg')).convert('RGB')
    save(mono.crop((740, 375, 1260, 1025)).resize((1040, 1300), Image.LANCZOS), 'products/dim-001-4')
    for i, (name, cx, cy, fw) in DETAILS.items():
        save(detail(name, cx, cy, fw), f'products/{i}-3')

    # 3. Visuels éditoriaux : vêtements posés sur les couleurs de la marque
    F = {i: cut(f'{i}-front') for i in IDS}
    B = {i: cut(BACK[i]) for i in IDS}

    def scene(key, w, h, colors, shots, seed):
        c = background(w, h, colors, seed)
        for g, x, y, s, r in shots:
            place(c, g, x * w, y * h, s * h, r, max_w=w * 0.9, shadow=0.42 if colors is BRAND else 0.3)
        save(c.convert('RGB'), key)

    scene('hero/desktop', 2560, 1440, BRAND, [(B['dim-001'], 0.66, 0.52, 0.68, -6)], 5)
    scene('hero/mobile', 1350, 1688, BRAND, [(B['dim-001'], 0.5, 0.4, 0.5, -6)], 6)
    scene('categories/t-shirts', 1500, 2000, STUDIO, [(B['dim-002'], 0.36, 0.36, 0.42, -6), (F['dim-003'], 0.64, 0.66, 0.42, 5)], 7)
    scene('categories/maille', 1500, 2000, STUDIO, [(F['dim-005'], 0.5, 0.5, 0.5, 0)], 8)
    scene('categories/love', 1500, 2000, BRAND, [(F['dim-001'], 0.5, 0.5, 0.56, 6)], 9)
    scene('story/2', 2560, 1440, BRAND, [(F['dim-004'], 0.22, 0.5, 0.6, -10), (B['dim-001'], 0.5, 0.48, 0.6, 4), (B['dim-003'], 0.78, 0.52, 0.6, -4)], 10)
    # Gros plan du monogramme brodé (vraie photo, recadrée dans le tissu)
    save(mono.crop((740, 375, 1260, 1025)).resize((1040, 1300), Image.LANCZOS), 'story/1')
    save(detail('dim-005-front', 0.36, 0.62, 0.3), 'story/3')

    looks = [
        ('16:9', BRAND, [(B['dim-001'], 0.5, 0.5, 0.68, 10)]),
        ('4:5', STUDIO, [(B['dim-002'], 0.5, 0.5, 0.6, 0)]),
        ('4:5', BRAND, [(B['dim-003'], 0.5, 0.5, 0.6, -12)]),
        ('4:5', STUDIO, [(F['dim-005'], 0.5, 0.5, 0.55, 0)]),
        ('16:9', BRAND, [(F['dim-004'], 0.32, 0.5, 0.7, -7), (B['dim-002'], 0.68, 0.5, 0.7, 8)]),
        ('4:5', STUDIO, [(F['dim-001'], 0.5, 0.5, 0.6, 0)]),
        ('4:5', BRAND, [(F['dim-005'], 0.5, 0.5, 0.52, 8)]),
        ('4:5', STUDIO, [(F['dim-004'], 0.5, 0.5, 0.6, 0)]),
        ('16:9', BRAND, [(F['dim-003'], 0.2, 0.5, 0.56, 7), (B['dim-001'], 0.5, 0.5, 0.56, -5), (F['dim-005'], 0.8, 0.5, 0.52, 10)]),
    ]
    for n, (ratio, colors, shots) in enumerate(looks, 1):
        w, h = (2560, 1440) if ratio == '16:9' else (1600, 2000)
        scene(f'lookbook/{n}', w, h, colors, shots, 20 + n)

    socials = [B['dim-001'], F['dim-002'], B['dim-003'], F['dim-004'], F['dim-005'], F['dim-001']]
    for n, g in enumerate(socials, 1):
        scene(f'social/{n}', 1080, 1080, BRAND if n % 2 else STUDIO, [(g, 0.5, 0.52, 0.74, (-8 + n * 3) if n % 2 else 0)], 40 + n)


if __name__ == '__main__':
    main()
