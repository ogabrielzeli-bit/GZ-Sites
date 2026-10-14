#!/usr/bin/env python3
"""Monta o corte 9:16 a partir das sequências e da trilha.

3D: cenas/frames/NNNN.jpg  (0–578)
Site: site/frames/NNNN.png (548–779)
Assinatura: end/frames/NNNN.png (750–899)
Áudio: audio/mix.wav
"""
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
W, H = 1080, 1920
FPS = 30
N = 900
D3 = Path("/tmp/gz-shot") if (Path("/tmp/gz-shot") / "0000.jpg").exists() else ROOT / "cenas" / "frames"
SITE = Path("/tmp/gz-site") if (Path("/tmp/gz-site") / "0600.png").exists() else ROOT / "site" / "frames"
END = Path("/tmp/gz-end") if (Path("/tmp/gz-end") / "0800.png").exists() else ROOT / "end" / "frames"
AUDIO = ROOT / "audio" / "mix.wav"
EXPORTS = ROOT / "exports"


def load(n, kind):
    if kind == "d3":
        p = D3 / f"{n:04d}.jpg"
    elif kind == "site":
        p = SITE / f"{n:04d}.png"
        if not p.exists():
            p = SITE / f"{n:04d}.jpg"
    else:
        p = END / f"{n:04d}.png"
        if not p.exists():
            p = END / f"{n:04d}.jpg"
    if not p.exists():
        raise FileNotFoundError(p)
    im = Image.open(p).convert("RGB")
    if im.size != (W, H):
        im = im.resize((W, H), Image.Resampling.LANCZOS)
    return np.asarray(im, dtype=np.float32)


def blend(a, b, u):
    return a * (1 - u) + b * u


def grade(img, rng):
    x = img
    # contraste contido, pretos com detalhe
    x = (x - 128.0) * 1.04 + 126.0
    x = np.clip(x, 0, 255)
    x += rng.uniform(-1.4, 1.4, x.shape)
    return np.clip(x, 0, 255).astype(np.uint8)


def main():
    EXPORTS.mkdir(parents=True, exist_ok=True)
    master = EXPORTS / "GZ_Sites_Comercial_9x16_master.mp4"
    reels = EXPORTS / "GZ_Sites_Comercial_9x16.mp4"
    rng = np.random.default_rng(19)
    cmd = [
        "ffmpeg", "-y",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-i", str(AUDIO),
        "-map", "0:v:0", "-map", "1:a:0",
        "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p",
        "-crf", "10", "-preset", "medium",
        "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
        "-shortest", "-movflags", "+faststart",
        str(master),
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    cache = {}

    def get(n, kind):
        key = (n, kind)
        if key not in cache:
            cache[key] = load(n, kind)
        return cache[key]

    try:
        for n in range(N):
            if n < 548:
                img = get(n, "d3")
            elif n <= 578:
                u = (n - 548) / (578 - 548)
                u = u * u * (3 - 2 * u)
                img = blend(get(n, "d3"), get(n, "site"), u)
            elif n < 750:
                img = get(n, "site")
            elif n <= 778:
                u = (n - 750) / (778 - 750)
                u = u * u * (3 - 2 * u)
                img = blend(get(n, "site"), get(n, "end"), u)
            else:
                img = get(n, "end")
            # solta caches que não voltam
            if n > 2:
                cache.pop((n - 2, "d3"), None)
                cache.pop((n - 2, "site"), None)
                cache.pop((n - 2, "end"), None)
            frame = grade(img, rng)
            proc.stdin.write(frame.tobytes())
            if n % 30 == 0:
                print("frame", n, flush=True)
    finally:
        if proc.stdin:
            proc.stdin.close()
        code = proc.wait()
        if code != 0:
            sys.exit(code)
    reels_cmd = [
        "ffmpeg", "-y", "-i", str(master),
        "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p",
        "-crf", "16", "-preset", "medium",
        "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
        "-movflags", "+faststart",
        str(reels),
    ]
    subprocess.check_call(reels_cmd)
    print("master", master)
    print("reels", reels)


if __name__ == "__main__":
    main()
