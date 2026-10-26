# Étape 1 — détourage des vraies photos (originales/ → detoures/).
# Retire tout ce qui n'est pas le vêtement : gravier, fond gris, filigrane TikTok,
# logo d'angle, numéros. Dépendances : pip install "rembg[cpu]" scipy opencv-python-headless
# Usage : python tools/visuels/detourer.py
import os
import numpy as np
import cv2
from PIL import Image
from rembg import remove, new_session
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'originales')
OUT = os.path.join(HERE, 'detoures')

# Filigrane « @dimensionbrand » des photos sur gravier (2000 × 1333), en bas à droite
WATERMARK = (1150, 1255, 1660, 1333)

# fichier source, zone (fractions x0, y0, x1, y1) ou None, nom de sortie, rotation (degrés)
JOBS = [
    ('dim-001-face-gravier.jpg', None, 'dim-001-front', -60),
    ('dim-001-dos-gravier.jpg', None, 'dim-001-back', 0),
    ('dim-001-plie-gravier.jpg', None, 'dim-001-fold', 0),
    ('dim-002-face-dos.webp', (0, 0, 0.5, 1), 'dim-002-front', 0),
    ('dim-002-face-dos.webp', (0.5, 0, 1, 1), 'dim-002-back', 0),
    ('dim-003-face-dos.jpg', (0, 0, 0.5, 1), 'dim-003-front', 0),
    ('dim-003-face-dos.jpg', (0.5, 0, 1, 1), 'dim-003-back', 0),
    ('dim-004-face.jpg', None, 'dim-004-front', 0),
    ('dim-005-face.webp', None, 'dim-005-front', 0),
]


def largest(mask):
    lab, n = ndimage.label(mask)
    if n <= 1:
        return mask
    sizes = ndimage.sum(np.ones(mask.shape), lab, range(1, n + 1))
    return lab == 1 + int(np.argmax(sizes))


def erase_watermark(im):
    """Gomme le filigrane (lettres blanc neutre) par retouche, avant le détourage."""
    a = np.array(im)
    x0, y0, x1, y1 = WATERMARK
    r = a[y0:y1, x0:x1].astype(int)
    text = (r.min(-1) > 200) & (np.abs(r[..., 2] - r[..., 0]) < 16)
    mask = np.zeros(a.shape[:2], np.uint8)
    mask[y0:y1, x0:x1] = ndimage.binary_dilation(text, iterations=6) * 255
    return Image.fromarray(cv2.inpaint(a, mask, 9, cv2.INPAINT_TELEA))


def main():
    os.makedirs(OUT, exist_ok=True)
    session = new_session('birefnet-general-lite')
    for src, box, name, rot in JOBS:
        im = Image.open(os.path.join(SRC, src)).convert('RGB')
        if 'gravier' in src:
            im = erase_watermark(im)
        if box:
            w, h = im.size
            im = im.crop((int(box[0] * w), int(box[1] * h), int(box[2] * w), int(box[3] * h)))
        alpha = np.array(remove(im, session=session))[..., 3].astype(np.float32)
        alpha[alpha < 18] = 0
        # on ne garde que le vêtement : la plus grande pièce d'un seul tenant
        keep = ndimage.binary_dilation(largest(alpha > 40), iterations=3)
        alpha = np.where(keep, alpha, 0).astype(np.uint8)
        out = Image.fromarray(np.dstack([np.array(im), alpha]), 'RGBA')
        if rot:
            out = out.rotate(rot, expand=True, resample=Image.BICUBIC)
        out = out.crop(out.getbbox())
        out.save(os.path.join(OUT, f'{name}.webp'), quality=94, alpha_quality=100, method=6)
        print(name, out.size)


if __name__ == '__main__':
    main()
