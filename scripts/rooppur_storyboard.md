# রূপপুর: Storyboard & Production Bible (three.js)

> Script: [rooppur_script.md](rooppur_script.md) (Hook A) · Format: 1080×1920 vertical · ~2:50 · 26 shots
> Engine: Remotion + three.js (React Three Fiber) · Sob 3D real reference ar real dimension theke, kono banano/dummy jinish na

---

## 1. Realism er niyom (prottek shot e mante hobe)

| Jinish | Ki use korbo | Keno |
|---|---|---|
| **Geometry** | Rooppur/VVER-1200 er published dimension, photo reference diye modeling (dome, cooling tower, hex fuel assembly, pellet). Pawa gele real glTF model (CC0/CC-BY) | Box/cylinder dummy na, ashol shape |
| **Material** | PBR texture set: concrete, painted steel, brushed metal, zirconium, ceramic, copper, water normal map (Poly Haven, CC0) | Real surface detail: dag, roughness, mapping |
| **Lighting** | HDRI environment (real sky/studio photo theke) + physical sun (three.js `Sky` shader) + soft shadow | Real alo-chhaya, reflection |
| **Atmosphere** | Height fog, volumetric-look steam (layered sprite shader), haze | Distance er depth |
| **Camera** | Real lens dhore: aerial 24mm, interior 35mm, macro 100mm + depth of field | Cinematic, chokh e real lage |
| **Post FX** | ACES tone map, bloom (shudhu alo/gorom jinish e), SSAO (ambient occlusion), DOF, halka film grain, vignette, motion blur (fast move e) | "CG" look kete "camera" look ashe |
| **Real place** | Rooppur er ashol satellite imagery ground texture hishebe (license onujayi), ashol layout: Padma kon dike, tower kon dike | Dummy jayga na |

**Color grading per act:** Hook ar exterior = golden dusk (warm amber + blue sky) · Pellet/lab = clean cool white · Atom/fission = deep navy + cyan neutron + amber energy · Thermal loop = orange heat map · Ending = night blue + warm city light.

---

## 2. Design system

**Font:** Anek Bangla 800 (headline), Hind Siliguri 700 (label/chip)

| Element | Size | Jayga (1080×1920) |
|---|---|---|
| Title slam (রূপপুর, ফিশন!) | 140–170px | Upore, y 220–520 |
| Sub-title / number counter | 64–90px | Title er niche |
| Label chip (leader line shoho) | 40–46px | Object er pashe, line diye object e point kore |
| Caption (word-sync, keyword highlight) | 88px | Niche, y ~1350–1540 |
| Safe zone | — | Pashe 80px, niche 300px (FB like/comment button), dan pashe 140px |

**Color:** navy `#05070d` · amber `#ffb020` (keyword/energy) · orange `#ff6a2b` (heat) · cyan `#3fe0ff` (neutron/tech) · white `#f5f3ee`

**Text rule:** ek shomoy screen e max 1 ta title + 1 ta caption. Label ashe object dekhanor 0.3 second pore, ar jay porer cut er 0.2 second age.

---

## 3. Camera & transition grammar

- **Push-in** = kichu reveal korbo · **Pull-out** = scale/size bujhabo · **Orbit** = object er 3D shape dekhabo · **Track along** = flow (pipe, steam) follow korbo
- **Long take** (8–12s): explanation dorkar jaygay (fission, steam generator, generator). **Short cut** (2–4s): energy/drama jaygay (hook, scram, dynamo, city light)
- **Transition:**
  - **Match cut:** steam er sada → pellet er white background
  - **Zoom-through:** pellet → crystal → atom (scale transition, ek take e)
  - **Light flash cut:** fission impact
  - **Whip pan:** max 2 bar
  - Random fade/slide **na**
- Cut hobe VO er beat e (shobdo shesh howar 2–4 frame pore)

---

## 4. Shot list

`Dur` = second · VO = [script](rooppur_script.md) er line

### ACT 1: HOOK (0:00–0:06)

| # | Time | Dur | Shot | Camera | Text / MG | SFX |
|---|---|---|---|---|---|---|
| S01 | 0:00 | 3.5 | **Rooppur dusk aerial.** Real layout: 2 ta reactor dome, turbine hall, cooling tower, Padma. Tower theke steam | Drone 24mm, slow push-in + halka niche nama | 0.3s e **রূপপুর** slam · 2.0s e **০ → ২৪০০ মেগাওয়াট** counter | Wind bed, sub-bass rise, title e deep hit |
| S02 | 0:03.5 | 2.5 | Cooling tower er mukh, steam fule uthchhe (tele close) | 85mm, static + halka tilt up | **আগুন ✕ · কয়লা ✕** (VO er shathe strike) | Steam hiss, 2 ta soft tick. Sada steam theke match cut |

