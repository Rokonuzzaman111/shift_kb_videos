/**
 * P2 v2 — from a diner booth to the AI rush (61.6 → 110.6 s). Film-stock look for the 90s, real 3D plates later,
 * a transition on every cut, every hit keyed to the spoken word:
 *  1 "১৯৯৩ সাল … স্যান হোসে … রেস্টুরেন্ট"    90s film: night street, diner neon flickers on, 1993 + location glass
 *  2 "তিনজন ইঞ্জিনিয়ার … কোম্পানি খুলবেন"       booth: three engineers pop in, napkin sketch draws
 *  3 "তাদের একজন জেনসেন হুয়াং"               push to the middle seat, Jensen photo print tossed in
 *  4 "শুরুটা সহজ ছিল না। ১৯৯৬"               red film: cash chart dives, 1996 stamp
 *  5 "অর্ধেকের বেশি কর্মী ছাঁটাই"              40-person staff wall, 22 fall away
 *  6 "বহু বছর মিটিং শুরু করতেন"              meeting slide, year calendar flips
 *  7 "আমাদের কোম্পানি দেউলিয়া হওয়া থেকে মাত্র"   quote types word by word, 30-day calendar crosses out
 *  8 "তিরিশ দিন দূরে"                        ৩০ দিন slam with draining ring
 *  9 "তিনটা মোড় · ১৯৯৯ প্রথম জিপিইউ"           glass timeline, GeForce 256 prints
 * 10 "২০০৬ কুডা … সফটওয়্যার" (+3 s pause)      CUDA terminal + code rain over the tray plate
 * 11 "গেমের চিপ দিয়ে বিজ্ঞানীরা অন্য হিসাব"     science tags burst out of the chip
 * 12 "২০১২ … দুটো গেমিং কার্ড"                 live 3D: two gaming cards
 * 13 "AI … ছবি চেনায় সবাইকে হারিয়ে দিল"        AI eye tags an image grid, "১ নম্বর" stamp
 * 14 "আধুনিক AI-এর দৌড় শুরু"                 speed streaks, 2012 → 2022 odometer
 * 15 "২০২২ … চ্যাটজিপিটি"                     chat window opens
 * 16 "সব বড় কোম্পানি … লাইনে দাঁড়াল"          data centre, companies queue for NVIDIA chips
 */
import { AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Atmos, Beats, Cam, Counter, Glass, GlitchBars, HitFlash, KText, Marker, PhotoCard, Plate, p01, type Beat } from "../kit";
import { GraphicsCard, Studio, orbit, type V3 } from "../three";
import { N, clamp, ease, headFont, numFont } from "../theme";
import { Film } from "../two/P2_parts";
import type { Cue } from "../types";
import { useAt } from "../vo";

export const P2_ID = "P2";
export const P2_KEYWORDS = ["১৯৯৩", "জেনসেন", "১৯৯৬", "তিরিশ", "১৯৯৯", "২০০৬", "কুডা", "২০১২", "দুটো", "২০২২", "চ্যাটজিপিটি।"];

export const P2_CUES: Cue[] = [
  { sfx: "reverse_swell", word: "১৯৯৩", offset: -0.9, volume: 0.6 },
  { sfx: "camera_shutter", word: "জেনসেন" },
  { sfx: "drop_down", word: "১৯৯৬", offset: -0.1 },
  { sfx: "hit_glitch", word: "ছাঁটাই" },
  { sfx: "heartbeat", word: "দেউলিয়া" },
  { sfx: "impact_deep", word: "তিরিশ" },
  { sfx: "whoosh", word: "১৯৯৯", offset: -0.2 },
  { sfx: "type", word: "২০০৬", offset: 0.1, volume: 0.6 },
  { sfx: "data_stream", word: "বিজ্ঞানীরা", offset: -0.2, volume: 0.8 },
  { sfx: "power_on", word: "দুটো", offset: -0.15 },
  { sfx: "impact", word: "হারিয়ে" },
  { sfx: "whoosh_big", word: "দৌড়", offset: -0.1 },
  { sfx: "ui_pop", word: "চ্যাটজিপিটি" },
  { sfx: "bass_drop", word: "লাইনে", volume: 0.8 },
];

const bn = (v: number | string) => String(v).replace(/\d/g, (c) => "০১২৩৪৫৬৭৮৯"[Number(c)]);

/* ---------------------------------------------------------------- photo helper (real photos, film-graded) */
const FullPhoto: React.FC<{ readonly src: string; readonly pos?: string; readonly zoom?: [number, number]; readonly pan?: [number, number]; readonly blur?: number; readonly bright?: number }> = ({
  src,
  pos = "center",
  zoom = [1.05, 1.2],
  pan = [0, 0],
  blur = 0,
  bright = 1,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const k = interpolate(frame, [0, durationInFrames], [0, 1], { ...clamp, easing: ease.inOut });
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: pos,
          scale: `${zoom[0] + (zoom[1] - zoom[0]) * k}`,
          translate: `${pan[0] * k}px ${pan[1] * k}px`,
          filter: `blur(${blur}px) brightness(${bright}) contrast(1.06)`,
        }}
      />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 1: 1993 — the diner sign at night */
const Street: React.FC<{ readonly place: number; readonly diner: number }> = ({ place, diner }) => {
  const frame = useCurrentFrame();
  const k = p01(frame, place - 4, place + 10);
  // neon flickers on at "রেস্টুরেন্ট"
  const flick = frame < diner ? 0.55 : frame < diner + 8 ? (random(`nf${frame}`) > 0.4 ? 1.15 : 0.6) : 1.08;
  return (
    <AbsoluteFill>
      <Film>
        <FullPhoto src="nvidia/img/dennys_sign.jpg" pos="30% 40%" zoom={[1.15, 1.45]} pan={[90, 30]} bright={flick} />
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at 28% 42%, rgba(255,190,60,0.22), transparent 45%)", mixBlendMode: "screen", opacity: flick > 1 ? 1 : 0.3 }} />
        <Atmos seed="p2a" color="#ff8a4a" color2="#ff3a6a" leak={0.55} bokeh={22} />
      </Film>
      <AbsoluteFill style={{ background: "linear-gradient(90deg, transparent 45%, rgba(5,6,7,0.75) 100%)" }} />
      <div style={{ position: "absolute", right: 96, top: 120, textAlign: "right", opacity: p01(frame, 0, 10), scale: `${1.25 - 0.25 * p01(frame, 0, 14)}`, transformOrigin: "right top" }}>
        <div style={{ fontFamily: numFont, fontWeight: 900, fontSize: 210, color: "#fff4e0", letterSpacing: -6, lineHeight: 1, textShadow: "0 0 50px #ff8a4a88, 0 10px 40px #000" }}>1993</div>
      </div>
      <Glass style={{ right: 96, top: 370, padding: "10px 30px 16px", opacity: k, translate: `${(1 - k) * 60}px 0` }} accent={N.amber}>
        <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 46, color: N.ink, lineHeight: 1.3 }}>📍 স্যান হোসে, আমেরিকা</div>
      </Glass>
      <div style={{ position: "absolute", right: 100, top: 480, opacity: p01(frame, diner, diner + 12), fontFamily: headFont, fontWeight: 700, fontSize: 38, color: "#ffd9a0", textShadow: "0 4px 18px #000", lineHeight: 1.3 }}>
        রাস্তার পাশের এক রেস্টুরেন্ট
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 2: the booth — three founders, a napkin sketch */
const FOUNDERS = [
  { n: "জেনসেন হুয়াং", r: "চিপ ডিজাইনার" },
  { n: "ক্রিস ম্যালাকাওস্কি", r: "ইঞ্জিনিয়ার" },
  { n: "কার্টিস প্রিম", r: "গ্রাফিক্স চিপ ডিজাইনার" },
];
const SKETCH = [
  "M560 300 L860 300 L860 560 L560 560 Z",
  "M610 350 L810 350 L810 510 L610 510 Z",
  "M560 340 L520 340 M560 400 L520 400 M560 460 L520 460 M560 520 L520 520",
  "M860 340 L900 340 M860 400 L900 400 M860 460 L900 460 M860 520 L900 520",
  "M620 300 L620 260 M700 300 L700 260 M780 300 L780 260",
  "M640 380 L780 480 M640 480 L780 380",
];
const Napkin: React.FC<{ readonly draw: number; readonly glow: number }> = ({ draw, glow }) => (
  <svg viewBox="0 0 1400 800" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
    {SKETCH.map((d, i) => {
      const k = Math.max(0, Math.min(1, draw * SKETCH.length - i));
      return (
        <path
          key={i}
          d={d}
          fill="none"
          stroke={glow > 0 ? N.greenHi : "#2a3a6a"}
          strokeWidth={glow > 0 ? 7 : 6}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - k}
          style={{ filter: glow > 0 ? `drop-shadow(0 0 ${14 * glow}px ${N.green})` : undefined }}
        />
      );
    })}
    <text x={710} y={640} textAnchor="middle" fontFamily="Segoe Print, cursive" fontSize={44} fill={glow > 0 ? N.greenHi : "#2a3a6a"} opacity={Math.max(0, draw * 1.6 - 0.6)}>
      3D graphics chip?
    </text>
  </svg>
);

