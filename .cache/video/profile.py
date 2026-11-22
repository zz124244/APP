import numpy as np
from PIL import Image

p = r'C:\Users\Lenovo\Documents\ChatGPT\APP\client-ios-codemagic\.cache\video\frame-4.62.png'
im = Image.open(p).convert('RGB')
a = np.asarray(im).astype(int)
hsv = np.asarray(im.convert('HSV')).astype(int)
H, S, V = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]

orange = (H >= 10) & (H <= 34) & (S >= 130) & (V >= 100)
rows = orange.sum(axis=1)
y = int(np.argmax(rows))
xs = np.where(orange[y])[0]
bl, br = int(xs.min()), int(xs.max())
print(f'button row y={y}  orange x=[{bl},{br}] w={br-bl}')

print('\nluminance profile around the LEFT edge of the button (x-40 .. x+20)')
for x in range(max(0, bl - 40), min(a.shape[1], bl + 20), 4):
    print(f'  x={x:3d}  V={V[y, x]:3d}  RGB={tuple(a[y, x])}')

print('\nluminance profile around the RIGHT edge of the button (x-20 .. x+40)')
for x in range(max(0, br - 20), min(a.shape[1], br + 40), 4):
    print(f'  x={x:3d}  V={V[y, x]:3d}  RGB={tuple(a[y, x])}')

print('\nwhole-row scan: longest bright run per threshold')
for thr in (40, 60, 80, 100, 120):
    m = V[y] > thr
    best = (0, 0, 0)
    run = 0
    for x in range(len(m)):
        if m[x]:
            run += 1
            if run > best[0]:
                best = (run, x - run + 1, x)
        else:
            run = 0
    print(f'  V>{thr}: longest run={best[0]:3d}  x=[{best[1]},{best[2]}]')

# vertical extent of the button at its centre column -> self-calibrating layout width
cx = (bl + br) // 2
col = orange[:, cx]
ys = np.where(col)[0]
ys = ys[(ys > y - 120) & (ys < y + 120)]
if len(ys):
    bt, bb = int(ys.min()), int(ys.max())
    bh = bb - bt + 1
    bw = br - bl + 1
    print(f'\nbutton box: w={bw}px h={bh}px  (CSS: w=W-64, h=48)')
    print(f'  self-calibrated layout width  W = 64 + w*48/h = {64 + bw*48/bh:.1f} CSS px')
    print(f'  horizontal scale sx = w/(W-64);  vertical scale sy = h/48')
    for W in (320, 375, 390, 414, 430):
        print(f'    if W={W}: sx={bw/(W-64):.4f}  sy={bh/48:.4f}  sx/sy={bw/(W-64)/(bh/48):.3f}')
