#!/usr/bin/env python3
"""Trilha procedural do comercial. Sem música de estoque, sem narração."""
import math
import wave
import struct
from pathlib import Path

import numpy as np

SR = 48000
DUR = 30.0
N = int(SR * DUR)


def env_exp(n, decay):
    t = np.arange(n) / SR
    return np.exp(-t / decay)


def noise(n, seed):
    rng = np.random.default_rng(seed)
    return rng.standard_normal(n).astype(np.float64)


def lowpass(x, cutoff):
    # one-pole
    a = math.exp(-2 * math.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    b = 1 - a
    for i, s in enumerate(x):
        acc = b * s + a * acc
        y[i] = acc
    return y


def highpass(x, cutoff):
    return x - lowpass(x, cutoff)


def band(x, lo, hi):
    return highpass(lowpass(x, hi), lo)


def place(buf, sig, at, gain=1.0):
    i = int(at * SR)
    j = min(N, i + len(sig))
    if i >= N or j <= i:
        return
    buf[i:j] += sig[: j - i] * gain


def main():
    L = np.zeros(N)
    R = np.zeros(N)

    # 1. Arremesso — ar e tecido, 0 a 0.45s
    arm_n = int(0.48 * SR)
    arm = band(noise(arm_n, 3), 180, 1400)
    t = np.arange(arm_n) / SR
    arm *= (t / 0.48) ** 1.4 * np.exp(-((t - 0.36) ** 2) / 0.02)
    place(L, arm, 0.0, 0.48)
    place(R, arm, 0.0, 0.36)

    # soltura
    rel_n = int(0.06 * SR)
    rel = band(noise(rel_n, 9), 400, 2800) * env_exp(rel_n, 0.012)
    place(L, rel, 0.37, 0.62)
    place(R, rel, 0.37, 0.5)

    # 2-3. Whoosh contínuo — um filtro só, sem cortes de bloco
    whoosh_n = int(7.2 * SR)
    w = noise(whoosh_n, 5)
    tt = np.arange(whoosh_n) / SR
    rate = np.exp(-tt / 0.85) * 0.85 + 0.02
    amp = rate ** 0.65
    amp *= np.clip(tt / 0.08, 0, 1)
    out = np.zeros(whoosh_n)
    lo = 0.0
    hi = 0.0
    prev = 0.0
    for i in range(whoosh_n):
        c_hi = 400 + 5200 * float(rate[i])
        c_lo = 90 + 380 * float(rate[i])
        a_hi = math.exp(-2 * math.pi * c_hi / SR)
        a_lo = math.exp(-2 * math.pi * c_lo / SR)
        lo = (1 - a_hi) * w[i] + a_hi * lo
        hi = (1 - a_lo) * lo + a_lo * hi
        sample = lo - hi
        # tira o clique de um salto de amostra
        sample = prev * 0.15 + sample * 0.85
        prev = sample
        out[i] = sample
    out *= amp
    # panorâmica leve da esquerda para o centro
    pan = np.linspace(-0.35, 0.15, whoosh_n)
    place(L, out * (0.55 - pan), 0.38, 0.72)
    place(R, out * (0.55 + pan), 0.38, 0.72)

    # 4. Quase silêncio — ar muito baixo, 7.6 a 11s
    air_n = int(3.6 * SR)
    air = highpass(noise(air_n, 8), 1800) * 0.015
    place(L, air, 7.5, 1.0)
    place(R, air * 0.8, 7.5, 1.0)

    # 6. Impacto em câmera lenta — corpo + rachaduras espaçadas + parciais de cristal
    impact = 11.0
    body_n = int(0.55 * SR)
    tt = np.arange(body_n) / SR
    body = np.sin(2 * math.pi * 72 * tt) * np.exp(-tt / 0.09)
    body += np.sin(2 * math.pi * 48 * tt) * np.exp(-tt / 0.14) * 0.6
    place(L, body, impact, 0.55)
    place(R, body, impact, 0.55)

    crack_times = [0.0, 0.22, 0.48, 0.86, 1.25, 1.7]
    for k, ct in enumerate(crack_times):
        cn = int(0.18 * SR)
        c = band(noise(cn, 20 + k), 900, 7000) * env_exp(cn, 0.02 + k * 0.004)
        g = 0.38 if k == 0 else 0.22
        place(L, c, impact + ct, g * (1.05 if k % 2 == 0 else 0.85))
        place(R, c, impact + ct, g * (0.85 if k % 2 == 0 else 1.05))

    # parciais inarmônicos de vidro
    partials = [1680, 2140, 2890, 3520, 4210, 5380, 6740]
    ratios_decay = [0.55, 0.42, 0.33, 0.24, 0.16, 0.1, 0.06]
    ring_n = int(2.8 * SR)
    tt = np.arange(ring_n) / SR
    ring = np.zeros(ring_n)
    for f, amp, dec in zip(partials, ratios_decay, [0.55, 0.48, 0.4, 0.36, 0.3, 0.24, 0.2]):
        ring += np.sin(2 * math.pi * f * tt) * np.exp(-tt / dec) * amp
    place(L, ring, impact + 0.01, 0.16)
    place(R, ring, impact + 0.012, 0.16)

    # 7. Estilhaços — sinos curtos, espaçados
    rng = np.random.default_rng(4)
    for k in range(14):
        at = 11.35 + rng.random() * 3.0
        f0 = 1800 + rng.random() * 4200
        tn = int((0.25 + rng.random() * 0.35) * SR)
        tt = np.arange(tn) / SR
        tone = np.sin(2 * math.pi * f0 * tt) * np.exp(-tt / 0.09)
        tone += np.sin(2 * math.pi * f0 * 2.3 * tt) * np.exp(-tt / 0.05) * 0.35
        g = 0.045 + rng.random() * 0.04
        if rng.random() > 0.5:
            place(L, tone, at, g)
            place(R, tone, at + 0.004, g * 0.7)
        else:
            place(R, tone, at, g)
            place(L, tone, at + 0.004, g * 0.7)

    # 8. Tom da passagem para o digital — quinta justa, baixo, sem melodia
    tone_n = int(10 * SR)
    tt = np.arange(tone_n) / SR
    fade = np.clip(tt / 1.4, 0, 1) * np.clip((9.2 - tt) / 1.2, 0, 1)
    tone = (np.sin(2 * math.pi * 196 * tt) * 0.55 + np.sin(2 * math.pi * 294 * tt) * 0.28) * fade
    place(L, tone, 16.2, 0.07)
    place(R, tone, 16.2, 0.07)

    # micro cliques quando o tipo assenta — bem baixos
    for at in (19.7, 20.4, 21.6, 22.4):
        cn = int(0.03 * SR)
        click = highpass(noise(cn, int(at * 10)), 2000) * env_exp(cn, 0.008)
        place(L, click, at, 0.05)
        place(R, click, at, 0.05)

    # 9. Assinatura — sino curto no monograma
    bell_n = int(2.4 * SR)
    tt = np.arange(bell_n) / SR
    bell = np.zeros(bell_n)
    for f, a, d in (
        (196, 0.35, 1.1),
        (392, 0.22, 0.9),
        (523.25, 0.55, 1.3),
        (784, 0.18, 0.7),
        (1046, 0.08, 0.45),
    ):
        bell += np.sin(2 * math.pi * f * tt) * np.exp(-tt / d) * a
    place(L, bell, 26.7, 0.14)
    place(R, bell, 26.7, 0.14)

    # limiter suave
    peak = max(np.max(np.abs(L)), np.max(np.abs(R)), 1e-9)
    target = 10 ** (-1.0 / 20)  # -1 dBFS
    if peak > target:
        L *= target / peak
        R *= target / peak

    stereo = np.stack([L, R], axis=1)
    out = Path(__file__).resolve().parent / "mix.wav"
    with wave.open(str(out), "w") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        pcm = np.clip(stereo, -1, 1)
        ints = (pcm * 32767).astype(np.int16)
        w.writeframes(ints.tobytes())
    # relatório rápido
    rms = math.sqrt(float(np.mean(stereo**2)))
    print(out, "peak", float(np.max(np.abs(stereo))), "rms", rms)


if __name__ == "__main__":
    main()