const BoothBeat: React.FC<{ readonly three: number; readonly company: number }> = ({ three, company }) => {
  const frame = useCurrentFrame();
  const draw = p01(frame, 4, company + 6, ease.inOut);
  const glow = p01(frame, company, company + 12);
  return (
    <AbsoluteFill>
      <Film amount={0.85}>
        <FullPhoto src="nvidia/img/diner_booth.jpg" pos="50% 60%" zoom={[1.1, 1.28]} pan={[-40, 20]} blur={3} bright={0.75} />
        <Atmos seed="p2b" color="#ffb060" color2="#ff4a7a" leak={0.4} bokeh={14} />
      </Film>
      <Cam push={0.1} drift={[0, -20]} punch={[three, company]} origin="50% 70%">
        <AbsoluteFill style={{ perspective: 1300 }}>
          <div
            style={{
              position: "absolute",
              left: 260,
              top: 300,
              width: 1400,
              height: 800,
              transform: "rotateX(52deg) rotateZ(-6deg)",
              transformOrigin: "50% 50%",
              boxShadow: "0 60px 120px rgba(0,0,0,0.7)",
              borderRadius: 6,
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(0,0,0,0.025) 0 2px, transparent 2px 12px), repeating-linear-gradient(90deg, rgba(0,0,0,0.02) 0 2px, transparent 2px 12px), linear-gradient(135deg, #f7f3ea, #e9e2d2)",
            }}
          >
            <Napkin draw={draw} glow={glow} />
          </div>
        </AbsoluteFill>
      </Cam>
      <div style={{ position: "absolute", left: 96, top: 150, display: "flex", flexDirection: "column", gap: 18 }}>
        {FOUNDERS.map((fd, i) => {
          const kk = p01(frame, three + i * 5, three + i * 5 + 12);
          return (
            <Glass key={fd.n} style={{ position: "relative", padding: "10px 26px 14px", opacity: kk, translate: `${(1 - kk) * -80}px 0`, width: 470 }} accent={i === 0 ? N.green : N.amber}>
              <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 38, color: N.ink, lineHeight: 1.3 }}>{fd.n}</div>
              <div style={{ fontFamily: headFont, fontWeight: 600, fontSize: 26, color: N.muted, lineHeight: 1.3 }}>{fd.r}</div>
            </Glass>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 96, top: 46, width: 900 }}>
        <KText text="৩ জন ইঞ্জিনিয়ার" at={three} size={62} align="left" color="#fff4e0" />
      </div>
      <div style={{ position: "absolute", right: 96, top: 60 }}>
        {frame >= company - 4 ? (
          <Glass style={{ position: "relative", padding: "8px 28px 14px", opacity: glow, scale: `${0.8 + 0.2 * glow}` }} accent={N.green} sheenAt={company}>
            <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 48, color: N.greenHi, lineHeight: 1.3 }}>ঠিক হলো: কোম্পানি খুলবেন</div>
          </Glass>
        ) : null}
      </div>
      <HitFlash at={company} color="#fff0c0" />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 3: one of them — Jensen Huang */
const JensenBeat: React.FC<{ readonly one: number; readonly name: number }> = ({ one, name }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Film amount={0.7}>
        <FullPhoto src="nvidia/img/diner_booth.jpg" pos="50% 55%" zoom={[1.3, 1.45]} blur={10} bright={0.55} />
        <Atmos seed="p2c" color="#ffd090" leak={0.4} bokeh={16} />
      </Film>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 62% 45%, transparent 20%, rgba(5,6,7,0.7) 70%)" }} />
      <Cam push={0.08} drift={[-10, 0]} punch={[name]}>
        <PhotoCard src="nvidia/img/jensen_2010.jpg" x={940} y={120} w={640} h={520} at={Math.max(0, one - 4)} rot={4} pos="50% 25%" caption="জেনসেন হুয়াং · প্রতিষ্ঠাতা" zoom={0.12} />
      </Cam>
      <div style={{ position: "absolute", left: 96, top: 300, width: 760 }}>
        <KText text="তাদের একজন" at={Math.max(0, one - 4)} size={70} align="left" color="#fff4e0" />
        {frame >= name - 2 ? <KText text="জেনসেন হুয়াং" at={name - 2} size={96} align="left" color={N.greenHi} glow={`${N.green}88`} /> : null}
      </div>
      <Marker d="M110 640 Q380 620 700 640" at={name + 8} color={N.greenHi} width={8} />
      <HitFlash at={name} />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 4: 1996 dive (over a real 3D data-centre plate, red) */
