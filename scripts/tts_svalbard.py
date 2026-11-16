"""Svalbard reel — Pradeep (bn-BD-PradeepNeural) voiceover for one part, with word timings.

Usage: python -I -X utf8 scripts/tts_svalbard.py p1
Each sentence is synthesized separately (retry: the service sometimes returns no audio), then joined with
fixed pauses so part boundaries always sit inside a pause.
Out: public/svalbard/vo/<part>.wav (48 kHz mono), src/svalbard/vo/<part>.json [{text,startMs,endMs}] (part time).
Temp files stay on E: (work/svalbard).
"""
import asyncio
import json
import pathlib
import subprocess
import sys

import edge_tts

VOICE = "bn-BD-PradeepNeural"
RATE = "+0%"
LEAD = 0.25  # s of silence before the first word
PAUSE = {",": 0.12, "s": 0.45}  # gap after a sentence; comma pauses come from the TTS itself
TAIL = 0.45

ROOT = pathlib.Path(__file__).resolve().parent.parent
TMP = ROOT / "work" / "svalbard"
OUT_WAV = ROOT / "public" / "svalbard" / "vo"
OUT_JSON = ROOT / "src" / "svalbard" / "vo"

PARTS = {
    "p1": [
        "পৃথিবীর সব ফসল একদিন হারিয়ে গেলে, আবার শুরু হবে এই পাহাড়ের ভেতর থেকে।",
        "নরওয়ের স্বালবার্ড দ্বীপপুঞ্জে, উত্তর মেরুর কাছাকাছি, একটা বরফ-ঢাকা পাহাড়ের গভীরে আছে, স্বালবার্ড গ্লোবাল সিড ভল্ট।",
        "দরজা পেরিয়ে, পাহাড়ের ভেতর দিয়ে একশো মিটারেরও বেশি লম্বা সুড়ঙ্গ, তারপর বরফ-শীতল তিনটা কক্ষ।",
        "ভেতরে মাইনাস আঠারো ডিগ্রি সেলসিয়াসে রাখা আছে, চৌদ্দ লাখেরও বেশি বীজের নমুনা।",
        "আর এর ধারণক্ষমতা? প্রায় পঁয়তাল্লিশ লাখ জাত।",
    ],
    "p2": [
        "দুই হাজার আট সালে চালু হওয়া এই ভল্ট, আসলে পৃথিবীর কৃষির একটা ব্যাকআপ।",
        "বিভিন্ন দেশের গবেষণা প্রতিষ্ঠান আর জিন-ব্যাংকে, ধান, গম, ভুট্টাসহ হাজারো জাতের বীজ রাখা হয়।",
        "কোনো জাত খরা সহ্য করে, কোনোটা নির্দিষ্ট রোগ ঠেকায়, আবার কোনোটা কঠিন পরিবেশেও ভালো ফলন দেয়।",
        "কিন্তু যুদ্ধ, বন্যা, আগুন, বা যান্ত্রিক সমস্যায়, এই সংগ্রহ ধ্বংস হয়ে যেতে পারে।",
        "আর একটা জাত হারালে, তার বিশেষ জিনগত গুণও, চিরতরে হারিয়ে যায়।",
    ],
    "p3": [
        "তাই বিভিন্ন দেশ, নিজেদের বীজের একটা বাড়তি কপি পাঠিয়ে দেয় এখানে।",
        "প্রতিটা নমুনায় গড়ে প্রায় পাঁচশোটা বীজ।",
        "বীজগুলো আগে ভালো করে শুকানো হয়, তারপর তিন স্তরের ফয়েলের প্যাকেটে সিল করে, বাক্সে ভরে রাখা হয় তাকে।",
        "মাইনাস আঠারো ডিগ্রিতে বীজ যেন ঘুমিয়ে পড়ে, ভেতরের সব কাজ প্রায় থেমে যায়।",
        "ফলে অনেক জাত, শত শত বছর পরেও আবার অঙ্কুরিত হতে পারে।",
    ],
    "p4": [
        "ভল্টটা সমুদ্র থেকে প্রায় একশো ত্রিশ মিটার উঁচুতে, মেরুর বরফ গললেও পানি পৌঁছাবে না।",
        "আর চারপাশের জমাট পাথর, মানে পারমাফ্রস্ট, বিদ্যুৎ চলে গেলেও ভল্টকে ঠান্ডা রাখে।",
        "মজার ব্যাপার, এখানে বীজ রাখতে কোনো টাকা লাগে না।",
        "বাক্সগুলো কেউ খোলেও না, একে বলে ব্ল্যাক বক্স ব্যবস্থা।",
        "যে প্রতিষ্ঠান বীজ রেখেছে, শুধু তারাই সেটা ফেরত নিতে পারে।",
    ],
    "p5": [
        "আর এই ব্যাকআপ, সত্যিই কাজে লেগেছে।",
        "দুই হাজার পনেরো সালে, সিরিয়ার যুদ্ধে, আলেপ্পোর একটা বীজ ব্যাংক বিপদে পড়ে।",
        "তখন ইতিহাসে প্রথমবার, স্বালবার্ড থেকে বীজ ফেরত তোলা হয়, আর লেবানন ও মরক্কোয় নতুন করে গড়ে ওঠে পুরো সংগ্রহ।",
        "এই অক্টোবরেও বীজ জমা দিয়েছে একুশটা জিন-ব্যাংক, তার মধ্যে যুদ্ধ শুরুর পর প্রথমবার, ইউক্রেনও।",
        "ভবিষ্যতের খরা আর রোগের সাথে লড়তে, লাগবে আজকের এই বীজ।",
        "বাংলাদেশের ধানের জাতও কি এখানে রাখা উচিত? কমেন্টে জানান।",
    ],
}

