"""Generate Bangla voiceover + word timings with Microsoft neural voice (edge-tts).

Usage: python -I -X utf8 scripts/tts.py
Outputs public/vo/<id>.mp3 and public/vo/<id>.json (word boundaries in ms).
The service intermittently returns no audio, so each line is retried.
"""
import asyncio
import json
import pathlib
import edge_tts

VOICE = "bn-BD-PradeepNeural"
RATE = "+0%"
PITCH = "+0Hz"

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "vo"

LINES = {
    "s1": "আঙুলের ডগার এই ছোট্ট টুকরোটা, একাই প্রায় এক টন কয়লার সমান শক্তি রাখে।",
    "s2": "আর পদ্মার পাড়ে, ঈশ্বরদীতে, এরকম লক্ষ লক্ষ টুকরো দিয়ে খাওয়ানো হচ্ছে একটা দানবকে।",
    "s3": "ভেতরে কোনো আগুন জ্বলে না। বিদ্যুৎ আসে, একটা পরমাণুর ভেতর থেকে।",
    # Final script (Hook A), hero shots S01-S04, S09
    "hook": "রূপপুরে কোনো আগুন জ্বলে না, এক টুকরো কয়লাও পোড়ে না। তবুও এখান থেকে বের হবে, দুই হাজার চারশো মেগাওয়াট বিদ্যুৎ।",
    "pellet": "এই পুরো শক্তির উৎস, এই ছোট্ট টুকরোটা। একটা ইউরেনিয়াম পেলেট, একাই প্রায় এক টন কয়লার সমান শক্তি রাখে।",
    "fission": "এই পেলেটের ভেতরে আছে ইউরেনিয়াম-২৩৫। এর নিউক্লিয়াস এতটাই ভারী আর অস্থির, যে একটা নিউট্রন এসে ছুঁয়ে দিলেই, সেটা ফেটে দুই টুকরো হয়ে যায়। ফাটার মুহূর্তে বের হয় প্রচণ্ড তাপ, আর ছিটকে বের হয় আরও দুই-তিনটা নতুন নিউট্রন।",
    # Remaining sections of the final script (one key per shot group)
    "reactor": "পদ্মার পাড়ে, ঈশ্বরদীতে, এরকম লক্ষ লক্ষ পেলেট ভরা হয় একটা দানবের পেটে, রিঅ্যাক্টরে। একেকটা রডে সাড়ে তিনশোরও বেশি পেলেট, একটা অ্যাসেম্বলিতে তিনশো বারোটা রড, আর চুল্লিতে একশো তেষট্টিটা অ্যাসেম্বলি।",
    "chain": "সেই নিউট্রনগুলো গিয়ে ভাঙে পাশের পরমাণু। তারা ভাঙে আরও। প্রতি সেকেন্ডে কোটি কোটি বার। এটাই চেইন রিঅ্যাকশন, পুরো বিদ্যুৎকেন্দ্রের হৃদপিণ্ড।",
    "myth": "অনেকে ভাবেন, এটা তো তাহলে একটা বোমা। না। বোমায় লাগে প্রায় নব্বই ভাগ খাঁটি ইউরেনিয়াম-২৩৫। রূপপুরের জ্বালানিতে সেটা পাঁচ ভাগেরও কম। এটা দিয়ে চাইলেও বোমার মতো বিস্ফোরণ সম্ভব না।",
    "control": "তারপরও বিক্রিয়াকে লাগাম পরাতে হয়। চুল্লির মাথায় ঝুলে থাকে কন্ট্রোল রড, যেগুলো নিউট্রন গিলে ফেলে। রড নামালে বিক্রিয়া কমে, তুললে বাড়ে।",
    "scram": "আর বিপদের সংকেত পেলে, সব রড একসাথে নিজের ওজনেই নিচে পড়ে যায়। কয়েক সেকেন্ডে চুল্লি শান্ত।",
    "loop": "এই তাপ দিয়ে শুরু হয় আসল খেলা। চুল্লির ভেতর দিয়ে ছুটছে পানি, প্রায় তিনশো ত্রিশ ডিগ্রি সেলসিয়াস গরম।",
    "pressure": "এই তাপমাত্রায় পানির অনেক আগেই ফুটে যাওয়ার কথা। কিন্তু এখানে চাপ দেওয়া হয় বায়ুমণ্ডলের প্রায় একশো ষাট গুণ, তাই পানি ফুটতেই পারে না।",
    "sg": "এই গরম পানি স্টিম জেনারেটরে গিয়ে, নিজের তাপ দিয়ে দেয় আলাদা একটা পানির লাইনে। দুই পানি কখনো মেশে না। দ্বিতীয় লাইনের পানি ফুটে তৈরি হয় তীব্র গতির বাষ্প।",
    "turbine": "সেই বাষ্প আছড়ে পড়ে দানবীয় টারবাইনের পাখায়। টারবাইন ঘোরে মিনিটে তিন হাজার বার।",
    "generator": "টারবাইনের সাথে জোড়া জেনারেটর। ভেতরে ঘুরছে বিশাল চুম্বক, চারপাশে তামার তার। চুম্বক ঘুরলেই, তারে জন্ম নেয় বিদ্যুৎ।",
    "dynamo": "ঠিক এই নিয়মেই জ্বলে সাইকেলের ডায়নামো লাইট।",
    "city": "পার্থক্য শুধু একটা। এইটা জ্বালাবে লক্ষ লক্ষ ঘর।",
    "cooling": "আর ওই বিশাল টাওয়ারগুলো থেকে যে সাদা মেঘ ওঠে, ওটা ধোঁয়া না, শুধুই পানির বাষ্প।",
    "condenser": "টারবাইন ঘোরানোর পর বাষ্পকে ঠান্ডা করে আবার পানি বানানো হয়, আর বাড়তি তাপটা উড়ে যায় এই টাওয়ার দিয়ে।",
    "safety": "চেরনোবিল আর ফুকুশিমার পর ডিজাইন বদলেছে। রূপপুরের রিঅ্যাক্টরের চারপাশে দুই স্তরের মোটা কংক্রিটের খোলস। বিদ্যুৎ চলে গেলেও, প্রাকৃতিকভাবে ঠান্ডা করার ব্যবস্থা আছে।",
    "catcher": "আর সবচেয়ে খারাপ দিনের জন্য, চুল্লির নিচে বসানো আছে কোর ক্যাচার, গলে যাওয়া জ্বালানি ধরে রাখার একটা বিশাল পাত্র।",
    "ending": "আগুন নেই, কয়লা নেই। শুধু একটা পরমাণু ভাঙে, আর পদ্মার পাড় থেকে আলো পৌঁছে যায় আপনার ঘর পর্যন্ত।",
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
    OUT.mkdir(parents=True, exist_ok=True)
    for k, t in LINES.items():
        if (OUT / f"{k}.mp3").exists() and (OUT / f"{k}.json").exists():
            continue
        await make(k, t)
    # Per-key audio length (s) from the last word boundary, for shot timing in src/
    lengths = {}
    for k in LINES:
        words = json.loads((OUT / f"{k}.json").read_text(encoding="utf-8"))
        lengths[k] = round(words[-1]["endMs"] / 1000 + 0.35, 2) if words else 0
    (ROOT / "src" / "vo-lengths.json").write_text(json.dumps(lengths, indent=1), encoding="utf-8")
    print(lengths)


asyncio.run(main())
