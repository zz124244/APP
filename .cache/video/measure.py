import glob, os, json
import numpy as np
from PIL import Image

frames = sorted(glob.glob(r'C:\Users\Lenovo\Documents\ChatGPT\APP\client-ios-codemagic\.cache\video\frame-*.png'),
                key=lambda p: float(os.path.basename(p)[6:-4]))
rows = []
for p in frames:
    im = Image.open(p).convert('L')
    a = np.asarray(im).astype(np.int16)
    h, w = a.shape
    # phone screen = the big bright blob (the room is dark)
    bright = a > 140
    cols = bright.sum(axis=0); rows_ = bright.sum(axis=1)
    xs = np.where(cols > h * 0.15)[0]; ys = np.where(rows_ > w * 0.15)[0]
    if len(xs) == 0 or len(ys) == 0:
        rows.append(dict(t=os.path.basename(p), note='no bright blob')); continue
    x0, x1, y0, y1 = xs[0], xs[-1], ys[0], ys[-1]
    scr_w = x1 - x0 + 1
    # app "paper" = near-white area inside the screen
    sub = a[y0:y1 + 1, x0:x1 + 1]
    white = sub > 232
    wc = white.sum(axis=0)
    wxs = np.where(wc > (y1 - y0) * 0.25)[0]
    if len(wxs) == 0:
        rows.append(dict(t=os.path.basename(p), scr=(int(x0), int(x1), int(y0), int(y1)), note='no white card')); continue
    wx0, wx1 = wxs[0], wxs[-1]
    rows.append(dict(
        t=os.path.basename(p)[6:-4],
        screen_x=[int(x0), int(x1)], screen_w=int(scr_w),
        card_x=[int(x0 + wx0), int(x0 + wx1)],
        left_margin=int(wx0), right_margin=int(scr_w - 1 - wx1),
        l_ratio=round(wx0 / scr_w, 3), r_ratio=round((scr_w - 1 - wx1) / scr_w, 3),
    ))

for r in rows:
    print(json.dumps(r, ensure_ascii=False))
