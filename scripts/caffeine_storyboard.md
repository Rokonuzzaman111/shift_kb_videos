# Caffeine reel: storyboard + production bible

Script: `scripts/caffeine_script.md` · VO: `public/vo/caffeine/<key>.mp3/.json` (word timings) · lengths: `src/caffeine/vo-lengths.json`
Total ≈ 1:46 · 1080×1920 · 30 fps · one shot per VO key.

---

## 1. Frame grammar (every shot follows this)

```
y=0     ┌──────────────────────────┐
        │  (FB top bar, keep calm) │  0–150   nothing important
y=160   │  TITLE ZONE              │  160–520 keyword titles / labels / counters
y=520   │                          │
        │  HERO ZONE               │  520–1250 the subject (brain, cup, molecule, student)
        │  (centre of interest     │  camera frames the hero here
        │   ≈ y 850)               │
y=1250  │                          │
        │  CAPTION ZONE            │  1280–1560 word-synced captions (owned by assembler)
y=1560  │                          │  NEVER put text or key action here
        │  (FB UI: likes, caption) │  1560–1920 only background
y=1920  └──────────────────────────┘
        side margins 80px; right 140px also holds FB buttons below y=1100
```

- **Visual change every 3–5 s**: camera move, cut, zoom, or new element. No static frame > 5 s.
- **Zoom on the noun**: when VO says the object's name (`wordAt(key,"ক্যাফেইন")`), the camera pushes in / the object scales up within ~0.4 s of that word.
- **Camera**: slow cinematic push (`ease.cine`), occasional whip/cut. Handheld micro-motion tiny (≤ 0.5% frame). Never shaky.
- **Text**: titles are **keywords, not sentences** (captions already carry every word). Max 2 text elements on screen at once. Every pop-in happens on its spoken word.
- **Transitions**: the assembler adds a short zoom-blur entry on each shot and a soft whoosh. Inside a shot, internal cuts are hard cuts on a word.
- **SFX**: purposeful only. Roughly ≤ 1 cue every 2–3 s, many pop texts get **no** sound. Music is a quiet bed, ducked under VO.

## 2. Look

- Base: warm dark (`#0d0806` → `#1b120c` gradients), like a study room at night.
- **Amber `#ffb547` = adenosine (tiredness)** · **Cyan `#47d7ff` = caffeine** · **Tea brown `#c8874a`** · **Alert red `#ff5a4d`** · **OK green `#4ade80`**
- 3D: physically based, HDRI-lit, PostFX (DOF, bloom, ACES). Molecules = glossy ball-and-stick with soft glow; brain = translucent, subsurface-looking pink-grey with emissive glow where receptors fire.
- 2D: clean flat-illustration with soft shading (not childish), same palette, 6–10 px rounded strokes.
- Fonts: Anek Bangla (titles) / Hind Siliguri (body) from `src/theme.ts`.

## 3. Shot list

Times are shot-local seconds. `w("x")` = `wordAt(key,"x")`.

