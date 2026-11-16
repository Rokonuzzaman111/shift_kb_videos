# Svalbard Reel — Art Direction Bible (v2, full redesign)

Every agent reads this first. The old Part 1/2 shots (src/svalbard/shots/P1Shots.tsx, P2Shots.tsx and their props)
were rejected as "cartoon / dummy / ugly": flat primitives, random colours, no context, empty backgrounds.
v2 lives in **src/svalbard/v2/** — do not import from the old shots/three files except the helpers listed in §8.

## 1. Look: "Polar Night documentary"
Ultra-realistic 3D like a Netflix/Kurzgesagt-realistic hybrid documentary: real scale (metres), PBR materials with
texture maps, HDRI image-based lighting, soft shadows, atmospheric fog, filmic tone mapping, subtle grain.
2D motion graphics sit ON TOP of the 3D (labels, numbers, lines) and never replace it.

### Locked palette (no other hues anywhere)
| Token | Hex | Use |
|---|---|---|
| night | `#070d16` | base / deepest shadow / letterbox |
| steel | `#2a3f55` | sky gradients, UI panels (with alpha) |
| snow | `#e8eef3` | snow, ice, light text |
| concrete | `#8d9093` | vault concrete (from texture) |
| vaultTeal | `#39e0c8` | THE accent: art-panel glow, keyword marker, active caption word, lines, pins |
| amber | `#ffb648` | numbers, dates, warm lamps (logo light, door lamp) |
| alert | `#ff4a3d` | danger only (Part 2 threats, Part 5 war) |
Grade every shot cool (blue shadows, neutral-white highlights); warm only from amber practical lights.

### Realism rules (hard)
- No bare `meshBasicMaterial` boxes as "objects". Every visible surface: `meshStandardMaterial`/`Physical` with
  map + normalMap + roughness (use `public/assets/tex/*` Poly Haven 2k: concrete_wall_008, metal_plate,
  rock_boulder_dry) or a convincing procedural canvas normal/roughness map.
- Lighting = HDRI environment (`public/assets/hdri/kloppenheim_06_puresky_2k.hdr` exteriors,
  `studio_small_09_2k.hdr` macro/interiors) + 1 key light with soft shadows + practical lights.
- Atmosphere: exponential fog matched to sky; blowing snow / frost particles where it fits; volumetric-looking light
  cones (additive cone with fresnel falloff) for lamps.
- Depth: always foreground / midground / background. Never an object floating on a void.
- Geometry detail: bevels on hard edges, real proportions from the reference photos (§3).
- Post: PostFX (bloom only on emissives, threshold ≥0.8), ACES, vignette 0.4–0.6, slight chromatic aberration,
  DOF on macro shots.

## 2. Camera language & rhythm
Each part mixes **long holds** (4–6 s slow push/crane/orbit, the "breathe" shots) with **fast beats**
(1–1.5 s cuts or a whip/speed-ramp between two angles). Rule of thumb per 30 s part: 2 long shots + 4–6 fast beats.
Moves: slow push-in, crane up/down, orbit, dolly-through, macro rack-focus, speed-ramped fly-through, whip-pan
transition (motion-blur streak), punch-in zoom on a key word (≤5 % FOV change, eased).
Camera never fully stops; handheld micro-drift ≤ 2 cm on interiors, 0 on drone shots.

### Visual variety (hard rule — user: "same visual in many places = boring and odd")
- Every shot must show something NEW to the viewer. Reusing a model's CODE is fine; showing the same
  view/composition again is not.
- A hero model may come back only when the story needs it, and then with a clearly different angle, light, time
  of day and context (e.g. the portal: twilight crane in P1 → never the same shot again).
- Before building a section, list the shots already used in earlier sections/parts and avoid repeating them.

## 3. Reference facts (match these)
Photos in `public/svalbard/img/` (CREDITS.txt there). **Look at them before modelling.**
- **Portal** (entrance_feb2025, entrance_2020, entrance_night, top_view): long concrete wedge sticking out of the
  slope; front face ≈ 4.5 m wide × ≈ 11 m tall; roof slopes DOWN from the front face back into the mountain
  (~25 m long). Front face top ≈ 40 %: glass art panel full of crumpled mirror triangles lit turquoise-green
  (`vaultTeal`) from inside; middle: horizontal steel louvre grille; bottom ≈ 2.6 m: brushed-steel double door with
  vertical handle. Roof also carries a strip of lit glass panels for the first ~8 m. Side wall: board-formed concrete
  panels with tie holes and dark water streaks; illuminated "↗" logo bracket (warm amber back-light) and raised
  letters "SVALBARD GLOBAL SEED VAULT". Galvanised steel truss bridge (two triangulated side trusses, grating floor)
  leads to the door. Deep snow drifts against the right side.
- **Setting**: Platåberget slope above Longyearbyen airport; Adventfjorden (dark water) and flat-topped,
  horizontally striped snow mountains (dark rock bands) across the fjord; pastel polar twilight sky or night.
- **Corridor** (tunnel_entry, tunnel_down): first a rectangular board-formed concrete corridor (wet-shine floor,
  boxy wall lamps, ducts and pipes on the ceiling, steel stair on the right), then a **corrugated steel tube**
  (blue-lit) sloping down ~100 m to a red-lit hall.
- **Vault door** (vault_door2): frosted, rimed steel door with lever handle, ice crystals everywhere.
- **Vault room** (inside_vault, inside_boxes): white-painted rock walls, ceiling cooling units with fans, pipes;
  pallet racks with **blue uprights + orange beams**, stacked **grey/black plastic crates** with white barcode
  labels and coloured institute stickers, some wooden crates; yellow aisle-number signs; frost on everything.
- **Packaging** (foil_bags, seed_box): silver 3-layer foil pouches with white printed labels, inside crates.

## 4. Text grammar (organised, never cluttered)
- Max ONE headline block on screen (top zone y 170–520). Kicker chip (teal fill, dark text) + headline (white,
  AnekBangla 800). Springs in (overshoot) on its word, exits with a 0.2 s fade/slide when the beat ends.
- Numbers / dates: Inter 900 in `amber`, Bangla digits for Bangla lines, counting up on their word.
- 3D-pinned labels: thin teal leader line + glass panel; at most 2 at once.
- Captions: bottom zone y 1300–1560, ≤3 words per page, active word teal, keywords on a teal marker. (shared
  component, already exists: src/svalbard/ui/Captions.tsx — recolour to the palette.)

## 5. Sound
- Music bed continuous across parts (`public/svalbard/music/bed.wav`, ducked under VO).
- Add a **beat layer**: low pulse + soft hits on cut points of fast sections (make in scripts/make_audio_svalbard.py).
- SFX only on ≤6 key beats per part (door, big reveal, number lands, whip transition). No SFX on every text pop.
- Ambient: wind outside, hum + fan inside the vault (low, continuous).

## 6. Photos
Exactly **two** photo pop-ups in the whole video, each ≤1.6 s, as a framed print that springs in with slight 3D
tilt + parallax, then the 3D continues:
1. Part 1, on "সিড ভল্ট": `entrance_feb2025.jpg` ("আসল ছবি" chip).
2. Part 5, on "আলেপ্পো"/ICARDA: `inside_vault.jpg` (ICARDA boxes). Credit line small under the print.

## 7. Low-RAM build rules
- One section per agent, agents run **one after another**. Each section = its own file(s) in src/svalbard/v2/.
- Instanced meshes for repeats; textures ≤2k; shadow maps ≤1024; no screen-space AO.
- Agents write code + `npx tsc --noEmit`. No video renders, no Studio.
- SPEED (user, Nov 15): time matters more than perfection. Build each section in ONE pass, reuse existing
  models/helpers, max 3–4 QA stills, fix only obvious fakes, then report. No long polish loops.
- QA stills ARE allowed (user approved): max 3–4 per section, one at a time, `--scale=0.3`, from a bundle in
  work/svalbard/bundle_v2, output to out/svalbard/qa_v2/. Look at every still and fix what looks fake before finishing.

## 8. Allowed shared helpers
src/kit/Stage.tsx (`Stage`, `Lens`), src/kit/PostFX.tsx, src/kit/time.ts, src/svalbard/theme.ts (update palette to
§1), src/svalbard/vo.ts (`atAfter`), src/svalbard/three/util.ts (`rng`, `fbm`, `project`, `latLon`, `canvasTex`),
src/svalbard/ui/Captions.tsx, src/svalbard/PartPlayer.tsx.

---

# Part 1 storyboard v2 (VO = src/svalbard/vo/p1.json, 27.8 s — timings are approximate, always key off words)

### Section 1A — Earth hook → where (0.0 – ~7.8 s)  file: v2/p1/S1A.tsx
| # | VO words | Shot | Camera | Text |
|---|---|---|---|---|
| A1 | পৃথিবীর সব ফসল একদিন হারিয়ে গেলে (0–2.1) | Photoreal Earth from orbit (earth_day/earth_night textures, cloud shell, atmosphere scattering rim, sun). Farmland belts (India, Bangladesh, US Midwest, Europe) glow green then **desaturate to dead brown** across the globe on "হারিয়ে". | slow orbit + slight push, LONG feel | none (caption only) |
| A2 | আবার শুরু হবে এই পাহাড়ের ভেতর থেকে (2.1–4.4) | Speed-ramped dive: through cloud layer to Svalbard, landing on a wide drone view of Adventfjorden + striped mountains, a tiny teal glow on the slope = the vault. | fast dive → slow settle | none |
| A3 | নরওয়ের স্বালবার্ড দ্বীপপুঞ্জে, উত্তর মেরুর কাছাকাছি (4.4–7.4) | Pull back up to the realistic globe, north-pole view: pins Norway → Svalbard, dashed arc to the Pole "~১,৩০০ কিমি". | smooth crane up/out | 2 pinned labels max |

### Section 1B — the portal (≈7.8 – 12.0 s)  file: v2/p1/S1B.tsx + v2/models/Portal.tsx + v2/models/Landscape.tsx
| # | VO | Shot | Camera | Text |
|---|---|---|---|---|
| B1 | একটা বরফ-ঢাকা পাহাড়ের গভীরে আছে | Accurate portal model in polar twilight, blowing snow, fjord + striped mountains behind, art panel glowing. | LONG slow crane from the bridge up to the art panel | none |
| B2 | স্বালবার্ড গ্লোবাল সিড ভল্ট | Photo pop-up #1 (entrance_feb2025) for ~1.4 s over a slow 3D push, then title lock-up. | push-in | Title: "SVALBARD GLOBAL SEED VAULT" + chip "নরওয়ে · ৭৮° উত্তর" |

### Section 1C — inside (≈12.0 – 27.8 s)  file: v2/p1/S1C.tsx + v2/models/Corridor.tsx + v2/models/VaultRoom.tsx
| # | VO | Shot | Camera | Text |
|---|---|---|---|---|
| C1 | দরজা পেরিয়ে | Steel door opens, cold breath of fog, light spills. | push through door | none |
| C2 | পাহাড়ের ভেতর দিয়ে একশো মিটারেরও বেশি লম্বা সুড়ঙ্গ | Concrete corridor → corrugated blue-lit tube, speed-ramped fly-through, light streaks. | FAST | amber distance counter "০ → ১০০+ মিটার" |
| C3 | তারপর বরফ-শীতল তিনটা কক্ষ | Transverse hall, three frosted vault doors, numbers 1-2-3 pop. | decelerate + slight orbit | chips ১ ২ ৩ |
| C4 | ভেতরে মাইনাস আঠারো ডিগ্রি… চৌদ্দ লাখেরও বেশি বীজের নমুনা | Vault room per photos: blue/orange racks, grey crates with labels, frost, cooling fans, breath fog. | LONG slow dolly down the aisle, rack-focus to a crate label | thermometer −18 °C (amber), counter ১৪,০০,০০০+ |
| C5 | আর এর ধারণক্ষমতা? প্রায় পঁয়তাল্লিশ লাখ জাত | X-ray pull-out through the rock: the 3 halls as glass volumes inside the mountain section, hall 1 filled, 2 & 3 fill as holograms. | fast pull-out → slow orbit | bar ১৪ লাখ / ৪৫ লাখ |

---

# Part 2 storyboard v2 (VO = src/svalbard/vo/p2.json, ≈27 s; key off words with atAfter("p2", …))
NOTHING here may repeat Part 1 visuals (no globe, no portal exterior, no tunnel, no vault racks).

### Section 2A–2D (0 → cut before "কোনো" ≈10.35 s)  file: v2/p2/S2A.tsx (+ models)
| # | VO | Shot | Camera | Text |
|---|---|---|---|---|
| A | দুই হাজার আট সালে চালু হওয়া এই ভল্ট | Macro of a brushed-steel commemorative plaque bolted on frosted concrete; frost wipes away to reveal engraved "26 · 02 · 2008". Amber rim light, ice crystals sparkle. | slow push + rack focus | amber "২৬ ফেব্রুয়ারি ২০০৮" kicker "চালু হয়" |
| B | আসলে পৃথিবীর কৃষির একটা ব্যাকআপ | One real wheat ear on dark slate under a scanner line; a glass replica lifts off it (the "copy") and slides into a frosted steel drawer that shuts. | dolly-side → push on drawer | headline "কৃষির ব্যাকআপ" |
| C | বিভিন্ন দেশের গবেষণা প্রতিষ্ঠান আর জিন-ব্যাংকে | Realistic genebank cold room: compact mobile shelving rows sliding open, glass seed jars and sealed canisters, frosty LED panels, a gloved hand pulls a jar. | FAST lateral track between shelves | chip "বিশ্বে প্রায় ১,৭৫০টি জিন-ব্যাংক" |
| D | ধান, গম, ভুট্টাসহ হাজারো জাতের বীজ রাখা হয় | Studio macro: three brass scoops with rice / wheat / maize grains (accurate grain shapes, SSS-ish), labels pop on each word; then pull back revealing hundreds of jars of different-coloured seeds. | macro pans → big pull-back | labels ধান / গম / ভুট্টা, then "হাজারো জাত" |

### Section 2E–2I ("কোনো" → end)  file: v2/p2/S2B.tsx (+ models)
| # | VO | Shot | Camera | Text |
|---|---|---|---|---|
| E | কোনো জাত খরা সহ্য করে | Cracked dry field at harsh noon, heat haze; dead brown plants, ONE green plant thriving. | low push-in | chip "খরা-সহিষ্ণু" |
| F | কোনোটা নির্দিষ্ট রোগ ঠেকায় | Macro leaves: orange rust spots spread across neighbour leaves, the hero leaf stays clean. | macro slide + rack focus | chip "রোগ-প্রতিরোধী" |
| G | আবার কোনোটা কঠিন পরিবেশেও ভালো ফলন দেয় | Flooded rice paddy in rain, heavy golden panicles bending, ripples. | slow crane | chip "বেশি ফলন" |
| H | কিন্তু যুদ্ধ, বন্যা, আগুন, বা যান্ত্রিক সমস্যায়, এই সংগ্রহ ধ্বংস হয়ে যেতে পারে | Realistic genebank building exterior; one beat per word: war (blast flash, debris, smoke), flood (water rises), fire (flames, embers), machine failure (lights die, red alarm, freezer frost melts). | FAST cuts / punch-ins per word | alert-red chips যুদ্ধ / বন্যা / আগুন / যান্ত্রিক ত্রুটি, then "সংগ্রহ ধ্বংস" |
| I | আর একটা জাত হারালে, তার বিশেষ জিনগত গুণও, চিরতরে হারিয়ে যায় | Macro: one last seed on dark stone; it cracks and crumbles to dust that blows away; light fades to black. | slow push, LONG | headline "চিরতরে হারিয়ে যায়" |

---

# Part 3 storyboard v2 (VO = src/svalbard/vo/p3.json, ≈22.3 s; key off words with atAfter("p3", …))
Must not repeat P1/P2 visuals (no globe, portal close-up, tunnel, vault racks, jars, scoops, wheat ear).

### Section 3A (0 → cut before "বাক্সে" ≈11.5 s)  file: v2/p3/S3A.tsx
| # | VO | Shot | Camera | Text |
|---|---|---|---|---|
| A | তাই বিভিন্ন দেশ, নিজেদের বীজের একটা বাড়তি কপি পাঠিয়ে দেয় এখানে | Night arrival: high aerial of a snowy switchback road, a cargo truck with headlights climbing toward a tiny distant teal glow. Cut to close-ups of sealed crates with different genebank codes + country flag decals stacking onto a pallet (fast). | aerial slow track → 3 fast close-ups | chip "বাড়তি কপি" |
| B | প্রতিটা নমুনায় গড়ে প্রায় পাঁচশোটা বীজ | Macro: a stream of seeds pours into an open silver foil pouch on a lab scale. | macro push | amber counter "≈৫০০টি বীজ" |
| C | বীজগুলো আগে ভালো করে শুকানো হয় | Drying room: mesh trays of seeds, dehumidifier airflow streaks, a humidity gauge needle dropping. | slow lateral slide | gauge "আর্দ্রতা ↓" |
| D | তারপর তিন স্তরের ফয়েলের প্যাকেটে সিল করে | Exploded 3D view: the pouch separates into 3 labelled layers, re-merges, a heat-sealer bar clamps with a glow line. | orbit around the pouch | label "৩ স্তরের ফয়েল" |

### Section 3B ("বাক্সে" → end)  file: v2/p3/S3B.tsx
| # | VO | Shot | Camera | Text |
|---|---|---|---|---|
| E | বাক্সে ভরে রাখা হয় তাকে | Top-down: labelled pouches drop into a crate, lid closes, barcode stamp. | top-down → tilt | none |
| F | মাইনাস আঠারো ডিগ্রিতে বীজ যেন ঘুমিয়ে পড়ে, ভেতরের সব কাজ প্রায় থেমে যায় | Macro cut-away of a seed (embryo, endosperm, seed coat); frost crystals creep over it; glowing metabolism particles inside slow down and stop; a heartbeat line flattens. | LONG slow push | amber "−১৮°C", chip "ঘুমন্ত বীজ" |
| G | ফলে অনেক জাত, শত শত বছর পরেও আবার অঙ্কুরিত হতে পারে | Years fly by (amber year counter racing forward), frost melts, warm light, the seed germinates: root emerges, sprout unfurls into green leaves. Hopeful ending. | slow push → crane up with sprout | amber "শত শত বছর পরেও", headline "আবার অঙ্কুরিত" |

---

# Part 4 storyboard v2 (VO = src/svalbard/vo/p4.json, ≈21.3 s; key off words with atAfter("p4", …))
No repeats of P1–P3 visuals.
| # | VO | Shot | Camera | Text |
|---|---|---|---|---|
| A | ভল্টটা সমুদ্র থেকে প্রায় একশো ত্রিশ মিটার উঁচুতে, মেরুর বরফ গললেও পানি পৌঁছাবে না | Side cross-section diorama of the coast: a glacier/ice cap melts into the sea, the sea level rises (water plane with waves) but stops far below the vault marker on the slope. Amber vertical ruler "১৩০ মিটার" from sea to vault. | slow side dolly + pull-back | amber "১৩০ মিটার", chip "বরফ গললেও নিরাপদ" |
| B | আর চারপাশের জমাট পাথর, মানে পারমাফ্রস্ট | Macro of frozen dark rock: ice-filled cracks, frost crystals growing, cold blue light. | macro slide | label "পারমাফ্রস্ট" |
| C | বিদ্যুৎ চলে গেলেও ভল্টকে ঠান্ডা রাখে | Breaker panel: lights die, a spark; then a dark digital thermometer: temperature drifts up but stops at −৪°C (permafrost) — still frozen. | punch-in → slow push | amber "−৪°C", chip "তবুও জমাট" |
| D | মজার ব্যাপার, এখানে বীজ রাখতে কোনো টাকা লাগে না | An invoice/deposit form on a crate; a rubber stamp slams "বিনামূল্যে / FREE". | top-down + stamp punch | chip "০ টাকা" |
| E | বাক্সগুলো কেউ খোলেও না, একে বলে ব্ল্যাক বক্স ব্যবস্থা | A sealed black crate with tamper-evident seal tape; a gloved hand reaches in and stops short. | slow push, rack focus to the seal | headline "ব্ল্যাক বক্স" |
| F | যে প্রতিষ্ঠান বীজ রেখেছে, শুধু তারাই সেটা ফেরত নিতে পারে | A heavy padlock/keyed latch: two wrong keys try — red ✕; the owner's key (tag "জমাদাতা") fits, latch opens with a teal glow. | macro orbit | headline "শুধু মালিক ফেরত নিতে পারে" |

---

# Part 5 storyboard v2 — FINAL part (VO = src/svalbard/vo/p5.json, ≈29.2 s; atAfter("p5", …))
No repeats of P1–P4 visuals. Contains photo pop-up #2 (bible §6).
| # | VO | Shot | Camera | Text |
|---|---|---|---|---|
| A | আর এই ব্যাকআপ, সত্যিই কাজে লেগেছে | One grey ICARDA-style crate alone in darkness under a single cold spotlight, frost drifting down. | slow push | headline "সত্যিই কাজে লেগেছে" |
| B | দুই হাজার পনেরো সালে, সিরিয়ার যুদ্ধে, আলেপ্পোর একটা বীজ ব্যাংক বিপদে পড়ে | War-damaged city diorama at dusk, desaturated: broken concrete buildings, smoke columns, dust; a small research-station building among them. | slow crane down + one punch-in on "বিপদে" | amber "২০১৫", label "আলেপ্পো, সিরিয়া" |
| C | তখন ইতিহাসে প্রথমবার, স্বালবার্ড থেকে বীজ ফেরত তোলা হয় | Interior looking OUT through a frosted doorway into bright light: a hand pallet truck rolls crates out. PHOTO POP-UP #2 on "প্রথমবার…ফেরত": public/svalbard/img/inside_vault.jpg (real ICARDA boxes) via src/svalbard/v2/ui/PhotoCard.tsx, ≤1.5 s, credit from public/svalbard/img/CREDITS.txt. | dolly back with the truck | chip "ইতিহাসে প্রথম", "আসল ছবি" chip on the card |
| D | আর লেবানন ও মরক্কোয় নতুন করে গড়ে ওঠে পুরো সংগ্রহ | 3D relief map of Europe–Mediterranean (flat tilted terrain tiles, NOT a globe): teal arcs fly Svalbard → Lebanon and → Morocco; at each landing green fields bloom outward. | tilted map pan | pins "লেবানন", "মরক্কো" |
| E | এই অক্টোবরেও বীজ জমা দিয়েছে একুশটা জিন-ব্যাংক, তার মধ্যে যুদ্ধ শুরুর পর প্রথমবার, ইউক্রেনও | Polar night arrival: crates on a conveyor into a frosted doorway; 21 crate tags pop in a grid (generic genebank codes); the Ukraine tag (blue/yellow) glows and slides forward. | slow track → push on Ukraine tag | amber "অক্টোবর ২০২৬", "২১টি জিন-ব্যাংক", chip "ইউক্রেন" |
| F | ভবিষ্যতের খরা আর রোগের সাথে লড়তে, লাগবে আজকের এই বীজ | Fast 2-beat montage (heat-cracked earth flash, storm flash), then an open palm holding one seed in warm light. | fast cuts → slow push on the palm | headline "আজকের এই বীজ" |
| G | বাংলাদেশের ধানের জাতও কি এখানে রাখা উচিত? কমেন্টে জানান | Bangladesh rice paddy at golden hour (green-gold rice, a palm tree line, a small wooden boat in a canal, soft haze). Slow crane up to the sky. CTA card at the end. | slow crane up, LONG | question headline, CTA card "কমেন্টে জানান" with a comment icon (SVG, no emoji) |
