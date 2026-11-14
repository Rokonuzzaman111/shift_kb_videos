/**
 * P7 v2 — what happens now (294.6 → 346.8 s). Strengths, four risks, the 17 Nov test.
 *  1 "ভালো দিক আগে বলি"        3D split: green chip-macro শক্তি | red data-centre ঝুঁকি, green side takes over
 *  2 "চাহিদা … আকাশছোঁয়া"      glass bar chart over GPU tray, last bar rockets out of frame
 *  3 "পরের তিন মাসে … ১০৮"      DGX photo print + glass counter rolling to $108B
 *  4 "সত্তর শতাংশ"              tilted glass chart, next-year bar climbs, +70%
 *  5 "প্রযুক্তিতে … সবার আগে"   3D chip macro, #1 → "এবার ঝুঁকি" red glitch slam
 *  6 risk ১ নেতৃত্ব             Jensen print + deal chips → print greys, glowing empty chair
 *  7 risk ২ টাকার চক্র          NVIDIA ⇄ AI companies loop with $/chip tokens → demand ↓ → loop breaks
 *  8 risk ৩ চীন                China outline glows, US-rule paper, GPU blocked by lock
 *  9 risk ৪ প্রতিযোগী           3D glass tickers NVDA ▼ / AMD ▲ / AVGO ▲
 * 10 "১৭ নভেম্বর"              paper calendar, marker ring on 17 → results glass sheet → first test without Huang
 */
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Atmos, Beats, Cam, Counter, DocBg, Glass, GlitchBars, HitFlash, KText, Marker, PhotoCard, Plate, p01, type Beat } from "../kit";
import { N, clamp, ease, headFont, numFont } from "../theme";
import type { Cue } from "../types";
import { useAt } from "../vo";

export const P7_ID = "P7";

export const P7_KEYWORDS = ["আকাশছোঁয়া।", "১০৮", "সত্তর", "ঝুঁকি।", "নেতৃত্ব।", "চক্র।", "চীন।", "প্রতিযোগী।", "১৭"];

export const P7_CUES: Cue[] = [
  { sfx: "whoosh", word: "ভালো", offset: -0.25, volume: 0.8 },
  { sfx: "swoosh_up", word: "আকাশছোঁয়া", offset: -0.2 },
  { sfx: "cash", word: "১০৮" },
  { sfx: "ui_pop", word: "সত্তর" },
  { sfx: "power_on", word: "প্রযুক্তিতে", offset: -0.15, volume: 0.7 },
  { sfx: "hit_glitch", word: "ঝুঁকি" },
  { sfx: "whoosh", word: "এক", offset: -0.15 },
  { sfx: "camera_shutter", word: "চুক্তির", volume: 0.7 },
  { sfx: "whoosh", word: "দুই", offset: -0.15 },
  { sfx: "data_stream", word: "বিনিয়োগ", offset: -0.1, volume: 0.55 },
  { sfx: "impact", word: "বিপদে" },
  { sfx: "whoosh", word: "তিন", nth: 1, offset: -0.15 },
  { sfx: "impact_deep", word: "বন্ধ", volume: 0.8 },
  { sfx: "swoosh_up", word: "উল্টো", offset: -0.1 },
  { sfx: "ui_click", word: "১৭" },
  { sfx: "heartbeat", word: "প্রথম", volume: 0.8 },
];

const bn = (n: number | string) => String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);

