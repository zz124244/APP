import glob, os
import numpy as np
from PIL import Image

SRC = r'C:\Users\Lenovo\Documents\ChatGPT\APP\client-ios-codemagic\.cache\video'
OUT = os.path.join(SRC, 'crop')
os.makedirs(OUT, exist_ok=True)

# keep only the real 0..20 s frames
keep = []
for p in glob.glob(os.path.join(SRC, 'frame-*.png')):
    try:
        t = float(os.path.basename(p)[6:-4])
    except ValueError:
        continue
    if t <= 20.01:
        keep.append((t, p))
    else:
        os.remove(p)
keep.sort()

print('usable frames:', [f'{t:.2f}' for t, _ in keep])

for t, p in keep:
    im = Image.open(p).convert('RGB')
    a = np.asarray(im.convert('L')).astype(np.int16)
    h, w = a.shape
    bright = a > 130
    cols = bright.sum(axis=0); rws = bright.sum(axis=1)
    xs = np.where(cols > h * 0.25)[0]; ys = np.where(rws > w * 0.25)[0]
    if len(xs) == 0 or len(ys) == 0:
        print(f'{t:5.2f}  no blob'); continue
    pad = 8
    box = (max(0, xs[0] - pad), max(0, ys[0] - pad), min(w, xs[-1] + pad), min(h, ys[-1] + pad))
    crop = im.crop(box)
    scale = 2.2
    crop = crop.resize((int(crop.width * scale), int(crop.height * scale)), Image.LANCZOS)
    name = os.path.join(OUT, f'crop-{t:05.2f}.png')
    crop.save(name)
    print(f'{t:5.2f}  screenBox={box}  crop={crop.size}  -> {os.path.basename(name)}')