const CASH: [number, number][] = [
  [0, 120], [120, 150], [240, 130], [360, 200], [480, 230], [600, 300], [720, 290], [840, 380], [960, 430], [1080, 470], [1200, 520],
];
const Dive: React.FC<{ readonly y96: number }> = ({ y96 }) => {
  const frame = useCurrentFrame();
  const draw = p01(frame, 0, y96 + 10, ease.out);
  const upto = draw * (CASH.length - 1);
  const i = Math.floor(upto);
  const pts = CASH.slice(0, i + 1);
  if (i < CASH.length - 1) {
    const fr = upto - i;
    pts.push([CASH[i][0] + (CASH[i + 1][0] - CASH[i][0]) * fr, CASH[i][1] + (CASH[i + 1][1] - CASH[i][1]) * fr]);
  }
  const d = pts.map(([x, y], k) => `${k ? "L" : "M"}${x} ${y}`).join(" ");
  const head = pts[pts.length - 1];
  const st = p01(frame, y96, y96 + 7);
  return (
    <AbsoluteFill>
      <Plate id="dc" from={3} rate={0.5} blur={8} dim={0.55} tint="#ff4a3a" drift={0.12} />
      <Atmos seed="p2d" color={N.red} color2="#ff8a4a" leak={0.4} bokeh={14} />
      <Cam push={0.12} drift={[-40, 20]} rot={-1} shakeAt={[y96]}>
        <AbsoluteFill style={{ perspective: 1500 }}>
          <Glass style={{ left: 260, top: 230, width: 1400, height: 580, transform: "rotateX(14deg) rotateY(-8deg)", transformOrigin: "50% 100%" }} accent={N.red}>
            <div style={{ position: "absolute", left: 36, top: 22, fontFamily: headFont, fontWeight: 700, fontSize: 36, color: N.ink, lineHeight: 1.3 }}>কোম্পানির হাতে টাকা</div>
            <svg viewBox="0 0 1400 580" style={{ position: "absolute", inset: 0 }}>
              <defs>
                <linearGradient id="p2ra" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={N.red} stopOpacity="0.45" />
                  <stop offset="1" stopColor={N.red} stopOpacity="0" />
                </linearGradient>
                <filter id="p2gl">
                  <feGaussianBlur stdDeviation="7" />
                </filter>
              </defs>
              <g transform="translate(90 20)">
                {[150, 270, 390, 510].map((y) => (
                  <line key={y} x1={0} x2={1220} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" />
                ))}
                {pts.length > 1 ? <path d={`${d} L${head[0]} 540 L0 540 Z`} fill="url(#p2ra)" /> : null}
                <path d={d} fill="none" stroke={N.red} strokeWidth={12} filter="url(#p2gl)" />
                <path d={d} fill="none" stroke="#ff8080" strokeWidth={5} />
                <circle cx={head[0]} cy={head[1]} r={12} fill={N.red} />
                <circle cx={head[0]} cy={head[1]} r={30 + 8 * Math.sin(frame / 3)} fill={N.red} opacity={0.25} />
              </g>
            </svg>
          </Glass>
        </AbsoluteFill>
      </Cam>
      <div style={{ position: "absolute", left: 96, top: 60, width: 1100 }}>
        <KText text="শুরুটা সহজ ছিল না" at={2} size={68} align="left" />
      </div>
      {frame >= y96 ? (
        <div
          style={{
            position: "absolute",
            right: 140,
            top: 70,
            rotate: "-8deg",
            opacity: st,
            scale: `${2 - st}`,
            border: `8px solid ${N.red}`,
            borderRadius: 14,
            padding: "0 30px",
            fontFamily: numFont,
            fontWeight: 900,
            fontSize: 120,
            color: N.red,
            background: "rgba(40,0,0,0.45)",
            textShadow: `0 0 30px ${N.red}aa`,
          }}
        >
          1996
        </div>
      ) : null}
      <HitFlash at={y96} color="#ff8080" />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 5: layoffs — wall of employee ID badges */
const STAFF = Array.from({ length: 40 }, (_, i) => ({ c: i % 10, r: Math.floor(i / 10), cut: random(`cut${i}`) < 0.55, j: random(`sj${i}`) }));
const Badge: React.FC<{ readonly x: number; readonly y: number; readonly i: number; readonly red: boolean; readonly o: number; readonly rot: number }> = ({ x, y, i, red, o, rot }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: 92,
      height: 118,
      borderRadius: 10,
      opacity: o,
      rotate: `${rot}deg`,
      background: red ? "linear-gradient(160deg, #4a1212, #200808)" : "linear-gradient(160deg, #2a3138, #14191d)",
      border: `1.5px solid ${red ? N.red : "rgba(255,255,255,0.16)"}`,
      boxShadow: red ? `0 0 18px ${N.red}66` : "0 8px 18px rgba(0,0,0,0.5)",
      overflow: "hidden",
    }}
  >
    <div style={{ height: 14, background: red ? N.red : N.green, opacity: 0.85 }} />
    <div style={{ width: 44, height: 44, borderRadius: 22, margin: "12px auto 6px", background: red ? "#6a2a2a" : "linear-gradient(160deg,#9aa5ad,#59636b)" }} />
    <div style={{ width: 60, height: 6, borderRadius: 3, margin: "0 auto 5px", background: "rgba(255,255,255,0.35)" }} />
    <div style={{ textAlign: "center", fontFamily: numFont, fontWeight: 700, fontSize: 13, color: red ? "#ff9a9a" : N.muted }}>ID {String(1000 + i * 7)}</div>
  </div>
);
const Layoff: React.FC<{ readonly cut: number }> = ({ cut }) => {
  const frame = useCurrentFrame();
  const gone = STAFF.filter((s) => s.cut && frame >= cut + s.j * 8 + 16).length;
  return (
    <AbsoluteFill>
      <Plate id="chipmacro" from={4} rate={0.4} blur={12} dim={0.6} tint="#ff4a3a" />
      <Atmos seed="p2e" color={N.red} leak={0.35} bokeh={12} />
      <Cam push={0.1} drift={[30, 0]} punch={[cut]} shakeAt={[cut]}>
        <AbsoluteFill style={{ perspective: 1500 }}>
          <Glass style={{ left: 380, top: 190, width: 1160, height: 600, transform: "rotateY(10deg) rotateX(6deg)" }} accent={N.red} sheenAt={cut}>
            {STAFF.map((s, i) => {
              const show = p01(frame, i * 0.6, i * 0.6 + 8);
              const fall = s.cut ? p01(frame, cut + s.j * 8, cut + s.j * 8 + 16, ease.in) : 0;
              const red = s.cut && frame >= cut + s.j * 6;
              return <Badge key={i} i={i} x={40 + s.c * 110} y={40 + s.r * 136 + fall * 420} red={red} o={show * (1 - fall)} rot={fall * (s.j - 0.5) * 60} />;
            })}
          </Glass>
        </AbsoluteFill>
      </Cam>
      <div style={{ position: "absolute", top: 50, width: "100%" }}>
        <KText text="অর্ধেকের বেশি কর্মী" at={0} size={64} />
      </div>
      <Glass style={{ right: 96, top: 210, padding: "10px 26px 16px", opacity: p01(frame, cut, cut + 10) }} accent={N.red}>
        <div style={{ fontFamily: headFont, fontWeight: 700, fontSize: 30, color: N.muted, lineHeight: 1.3 }}>কর্মী</div>
        <div style={{ fontFamily: numFont, fontWeight: 900, fontSize: 64, color: N.ink, fontVariantNumeric: "tabular-nums" }}>
          {40 - gone}
          <span style={{ fontSize: 34, color: N.muted }}>/40</span>
        </div>
      </Glass>
      {frame >= cut ? (
        <div style={{ position: "absolute", top: 790, width: "100%", textAlign: "center", fontFamily: headFont, fontWeight: 800, fontSize: 64, color: N.red, scale: `${1 + 0.4 * Math.exp(-(frame - cut) / 4)}`, textShadow: "0 0 30px #ff3b3b88, 0 6px 26px #000", lineHeight: 1.3 }}>
          ছাঁটাই
        </div>
      ) : null}
      {frame >= cut && frame < cut + 7 ? <GlitchBars amount={1 - (frame - cut) / 7} /> : null}
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 6: years of meetings */
const Meetings: React.FC<{ readonly years: number; readonly word: number }> = ({ years, word }) => {
  const frame = useCurrentFrame();
  const yr = Math.round(interpolate(frame, [years, years + 50], [1996, 2004], clamp));
  const flipPh = (interpolate(frame, [years, years + 50], [0, 8], clamp) % 1) * 90;
  return (
    <AbsoluteFill>
      <Film amount={0.5}>
        <Plate id="dc" from={6} rate={0.4} blur={14} dim={0.62} />
        <Atmos seed="p2f" color={N.amber} leak={0.35} />
        <Cam push={0.12} drift={[-40, -10]} rot={0.6}>
          <AbsoluteFill style={{ perspective: 1400 }}>
            {/* calendar */}
            <div style={{ position: "absolute", left: 220, top: 230, width: 460, height: 500, transform: "rotateY(18deg)" }}>
              <div style={{ position: "absolute", inset: 0, background: "#f1efe9", borderRadius: 16, boxShadow: "0 40px 80px rgba(0,0,0,0.7)" }} />
              <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 110, background: N.red, borderRadius: "16px 16px 0 0", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: headFont, fontWeight: 800, fontSize: 48, color: "#fff" }}>
                বছর
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 110,
                  bottom: 0,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontFamily: numFont,
                  fontWeight: 900,
                  fontSize: 150,
                  color: "#1b1b1b",
                  transform: frame >= years && yr < 2004 ? `rotateX(${flipPh}deg)` : undefined,
                  transformOrigin: "50% 0%",
                }}
              >
                {yr}
              </div>
              {[0, 1].map((i) => (
                <div key={i} style={{ position: "absolute", top: -18, left: 110 + i * 200, width: 24, height: 50, borderRadius: 12, background: "#555" }} />
              ))}
            </div>
            {/* meeting slide */}
            <Glass style={{ left: 800, top: 200, width: 900, height: 540, transform: "rotateY(-12deg)" }} accent={N.amber} sheenAt={word}>
              <div style={{ position: "absolute", left: 40, top: 26, fontFamily: numFont, fontWeight: 800, fontSize: 30, color: N.muted, letterSpacing: 4 }}>NVIDIA · WEEKLY MEETING</div>
              <div style={{ position: "absolute", left: 40, top: 110, right: 40 }}>
                {["প্রতিটা মিটিং", "শুরু হতো", "একটা কথা দিয়ে…"].map((l, i) => (
                  <div key={l} style={{ fontFamily: headFont, fontWeight: 800, fontSize: 70, lineHeight: 1.35, color: i === 2 ? N.amber : N.ink, opacity: p01(frame, 6 + i * 12, 18 + i * 12), translate: `${(1 - p01(frame, 6 + i * 12, 18 + i * 12)) * 40}px 0` }}>
                    {l}
                  </div>
                ))}
              </div>
            </Glass>
          </AbsoluteFill>
        </Cam>
      </Film>
      <div style={{ position: "absolute", left: 220, top: 110 }}>
        <KText text="বহু বছর ধরে" at={years - 4} size={58} align="left" color={N.amber} />
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 7: the quote */
const QuoteBeat: React.FC<{ readonly marks: number[] }> = ({ marks }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const words = ["আমাদের", "কোম্পানি", "দেউলিয়া", "হওয়া", "থেকে", "মাত্র…"];
  const cross = interpolate(frame, [0, durationInFrames], [0, 26], clamp);
  return (
    <AbsoluteFill>
      <Plate id="dc" blur={14} dim={0.6} from={3} tint="#ff7070" />
      <Atmos seed="p2g" color={N.red} color2={N.amber} leak={0.4} />
      <Cam push={0.14} drift={[0, -20]} punch={[marks[2]]}>
        <AbsoluteFill style={{ perspective: 1600 }}>
          <div style={{ position: "absolute", left: 1170, top: 170, width: 620, transform: "rotateY(-20deg) rotateX(6deg)", display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
            {Array.from({ length: 30 }).map((_, i) => {
              const gone = i < cross;
              return (
                <div key={i} style={{ position: "relative", height: 84, borderRadius: 10, background: gone ? "rgba(60,8,8,0.75)" : "rgba(241,239,233,0.92)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: headFont, fontWeight: 800, fontSize: 32, color: gone ? "#7a2a2a" : "#1b1b1b" }}>
                  {bn(i + 1)}
                  {gone ? <div style={{ position: "absolute", fontSize: 64, color: N.red, fontFamily: numFont, fontWeight: 900, lineHeight: 1 }}>✕</div> : null}
                </div>
              );
            })}
          </div>
          <Glass style={{ left: 110, top: 220, width: 960, padding: "30px 46px 40px" }} accent={N.red}>
            <div style={{ fontFamily: numFont, fontWeight: 900, fontSize: 120, color: N.red, lineHeight: 0.6, height: 50 }}>“</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0 22px" }}>
              {words.map((w, i) => {
                const k = p01(frame, marks[i] - 3, marks[i] + 6);
                return (
                  <span key={w} style={{ fontFamily: headFont, fontWeight: 800, fontSize: 76, lineHeight: 1.4, color: i === 2 ? N.red : N.ink, opacity: k, translate: `0 ${(1 - k) * 30}px`, filter: k < 1 ? `blur(${(1 - k) * 6}px)` : undefined }}>
                    {w}
                  </span>
                );
              })}
            </div>
            <div style={{ fontFamily: headFont, fontWeight: 600, fontSize: 32, color: N.muted, marginTop: 18 }}>— জেনসেন হুয়াং, মিটিংয়ের শুরুতে</div>
          </Glass>
        </AbsoluteFill>
      </Cam>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 8: ৩০ দিন slam */
const ThirtyDays: React.FC<{ readonly hit: number }> = ({ hit }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const ring = interpolate(frame, [hit, durationInFrames], [1, 0.82], clamp);
  const R = 300;
  const C = 2 * Math.PI * R;
  const sc = frame >= hit ? 1 + 0.5 * Math.exp(-(frame - hit) / 4) : 0;
  return (
    <AbsoluteFill>
      <Plate id="dc" blur={22} dim={0.7} from={5} tint="#ff5050" />
      <Atmos seed="p2h" color={N.red} leak={0.5} />
      <Cam push={0.1} shakeAt={[hit]}>
        <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
          <defs>
            <filter id="p2rg">
              <feGaussianBlur stdDeviation="12" />
            </filter>
          </defs>
          <g transform="translate(960 440) rotate(-90)">
            <circle r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={22} />
            <circle r={R} fill="none" stroke={N.red} strokeWidth={22} strokeDasharray={`${ring * C} ${C}`} filter="url(#p2rg)" />
            <circle r={R} fill="none" stroke="#ff8080" strokeWidth={10} strokeDasharray={`${ring * C} ${C}`} />
          </g>
        </svg>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 200 }}>
          <div style={{ scale: `${sc}`, textAlign: "center" }}>
            <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 230, color: "#fff", lineHeight: 1.2, textShadow: `0 0 80px ${N.red}, 0 10px 40px #000`, WebkitTextStroke: `3px ${N.red}` }}>৩০ দিন</div>
            <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 60, color: N.ink, lineHeight: 1.3, marginTop: -10, textShadow: "0 4px 20px #000" }}>
              দেউলিয়া হওয়া থেকে <span style={{ color: N.red }}>মাত্র ৩০ দিন দূরে</span>
            </div>
          </div>
        </AbsoluteFill>
      </Cam>
      <HitFlash at={hit} color="#ff8080" />
      {frame >= hit && frame < hit + 6 ? <GlitchBars amount={1 - (frame - hit) / 6} /> : null}
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- timeline strip (beats 9–11) */
const Timeline: React.FC<{ readonly draw: number; readonly lit: number[] }> = ({ draw, lit }) => {
  const frame = useCurrentFrame();
  const ys = ["1999", "2006", "2012"];
  const lbl = ["প্রথম GPU", "CUDA", "AI"];
  return (
    <Glass style={{ left: 260, top: 40, width: 1400, height: 130 }} accent={N.green}>
      <div style={{ position: "absolute", left: 120, right: 120, top: 46, height: 6, background: "rgba(255,255,255,0.1)" }}>
        <div style={{ width: `${draw * 100}%`, height: "100%", background: `linear-gradient(90deg, ${N.green}, ${N.greenHi})`, boxShadow: `0 0 16px ${N.green}` }} />
      </div>
      {ys.map((y, i) => {
        const on = frame >= lit[i];
        const pop = on ? 1 + 0.4 * Math.exp(-(frame - lit[i]) / 4) : 1;
        return (
          <div key={y} style={{ position: "absolute", left: 120 + i * 580 - 60, top: 20, width: 120, textAlign: "center", opacity: p01(frame, 0, 12) }}>
            <div style={{ width: 30, height: 30, margin: "0 auto", borderRadius: 15, background: on ? N.greenHi : "#2a3030", border: `3px solid ${on ? "#fff" : "rgba(255,255,255,0.3)"}`, boxShadow: on ? `0 0 26px ${N.greenHi}` : undefined, scale: `${pop}` }} />
            <div style={{ fontFamily: numFont, fontWeight: 900, fontSize: 34, color: on ? N.ink : N.muted, marginTop: 4 }}>{y}</div>
            <div style={{ position: "absolute", left: 140, top: 36, whiteSpace: "nowrap", fontFamily: /[A-Z]/.test(lbl[i][0]) ? numFont : headFont, fontWeight: 800, fontSize: 30, color: N.greenHi, opacity: on ? 1 : 0, textAlign: "left" }}>
              {lbl[i]}
            </div>
          </div>
        );
      })}
    </Glass>
  );
};

const FirstGpu: React.FC<{ readonly turns: number; readonly y99: number; readonly first: number }> = ({ turns, y99, first }) => {
  const frame = useCurrentFrame();
  const draw = p01(frame, turns - 6, turns + 20, ease.inOut);
  const k = p01(frame, first - 4, first + 10);
  return (
    <AbsoluteFill>
      <Plate id="card" blur={16} dim={0.6} from={1} />
      <Atmos seed="p2i" />
      <Cam push={0.1} drift={[-30, -10]} punch={[y99, first]}>
        <PhotoCard src="nvidia/img/geforce256.jpg" x={250} y={300} w={760} h={470} at={y99} rot={-4} caption="GeForce 256 · ১৯৯৯" />
        <PhotoCard src="nvidia/img/nv10_chip.jpg" x={1080} y={250} w={460} h={420} at={y99 + 8} rot={5} tape={false} />
        <Glass style={{ left: 1180, top: 700, padding: "8px 34px 16px", opacity: k, scale: `${0.8 + 0.2 * k}` }} accent={N.green} sheenAt={first}>
          <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 62, color: N.ink, lineHeight: 1.3 }}>
            প্রথম <span style={{ fontFamily: numFont, fontWeight: 900, color: N.greenHi }}>GPU</span>
          </div>
        </Glass>
      </Cam>
      <Timeline draw={draw * 0.33} lit={[y99, 1e9, 1e9]} />
      {frame < y99 ? (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <KText text="তারপর তিনটা মোড়" at={0} size={92} />
          <div style={{ display: "flex", gap: 40, marginTop: 30 }}>
            {["1999", "2006", "2012"].map((y, i) => {
              const kk = p01(frame, 6 + i * 5, 18 + i * 5);
              return (
                <Glass key={y} style={{ position: "relative", padding: "10px 40px 14px", opacity: kk, translate: `0 ${(1 - kk) * 40}px` }} accent={N.green}>
                  <div style={{ fontFamily: numFont, fontWeight: 900, fontSize: 64, color: N.ink }}>{y}</div>
                </Glass>
              );
            })}
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

const CODE = [
  "// CUDA — 2006",
  "__global__ void add(float *a, float *b) {",
  "    int i = threadIdx.x;",
  "    a[i] = a[i] + b[i];",
  "}",
  "",
  "add<<<1, 1000>>>(a, b);",
  "// 1000 threads, all at once",
  "$ nvcc add.cu && ./add",
  "> done on GPU ✓",
];
const CudaBeat: React.FC<{ readonly cuda: number; readonly soft: number }> = ({ cuda, soft }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const total = CODE.join("\n").length;
  const n = Math.floor(interpolate(frame, [4, durationInFrames - 20], [0, total], clamp));
  let left = n;
  const k = p01(frame, cuda - 4, cuda + 8);
  const s = p01(frame, soft - 4, soft + 8);
  return (
    <AbsoluteFill>
      <Plate id="tray" from={1} rate={0.8} dim={0.35} drift={0.12} />
      {/* code rain */}
      <AbsoluteFill style={{ mixBlendMode: "screen", opacity: 0.55 }}>
        {Array.from({ length: 34 }).map((_, i) => {
          const sp = 6 + random(`rs${i}`) * 10;
          const y = ((frame * sp + random(`ry${i}`) * 1400) % 1500) - 400;
          return (
            <div key={i} style={{ position: "absolute", left: i * 57, top: y, fontFamily: "Consolas, monospace", fontSize: 22, lineHeight: 1.1, color: N.greenHi, width: 20, wordBreak: "break-all", opacity: 0.4 + random(`ro${i}`) * 0.6, textShadow: `0 0 8px ${N.green}` }}>
              {Array.from({ length: 14 }).map((_, j) => "01{}[];<>=+*"[Math.floor(random(`rc${i}-${j}-${Math.floor(frame / 4)}`) * 12)]).join("")}
            </div>
          );
        })}
      </AbsoluteFill>
      <Atmos seed="p2j" bokeh={10} leak={0.35} />
      <Cam push={0.12} drift={[30, -10]} punch={[cuda]}>
        <AbsoluteFill style={{ perspective: 1500 }}>
          <Glass style={{ left: 300, top: 230, width: 1000, height: 600, transform: `rotateY(${interpolate(frame, [0, durationInFrames], [16, 6], clamp)}deg) rotateX(4deg)`, background: "rgba(4,8,6,0.82)" }} accent={N.green}>
            <div style={{ height: 50, display: "flex", alignItems: "center", gap: 12, paddingLeft: 22, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                <div key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c }} />
              ))}
              <div style={{ fontFamily: numFont, fontSize: 22, color: N.muted, marginLeft: 16 }}>add.cu</div>
            </div>
            <div style={{ padding: "18px 30px", fontFamily: "Consolas, 'Courier New', monospace", fontSize: 34, lineHeight: 1.42, whiteSpace: "pre" }}>
              {CODE.map((l, i) => {
                const show = l.slice(0, Math.max(0, left));
                left -= l.length + 1;
                const col = l.startsWith("//") ? "#6a9955" : l.startsWith("$") || l.startsWith(">") ? N.greenHi : i === 6 ? N.amber : "#d8e2dc";
                return (
                  <div key={i} style={{ color: col, minHeight: 48 }}>
                    {show}
                    {left < 0 && left > -l.length - 2 && frame % 16 < 8 ? <span style={{ color: N.greenHi }}>▍</span> : null}
                  </div>
                );
              })}
            </div>
          </Glass>
        </AbsoluteFill>
      </Cam>
      <Timeline draw={0.33 + 0.33 * p01(frame, 0, 16, ease.inOut)} lit={[-100, 6, 1e9]} />
      <div style={{ position: "absolute", left: 1380, top: 330, opacity: k, scale: `${1.4 - 0.4 * k}`, fontFamily: numFont, fontWeight: 900, fontSize: 150, color: "#fff", textShadow: `0 0 60px ${N.green}, 0 8px 30px #000` }}>CUDA</div>
      <Glass style={{ left: 1400, top: 540, padding: "8px 30px 14px", opacity: s, translate: `${(1 - s) * 40}px 0` }} accent={N.green}>
        <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 52, color: N.ink, lineHeight: 1.3 }}>একটা সফটওয়্যার</div>
      </Glass>
      <HitFlash at={cuda} color={N.greenHi} />
    </AbsoluteFill>
  );
};