### SH1 · hook (~9.5 s) · owner: props3d
- 0 → w("পরদিন"): **3D night desk**. Close-up of a milk-tea glass cup with steam, open book, desk lamp warm pool of light, analog clock reads 2:00. Camera slow push from cup to clock. Title pop on w("চা"): **"রাত ২টা ☕"**. SFX: clink at 0.3, soft tick under.
- w("পরদিন") → w("কীভাবে"): **hard cut** to exam hall (2D `Student` pose "nodding" at a desk, rows of desks, invigilator silhouette, wall clock). Student head drops on w("ঝিমানোর"). Title: **"পরীক্ষার হল 😴"**.
- w("কীভাবে") → end: whip back to the tea cup, fast zoom INTO the tea surface (transition into next shot's brain). SFX: whoosh.

### SH2 · adeno (~16.2 s) · owner: science3d
- Open on translucent 3D **brain**, slowly rotating, centred. A small sun→moon arc / clock in title zone shows time passing (morning→night).
- w("জমতে"): amber adenosine molecules start appearing and multiplying around the brain (count grows).
- w("অ্যাডেনোসিন"): **zoom into one adenosine molecule** (macro), label pop **"অ্যাডেনোসিন"** amber.
- w("বাড়ে"): pull back; a "tiredness" meter (2D overlay, top) fills.
- w("জায়গা"): camera dives to the brain surface → close-up of a **receptor** (cup-shaped socket on a cell membrane). Label **"বসার জায়গা"**.
- w("বসলে"): adenosine docks into receptor (snap + glow ripple). SFX: soft click.
- w("ঘুমানো"): the cell/region dims, a gentle "😴 ঘুম" pop. 

### SH3 · caff (~15.2 s) · owner: science3d  ★ hero shot
- Open: tea cup top-down → cyan caffeine molecules rise from the tea (3D, can reuse `TeaCup`).
- w("ক্যাফেইন") (1st): zoom on one caffeine molecule, label **"ক্যাফেইন"** cyan.
- w("দেখতে"): side-by-side compare, adenosine (amber) left, caffeine (cyan) right, similar shape. Thin outline overlay showing the matching parts.
- w("আগে"): caffeine flies into the receptor first and docks (snap). SFX: click.
- w("পায়"): adenosine arrives, bumps, bounces off. Red ✕ pulse. 
- w("সংকেত"): pull back wide: many receptors on membrane, all filled cyan; a signal pulse (amber line) travelling toward the brain gets blocked. Title **"সংকেত ❌"**.

### SH4 · energy (~6.1 s) · owner: motion2d
- 2D: a battery icon labelled **"এনার্জি"**; on w("এনার্জি") it stays the same (no charge), crossed out ✕.
- w("ক্লান্তিটা"): tiredness meter is HIGH (amber 85%) but a cyan "mute/cover" slides over it, and the student character looks wide-awake with tired eyes. Title **"ক্লান্তি চাপা পড়ে"**.

### SH5 · time (~12.1 s) · owner: props3d
- 3D tea cup, a ring timer around it counts **০ → ২০–৩০ মিনিট** on w("বিশ"). Label **"কাজ শুরু: ২০–৩০ মিনিট"**.
- w("অর্ধেক"): cut to clean 2D/3D bar: caffeine level 100% → 50% with a "৫ ঘণ্টা" bracket (on w("পাঁচ")).
- w("দশটায়"): two analog clocks side by side: **রাত ১০টা** → hands spin → **রাত ৩টা** (on w("তিনটাতেও")). The cup beside it still half full of cyan glow. SFX: ticking accelerating during spin, stops on ৩টা.

### SH6 · crash (~15.3 s) · owner: science3d
- Receptors filled cyan, outside them a growing **queue** of amber adenosine (stack/crowd keeps increasing). Counter top: amber count rising. w("থামে")
- w("সরে"): cyan molecules detach one by one and drift away.
- w("একসাথে"): all amber rush in at once (fast, satisfying swarm docking). Brain glow dims hard. SFX: low thud on w("একসাথে").
- w("ঘুম"): cut to exam hall 2D (`Student` pose "yawn"→"nodding"). Title **"এজন্যই ঝিমানো"** on w("ঝিমানোর").

### SH7 · memory (~10.1 s) · owner: motion2d
- 2D: topic cards ("গণিত", "পদার্থ", "ইংরেজি" ...) floating in a dark brain silhouette.
- w("ঘুমের"): moon icon, cards slide into neat shelves/drawers ("storage") with a soft glow. Label **"ঘুমে পড়া পাকা হয়"**.
- w("জেগে"): rewind; awake version: cards stay scattered and some fade/crumble. Label **"রাত জাগলে → মনে থাকে কম"** with ↓ arrow. SFX: paper flutter once.

### SH8 · tolerance (~10.5 s) · owner: science3d
- Cups 1, 2, 3 pop in title zone (2D icons). Membrane close-up: **new receptors sprout** (grow from membrane) on w("বেড়ে").
- w("কাজ"): cyan caffeine can only fill some; amber fills the new empty ones → brain still dims. Label **"কাজ কমে"**.
- w("মাথা"): 2D `Student` pose "headache" with a pulsing red ache around head. Label **"চা বাদ = মাথাব্যথা"**.

### SH9 · tips (~12.9 s) · owner: props3d
- Back to the 3D desk, now calm. Checklist card (glass panel, title zone→hero) ticks one by one on the spoken words:
  - w("ছয়-সাত") or w("ঘুমান"): ✅ **রাতে ৬–৭ ঘণ্টা ঘুম**
  - w("সন্ধ্যার"): ✅ **চা সন্ধ্যার আগে**
  - w("সকালে"): ✅ **পরীক্ষার দিন সকালে ১ কাপ**
  SFX: soft ding per tick (3 total).
- w("কমবে") → end: clock to 11:00, lamp switches off, end card **"পরের পর্ব → রাত জেগে ফোন চালালে মগজে কী হয়? 📱"** (last ~1.2 s).

## 4. Audio plan (owner: audio)
- Music: warm lo-fi/ambient bed, 70–80 BPM, soft keys + pad + very light percussion, ~110 s, no melody fighting the voice. Volume ≈ 0.10–0.14, ducked to ~0.06 while VO speaks; slight lift at the hook start and at the final tips/end card.
- SFX library (`public/sfx/caffeine/`): `whoosh_soft`, `whoosh_fast`, `pop`, `click_lock`, `clink`, `tick`, `tick_fast`, `thud_low`, `ding`, `paper`, `riser`, `lamp_click`.
- Shots declare cues (`CUES`), assembler plays them. Audio owner reviews density at the end.