SR = 48000


async def attempt(text: str):
    comm = edge_tts.Communicate(text, VOICE, rate=RATE, boundary="WordBoundary")
    words, audio = [], bytearray()
    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            audio.extend(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            words.append({"text": chunk["text"], "startMs": chunk["offset"] / 10_000,
                          "endMs": (chunk["offset"] + chunk["duration"]) / 10_000})
    return words, bytes(audio)


async def synth(text: str):
    for _ in range(15):
        try:
            w, a = await attempt(text)
            if a and w:
                return w, a
        except edge_tts.exceptions.NoAudioReceived:
            pass
        await asyncio.sleep(1.5)
    raise SystemExit(f"no audio: {text}")


def decode(mp3: pathlib.Path) -> bytes:
    return subprocess.run(["ffmpeg", "-v", "error", "-i", str(mp3), "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
                          capture_output=True, check=True).stdout


def trim_silence(pcm: bytes) -> tuple[bytes, float]:
    """cut leading/trailing near-silence; returns (pcm, seconds cut at the start)"""
    import array
    a = array.array("h", pcm)
    thr = 300
    i = next((k for k, v in enumerate(a) if abs(v) > thr), 0)
    j = len(a) - next((k for k, v in enumerate(reversed(a)) if abs(v) > thr), 0)
    i = max(0, i - int(0.03 * SR))
    j = min(len(a), j + int(0.06 * SR))
    return a[i:j].tobytes(), i / SR


async def main(part: str) -> None:
    TMP.mkdir(parents=True, exist_ok=True)
    OUT_WAV.mkdir(parents=True, exist_ok=True)
    OUT_JSON.mkdir(parents=True, exist_ok=True)
    pcm = bytearray(b"\0\0" * int(LEAD * SR))
    words = []
    for n, line in enumerate(PARTS[part]):
        w, a = await synth(line)
        mp3 = TMP / f"{part}_{n}.mp3"
        mp3.write_bytes(a)
        seg, cut = trim_silence(decode(mp3))
        t0 = len(pcm) / 2 / SR - cut
        for x in w:
            words.append({"text": x["text"], "startMs": round(t0 * 1000 + x["startMs"], 1),
                          "endMs": round(t0 * 1000 + x["endMs"], 1), "line": n})
        pcm.extend(seg)
        if n < len(PARTS[part]) - 1:
            pcm.extend(b"\0\0" * int(PAUSE["s"] * SR))
        print(f"line {n}: {len(seg) / 2 / SR:.2f}s, {len(w)} words")
    pcm.extend(b"\0\0" * int(TAIL * SR))
    raw = TMP / f"{part}.pcm"
    raw.write_bytes(bytes(pcm))
    wav = OUT_WAV / f"{part}.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", str(raw),
                    "-af", "loudnorm=I=-16:TP=-1.5:LRA=7", "-ar", str(SR), str(wav)], check=True)
    (OUT_JSON / f"{part}.json").write_text(json.dumps(words, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{part}: {len(pcm) / 2 / SR:.2f}s total, {len(words)} words -> {wav}")


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1] if len(sys.argv) > 1 else "p1"))