### ACT 2: PELLET (0:06–0:16)

| # | Time | Dur | Shot | Camera | Text / MG | SFX |
|---|---|---|---|---|---|---|
| S03 | 0:06 | 5 | **Pellet macro:** lab glove pora angul er dogay UO₂ pellet (real size ~ 7.6mm dia). Ceramic surface, chamfer edge | 100mm macro, rack focus glove → pellet, slow dolly-in | Leader line label: **ইউরেনিয়াম পেলেট · ~১ সেমি** | Room tone, halka ceramic click |
| S04 | 0:11 | 5 | **Scale reveal:** pellet ekta tray te. Pashe conveyor theke koyla pore 1 ton er stup (realistic coal PBR, chunk physics) | Pull-out + crane up | **১টি পেলেট = ~১ টন কয়লা** (koyla porar por, nirobotar majhe) | Koylar avalanche rumble → text e silence |

### ACT 3: REACTOR (0:16–0:26)

| # | Time | Dur | Shot | Camera | Text / MG | SFX |
|---|---|---|---|---|---|---|
| S05 | 0:16 | 3 | Pellet gula zirconium tube (fuel rod) e slide kore dhoke | Macro, tube er pashe track | — | Metallic slide, clink |
| S06 | 0:19 | 3 | Rod gula hexagonal **fuel assembly** te shajano (VVER hex lattice) | Slow orbit | **১টি অ্যাসেম্বলি = ৩১২টি রড** *(verify)* | Mechanical hum |
| S07 | 0:22 | 4 | Uporer theke reactor core: 163 ta hex assembly, panir niche **Cherenkov blue glow** | Top-down, slow rotate + push-in | **রিঅ্যাক্টর কোর · ১৬৩টি অ্যাসেম্বলি** *(verify)* | Underwater muffled drone |

### ACT 4: FISSION (0:26–0:54): long, slow, hero section

| # | Time | Dur | Shot | Camera | Text / MG | SFX |
|---|---|---|---|---|---|---|
| S08 | 0:26 | 8 | **Zoom-through (ek take):** pellet surface → crystal grain → UO₂ lattice → ekta U-235 atom → nucleus | Continuous dive, scale counter (mm → nm → fm) | Corner e scale: **১ মিমি → ১ ন্যানোমিটার → নিউক্লিয়াস** | Descending whoosh layer, pitch niche name |
| S09 | 0:34 | 10 | **Hero fission:** cyan neutron ashe (speed ramp), nucleus kape, peanut shape hoy, bhenge jay. White-amber flash, 2 ta fragment + 3 ta neutron chhitke jay | Slow orbit → impact e camera shake + slow-mo | **ইউরেনিয়াম-২৩৫** → **ফিশন!** → chip: **প্রচণ্ড তাপ** · **+২-৩ নিউট্রন** | Tension riser → sub-boom impact → glassy shatter tail |
| S10 | 0:44 | 10 | **Chain reaction:** ek theke dui, dui theke char... puro lattice jure amber alor jal | Long pull-out | **প্রতি সেকেন্ডে কোটি কোটি বার** · tarpor **চেইন রিঅ্যাকশন** | Pop cascade build → "হৃদপিণ্ড" te silence + 1 ta heartbeat thump |

### ACT 5: MYTH + CONTROL (0:54–1:16)

| # | Time | Dur | Shot | Camera | Text / MG | SFX |
|---|---|---|---|---|---|---|
| S11 | 0:54 | 6 | Split infographic (dark 3D bg): 2 ta glass cylinder e U-235 bhora: **৯০%** vs **~৫%** | Static, halka parallax | Bar fill animation, **বোমা ✕ · রূপপুর ✓** | UI tick, bomb side e low buzz |
| S12 | 1:00 | 8 | **Reactor vessel head cutaway:** CRDM drive er niche control rod core e uthe-name. Pashe power graph | 35mm slow lateral track | Live graph **শক্তি ↑↓** | Servo whirr, mechanical clunk |
| S13 | 1:08 | 8 | **SCRAM:** red alarm light, shob rod ekshathe pore jay, core er alo nibhe jay | Fast cuts: 2s + 2s + 4s (alarm, rod pora, andhokar core) | **কয়েক সেকেন্ডে শান্ত** | Alarm beep → drop clank → power-down whoosh |

### ACT 6: HEAT → STEAM → TURBINE (1:16–1:50)