const SCI = [
  { t: "আবহাওয়ার পূর্বাভাস", e: "🌦️" },
  { t: "ওষুধ গবেষণা", e: "💊" },
  { t: "মহাকাশ", e: "🔭" },
  { t: "জিন বিশ্লেষণ", e: "🧬" },
  { t: "পদার্থবিজ্ঞান", e: "⚛️" },
];
const Science: React.FC<{ readonly game: number; readonly sci: number }> = ({ game, sci }) => {
  const frame = useCurrentFrame();
  const g = p01(frame, 0, 10);
  return (
    <AbsoluteFill>
      <Plate id="chipmacro" blur={8} dim={0.5} from={4} drift={0.12} />
      <Atmos seed="p2k" color2={N.cyan} />
      <Cam push={0.12} drift={[0, -10]} punch={[sci]}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <Glass style={{ position: "relative", padding: "14px 40px 22px", opacity: g, scale: `${0.8 + 0.2 * g}`, marginTop: 60 }} accent={N.green} sheenAt={game}>
            <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 70, color: N.ink, lineHeight: 1.3 }}>
              <span style={{ color: N.greenHi }}>গেমের চিপ</span> দিয়ে
            </div>
          </Glass>
        </AbsoluteFill>
        {SCI.map((s, i) => {
          const k = p01(frame, sci - 4 + i * 3, sci + 6 + i * 3);
          const ang = -Math.PI / 2 + (i - 2) * 0.95 + Math.PI;
          const x = 960 + Math.cos(ang) * 620 * k;
          const y = 500 + Math.sin(ang) * 290 * k;
          return (
            <Glass key={s.t} style={{ left: x - 200, top: y - 50, width: 400, padding: "10px 20px 16px", display: "flex", alignItems: "center", gap: 16, opacity: k, scale: `${0.5 + 0.5 * k}` }} accent={N.cyan}>
              <div style={{ fontSize: 48 }}>{s.e}</div>
              <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 38, color: N.ink, lineHeight: 1.3 }}>{s.t}</div>
            </Glass>
          );
        })}
      </Cam>
      <div style={{ position: "absolute", top: 40, width: "100%" }}>
        {frame >= sci - 4 ? <KText text="বিজ্ঞানীদের অন্য হিসাবও" at={sci - 4} size={58} color={N.cyan} /> : null}
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 12: 2012 — two gaming cards (live 3D) */
const TwoCards: React.FC<{ readonly res: number; readonly two: number }> = ({ res, two }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = interpolate(frame, [0, durationInFrames], [0, 1], { ...clamp, easing: ease.inOut });
  const target: V3 = [0, 7, 0];
  const r = 108 - t * 22;
  const cam = { pos: orbit(target, r, 22 - t * 10, -0.75 + t * 0.6), target, mm: 50, focus: r, range: 40 };
  const glow = p01(frame, two - 6, two + 6);
  const k = p01(frame, two - 4, two + 8);
  return (
    <AbsoluteFill>
      <Studio camera={cam} size={40}>
        <GraphicsCard position={[-17.5, 7.1, -3]} rotation={[0, 0.18, 0]} fanSpeed={0.5 + 3 * glow} accent={0.3 + 0.7 * glow} />
        <GraphicsCard position={[17.5, 7.1, 3]} rotation={[0, 0.18, 0]} fanSpeed={0.5 + 3 * glow} accent={0.3 + 0.7 * glow} />
      </Studio>
      <Atmos seed="p2l" bokeh={10} leak={0.35} />
      <div style={{ position: "absolute", left: 96, top: 60, opacity: p01(frame, 0, 10), scale: `${1.3 - 0.3 * p01(frame, 0, 12)}`, transformOrigin: "left top" }}>
        <div style={{ fontFamily: numFont, fontWeight: 900, fontSize: 150, color: "#fff", lineHeight: 1, letterSpacing: -4, textShadow: `0 0 40px ${N.green}88, 0 10px 40px #000` }}>2012</div>
      </div>
      <div style={{ position: "absolute", left: 96, top: 230, width: 800 }}>
        <KText text="একদল গবেষক" at={res - 4} size={58} align="left" />
      </div>
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 230 }}>
        <Glass style={{ position: "relative", padding: "10px 46px 20px", opacity: k, scale: `${0.8 + 0.2 * k + 0.2 * Math.exp(-Math.max(0, frame - two) / 4) * (frame >= two ? 1 : 0)}` }} accent={N.green} sheenAt={two}>
          <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 76, color: N.ink, lineHeight: 1.3 }}>
            মাত্র <span style={{ color: N.greenHi }}>২টি গেমিং কার্ড</span>
          </div>
        </Glass>
      </AbsoluteFill>
      <HitFlash at={two} color={N.greenHi} />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 13: AI recognises images */