/* ---------------------------------------------------------------- shared */
const Check: React.FC<{ readonly size?: number; readonly color?: string }> = ({ size = 40, color = N.greenHi }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" style={{ filter: `drop-shadow(0 0 ${size / 5}px ${color})` }}>
    <circle cx={20} cy={20} r={18} fill="none" stroke={color} strokeWidth={3} />
    <path d="M11 21 L18 28 L30 13" fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Warn: React.FC<{ readonly size?: number; readonly color?: string }> = ({ size = 40, color = N.red }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" style={{ filter: `drop-shadow(0 0 ${size / 5}px ${color})` }}>
    <path d="M20 3 L38 36 L2 36 Z" fill={`${color}22`} stroke={color} strokeWidth={3} strokeLinejoin="round" />
    <rect x={18} y={14} width={4} height={12} rx={2} fill={color} />
    <circle cx={20} cy={31} r={2.4} fill={color} />
  </svg>
);

/** green "শক্তি" corner badge on every strength beat */
const StrengthTag: React.FC = () => {
  const frame = useCurrentFrame();
  const k = p01(frame, 0, 14);
  return (
    <Glass style={{ left: 96, top: 64, padding: "6px 26px 10px 18px", display: "flex", alignItems: "center", gap: 14, opacity: k, translate: `${(1 - k) * -40}px 0` }} accent={N.green}>
      <Check size={40} />
      <span style={{ fontFamily: headFont, fontWeight: 800, fontSize: 40, color: N.greenHi, lineHeight: 1.3 }}>শক্তি</span>
    </Glass>
  );
};

const Chair: React.FC<{ readonly color?: string; readonly size?: number }> = ({ color = N.muted, size = 300 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" style={{ filter: `drop-shadow(0 0 ${size / 18}px ${color})` }}>
    <rect x={55} y={20} width={90} height={80} rx={14} fill={`${color}18`} stroke={color} strokeWidth={6} />
    <rect x={45} y={100} width={110} height={22} rx={8} fill={`${color}18`} stroke={color} strokeWidth={6} />
    <line x1={100} y1={122} x2={100} y2={160} stroke={color} strokeWidth={7} />
    <line x1={100} y1={160} x2={60} y2={175} stroke={color} strokeWidth={6} strokeLinecap="round" />
    <line x1={100} y1={160} x2={140} y2={175} stroke={color} strokeWidth={6} strokeLinecap="round" />
    <line x1={100} y1={160} x2={100} y2={180} stroke={color} strokeWidth={6} strokeLinecap="round" />
    <circle cx={60} cy={182} r={6} fill={color} />
    <circle cx={140} cy={182} r={6} fill={color} />
    <circle cx={100} cy={186} r={6} fill={color} />
  </svg>
);

/* ---------------------------------------------------------------- 1 split */
const Split: React.FC<{ readonly good: number }> = ({ good }) => {
  const frame = useCurrentFrame();
  const g = p01(frame, good, good + 16, ease.inOut);
  const lw = 960 + 220 * g;
  const inL = p01(frame, 0, 12);
  const inR = p01(frame, 3, 15);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, top: 0, width: lw, height: 1080, overflow: "hidden" }}>
        <Plate id="chipmacro" dim={0.45} blur={4} drift={0.1} />
        <Atmos seed="p7a" color={N.green} />
        <AbsoluteFill style={{ background: `linear-gradient(90deg, rgba(10,30,0,0.55), transparent 70%)` }} />
      </div>
      <div style={{ position: "absolute", left: lw, top: 0, width: 1920, height: 1080, overflow: "hidden", filter: `saturate(${1 - 0.7 * g}) brightness(${1 - 0.45 * g})` }}>
        <div style={{ position: "absolute", left: -lw + 0, top: 0, width: 1920, height: 1080 }}>
          <Plate id="dc" dim={0.4} blur={6} tint="#ff5a5a" from={3} />
        </div>
      </div>
      <Cam push={0.06} drift={[-20, -10]}>
        <div style={{ position: "absolute", left: 0, width: lw, top: 210, display: "flex", flexDirection: "column", alignItems: "center", opacity: inL, translate: `${(1 - inL) * -120}px 0` }}>
          <div style={{ scale: `${1 + 0.15 * g}` }}>
            <Check size={140} />
          </div>
          <KText text="শক্তি" at={0} size={170} color={N.greenHi} glow={`${N.green}aa`} />
          <div style={{ opacity: g, marginTop: -20 }}>
            <KText text="ভালো দিক আগে" at={good} size={50} />
          </div>
        </div>
        <div style={{ position: "absolute", left: lw, width: 960, top: 210, display: "flex", flexDirection: "column", alignItems: "center", opacity: inR * (1 - 0.6 * g), translate: `${(1 - inR) * 120 + 120 * g}px 0` }}>
          <Warn size={140} />
          <KText text="ঝুঁকি" at={3} size={170} color={N.red} glow={`${N.red}88`} />
        </div>
      </Cam>
      <div style={{ position: "absolute", left: lw - 3, top: 0, width: 6, height: 1080, background: "#fff", boxShadow: `0 0 40px #fff, 0 0 80px ${N.greenHi}` }} />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 2 demand */
const Demand: React.FC<{ readonly sky: number }> = ({ sky }) => {
  const frame = useCurrentFrame();
  const bars = [0.24, 0.32, 0.4, 0.5, 0.62, 0.74];
  const shoot = interpolate(frame, [sky - 10, sky + 8], [0, 1], { ...clamp, easing: ease.in });
  return (
    <AbsoluteFill>
      <Plate id="tray" from={1} blur={8} dim={0.55} />
      <Atmos seed="p7b" />
      <Cam push={0.12} drift={[-40, 10]} punch={[sky]} shakeAt={[sky + 6]} origin="70% 60%">
        <AbsoluteFill style={{ perspective: 1600 }}>
          <Glass style={{ left: 860, top: 170, width: 960, height: 640, transform: "rotateY(-14deg) rotateX(6deg)", overflow: "visible" }} accent={N.green}>
            <div style={{ position: "absolute", left: 36, top: 22, fontFamily: numFont, fontWeight: 700, fontSize: 26, color: N.muted, letterSpacing: 3 }}>AI CHIP DEMAND</div>
            <div style={{ position: "absolute", left: 60, right: 60, bottom: 50, height: 500, display: "flex", alignItems: "flex-end", gap: 34 }}>
              {bars.map((h, i) => {
                const grow = p01(frame, 2 + i * 4, 20 + i * 4);
                const last = i === bars.length - 1;
                const hh = (h * grow + (last ? shoot * 1.4 : 0)) * 500;
                return (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: hh,
                      borderRadius: "12px 12px 2px 2px",
                      background: last ? `linear-gradient(0deg, ${N.green}, ${N.greenHi} 70%, #eaffc0)` : `linear-gradient(0deg, ${N.green}33, ${N.green}bb)`,
                      boxShadow: last ? `0 0 ${30 + 50 * shoot}px ${N.greenHi}` : `0 0 20px ${N.green}44`,
                    }}
                  />
                );
              })}
            </div>
            <div style={{ position: "absolute", left: 40, right: 40, bottom: 48, height: 3, background: "rgba(255,255,255,0.25)" }} />
          </Glass>
        </AbsoluteFill>
      </Cam>
      <StrengthTag />
      <div style={{ position: "absolute", left: 96, top: 250, width: 760 }}>
        <KText text="চিপের চাহিদা এখনো" at={2} size={66} align="left" />
        <div style={{ marginTop: -10 }}>
          <KText text="আকাশছোঁয়া" at={sky} size={130} align="left" color={N.greenHi} glow={`${N.green}cc`} stagger={0} />
        </div>
      </div>
      <HitFlash at={sky} color={N.greenHi} />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 3 $108B */
const Revenue: React.FC<{ readonly months: number; readonly hit: number }> = ({ months, hit }) => {
  const frame = useCurrentFrame();
  const land = p01(frame, hit, hit + 10);
  return (
    <AbsoluteFill>
      <DocBg tint="#1a2316" spot={[65, 40]} />
      <Atmos seed="p7c" leak={0.35} bokeh={14} />
      <Cam push={0.1} drift={[-40, -10]} rot={-0.6} punch={[hit]}>
        <PhotoCard src="nvidia/img/dgx_b200.jpg" x={110} y={170} w={600} h={600} at={0} rot={-5} caption="এনভিডিয়ার AI সার্ভার" pos="50% 40%" />
        <AbsoluteFill style={{ perspective: 1600 }}>
          <Glass style={{ left: 820, top: 190, width: 1000, height: 600, transform: "rotateY(-8deg)", padding: "36px 50px" }} accent={N.green} sheenAt={hit}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              {[0, 1, 2].map((i) => {
                const on = p01(frame, months + i * 5, months + i * 5 + 8);
                return (
                  <div
                    key={i}
                    style={{
                      width: 110,
                      height: 110,
                      borderRadius: 16,
                      overflow: "hidden",
                      background: `rgba(118,185,0,${0.08 + 0.3 * on})`,
                      border: `2px solid ${N.green}${on > 0.5 ? "" : "66"}`,
                      boxShadow: on > 0.5 ? `0 0 24px ${N.green}88` : "none",
                      textAlign: "center",
                      scale: `${0.85 + 0.15 * on}`,
                    }}
                  >
                    <div style={{ height: 22, background: N.green }} />
                    <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 30, color: N.ink, lineHeight: 1.3, marginTop: 14 }}>মাস {bn(i + 1)}</div>
                  </div>
                );
              })}
              <div style={{ fontFamily: headFont, fontWeight: 700, fontSize: 42, color: N.ink, marginLeft: 20, lineHeight: 1.3 }}>
                পরের <span style={{ color: N.greenHi }}>৩ মাসে</span> আয়
              </div>
            </div>
            <div style={{ marginTop: 34, fontWeight: 900, fontSize: 230, letterSpacing: -6, lineHeight: 1, color: land > 0 ? "#fff" : N.ink, textShadow: `0 0 ${20 + 60 * land}px ${N.green}, 0 10px 40px #000` }}>
              <Counter to={108} a={months} b={hit} fmt={(v) => `$${Math.round(v)}B`} style={{ fontWeight: 900 }} />
            </div>
            <div style={{ marginTop: 20, opacity: land, fontFamily: headFont, fontWeight: 700, fontSize: 42, color: N.ink, lineHeight: 1.35 }}>
              প্রায় <span style={{ color: N.greenHi }}>১০৮ বিলিয়ন ডলার</span> <span style={{ color: N.muted, fontSize: 30 }}>· কোম্পানির পূর্বাভাস</span>
            </div>
          </Glass>
        </AbsoluteFill>
        <Marker d="M880 650 C 1100 670, 1350 640, 1560 655" at={hit + 2} color={N.greenHi} width={9} />
      </Cam>
      <StrengthTag />
      <HitFlash at={hit} color={N.greenHi} />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 4 +70% */
const Growth: React.FC<{ readonly seventy: number }> = ({ seventy }) => {
  const frame = useCurrentFrame();
  const a = p01(frame, 0, 16);
  const b = interpolate(frame, [8, seventy + 4], [0, 1], { ...clamp, easing: ease.inOut });
  const pop = p01(frame, seventy, seventy + 10);
  const base = 280;
  return (
    <AbsoluteFill>
      <Plate id="dc" from={1} blur={10} dim={0.55} />
      <Atmos seed="p7d" />
      <Cam push={0.1} drift={[30, -20]} rot={0.6} punch={[seventy]}>
        <div style={{ position: "absolute", left: 96, top: 170, width: 900 }}>
          <KText text="সামনের বছরে আয় বাড়তে পারে" at={2} size={60} align="left" />
        </div>
        <AbsoluteFill style={{ perspective: 1500 }}>
          <Glass style={{ left: 120, top: 320, width: 1060, height: 520, transform: "rotateY(12deg) rotateX(5deg)", overflow: "visible" }} accent={N.green}>
            {[
              { x: 140, h: base * a, label: "এ বছর", hi: false },
              { x: 620, h: base * 1.7 * b, label: "সামনের বছর", hi: true },
            ].map((bar) => (
              <div key={bar.x}>
                <div
                  style={{
                    position: "absolute",
                    left: bar.x,
                    bottom: 80,
                    width: 300,
                    height: bar.h,
                    borderRadius: "16px 16px 2px 2px",
                    background: bar.hi ? `linear-gradient(0deg, ${N.green}, ${N.greenHi} 80%, #eaffc0)` : `linear-gradient(0deg, ${N.green}44, ${N.green}aa)`,
                    boxShadow: bar.hi ? `0 0 ${30 + 50 * pop}px ${N.greenHi}` : "none",
                  }}
                />
                <div style={{ position: "absolute", left: bar.x, width: 300, bottom: 20, textAlign: "center", fontFamily: headFont, fontWeight: 700, fontSize: 34, color: N.ink, lineHeight: 1.3 }}>
                  {bar.label}
                </div>
              </div>
            ))}
            <div style={{ position: "absolute", left: 60, right: 60, bottom: 78, height: 3, background: "rgba(255,255,255,0.3)" }} />
            <svg viewBox="0 0 1060 520" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
              <path d={`M290 ${440 - base - 30} Q 520 ${440 - base - 120} ${760} ${440 - base * 1.7 * b - 40}`} fill="none" stroke={N.greenHi} strokeWidth={8} strokeDasharray="20 12" opacity={b} style={{ filter: `drop-shadow(0 0 10px ${N.green})` }} />
            </svg>
          </Glass>
        </AbsoluteFill>
        <div style={{ position: "absolute", left: 1230, top: 330, opacity: pop, scale: `${1 + 0.6 * Math.exp(-Math.max(0, frame - seventy) / 4)}`, transformOrigin: "left center" }}>
          <div style={{ fontFamily: numFont, fontWeight: 900, fontSize: 210, letterSpacing: -6, color: "#fff", textShadow: `0 0 70px ${N.green}, 0 0 20px ${N.greenHi}`, WebkitTextStroke: `3px ${N.greenHi}` }}>+70%</div>
          <div style={{ fontFamily: headFont, fontWeight: 700, fontSize: 46, color: N.greenHi, lineHeight: 1.3, marginTop: -10 }}>প্রায় সত্তর শতাংশ</div>
        </div>
      </Cam>
      <StrengthTag />
      <HitFlash at={seventy} color={N.greenHi} />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 5 tech lead → risk slam */
const TechLead: React.FC<{ readonly now: number; readonly risk: number }> = ({ now, risk }) => {
  const frame = useCurrentFrame();
  const r = p01(frame, risk - 3, risk + 6);
  return (
    <AbsoluteFill>
      <Plate id="chipmacro" from={2} rate={1.1} drift={0.16} tint={r > 0 ? `rgb(255,${Math.round(255 - 170 * r)},${Math.round(255 - 170 * r)})` : undefined} dim={0.15 + 0.4 * r} />
      <Atmos seed="p7e" color={r > 0.5 ? N.red : N.green} />
      <Cam push={0.12} drift={[-30, 0]} punch={[risk]} shakeAt={[risk]}>
        <div style={{ position: "absolute", left: 96, top: 200, width: 900, opacity: 1 - r }}>
          <KText text="প্রযুক্তিতে এখনো" at={2} size={72} align="left" />
          <div style={{ display: "flex", alignItems: "center", gap: 26, marginTop: -6 }}>
            <span style={{ fontFamily: numFont, fontWeight: 900, fontSize: 150, color: "#fff", textShadow: `0 0 50px ${N.green}`, WebkitTextStroke: `3px ${N.greenHi}`, opacity: p01(frame, now, now + 8), scale: `${1.4 - 0.4 * p01(frame, now, now + 10)}` }}>#1</span>
            <KText text="সবার আগে" at={now} size={86} color={N.greenHi} glow={`${N.green}aa`} />
          </div>
        </div>
        {frame >= risk - 3 ? (
          <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 150 }}>
            <div style={{ scale: `${1 + 0.8 * Math.exp(-Math.max(0, frame - risk) / 4)}`, opacity: r, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Warn size={150} />
              <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 200, lineHeight: 1.3, color: "#fff", WebkitTextStroke: `3px ${N.red}`, textShadow: `0 0 80px ${N.red}, 0 0 20px ${N.red}` }}>ঝুঁকি</div>
            </div>
          </AbsoluteFill>
        ) : null}
      </Cam>
      {r < 0.5 ? <StrengthTag /> : null}
      <HitFlash at={risk} color="#ff8080" />
      {frame >= risk && frame < risk + 8 ? <GlitchBars amount={1 - (frame - risk) / 8} /> : null}
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- risk frame */
const RISKS = ["নেতৃত্ব", "টাকার চক্র", "চীন", "প্রতিযোগী"];

const RiskTabs: React.FC<{ readonly idx: number }> = ({ idx }) => {
  const frame = useCurrentFrame();
  const flip = p01(frame, 2, 16);
  return (
    <div style={{ position: "absolute", left: 96, right: 96, top: 54, display: "flex", gap: 18, perspective: 800 }}>
      {RISKS.map((r, i) => {
        const active = i === idx;
        const seen = i <= idx;
        return (
          <div
            key={r}
            style={{
              flex: 1,
              height: 80,
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "0 20px",
              opacity: seen ? 1 : 0.35,
              transform: active ? `rotateX(${(1 - flip) * 90}deg)` : undefined,
              background: active ? `linear-gradient(135deg, ${N.red}55, ${N.red}18)` : "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
              border: `1.5px solid ${active ? N.red : "rgba(255,255,255,0.15)"}`,
              boxShadow: active ? `0 0 40px ${N.red}55` : "0 10px 30px rgba(0,0,0,0.4)",
              backdropFilter: "blur(12px)",
            }}
          >
            <span
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                flexShrink: 0,
                background: seen ? N.red : "transparent",
                border: `2px solid ${N.red}`,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: headFont,
                fontWeight: 800,
                fontSize: 30,
                lineHeight: 1,
                paddingBottom: 4,
              }}
            >
              {bn(i + 1)}
            </span>
            <span style={{ fontFamily: headFont, fontWeight: 800, fontSize: 34, color: active ? "#fff" : N.muted, lineHeight: 1.3 }}>{seen ? r : "?"}</span>
          </div>
        );
      })}
    </div>
  );
};

const RiskTitle: React.FC<{ readonly idx: number; readonly x?: number; readonly y?: number }> = ({ idx, x = 96, y = 170 }) => (
  <div style={{ position: "absolute", left: x, top: y, display: "flex", alignItems: "center", gap: 10 }}>
    <KText text={`ঝুঁকি ${bn(idx + 1)} ·`} at={4} size={50} color={N.red} align="left" />
    <KText text={RISKS[idx]} at={7} size={80} align="left" glow={`${N.red}55`} />
  </div>
);

/* ---------------------------------------------------------------- 6 leadership */
const Leadership: React.FC<{ readonly deals: number; readonly gone: number; readonly hard: number }> = ({ deals, gone, hard }) => {
  const frame = useCurrentFrame();
  const fade = p01(frame, gone, gone + 18, ease.inOut);
  const chair = p01(frame, gone + 4, gone + 20);
  const docs = ["বড় চুক্তি", "পার্টনারশিপ", "বড় অর্ডার"];
  return (
    <AbsoluteFill>
      <DocBg tint="#2a1a17" spot={[66, 45]} />
      <Atmos seed="p7f" color={N.amber} leak={0.3} bokeh={12} />
      <Cam push={0.1} drift={[-40, 0]} rot={0.6} punch={[deals, hard]} origin="62% 50%">
        <RiskTitle idx={0} />
        <div style={{ position: "absolute", left: 96, top: 360, width: 800, opacity: 1 - fade }}>
          <KText text="বড় বড় চুক্তির পেছনে" at={deals - 8} size={56} align="left" />
          <KText text="ছিলেন হুয়াং নিজে" at={deals + 4} size={64} align="left" color={N.amber} />
        </div>
        <div style={{ position: "absolute", left: 96, top: 360, width: 820, opacity: fade }}>
          <KText text="তার জায়গা পূরণ করা" at={gone} size={60} align="left" />
          <KText text="সহজ না" at={hard} size={120} align="left" color={N.red} glow={`${N.red}88`} />
        </div>
        <div style={{ opacity: 1 - fade * 0.85 }}>
          <PhotoCard src="nvidia/img/jensen_2016.jpg" x={1000} y={190} w={760} h={520} at={2} rot={3} gray={fade} pos="40% 30%" caption="জেনসেন হুয়াং" />
        </div>
        {docs.map((d, i) => {
          const k = p01(frame, deals + i * 5, deals + i * 5 + 14);
          return (
            <Glass
              key={d}
              accent={N.amber}
              style={{
                left: 980 + i * 260,
                top: 700 - (i % 2) * 40,
                padding: "6px 22px 10px",
                opacity: k * (1 - fade),
                translate: `${(1 - k) * -260}px ${(1 - k) * 140}px`,
                rotate: `${-6 + i * 6}deg`,
                fontFamily: headFont,
                fontWeight: 800,
                fontSize: 34,
                lineHeight: 1.3,
                color: N.amber,
              }}
            >
              ✍ {d}
            </Glass>
          );
        })}
        <AbsoluteFill style={{ left: 1000, width: 780, top: 140, height: 640, justifyContent: "center", alignItems: "center", opacity: chair }}>
          <div style={{ scale: `${0.8 + 0.2 * chair}` }}>
            <Chair color="#ffd2c8" size={380} />
          </div>
          <div style={{ position: "absolute", top: 40, right: 140, fontFamily: headFont, fontWeight: 800, fontSize: 160, color: N.red, opacity: p01(frame, hard, hard + 8), textShadow: `0 0 40px ${N.red}` }}>?</div>
          <div style={{ position: "absolute", bottom: 40, fontFamily: headFont, fontWeight: 700, fontSize: 34, color: N.muted, lineHeight: 1.3 }}>সিইও-র চেয়ার এখন খালি</div>
        </AbsoluteFill>
      </Cam>
      <RiskTabs idx={0} />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 7 money loop */
type P = [number, number];
const bez = (p: P[], t: number): P => {
  const u = 1 - t;
  return [0, 1].map((k) => u * u * u * p[0][k] + 3 * u * u * t * p[1][k] + 3 * u * t * t * p[2][k] + t * t * t * p[3][k]) as P;
};

const MoneyLoop: React.FC<{ readonly invest: number; readonly back: number; readonly chip: number; readonly critics: number; readonly drop: number; readonly danger: number }> = ({
  invest,
  back,
  chip,
  critics,
  drop,
  danger,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nodes = p01(frame, 8, 22);
  const top = interpolate(frame, [invest - 10, invest + 12], [0, 1], { ...clamp, easing: ease.inOut });
  const bot = interpolate(frame, [back, chip + 8], [0, 1], { ...clamp, easing: ease.inOut });
  const crit = p01(frame, critics, critics + 12);
  const dr = interpolate(frame, [drop - 4, drop + 14], [0, 1], { ...clamp, easing: ease.inOut });
  const red = p01(frame, danger, danger + 8);
  const spin = (frame / fps) * (1 - 0.85 * red);
  const A: P = [560, 540];
  const B: P = [1360, 540];
  const topP: P[] = [[A[0] + 160, A[1] - 70], [A[0] + 320, A[1] - 330], [B[0] - 320, B[1] - 330], [B[0] - 160, B[1] - 70]];
  const botP: P[] = [[B[0] - 160, B[1] + 70], [B[0] - 320, B[1] + 290], [A[0] + 320, A[1] + 290], [A[0] + 160, A[1] + 70]];
  const dP = (p: P[]) => `M${p[0][0]} ${p[0][1]} C ${p[1][0]} ${p[1][1]}, ${p[2][0]} ${p[2][1]}, ${p[3][0]} ${p[3][1]}`;
  const lc = red > 0.5 ? N.red : N.greenHi;
  const tokens = (pts: P[], on: number, kind: "$" | "chip", phase: number) =>
    [0, 1, 2, 3].map((i) => {
      const t = (spin * 0.45 + i / 4 + phase) % 1;
      const [x, y] = bez(pts, t);
      const o = on * Math.min(1, Math.sin(t * Math.PI) * 3) * (1 - red);
      return kind === "$" ? (
        <g key={`${kind}${phase}${i}`} opacity={o} style={{ filter: `drop-shadow(0 0 10px ${N.gold})` }}>
          <circle cx={x} cy={y} r={26} fill={N.gold} stroke="#fff6" strokeWidth={3} />
          <text x={x} y={y + 11} textAnchor="middle" fontFamily={numFont} fontWeight={900} fontSize={32} fill="#3a2a00">
            $
          </text>
        </g>
      ) : (
        <g key={`${kind}${phase}${i}`} opacity={o} style={{ filter: `drop-shadow(0 0 10px ${N.green})` }}>
          <rect x={x - 22} y={y - 22} width={44} height={44} rx={6} fill="#1a2210" stroke={N.greenHi} strokeWidth={3} />
          <rect x={x - 10} y={y - 10} width={20} height={20} fill={N.greenHi} />
        </g>
      );
    });
  return (
    <AbsoluteFill>
      <Plate id="dc" from={2.5} blur={12} dim={0.6} tint={red > 0.5 ? "#ff7070" : undefined} />
      <Atmos seed="p7g" color={red > 0.5 ? N.red : N.gold} leak={0.4} />
      <Cam push={0.12} drift={[0, -20]} punch={[invest, danger]} shakeAt={[danger]} origin="50% 55%">
        <RiskTitle idx={1} y={160} />
        <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
          <defs>
            <filter id="p7glow">
              <feGaussianBlur stdDeviation="8" />
            </filter>
          </defs>
          <path d={dP(topP)} fill="none" stroke={N.gold} strokeWidth={16} opacity={0.4 * top * (1 - red)} filter="url(#p7glow)" />
          <path d={dP(topP)} fill="none" stroke={red > 0.5 ? N.red : N.gold} strokeWidth={6} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - top} />
          <path d={dP(botP)} fill="none" stroke={lc} strokeWidth={16} opacity={0.4 * bot * (1 - red)} filter="url(#p7glow)" />
          <path d={dP(botP)} fill="none" stroke={lc} strokeWidth={6} pathLength={1} strokeDasharray={red > 0.5 ? "0.06 0.05" : "1"} strokeDashoffset={red > 0.5 ? 0 : 1 - bot} />
          {tokens(topP, top, "$", 0)}
          {tokens(botP, bot, "chip", 0.12)}
          {tokens(botP, bot, "$", 0.5)}
          <text x={960} y={250} textAnchor="middle" fontFamily={headFont} fontWeight={800} fontSize={44} fill={N.gold} opacity={top * (1 - red)}>
            টাকা বিনিয়োগ →
          </text>
          <text x={960} y={850} textAnchor="middle" fontFamily={headFont} fontWeight={800} fontSize={42} fill={N.greenHi} opacity={bot * (1 - red)}>
            ← এনভিডিয়ারই চিপ কেনে
          </text>
        </svg>
        <Glass
          accent={red > 0.5 ? N.red : N.green}
          style={{
            left: A[0] - 160,
            top: A[1] - 95,
            width: 320,
            height: 190,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: nodes,
            scale: `${0.8 + 0.2 * nodes}`,
            border: `2px solid ${red > 0.5 ? N.red : N.green}`,
          }}
        >
          <span style={{ fontFamily: numFont, fontWeight: 900, fontSize: 64, color: "#fff", letterSpacing: 2, textShadow: `0 0 30px ${N.green}` }}>NVIDIA</span>
        </Glass>
        <div style={{ position: "absolute", left: B[0] - 160, top: B[1] - 120, width: 320, opacity: nodes, scale: `${0.8 + 0.2 * nodes}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: 100,
                  borderRadius: 18,
                  background: "linear-gradient(145deg, rgba(63,216,255,0.22), rgba(63,216,255,0.05))",
                  border: `1.5px solid ${red > 0.5 ? N.red : N.cyan}`,
                  boxShadow: `0 0 24px ${red > 0.5 ? N.red : N.cyan}44`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: numFont,
                  fontWeight: 900,
                  fontSize: 40,
                  color: "#fff",
                  rotate: `${red * (i % 2 ? 7 : -7)}deg`,
                  translate: `0 ${red * (i + 1) * 6}px`,
                }}
              >
                AI
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 8, fontFamily: headFont, fontWeight: 700, fontSize: 34, color: N.ink, lineHeight: 1.3 }}>AI কোম্পানি</div>
        </div>
        {red > 0 ? (
          <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
            <div
              style={{
                opacity: red,
                scale: `${1 + 0.7 * Math.exp(-Math.max(0, frame - danger) / 4)}`,
                fontFamily: headFont,
                fontWeight: 800,
                fontSize: 110,
                lineHeight: 1.3,
                color: "#fff",
                WebkitTextStroke: `3px ${N.red}`,
                textShadow: `0 0 60px ${N.red}`,
                rotate: "-4deg",
              }}
            >
              চক্র বিপদে?
            </div>
          </AbsoluteFill>
        ) : null}
      </Cam>
      <Glass accent={N.amber} style={{ right: 96, top: 170, padding: "14px 28px 18px", opacity: crit, translate: `${(1 - crit) * 60}px 0` }}>
        <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 34, color: N.amber, lineHeight: 1.3 }}>সমালোচকরা বলছেন</div>
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 14, fontFamily: headFont, fontWeight: 700, fontSize: 32, color: N.ink, lineHeight: 1.3 }}>
          AI-এর চাহিদা
          <div style={{ width: 190, height: 24, borderRadius: 12, background: "rgba(0,0,0,0.4)", overflow: "hidden" }}>
            <div style={{ width: `${90 - 72 * dr}%`, height: "100%", background: dr > 0.3 ? `linear-gradient(90deg, ${N.red}, #ff8a8a)` : `linear-gradient(90deg, ${N.green}, ${N.greenHi})`, boxShadow: `0 0 14px ${dr > 0.3 ? N.red : N.green}` }} />
          </div>
          <span style={{ color: N.red, opacity: dr, fontFamily: numFont, fontWeight: 900, fontSize: 40 }}>↓</span>
        </div>
      </Glass>
      <RiskTabs idx={1} />
      <HitFlash at={danger} color="#ff8080" />
      {frame >= danger && frame < danger + 7 ? <GlitchBars amount={1 - (frame - danger) / 7} /> : null}
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 8 China */
const CHINA: P[] = [
  [73.5, 39.5], [75, 37], [78, 35.5], [79, 32.5], [81, 30], [85, 28.3], [89, 27.9], [92, 27.8], [97, 28.2], [98.5, 25], [101, 22],
  [106, 22.5], [108, 21.6], [111, 21.5], [114, 22.3], [117, 23.5], [120, 26.5], [122, 30], [121, 32], [119.5, 35], [122.5, 37.3],
  [121, 39], [122, 40.5], [124.5, 40], [126, 41.5], [129, 42.5], [131, 43], [131, 45], [133, 45], [135, 48.5], [131, 48],
  [127.5, 49.7], [126, 52.8], [123, 53.5], [120.5, 53], [119.5, 50], [116, 49.8], [117.5, 47], [112, 45], [107, 42.5], [101, 42.5],
  [96.5, 42.8], [91, 45], [90, 47.8], [87.5, 49], [85, 47], [82.5, 45.5], [80, 43.2], [80, 42], [76, 40.5],
];
const CHINA_PATH = CHINA.map(([lon, lat], i) => `${i ? "L" : "M"}${((lon - 73) * 18).toFixed(1)} ${((54 - lat) * 18).toFixed(1)}`).join(" ") + " Z";

const China: React.FC<{ readonly rule: number; readonly best: number; readonly ban: number }> = ({ rule, best, ban }) => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame, [4, 28], [0, 1], { ...clamp, easing: ease.inOut });
  const r = p01(frame, rule - 4, rule + 10);
  const c = interpolate(frame, [best, ban], [0, 1], { ...clamp, easing: ease.in });
  const b = p01(frame, ban, ban + 8);
  return (
    <AbsoluteFill>
      <DocBg tint="#2a1414" spot={[68, 50]} />
      <Atmos seed="p7h" color={N.red} leak={0.35} bokeh={12} />
      <Cam push={0.12} drift={[-30, -10]} punch={[ban]} shakeAt={[ban]} origin="65% 55%">
        <RiskTitle idx={2} />
        <div style={{ position: "absolute", left: 860, top: 210, width: 960, height: 566, perspective: 1600 }}>
          <svg viewBox="0 0 1120 660" style={{ width: "100%", height: "100%", overflow: "visible", transform: "rotateX(14deg) rotateY(-8deg)" }}>
            <defs>
              <linearGradient id="p7cn" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ff6b6b" stopOpacity="0.55" />
                <stop offset="1" stopColor="#4a0000" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            {[18, 10].map((o) => (
              <path key={o} d={CHINA_PATH} fill="#1a0000" transform={`translate(${o * 0.5} ${o})`} opacity={0.8 * draw} />
            ))}
            <path d={CHINA_PATH} fill="url(#p7cn)" fillOpacity={draw} stroke="#ff7a7a" strokeWidth={4} strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} style={{ filter: `drop-shadow(0 0 20px ${N.red})` }} />
            <text x={720} y={360} textAnchor="middle" fontFamily={headFont} fontWeight={800} fontSize={80} fill="#fff" opacity={draw}>
              চীন
            </text>
          </svg>
          <div style={{ position: "absolute", left: 300, top: 110, opacity: b, scale: `${1 + 0.8 * Math.exp(-Math.max(0, frame - ban) / 4)}`, filter: `drop-shadow(0 0 30px ${N.red})` }}>
            <svg width={190} height={220} viewBox="0 0 100 116">
              <path d="M26 50 V32 a24 24 0 0 1 48 0 V50" fill="none" stroke="#e8e8e8" strokeWidth={10} />
              <rect x={10} y={48} width={80} height={64} rx={12} fill={N.red} />
              <circle cx={50} cy={74} r={9} fill="#2a0000" />
              <rect x={46} y={78} width={8} height={18} rx={3} fill="#2a0000" />
            </svg>
          </div>
        </div>
        {/* US rule paper */}
        <div
          style={{
            position: "absolute",
            left: 110,
            top: 380,
            width: 580,
            opacity: r,
            translate: `${(1 - r) * -120}px ${(1 - r) * 40}px`,
            rotate: `${-3 + (1 - r) * -8}deg`,
            background: "#f1efe9",
            padding: "24px 32px 28px",
            boxShadow: "0 30px 60px rgba(0,0,0,0.6), 0 6px 14px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ position: "absolute", top: -16, left: "50%", width: 130, height: 36, translate: "-50% 0", rotate: "4deg", background: "rgba(235,225,190,0.75)" }} />
          <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 42, color: "#1b1b1b", lineHeight: 1.3 }}>আমেরিকার নিয়ম</div>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ height: 11, borderRadius: 6, background: "#cdc8ba", marginTop: 15, width: `${92 - i * 18}%` }} />
          ))}
          <div style={{ marginTop: 20, fontFamily: headFont, fontWeight: 800, fontSize: 38, color: "#c11", lineHeight: 1.3 }}>সেরা চিপ → চীনে বিক্রি বন্ধ</div>
        </div>
        {/* GPU trying to cross */}
        <div
          style={{
            position: "absolute",
            left: interpolate(c, [0, 1], [720, 1000]) - 50 * b,
            top: 760,
            opacity: p01(frame, best - 4, best + 6),
            width: 120,
            height: 90,
            borderRadius: 14,
            background: "linear-gradient(145deg,#26341a,#0d1408)",
            border: `3px solid ${b > 0.5 ? N.red : N.greenHi}`,
            boxShadow: `0 0 30px ${b > 0.5 ? N.red : N.green}88`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: numFont,
            fontWeight: 900,
            fontSize: 28,
            color: "#fff",
          }}
        >
          GPU
        </div>
        <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
          <g opacity={b} stroke={N.red} strokeWidth={12} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 12px ${N.red})` }}>
            <line x1={1150} y1={730} x2={1150} y2={870} />
            <line x1={1080} y1={760} x2={1130} y2={840} />
            <line x1={1130} y1={760} x2={1080} y2={840} />
          </g>
        </svg>
        <div style={{ position: "absolute", left: 1185, top: 755, opacity: b, fontFamily: headFont, fontWeight: 800, fontSize: 76, color: "#fff", WebkitTextStroke: `2px ${N.red}`, textShadow: `0 0 40px ${N.red}`, lineHeight: 1.3 }}>বন্ধ</div>
      </Cam>
      <RiskTabs idx={2} />
      <HitFlash at={ban} color="#ff8080" />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 9 competitors */
const Ticker: React.FC<{ readonly sym: string; readonly name: string; readonly up: boolean; readonly t: number; readonly x: number; readonly ry: number }> = ({ sym, name, up, t, x, ry }) => {
  const frame = useCurrentFrame();
  const a = p01(frame, t, t + 14);
  const draw = interpolate(frame, [t + 4, t + 34], [0, 1], { ...clamp, easing: ease.out });
  const c = up ? N.greenHi : N.red;
  const pts = up ? [[0, 120], [60, 112], [120, 116], [180, 82], [240, 74], [300, 34], [360, 12]] : [[0, 20], [60, 30], [120, 25], [180, 72], [240, 92], [300, 102], [360, 126]];
  const d = pts.map(([px, py], i) => `${i ? "L" : "M"}${px} ${py}`).join(" ");
  return (
    <Glass
      accent={c}
      sheenAt={t}
      style={{
        left: x,
        top: 360,
        width: 520,
        height: 320,
        padding: "22px 30px",
        opacity: a,
        transform: `translateY(${(1 - a) * 80}px) rotateY(${ry}deg)`,
        border: `1.5px solid ${c}88`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontFamily: numFont, fontWeight: 900, fontSize: 56, color: "#fff" }}>{sym}</div>
          <div style={{ fontFamily: headFont, fontWeight: 700, fontSize: 30, color: N.muted, lineHeight: 1.3 }}>{name}</div>
        </div>
        <svg width={86} height={86} viewBox="0 0 40 40" style={{ filter: `drop-shadow(0 0 12px ${c})` }}>
          <path d={up ? "M20 4 L36 26 L4 26 Z" : "M20 36 L36 14 L4 14 Z"} fill={c} />
        </svg>
      </div>
      <svg width={460} height={140} viewBox="0 0 370 140" style={{ marginTop: 8, overflow: "visible" }}>
        <defs>
          <linearGradient id={`p7t${sym}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={c} stopOpacity="0.4" />
            <stop offset="1" stopColor={c} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${d} L360 140 L0 140 Z`} fill={`url(#p7t${sym})`} opacity={draw} />
        <path d={d} fill="none" stroke={c} strokeWidth={6} strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} style={{ filter: `drop-shadow(0 0 8px ${c})` }} />
      </svg>
    </Glass>
  );
};

