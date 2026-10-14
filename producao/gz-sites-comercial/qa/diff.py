#!/usr/bin/env python3
"""Diferença média entre quadros consecutivos. Aponta trechos parados."""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

folder = Path(sys.argv[1])
step = int(sys.argv[2]) if len(sys.argv) > 2 else 1
files = sorted(folder.glob("*.jpg")) + sorted(folder.glob("*.png"))
files = [p for p in files if p.suffix in {".jpg", ".png"}]
# unique sorted by frame number
files = sorted({int(p.stem): p for p in files}.items())
prev = None
prev_n = None
rows = []
for n, p in files:
    if n % step:
        continue
    im = np.asarray(Image.open(p).resize((180, 320)), dtype=np.float32)
    if prev is not None and n - prev_n == step:
        d = float(np.mean(np.abs(im - prev)))
        rows.append((n, d))
    prev = im
    prev_n = n
rows.sort(key=lambda r: r[1])
print("quietest")
for n, d in rows[:12]:
    print(f"  {n-step:04d}->{n:04d}  {d:.3f}")
print("loudest")
for n, d in rows[-8:]:
    print(f"  {n-step:04d}->{n:04d}  {d:.3f}")
print("count", len(rows), "median", float(np.median([d for _, d in rows])) if rows else 0)
