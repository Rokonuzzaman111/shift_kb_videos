"""Caffeine reel voiceover + word timings (edge-tts, bn-BD-PradeepNeural).

Usage: python -I -X utf8 scripts/tts_caffeine.py [--force]
Outputs public/vo/caffeine/<key>.mp3 + .json and src/caffeine/vo-lengths.json.
One key per shot (see scripts/caffeine_storyboard.md).
"""
import asyncio
import json
import pathlib
import sys

import edge_tts

VOICE = "bn-BD-PradeepNeural"
RATE = "+4%"
PITCH = "+0Hz"

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "vo" / "caffeine"
LENGTHS = ROOT / "src" / "caffeine" / "vo-lengths.json"

LINES = {
    "hook": "পরীক্ষার আগের রাতে চা খেয়ে জেগে থাকেন? পরদিন হলে বসে ঝিমানোর কারণটাও ওই চা। কীভাবে, সেটা সহজ করে বলি।",
    "adeno": "আমরা যতক্ষণ জেগে থাকি, মগজে একটা জিনিস জমতে থাকে। এর নাম অ্যাডেনোসিন। সময় যত যায়, এটা তত বাড়ে। মগজে এর বসার নির্দিষ্ট জায়গা আছে। অ্যাডেনোসিন সেখানে বসলে মগজ বুঝতে পারে, এবার ঘুমানো দরকার।",
    "caff": "চায়ে থাকে ক্যাফেইন। ক্যাফেইন দেখতে প্রায় অ্যাডেনোসিনের মতো। তাই চা খেলে ক্যাফেইন আগে গিয়ে ওই জায়গাগুলোতে বসে পড়ে। অ্যাডেনোসিন তখন বসার জায়গা পায় না। ফলে ঘুমের সংকেত মগজে পৌঁছায় না।",
    "energy": "অর্থাৎ চা আপনাকে এনার্জি দেয় না। শুধু ক্লান্তিটা টের পেতে দেয় না।",
    "time": "চা খাওয়ার বিশ থেকে ত্রিশ মিনিট পর ক্যাফেইন কাজ শুরু করে। আর শরীর থেকে এর অর্ধেক বের হতে লাগে প্রায় পাঁচ ঘণ্টা। মানে রাত দশটায় চা খেলে, রাত তিনটাতেও অর্ধেকটা থেকে যায়।",
    "crash": "কিন্তু ক্যাফেইন বসে থাকলেও অ্যাডেনোসিন জমা থামে না। জমতেই থাকে। ক্যাফেইন সরে গেলে জমে থাকা সব অ্যাডেনোসিন একসাথে কাজ শুরু করে। তখন হঠাৎ অনেক বেশি ঘুম পায়। পরীক্ষার হলে ঝিমানোর কারণ এটাই।",
    "memory": "আরেকটা বিষয়। দিনে যা পড়েন, সেটা মগজে ভালোভাবে জমা হয় ঘুমের সময়। তাই রাত জেগে পড়লে পড়া হয় ঠিকই, কিন্তু মনে থাকে কম।",
    "tolerance": "যারা রোজ কয়েক কাপ চা খান, তাদের মগজে অ্যাডেনোসিনের বসার জায়গা বেড়ে যায়। তখন আগের মতো চা খেলে কাজ কম হয়। আর চা বাদ দিলে মাথা ধরে।",
    "tips": "তাই পরীক্ষার আগে রাতে অন্তত ছয়-সাত ঘণ্টা ঘুমান। চা খেলে খান সন্ধ্যার আগে। আর দরকার হলে পরীক্ষার দিন সকালে এক কাপ চা খান। তাহলে হলে বসে ঝিমানোর সম্ভাবনা কমবে।",
}


async def attempt(text: str):
    comm = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH, boundary="WordBoundary")
    words, audio = [], bytearray()
    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            audio.extend(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            words.append({
                "text": chunk["text"],
                "startMs": chunk["offset"] / 10_000,
                "endMs": (chunk["offset"] + chunk["duration"]) / 10_000,
            })
    return words, bytes(audio)


async def make(key: str, text: str) -> None:
    for i in range(15):
        try:
            words, audio = await attempt(text)
            if audio:
                (OUT / f"{key}.mp3").write_bytes(audio)
                (OUT / f"{key}.json").write_text(json.dumps(words, ensure_ascii=False, indent=1), encoding="utf-8")
                print(key, "ok after", i + 1, "tries,", len(words), "words")
                return
        except edge_tts.exceptions.NoAudioReceived:
            pass
        await asyncio.sleep(1.5)
    raise SystemExit(f"{key}: no audio after retries")


async def main() -> None:
    force = "--force" in sys.argv
    OUT.mkdir(parents=True, exist_ok=True)
    LENGTHS.parent.mkdir(parents=True, exist_ok=True)
    for k, t in LINES.items():
        if not force and (OUT / f"{k}.mp3").exists() and (OUT / f"{k}.json").exists():
            continue
        await make(k, t)
    lengths = {}
    for k in LINES:
        words = json.loads((OUT / f"{k}.json").read_text(encoding="utf-8"))
        lengths[k] = round(words[-1]["endMs"] / 1000 + 0.35, 2) if words else 0
    LENGTHS.write_text(json.dumps(lengths, indent=1), encoding="utf-8")
    print(lengths, "total", round(sum(lengths.values()), 2))


asyncio.run(main())