const TILES = [
  { src: "nvidia/img/professor.jpg", t: "মানুষ", pos: "75% 30%" },
  { src: "nvidia/img/rtx3090.jpg", t: "গ্রাফিক্স কার্ড", pos: "center" },
  { src: "nvidia/img/hq.jpg", t: "ভবন", pos: "center" },
  { src: "nvidia/img/dennys_sign.jpg", t: "সাইনবোর্ড", pos: "30% 40%" },
  { src: "nvidia/img/dc_racks.jpg", t: "সার্ভার", pos: "center" },
  { src: "nvidia/img/campus_aerial.jpg", t: "শহর", pos: "center 70%" },
  { src: "nvidia/img/diner_booth.jpg", t: "টেবিল", pos: "center" },
  { src: "nvidia/img/geforce256.jpg", t: "সার্কিট বোর্ড", pos: "center" },
  { src: "nvidia/img/jensen_stage1.jpg", t: "ভিড়", pos: "center" },
];
const AiEye: React.FC<{ readonly ai: number; readonly pic: number; readonly win: number }> = ({ ai, pic, win }) => {
  const frame = useCurrentFrame();
  const open = p01(frame, ai - 6, ai + 10);
  const st = p01(frame, win, win + 7);
  const scanY = 200 + ((frame * 9) % 540);
  return (
    <AbsoluteFill>
      <Plate id="dc" blur={16} dim={0.6} from={2} />
      <Atmos seed="p2m" color2={N.cyan} />
      <Cam push={0.1} drift={[-30, 0]} punch={[pic]} shakeAt={[win]}>
        {/* glass AI core with spinning rings */}
        <div style={{ position: "absolute", left: 240, top: 290, width: 360, height: 360, opacity: open, scale: `${0.7 + 0.3 * open}` }}>
          {[0, 1, 2].map((r) => (
            <div
              key={r}
              style={{
                position: "absolute",
                inset: -r * 46,
                borderRadius: "50%",
                border: `${3 - r}px ${r === 1 ? "dashed" : "solid"} ${N.greenHi}`,
                opacity: 0.7 - r * 0.2,
                rotate: `${(r % 2 ? -1 : 1) * frame * (2 + r)}deg`,
                boxShadow: r === 0 ? `0 0 40px ${N.green}88, inset 0 0 40px ${N.green}55` : undefined,
              }}
            />
          ))}
          <div
            style={{
              position: "absolute",
              inset: 30,
              borderRadius: "50%",
              background: `radial-gradient(circle at 35% 30%, ${N.greenHi}, ${N.green} 45%, #0a1a00 100%)`,
              boxShadow: `0 0 80px ${N.green}, inset 0 -20px 40px rgba(0,0,0,0.5)`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontFamily: numFont,
              fontWeight: 900,
              fontSize: 110,
              color: "#0a1200",
              scale: `${1 + 0.04 * Math.sin(frame / 4)}`,
            }}
          >
            AI
          </div>
        </div>
        <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
          <path d={`M600 470 L1010 ${scanY - 60} L1010 ${scanY + 60} Z`} fill={N.greenHi} opacity={0.12 * open} />
        </svg>
        <AbsoluteFill style={{ perspective: 1500 }}>
          <div style={{ position: "absolute", left: 1010, top: 160, width: 760, transform: "rotateY(-14deg)", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
            {TILES.map((tl, i) => {
              const tag = frame >= pic + i * 3;
              return (
                <div key={tl.t} style={{ position: "relative", height: 186, borderRadius: 16, background: "linear-gradient(145deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03))", border: `2px solid ${tag ? N.greenHi : "rgba(255,255,255,0.15)"}`, boxShadow: tag ? `0 0 24px ${N.green}88` : "0 20px 40px rgba(0,0,0,0.5)", overflow: "hidden", opacity: p01(frame, i * 2, i * 2 + 10) }}>
                  <Img src={staticFile(tl.src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: tl.pos, filter: tag ? "none" : "grayscale(0.6) brightness(0.7)" }} />
                  {tag ? <div style={{ position: "absolute", inset: 10, border: `3px solid ${N.greenHi}`, borderRadius: 8 }} /> : null}
                  {tag ? (
                    <div style={{ position: "absolute", left: 8, top: 8, background: N.green, color: "#081000", fontFamily: headFont, fontWeight: 800, fontSize: 26, padding: "0 12px 4px", borderRadius: 8, lineHeight: 1.35 }}>
                      {tl.t} ✓
                    </div>
                  ) : null}
                </div>
              );
            })}
            <div style={{ position: "absolute", left: -10, right: -10, top: scanY - 170, height: 4, background: N.greenHi, boxShadow: `0 0 20px ${N.greenHi}`, opacity: 0.8 * open }} />
          </div>
        </AbsoluteFill>
      </Cam>
      <div style={{ position: "absolute", left: 96, top: 60, width: 900 }}>
        <KText text="ছবি চেনার AI" at={ai - 6} size={66} align="left" />
      </div>
      {frame >= win ? (
        <div style={{ position: "absolute", left: 1080, top: 380, rotate: "-9deg", opacity: st, scale: `${2.2 - 1.2 * st}`, border: `8px solid ${N.greenHi}`, borderRadius: 16, padding: "0 30px 12px", background: "rgba(10,30,0,0.8)", fontFamily: headFont, fontWeight: 800, fontSize: 84, color: N.greenHi, textShadow: `0 0 30px ${N.green}`, lineHeight: 1.3 }}>
          সবাইকে হারিয়ে ১ নম্বর
        </div>
      ) : null}
      <HitFlash at={win} color={N.greenHi} />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 14: the race starts, 2012 → 2022 */
const Race: React.FC<{ readonly run: number; readonly land: number }> = ({ run, land }) => {
  const frame = useCurrentFrame();
  const sp = p01(frame, run - 6, run + 10, ease.in);
  return (
    <AbsoluteFill>
      <Plate id="dc" from={0} rate={1 + 2 * sp} blur={4 + 10 * sp} dim={0.45} drift={0.3} />
      <AbsoluteFill style={{ mixBlendMode: "screen" }}>
        {Array.from({ length: 40 }).map((_, i) => {
          const y = random(`ly${i}`) * 1080;
          const len = 200 + random(`ll${i}`) * 600;
          const x = 2000 - (((frame * (40 + 80 * sp) * (0.5 + random(`lv${i}`))) + random(`lx${i}`) * 2400) % 2800);
          return <div key={i} style={{ position: "absolute", left: x, top: y, width: len, height: 2 + random(`lh${i}`) * 3, background: `linear-gradient(90deg, transparent, ${i % 3 ? "#fff" : N.greenHi})`, opacity: 0.2 + 0.6 * sp }} />;
        })}
      </AbsoluteFill>
      <Atmos seed="p2n" />
      <Cam push={0.25} punch={[run]}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 140 }}>
          <KText text="আধুনিক AI-এর দৌড় শুরু" at={2} size={92} />
          <div style={{ fontFamily: numFont, fontWeight: 900, fontSize: 200, color: "#fff", letterSpacing: -4, lineHeight: 1, opacity: p01(frame, run - 4, run + 4), textShadow: `0 0 60px ${N.green}, 0 10px 40px #000`, filter: frame < land ? "blur(1.5px)" : undefined }}>
            <Counter from={2012} to={2022} a={run} b={land} style={{ fontWeight: 900 }} />
          </div>
        </AbsoluteFill>
      </Cam>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 15: ChatGPT arrives */
const REPLY = "হ্যালো! আমি ChatGPT। কী জানতে চান?";
const ChatGpt: React.FC<{ readonly gpt: number }> = ({ gpt }) => {
  const frame = useCurrentFrame();
  const k = p01(frame, 0, 14);
  const n = Math.floor(interpolate(frame, [6, 34], [0, REPLY.length], clamp));
  return (
    <AbsoluteFill>
      <Plate id="dc" blur={14} dim={0.55} from={4} />
      <Atmos seed="p2o" />
      <Cam push={0.12} drift={[0, -20]} punch={[gpt]}>
        <AbsoluteFill style={{ perspective: 1400 }}>
          <Glass style={{ left: 560, top: 230, width: 800, height: 520, transform: `rotateX(${(1 - k) * 40 + 6}deg) scale(${0.7 + 0.3 * k})`, opacity: k }} accent={N.green} sheenAt={gpt}>
            <div style={{ padding: "22px 34px", fontFamily: numFont, fontWeight: 800, fontSize: 34, color: N.ink, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
              <span style={{ color: N.greenHi }}>●</span> ChatGPT <span style={{ color: N.muted, fontSize: 24, fontWeight: 500 }}>· নভেম্বর ২০২২</span>
            </div>
            <div style={{ position: "absolute", left: 34, top: 130, maxWidth: 640, background: "#1d242a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "26px 26px 26px 6px", padding: "14px 26px 20px", fontFamily: headFont, fontWeight: 700, fontSize: 42, color: N.ink, lineHeight: 1.4, opacity: n ? 1 : 0 }}>
              {REPLY.slice(0, n)}
              {n < REPLY.length ? <span style={{ color: N.greenHi }}>▍</span> : null}
            </div>
          </Glass>
        </AbsoluteFill>
      </Cam>
      <div style={{ position: "absolute", left: 96, top: 60 }}>
        <div style={{ fontFamily: numFont, fontWeight: 900, fontSize: 130, color: "#fff", lineHeight: 1, letterSpacing: -4, textShadow: `0 0 40px ${N.green}88, 0 10px 40px #000` }}>2022</div>
      </div>
      <HitFlash at={gpt} color={N.greenHi} />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 16: everyone queues */
const CO = ["Microsoft", "Google", "Meta", "Amazon", "Oracle", "Tesla", "OpenAI"];
const Queue: React.FC<{ readonly world: number; readonly line: number }> = ({ world, line }) => {
  const frame = useCurrentFrame();
  const k = p01(frame, line - 4, line + 8);
  return (
    <AbsoluteFill>
      <Plate id="dc" from={1} rate={0.9} drift={0.16} dim={0.15} />
      <Atmos seed="p2p" bokeh={14} leak={0.35} />
      <Cam push={0.08} drift={[-30, 0]} punch={[line]}>
        {/* counter */}
        <Glass style={{ left: 1490, top: 330, width: 330, height: 330, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }} accent={N.green} sheenAt={world}>
          <div style={{ fontFamily: numFont, fontWeight: 900, fontSize: 66, color: "#fff", letterSpacing: 2, textShadow: `0 0 30px ${N.green}` }}>NVIDIA</div>
          <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 40, color: N.greenHi, lineHeight: 1.3 }}>চিপ</div>
          <div style={{ width: 200, height: 6, borderRadius: 3, background: N.greenHi, marginTop: 14, opacity: 0.6 + 0.4 * Math.sin(frame / 4), boxShadow: `0 0 20px ${N.greenHi}` }} />
        </Glass>
        {CO.map((c, i) => {
          const enter = p01(frame, world + i * 4, world + i * 4 + 22, ease.out);
          const x = -320 + enter * (1270 - i * 190);
          const bob = Math.abs(Math.sin(frame / 4 + i)) * -10 * (enter < 1 ? 1 : 0.4);
          return (
            <Glass key={c} style={{ left: x, top: 440 + bob, width: 176, height: 150, display: "flex", justifyContent: "center", alignItems: "center", opacity: Math.min(1, enter * 3) }} accent={N.cyan}>
              <div style={{ fontFamily: numFont, fontWeight: 800, fontSize: c.length > 7 ? 26 : 32, color: N.ink, textAlign: "center" }}>{c}</div>
            </Glass>
          );
        })}
      </Cam>
      <div style={{ position: "absolute", top: 70, width: "100%" }}>
        <KText text="পৃথিবীর সব বড় কোম্পানি" at={world - 6} size={64} />
      </div>
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 240 }}>
        <div style={{ opacity: k, scale: `${1.4 - 0.4 * k}`, fontFamily: headFont, fontWeight: 800, fontSize: 72, color: N.greenHi, textShadow: `0 0 40px ${N.green}, 0 6px 26px #000`, lineHeight: 1.3 }}>লাইনে দাঁড়াল!</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- assembly */
export const P2Scene: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  const at = useAt(P2_ID);
  const f = (s: number) => Math.round(s * fps);

  const bBooth = f(at("তিনজন") - 0.2);
  const bJen = f(at("তাদের") - 0.1);
  const bDive = f(at("শুরুটা") - 0.15);
  const bCut = f(at("অর্ধেকের") - 0.3);
  const bMeet = f(at("তখন") - 0.15);
  const bQuote = f(at("আমাদের") - 0.15);
  const b30 = f(at("তিরিশ") - 0.1);
  const bTurn = f(at("তারপর") - 0.1);
  const bCuda = f(at("২০০৬") - 0.15);
  const bSci = f(at("এর") - 0.1);
  const b2012 = f(at("আর", 0) - 0.1);
  const bEye = f(at("AI") - 0.3);
  const bRace = f(at("সেদিন") - 0.15);
  const bGpt = f(at("২০২২") - 0.05);
  const bQ = f(at("তখন", 1) - 0.15);

  const qm = [at("আমাদের"), at("কোম্পানি", 1), at("দেউলিয়া"), at("হওয়া"), at("থেকে", 1), at("মাত্র")].map((s) => f(s) - bQuote);

  const beats: Beat[] = [
    { at: 0, name: "1993 street", node: <Street place={f(at("স্যান"))} diner={f(at("রেস্টুরেন্ট"))} /> },
    { at: bBooth, trans: "zoom", name: "booth", node: <BoothBeat three={f(at("তিনজন")) - bBooth} company={f(at("কোম্পানি")) - bBooth} /> },
    { at: bJen, trans: "blur", name: "jensen", node: <JensenBeat one={f(at("একজন")) - bJen} name={f(at("জেনসেন")) - bJen} /> },
    { at: bDive, trans: "glitch", name: "1996 dive", node: <Dive y96={f(at("১৯৯৬")) - bDive} /> },
    { at: bCut, trans: "whip", name: "layoffs", node: <Layoff cut={f(at("ছাঁটাই")) - bCut} /> },
    { at: bMeet, trans: "slideUp", name: "meetings", node: <Meetings years={f(at("বহু")) - bMeet} word={f(at("কথা")) - bMeet} /> },
    { at: bQuote, trans: "zoom", name: "quote", node: <QuoteBeat marks={qm} /> },
    { at: b30, trans: "flash", name: "30 days", node: <ThirtyDays hit={f(at("তিরিশ")) - b30} /> },
    { at: bTurn, trans: "whipL", name: "1999", node: <FirstGpu turns={f(at("তিনটা")) - bTurn} y99={f(at("১৯৯৯")) - bTurn} first={f(at("প্রথম")) - bTurn} /> },
    { at: bCuda, trans: "whip", name: "cuda", node: <CudaBeat cuda={f(at("কুডা")) - bCuda} soft={f(at("সফটওয়্যার")) - bCuda} /> },
    { at: bSci, trans: "zoom", name: "science", node: <Science game={f(at("গেমের")) - bSci} sci={f(at("বিজ্ঞানীরা")) - bSci} /> },
    { at: b2012, trans: "whip", name: "2012 cards", node: <TwoCards res={f(at("গবেষক")) - b2012} two={f(at("দুটো")) - b2012} /> },
    { at: bEye, trans: "glitch", name: "ai eye", node: <AiEye ai={f(at("AI")) - bEye} pic={f(at("ছবি")) - bEye} win={f(at("হারিয়ে")) - bEye} /> },
    { at: bRace, trans: "zoom", name: "race", node: <Race run={f(at("দৌড়")) - bRace} land={bGpt - bRace} /> },
    { at: bGpt, trans: "flash", name: "chatgpt", node: <ChatGpt gpt={f(at("চ্যাটজিপিটি")) - bGpt} /> },
    { at: bQ, trans: "whip", name: "queue", node: <Queue world={f(at("পৃথিবীর")) - bQ} line={f(at("লাইনে")) - bQ} /> },
  ];

  return (
    <AbsoluteFill style={{ background: N.bg }}>
      <Beats beats={beats} end={durationInFrames} />
    </AbsoluteFill>
  );
};
