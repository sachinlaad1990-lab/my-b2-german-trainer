#!/usr/bin/env python3
"""Build an original spoken guide in 10 paced sections; no external voice services."""
from pathlib import Path
import array
import subprocess
import wave

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"media"/"_tour_build"
OUT.mkdir(parents=True,exist_ok=True)
SCRIPT=[
"Welcome to Deutsch B2 Beruf. Here is how to get started.",
"On the home screen, choose vocabulary, verbs, grammar, or practice.",
"Open vocabulary to learn meanings, articles, and useful examples.",
"With flashcards, think of the answer before you reveal it.",
"Then reveal the answer and review difficult words as needed.",
"Explore two hundred eleven verbs, including past forms and examples.",
"Expand a verb to see all six present-tense conjugations.",
"Open grammar for clear explanations and practical sentences.",
"Try the quiz and get feedback right after answering.",
"Your progress is saved, and you can return to learn more any time."
]
RATE=22050
DURATION=32.0
STEP=3.15
output=array.array("h",[0])*(int(DURATION*RATE))
for i,line in enumerate(SCRIPT):
    wav=OUT/f"narration_{i:02d}.wav"
    subprocess.run(["espeak-ng","-v","en-us","-s","176","-p","50","-a","150","-w",str(wav),line],check=True)
    with wave.open(str(wav),"rb") as f:
        assert f.getnchannels()==1, "Expected mono voice"
        samples=array.array("h",f.readframes(f.getnframes()))
        rate=f.getframerate()
    if rate!=RATE:
        # espeak-ng commonly emits 22050 Hz; avoid resampling dependencies.
        raise RuntimeError(f"Unexpected narration sample rate: {rate}")
    start=int((i*STEP+0.15)*RATE)
    for j,s in enumerate(samples):
        pos=start+j
        if pos>=len(output) or j>=int(3.1*RATE):
            break
        mixed=int(output[pos]+s*.82)
        output[pos]=max(-32768,min(32767,mixed))
with wave.open(str(OUT/"narration.wav"),"wb") as f:
    f.setnchannels(1)
    f.setsampwidth(2)
    f.setframerate(RATE)
    f.writeframes(output.tobytes())
print("VOICEOVER GENERATED",len(SCRIPT),"sections")
