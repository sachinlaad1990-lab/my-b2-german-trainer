#!/usr/bin/env python3
"""Calm spoken app tour using the public-domain LJ Speech voice.
Do not trim narration to fit scenes: assert each segment has enough room.
Voice checkpoint: rhasspy/piper-voices/en/en_US/ljspeech/medium (see MODEL_CARD).
"""
from pathlib import Path
import array
import subprocess
import wave

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "media" / "_tour_build"
OUT.mkdir(parents=True, exist_ok=True)
MODEL = OUT / "en_US-ljspeech-medium.onnx"
assert MODEL.exists() and MODEL.stat().st_size > 50_000_000, "Voice model was not downloaded"
LINES = [
    "Welcome to your German B two learning app.",
    "Start here. Choose what you want to learn.",
    "Vocabulary cards show useful words, with examples.",
    "On each flashcard, try remembering the answer first.",
    "Then reveal it, and review any difficult words.",
    "Study two hundred and eleven verbs, with examples.",
    "Open the table for all six present tense forms.",
    "Grammar lessons explain the rules in simple steps.",
    "Try a quiz. You get feedback straight away.",
    "Your progress stays saved. Try the app for free.",
]
assert len(LINES) == 10
RATE = 22050
STEP = 6.0
DURATION = 62.0
# The opening silence avoids speech starting before the first screen is visible.
sound = array.array("h", [0]) * round(DURATION * RATE)
for index, sentence in enumerate(LINES):
    path = OUT / f"voice_{index:02d}.wav"
    subprocess.run(
        ["piper", "--model", str(MODEL),
         "--length_scale", "1.12", "--output_file", str(path)],
        input=sentence + "\n", text=True, capture_output=True, check=True
    )
    with wave.open(str(path), "rb") as track:
        assert track.getnchannels() == 1 and track.getsampwidth() == 2
        assert track.getframerate() == RATE
        samples = array.array("h", track.readframes(track.getnframes()))
    duration = len(samples) / RATE
    if duration > STEP - 0.7:
        raise RuntimeError(f"Line {index + 1} is {duration:.2f}s and too long for {STEP}s scene; shorten text rather than clipping")
    start = round((index * STEP + 0.35) * RATE)
    for n, sample in enumerate(samples):
        ix = start + n
        if ix >= len(sound):
            raise RuntimeError("Narration extends past final video duration")
        value = int(sound[ix] + sample * 0.78)
        sound[ix] = max(-32768, min(32767, value))
    print(f"Scene {index + 1}: {duration:.2f}s voice / {STEP:.1f}s window, no cut", flush=True)
with wave.open(str(OUT / "narration.wav"), "wb") as f:
    f.setnchannels(1)
    f.setsampwidth(2)
    f.setframerate(RATE)
    f.writeframes(sound.tobytes())
print("CALM_NARRATION_SUCCESS: 10 scenes, uncut neural TTS, natural pauses", flush=True)
