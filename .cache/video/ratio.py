import glob, os, json
import numpy as np
from PIL import Image

SRC = r'C:\Users\Lenovo\Documents\ChatGPT\APP\client-ios-codemagic\.cache\video'

def screen_span_on_row(v, y, seed_x):
    """walk out from seed_x while the row stays 'screen-like' (bright) -> screen edges"""
    h, w = v.shape
    row = v[y]
    # screen interior is light (#f8f9ff / white). bezel + room are dark.
    x0 = seed_x
    while x0 > 0 and row[x0 - 1] > 110:
        x0 -= 1
    x1 = seed_x
    while x1 < w - 1 and row[x1 + 1] > 110:
        x1 += 1
    return x0, x1

def analyse(path):
    im = Image.open(path).convert('RGB')
    arr = np.asarray(im)
    hsv = np.asarray(im.convert('HSV')).astype(np.int16)
    H, S, V = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
    # brand orange #d97706 -> hue ~31deg -> 31/360*255 ~= 22 ; allow 10..34
    orange = (H >= 10) & (H <= 34) & (S >= 130) & (V >= 110)
    rows = orange.sum(axis=1)
    if rows.max() < 12:
        return None
    # pick the row band of the widest orange run
    y = int(np.argmax(rows))
    xs = np.where(orange[y])[0]
    btn_l, btn_r = int(xs.min()), int(xs.max())
    seed = (btn_l + btn_r) // 2
    scr_l, scr_r = screen_span_on_row(V, y, seed)
    btn_w = btn_r - btn_l
    scr_w = scr_r - scr_l
    return dict(
        y=y, btn=[btn_l, btn_r], btn_w=btn_w,
        screen=[scr_l, scr_r], screen_w=scr_w,
        ratio=round(btn_w / scr_w, 4),
        left_gap=btn_l - scr_l, right_gap=scr_r - btn_r,
        center_off=round(((btn_l + btn_r) / 2 - (scr_l + scr_r) / 2) / scr_w, 4),
    )

rows = []
for p in sorted(glob.glob(os.path.join(SRC, 'frame-*.png'))):
    t = os.path.basename(p)[6:-4]
    try:
        tv = float(t)
    except ValueError:
        continue
    if tv > 20.01:
        continue
    r = analyse(p)
    if r is None:
        print(f'{t:>6}  no orange button found')
        continue
    print(f'{t:>6}  row={r["y"]:3d}  screen=[{r["screen"][0]},{r["screen"][1]}] w={r["screen_w"]:3d}'
          f'  button=[{r["btn"][0]},{r["btn"][1]}] w={r["btn_w"]:3d}'
          f'  ratio={r["ratio"]:.3f}  gapL={r["left_gap"]:3d} gapR={r["right_gap"]:3d}  centerOff={r["center_off"]:+.3f}')
    rows.append((tv, r))

print()
print('expected ratio for a normal, un-zoomed render: 1 - 64/W')
for W in (375, 390, 430):
    print(f'  W={W}: {(W-64)/W:.3f}')
print('expected ratio if the visual viewport is zoomed by z: (W-64)/(W/z) = z*(1-64/W)')
for z in (1.1, 1.15, 1.25, 1.5):
    print(f'  zoom {z}: {z*(390-64)/390:.3f} (W=390)')
