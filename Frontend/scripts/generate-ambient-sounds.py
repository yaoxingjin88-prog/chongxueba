"""生成专注页白噪音占位音频（loop 友好，约 30s）"""
import math
import random
import struct
import wave
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / 'public' / 'sounds'
SAMPLE_RATE = 22050
DURATION = 30


def write_wav(name, samples):
    path = OUT / f'{name}.wav'
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), 'w') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        frames = b''.join(struct.pack('<h', max(-32767, min(32767, int(s * 32767)))) for s in samples)
        wf.writeframes(frames)
    print(f'  {path.name} ({path.stat().st_size // 1024} KB)')


def pink_noise(n):
    rows = [0.0] * 7
    out = []
    for _ in range(n):
        white = random.uniform(-1, 1)
        rows[0] = 0.99886 * rows[0] + white * 0.0555179
        rows[1] = 0.99332 * rows[1] + white * 0.0750759
        rows[2] = 0.96900 * rows[2] + white * 0.1538520
        rows[3] = 0.86650 * rows[3] + white * 0.3104856
        rows[4] = 0.55000 * rows[4] + white * 0.5329522
        rows[5] = -0.7616 * rows[5] - white * 0.0168980
        val = sum(rows) + white * 0.5362
        out.append(val * 0.11)
    return out


def rain(n):
    base = pink_noise(n)
    for i in range(n):
        if random.random() < 0.0025:
            drop = math.exp(-((i % 800) / 120))
            base[i] += drop * random.uniform(0.08, 0.18)
        base[i] *= 0.85 + 0.15 * math.sin(i / SAMPLE_RATE * 0.7)
    return base


def cafe(n):
    base = pink_noise(n)
    for i in range(n):
        t = i / SAMPLE_RATE
        hum = math.sin(t * 2 * math.pi * 60) * 0.015
        chatter = math.sin(t * 17.3) * math.sin(t * 3.1) * 0.012
        base[i] = base[i] * 0.55 + hum + chatter
    return base


def forest(n):
    base = pink_noise(n)
    for i in range(n):
        t = i / SAMPLE_RATE
        if int(t * 3.7) != int((i - 1) / SAMPLE_RATE * 3.7) and random.random() < 0.35:
            chirp_len = int(SAMPLE_RATE * random.uniform(0.08, 0.18))
            freq = random.uniform(1800, 4200)
            for j in range(min(chirp_len, n - i)):
                env = math.sin(math.pi * j / chirp_len)
                base[i + j] += math.sin((i + j) / SAMPLE_RATE * freq * 2 * math.pi) * env * 0.06
        base[i] *= 0.7
    return base


def fire(n):
    base = pink_noise(n)
    crackle = 0.0
    for i in range(n):
        if random.random() < 0.018:
            crackle = random.uniform(0.12, 0.28)
        crackle *= 0.92
        t = i / SAMPLE_RATE
        base[i] = base[i] * 0.45 + crackle + math.sin(t * 2 * math.pi * 90) * 0.008
    return base


def main():
    n = SAMPLE_RATE * DURATION
    random.seed(42)
    print('Generating ambient sounds...')
    write_wav('rain', rain(n))
    random.seed(43)
    write_wav('cafe', cafe(n))
    random.seed(44)
    write_wav('forest', forest(n))
    random.seed(45)
    write_wav('fire', fire(n))
    print('Done.')


if __name__ == '__main__':
    main()