| # | Time | Dur | Shot | Camera | Text / MG | SFX |
|---|---|---|---|---|---|---|
| S14 | 1:16 | 8 | Primary loop pipe er bhitore X-ray: gorom pani (thermal orange) chhute chole | Pipe er bhitor diye track | Gauge: **৩২০°C** · **১৬০ atm** *(verify)* | Deep flow rumble |
| S15 | 1:24 | 6 | Split: shadharon ketli 100°C e fute vs pressure pipe e 320°C e-o bubble nai | Static split | **৩২০°C · তবুও পানি ফোটে না!** | Ketlir whistle → cut |
| S16 | 1:30 | 10 | **Horizontal steam generator cutaway:** gorom tube er charpashe secondary pani fute bashpo hoy | Slow lateral track | **দুই পানি কখনো মেশে না** (2 color loop line) | Boiling bubble, rising hiss |
| S17 | 1:40 | 10 | Bashpo turbine e dhoke, blade row ghora shuru kore, speed bare | Shaft bore low angle, motion blur | RPM counter *(verify 1500/3000)* | Jet spool-up |

### ACT 7: GENERATOR (1:50–2:08)

| # | Time | Dur | Shot | Camera | Text / MG | SFX |
|---|---|---|---|---|---|---|
| S18 | 1:50 | 10 | **Generator cutaway:** rotor magnet ghure, copper stator coil e magnetic field line (MG overlay) | Orbit 90° | **চুম্বক + তামা = বিদ্যুৎ** | 50Hz electric hum |
| S19 | 2:00 | 4 | Gramer rastay rat e cycle, dynamo light jhik-mik kore jole | Low tracking | **সাইকেলের ডায়নামো** | Cycle chain, dynamo whine |
| S20 | 2:04 | 4 | Transmission line diye alor pulse shohor e jay, Dhaka r janala jole uthe | Fast drone | **লক্ষ লক্ষ ঘর** | Electric zap whoosh |

### ACT 8: COOLING TOWER (2:08–2:22)

| # | Time | Dur | Shot | Camera | Text / MG | SFX |
|---|---|---|---|---|---|---|
| S21 | 2:08 | 7 | Cooling tower er niche theke upore (worm's eye), bishal steam | Tilt up, slow | **ধোঁয়া ✕ · পানির বাষ্প ✓** stamp | Wind, steam roar |
| S22 | 2:15 | 7 | Condenser + tower loop cutaway: thanda pani, gorom pani flow line | Static iso, MG flow | **বাড়তি তাপ → আকাশে** | Soft water flow |

### ACT 9: SAFETY (2:22–2:38)

| # | Time | Dur | Shot | Camera | Text / MG | SFX |
|---|---|---|---|---|---|---|
| S23 | 2:22 | 8 | Reactor building X-ray: outer dome → inner containment → vessel, ek ek kore khule | Orbit + layer peel | **VVER-1200 · দুই স্তরের খোলস** | Layered shield whoosh |
| S24 | 2:30 | 8 | Vessel er niche **core catcher** reveal | Push-in niche | **কোর ক্যাচার** | Low drone resolve |

### ACT 10: ENDING (2:38–2:50)

| # | Time | Dur | Shot | Camera | Text / MG | SFX |
|---|---|---|---|---|---|---|
| S25 | 2:38 | 8 | Rater aerial pull-out: plant er alo → Padma → Bangladesh er rater alo | Big pull-out | — | Music swell |
| S26 | 2:46 | 4 | Match cut abar S01 er framing e (loop) | Same as S01 | Niche chhoto: **পরের পর্ব → পদ্মা সেতু** | Final hit, fade |

---

## 5. Music & sound

- **Music arc:** Hook e dark tension pad → Act 4 e pulse build (fission e drop) → Act 6–7 e rhythmic mechanical groove → ending e emotional strings/piano swell
- **Mix:** VO −14 LUFS, music VO er niche −18 to −22 dB (VO chalar shomoy duck), SFX −20 to −10 dB
- **Source:** royalty-free, commercial use allowed (YouTube Audio Library / Pixabay music & SFX / Freesound CC0). Download er age apnar permission nibo

---

## 6. Build order (part by part)

1. **Asset setup:** HDRI, PBR texture, font, SFX/music, ar post-processing package
2. **Hero shots age:** S01 (exterior), S03 (pellet), S09 (fission). Ei 3 ta realism er standard thik korbe
3. Prottek act alada Remotion composition hishebe, apni prottek tar low-quality preview review korben
4. Puro voiceover (Hook A script) generate + caption sync
5. Assembly, sound mix, color grade, final render

> *(verify)* lekha number gula research report ashar por thik kore update korbo.