const Rivals: React.FC<{ readonly amd: number; readonly avgo: number; readonly rose: number }> = ({ amd, avgo, rose }) => {
  return (
    <AbsoluteFill>
      <Plate id="card" from={1} blur={10} dim={0.6} />
      <Atmos seed="p7i" color={N.greenHi} leak={0.35} />
      <Cam push={0.1} drift={[-40, -10]} punch={[amd, avgo, rose]}>
        <RiskTitle idx={3} />
        <AbsoluteFill style={{ perspective: 1800 }}>
          <Ticker sym="NVIDIA" name="এনভিডিয়া" up={false} t={6} x={96} ry={14} />
          <Ticker sym="AMD" name="এএমডি" up t={amd} x={700} ry={0} />
          <Ticker sym="BROADCOM" name="ব্রডকম" up t={avgo} x={1304} ry={-14} />
        </AbsoluteFill>
        <div style={{ position: "absolute", left: 0, right: 0, top: 712 }}>
          <KText text="প্রতিযোগীদের শেয়ার উল্টো বেড়েছে ▲" at={rose - 6} size={64} color="#fff" glow={`${N.green}88`} />
        </div>
      </Cam>
      <RiskTabs idx={3} />
      <HitFlash at={rose} color={N.greenHi} />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 10 calendar */
const DAYS = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"];

const Calendar17: React.FC<{ readonly ring: number; readonly report: number; readonly first: number }> = ({ ring, report, first }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const inC = p01(frame, 0, 16);
  const rep = interpolate(frame, [report - 6, report + 16], [0, 1], { ...clamp, easing: ease.inOut });
  const fst = p01(frame, first, first + 12);
  const out = interpolate(frame, [durationInFrames - 12, durationInFrames - 2], [1, 0], clamp);
  const zoom17 = interpolate(frame, [ring - 10, ring + 10, report - 6, report + 14], [1, 1.25, 1.25, 1], { ...clamp, easing: ease.inOut });
  const cell = 98;
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <DocBg tint="#2a2315" spot={[45, 40]} />
      <Atmos seed="p7j" color={N.amber} leak={0.4} bokeh={16} />
      <Cam push={0.08} drift={[-30, -10]} punch={[ring, first]} shakeAt={[first]}>
        <div style={{ position: "absolute", left: 96, top: 64, width: 900 }}>
          <KText text="সামনে বড় পরীক্ষা" at={0} size={62} color={N.amber} align="left" glow={`${N.amber}55`} />
        </div>
        <AbsoluteFill style={{ perspective: 1600 }}>
          <div
            style={{
              position: "absolute",
              left: 960 - 370 - 420 * rep,
              top: 170,
              width: 740,
              transform: `rotateY(${8 + 10 * rep}deg) rotateX(6deg) scale(${zoom17 * (1 - 0.15 * rep)}) translateY(${(1 - inC) * 80}px)`,
              transformOrigin: "60% 70%",
              opacity: inC,
              background: "#f3f1ea",
              boxShadow: "0 40px 90px rgba(0,0,0,0.75), 0 8px 20px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ background: `linear-gradient(180deg, #e2453f, #b8231e)`, padding: "8px 0 14px", textAlign: "center", fontFamily: headFont, fontWeight: 800, fontSize: 46, color: "#fff", lineHeight: 1.3 }}>
              নভেম্বর ২০২৬
            </div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(7, ${cell}px)`, padding: "10px 27px 20px" }}>
              {DAYS.map((d) => (
                <div key={d} style={{ textAlign: "center", fontFamily: headFont, fontWeight: 700, fontSize: 24, color: "#888", lineHeight: 1.6 }}>
                  {d}
                </div>
              ))}
              {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
                const is17 = d === 17;
                const past = d <= 13;
                return (
                  <div
                    key={d}
                    style={{
                      height: 74,
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: headFont,
                      fontWeight: 800,
                      fontSize: 36,
                      lineHeight: 1,
                      color: is17 ? "#c11" : past ? "#bdb8ac" : "#222",
                    }}
                  >
                    {bn(d)}
                    {past ? <div style={{ position: "absolute", width: 50, height: 3, background: "#c9c3b5", rotate: "-30deg" }} /> : null}
                  </div>
                );
              })}
            </div>
            {/* marker ring around 17 (row 3, col 2 of the grid) */}
            <svg viewBox="0 0 740 600" style={{ position: "absolute", left: 0, top: 0, width: 740, height: 600, overflow: "visible", pointerEvents: "none" }}>
              <path
                d={`M${27 + 2.5 * cell + 40} ${72 + 38 + 2 * 74 + 18} C ${27 + 2.5 * cell + 60} ${72 + 38 + 2 * 74 + 60}, ${27 + 2.5 * cell - 70} ${72 + 38 + 2 * 74 + 60}, ${27 + 2.5 * cell - 62} ${72 + 38 + 2 * 74 + 2} C ${27 + 2.5 * cell - 56} ${72 + 38 + 2 * 74 - 52}, ${27 + 2.5 * cell + 66} ${72 + 38 + 2 * 74 - 50}, ${27 + 2.5 * cell + 56} ${72 + 38 + 2 * 74 + 12}`}
                fill="none"
                stroke="#d61a1a"
                strokeWidth={7}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - p01(frame, ring - 2, ring + 12, ease.inOut)}
              />
            </svg>
          </div>
          <Glass
            accent={N.amber}
            sheenAt={report}
            style={{
              left: 1010,
              top: 170,
              width: 780,
              height: 650,
              padding: "28px 40px",
              opacity: rep,
              transform: `translateX(${(1 - rep) * 400}px) rotateY(-10deg)`,
            }}
          >
            <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 50, color: "#fff", lineHeight: 1.3 }}>তিন মাসের হিসাব</div>
            <div style={{ fontFamily: numFont, fontWeight: 700, fontSize: 26, color: N.muted, letterSpacing: 3 }}>QUARTERLY RESULTS · 17 NOV</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 40, height: 270, marginTop: 26, borderBottom: "3px solid rgba(255,255,255,0.25)" }}>
              {[0.45, 0.6, 0.78].map((h, i) => (
                <div key={i} style={{ width: 120, height: 270 * h * p01(frame, report + i * 5, report + i * 5 + 16), background: `linear-gradient(0deg, ${N.green}66, ${N.greenHi})`, borderRadius: "12px 12px 2px 2px", boxShadow: `0 0 20px ${N.green}55` }} />
              ))}
              <div
                style={{
                  width: 120,
                  height: 270 * 0.92,
                  border: `4px dashed ${N.amber}`,
                  borderBottom: "none",
                  borderRadius: "12px 12px 0 0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: headFont,
                  fontWeight: 800,
                  fontSize: 110,
                  color: N.amber,
                  textShadow: `0 0 30px ${N.amber}`,
                  opacity: p01(frame, report + 18, report + 28) * (0.75 + 0.25 * Math.sin(frame / 5)),
                }}
              >
                ?
              </div>
            </div>
            <div style={{ marginTop: 26, display: "flex", alignItems: "center", gap: 24, opacity: fst, scale: `${1 + 0.3 * (1 - fst)}`, transformOrigin: "left center" }}>
              <Chair color={N.amber} size={110} />
              <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 46, color: N.amber, lineHeight: 1.35 }}>
                হুয়াং ছাড়া
                <br />
                প্রথম বড় পরীক্ষা
              </div>
            </div>
          </Glass>
        </AbsoluteFill>
      </Cam>
      <HitFlash at={ring} color="#ffd9a0" />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- assembly */
export const P7Scene: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  const at = useAt(P7_ID);
  const f = (s: number) => Math.round(s * fps);

  const b1 = f(at("চিপের") - 0.2);
  const b2 = f(at("কোম্পানি") - 0.2);
  const b3 = f(at("আর") - 0.15);
  const b4 = f(at("প্রযুক্তিতে") - 0.2);
  const b5 = f(at("এক") - 0.2);
  const b6 = f(at("দুই") - 0.2);
  const b7 = f(at("তিন", 1) - 0.2);
  const b8 = f(at("চার") - 0.2);
  const b9 = f(at("সামনে", 1) - 0.2);

  const beats: Beat[] = [
    { at: 0, name: "split", node: <Split good={f(at("ভালো"))} /> },
    { at: b1, trans: "whip", name: "demand", node: <Demand sky={f(at("আকাশছোঁয়া")) - b1} /> },
    { at: b2, trans: "zoom", name: "$108B", node: <Revenue months={f(at("পরের")) - b2} hit={f(at("১০৮")) - b2} /> },
    { at: b3, trans: "slideUp", name: "+70%", node: <Growth seventy={f(at("সত্তর")) - b3} /> },
    { at: b4, trans: "flash", name: "tech → risk", node: <TechLead now={f(at("সবার")) - b4} risk={f(at("ঝুঁকি")) - b4} /> },
    { at: b5, trans: "glitch", name: "risk 1 leadership", node: <Leadership deals={f(at("চুক্তির")) - b5} gone={f(at("তার", 1)) - b5} hard={f(at("সহজ")) - b5} /> },
    {
      at: b6,
      trans: "whip",
      name: "risk 2 loop",
      node: (
        <MoneyLoop
          invest={f(at("বিনিয়োগ")) - b6}
          back={f(at("আবার")) - b6}
          chip={f(at("চিপ", 1)) - b6}
          critics={f(at("সমালোচকরা")) - b6}
          drop={f(at("কমলে")) - b6}
          danger={f(at("বিপদে")) - b6}
        />
      ),
    },
    { at: b7, trans: "whipL", name: "risk 3 china", node: <China rule={f(at("নিয়মে")) - b7} best={f(at("সেরা")) - b7} ban={f(at("বন্ধ")) - b7} /> },
    { at: b8, trans: "slideUp", name: "risk 4 rivals", node: <Rivals amd={f(at("এএমডি")) - b8} avgo={f(at("ব্রডকমের")) - b8} rose={f(at("উল্টো")) - b8} /> },
    { at: b9, trans: "zoom", name: "17 Nov", node: <Calendar17 ring={f(at("১৭")) - b9} report={f(at("সেদিন")) - b9} first={f(at("হুয়াংকে")) - b9} /> },
  ];

  return (
    <AbsoluteFill style={{ background: N.bg }}>
      <Beats beats={beats} end={durationInFrames} />
    </AbsoluteFill>
  );
};
