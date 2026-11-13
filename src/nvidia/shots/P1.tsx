/**
 * P1 v2 — what Nvidia makes (26.7 → 61.6 s). 3D plates behind everything, a transition on every cut,
 * camera always moving, every hit keyed to the spoken word:
 *  1 "কম্পিউটারের মগজ হলো সিপিইউ"           glass CPU chip over the chip-macro plate, CPU slams
 *  2 "ধরুন একজন প্রফেসর … একটা একটা করে"      documentary desk: professor at a tilted chalkboard, sums one by one
 *  3 "এনভিডিয়া বানায় জিপিইউ … হাজার জন"        1000 students ripple into a glass wall, counter rolls to 1,000
 *  4 "প্রত্যেকে ছোট একটা হিসাব … সবাই একসাথে"   push into their sum cards, CPU vs GPU race, all solve at once
 *  5 "শুরুতে … গেমের জন্য"                    real 3D gaming card plate, controller tag
 *  6 "স্ক্রিনের লক্ষ লক্ষ বিন্দু একসাথে"        tilted monitor of pixels — all light at once
 *  7 "AI শেখানোর কাজটাও ঠিক এমন"              neural net over the chip plate, "গেম = AI"
 *  8 "কোটি কোটি ছোট হিসাব, একসাথে"            ops field flashes together
 *  9 "চ্যাটজিপিটির মতো বেশিরভাগ বড় AI"          chat window over the data centre
 * 10 "চলে এনভিডিয়ার চিপে"                     AI apps fly into the glowing die
 * 11 "৭৫ থেকে ৯০ শতাংশ"                      glass donut 75 → 90 %
 */
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { Atmos, Beats, Cam, Counter, DocBg, Glass, GlitchBars, HitFlash, KText, Marker, Plate, p01, type Beat } from "../kit";
import { N, clamp, ease, headFont, numFont } from "../theme";
import { Pad, Professor, Student } from "../two/P1_figs";
import type { Cue } from "../types";
import { useAt } from "../vo";

export const P1_ID = "P1";
export const P1_KEYWORDS = ["সিপিইউ।", "প্রফেসর।", "জিপিইউ।", "হাজার", "একসাথে।", "গেমের", "চিপে।", "৭৫", "৯০"];

export const P1_CUES: Cue[] = [
  { sfx: "impact", word: "সিপিইউ" },
  { sfx: "whoosh", word: "ধরুন", offset: -0.25 },
  { sfx: "power_on", word: "জিপিইউ", offset: -0.1 },
  { sfx: "shimmer", word: "একসাথে" },
  { sfx: "whoosh_big", word: "শুরুতে", offset: -0.25 },
  { sfx: "data_stream", word: "একসাথে", nth: 1, offset: -0.1 },
  { sfx: "whoosh", word: "পরে", offset: -0.15, volume: 0.7 },
  { sfx: "bass_drop", word: "একসাথে", nth: 2 },
  { sfx: "power_on", word: "চিপে", offset: -0.3 },
  { sfx: "riser_short", word: "৭৫", offset: -0.6, volume: 0.8 },
  { sfx: "impact_deep", word: "৭৫" },
];

/* ---------------------------------------------------------------- 1: CPU = the brain */
const CpuBrain: React.FC<{ readonly brain: number; readonly cpu: number }> = ({ brain, cpu }) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const c = p01(frame, cpu, cpu + 10);
  const tilt = interpolate(frame, [0, 100], [28, 8], { ...clamp, easing: ease.out });
  const traces = Array.from({ length: 14 }, (_, i) => {
    const side = i % 2 ? 1 : -1;
    const y = 140 + Math.floor(i / 2) * 60;
    return { d: `M${side < 0 ? -200 : 2120} ${y + side * 40} L${side < 0 ? 420 : 1500} ${y + side * 40} L${side < 0 ? 560 : 1360} ${y} L${side < 0 ? 760 : 1160} ${y}`, ph: random(`t${i}`) };
  });
  return (
    <AbsoluteFill>
      <Plate id="chipmacro" blur={12} dim={0.6} from={1} />
      <Atmos seed="p1a" leak={0.5} />
      <Cam push={0.14} drift={[-30, -16]} punch={[cpu]} shakeAt={[cpu]}>
        <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
          <defs>
            <filter id="p1tg">
              <feGaussianBlur stdDeviation="5" />
            </filter>
          </defs>
          {traces.map((tr, i) => (
            <g key={i}>
              <path d={tr.d} stroke="rgba(166,242,42,0.18)" strokeWidth={3} fill="none" />
              <path d={tr.d} stroke={N.greenHi} strokeWidth={6} fill="none" pathLength={1} strokeDasharray="0.1 0.9" strokeDashoffset={-((t * 0.8 + tr.ph) % 1)} filter="url(#p1tg)" />
            </g>
          ))}
        </svg>
        <AbsoluteFill style={{ perspective: 1400, justifyContent: "center", alignItems: "center" }}>
          <div style={{ transform: `rotateX(${tilt}deg) rotateZ(${-tilt * 0.4}deg)`, marginTop: 30 }}>
            <Glass style={{ position: "relative", width: 440, height: 440, borderRadius: 34 }} accent={N.green} sheenAt={cpu}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i}>
                  {[0, 1].map((s) => (
                    <div key={s} style={{ position: "absolute", left: 60 + i * 44, top: s ? 418 : 0, width: 14, height: 22, background: "linear-gradient(#e7c66a,#9c7a25)", borderRadius: 3 }} />
                  ))}
                  {[0, 1].map((s) => (
                    <div key={s} style={{ position: "absolute", top: 60 + i * 44, left: s ? 418 : 0, height: 14, width: 22, background: "linear-gradient(90deg,#e7c66a,#9c7a25)", borderRadius: 3 }} />
                  ))}
                </div>
              ))}
              <div
                style={{
                  position: "absolute",
                  inset: 70,
                  borderRadius: 18,
                  background: `radial-gradient(circle at 40% 35%, ${N.green}${c > 0 ? "88" : "22"}, #0b0f0a 75%)`,
                  border: `2px solid ${c > 0 ? N.greenHi : "rgba(255,255,255,0.15)"}`,
                  boxShadow: `0 0 ${80 * c}px ${N.green}, inset 0 0 40px rgba(0,0,0,0.8)`,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontFamily: numFont,
                  fontWeight: 900,
                  fontSize: 120,
                  color: "#fff",
                  opacity: 0.4 + 0.6 * c,
                  textShadow: `0 0 40px ${N.greenHi}`,
                  scale: `${1 + 0.25 * Math.exp(-Math.max(0, frame - cpu) / 5) * (frame >= cpu ? 1 : 0)}`,
                }}
              >
                CPU
              </div>
            </Glass>
          </div>
        </AbsoluteFill>
      </Cam>
      <div style={{ position: "absolute", top: 60, width: "100%" }}>
        <KText text="কম্পিউটারের মগজ" at={2} size={78} />
      </div>
      <Marker d="M1120 205 Q1230 190 1330 212" at={brain} color={N.greenHi} width={9} />
      <div style={{ position: "absolute", top: 760, width: "100%" }}>
        {frame >= cpu - 2 ? <KText text="= সিপিইউ" at={cpu - 2} size={70} color={N.greenHi} glow={`${N.green}aa`} stagger={2} /> : null}
      </div>
      <HitFlash at={cpu} color={N.greenHi} />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 2: professor */
const SUMS = ["27 × 43 = 1161", "318 ÷ 6 = 53", "√784 = 28", "45 × 19 = 855"];

const Chalk: React.FC<{ readonly frame: number; readonly start: number; readonly per: number; readonly fs: number }> = ({ frame, start, per, fs }) => (
  <>
    {SUMS.map((s, k) => {
      const a = start + k * per;
      const n = Math.floor(interpolate(frame, [a, a + per * 0.7], [0, s.length], clamp));
      return n > 0 ? (
        <div key={k} style={{ fontFamily: numFont, fontWeight: 700, fontSize: fs, color: "#eef2e6", lineHeight: 1.45, whiteSpace: "nowrap", textShadow: "0 0 6px rgba(255,255,255,0.35)" }}>
          {s.slice(0, n)}
          {frame > a + per * 0.75 ? <span style={{ color: N.greenHi, marginLeft: fs * 0.4 }}>✓</span> : null}
        </div>
      ) : null;
    })}
  </>
);

const ProfessorBeat: React.FC<{ readonly prof: number; readonly wise: number; readonly one: number }> = ({ prof, wise, one }) => {
  const frame = useCurrentFrame();
  const per = 30;
  const done = Math.max(0, Math.min(4, Math.floor((frame - 6 - per * 0.75) / per) + 1));
  const w = p01(frame, wise, wise + 10);
  return (
    <AbsoluteFill>
      <DocBg tint="#2a2416" spot={[45, 35]} />
      <Atmos seed="p1b" color={N.amber} color2="#ffcf8a" leak={0.4} bokeh={16} />
      <Cam push={0.12} drift={[-40, -10]} rot={-0.6} punch={[one]} origin="55% 45%">
        <AbsoluteFill style={{ perspective: 1600 }}>
          <div
            style={{
              position: "absolute",
              left: 620,
              top: 190,
              width: 1120,
              height: 560,
              transform: "rotateY(-14deg) rotateX(4deg)",
              transformOrigin: "0% 50%",
              background: "radial-gradient(ellipse at 40% 40%, #24463a, #0f2219 80%)",
              border: "20px solid #6a4526",
              borderRadius: 10,
              boxShadow: "0 50px 100px rgba(0,0,0,0.8), inset 0 0 90px rgba(0,0,0,0.55)",
              padding: "34px 60px",
            }}
          >
            <Chalk frame={frame} start={6} per={per} fs={66} />
            <div style={{ position: "absolute", right: 36, top: 24, textAlign: "right" }}>
              <div style={{ fontFamily: headFont, fontWeight: 600, fontSize: 30, color: "#c5d6c5", lineHeight: 1.3 }}>বাকি হিসাব</div>
              <div style={{ fontFamily: numFont, fontWeight: 900, fontSize: 60, color: N.amber, fontVariantNumeric: "tabular-nums" }}>{(10000 - done).toLocaleString("en-US")}</div>
            </div>
          </div>
        </AbsoluteFill>
        <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
          <defs>
            <radialGradient id="p1sh">
              <stop offset="0" stopColor="#000" stopOpacity="0.7" />
              <stop offset="1" stopColor="#000" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx={440} cy={850} rx={220} ry={30} fill="url(#p1sh)" />
          <Professor x={440} y={845} s={1.15} arm={frame / 18} />
        </svg>
        <div
          style={{
            position: "absolute",
            left: 150,
            top: 200,
            opacity: w,
            scale: `${0.6 + 0.4 * w}`,
            rotate: "-7deg",
            background: `linear-gradient(135deg, ${N.greenHi}, ${N.green})`,
            color: "#081000",
            fontFamily: headFont,
            fontWeight: 800,
            fontSize: 40,
            padding: "4px 24px 10px",
            borderRadius: 12,
            boxShadow: "0 14px 30px rgba(0,0,0,0.5)",
          }}
        >
          খুব জ্ঞানী
        </div>
      </Cam>
      <div style={{ position: "absolute", top: 50, width: "100%" }}>
        <KText text="CPU = একজন প্রফেসর" at={prof - 4} size={70} />
      </div>
      <div style={{ position: "absolute", left: 700, top: 770 }}>
        <KText text="একটা → একটা করে…" at={one} size={60} color={N.amber} align="left" />
      </div>
      <Marker d="M710 860 Q930 845 1180 858" at={one + 8} color={N.amber} width={7} />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 3/4: students */
const COLS = 40;
const ROWS = 25;
const GW = 1180;
const GH = 600;
const STUDENTS = Array.from({ length: COLS * ROWS }, (_, i) => {
  const c = i % COLS;
  const r = Math.floor(i / COLS);
  const a = 1 + Math.floor(random(`sa${i}`) * 8);
  const b = 1 + Math.floor(random(`sb${i}`) * 8);
  return { x: (c + 0.5) * (GW / COLS), y: (r + 0.7) * (GH / ROWS), d: Math.hypot(c - COLS / 2, (r - ROWS / 2) * 1.6) / 24, a, b, j: random(`sj${i}`) };
});

const Grid: React.FC<{ readonly frame: number; readonly appear: number; readonly cards: boolean; readonly solved: number }> = ({ frame, appear, cards, solved }) => (
  <svg viewBox={`0 0 ${GW} ${GH}`} width={GW} height={GH} style={{ overflow: "visible" }}>
    {STUDENTS.map((s, i) => {
      const show = interpolate(frame, [appear + s.d * 18, appear + s.d * 18 + 8], [0, 1], clamp);
      if (show <= 0) return null;
      const ok = frame >= solved + Math.floor(s.j * 4);
      const glow = 0.45 + 0.25 * Math.sin(frame / 6 + s.j * 10);
      return (
        <g key={i} opacity={show}>
          <Student x={s.x} y={s.y} color={ok ? (frame < solved + 12 ? "#eaffc0" : N.greenHi) : `rgba(166,242,42,${glow})`} op={ok ? `${s.a}+${s.b}=${s.a + s.b}` : `${s.a}+${s.b}`} card={cards || ok ? 1 : 0} ok={ok ? 1 : 0} />
        </g>
      );
    })}
  </svg>
);

const Thousand: React.FC<{ readonly gpu: number; readonly thousand: number }> = ({ gpu, thousand }) => {
  const frame = useCurrentFrame();
  const tilt = interpolate(frame, [0, 90], [18, 6], { ...clamp, easing: ease.out });
  return (
    <AbsoluteFill>
      <Plate id="card" blur={14} dim={0.62} from={2} />
      <Atmos seed="p1c" />
      <Cam push={0.1} drift={[20, -14]} punch={[gpu, thousand]} shakeAt={[gpu]}>
        <AbsoluteFill style={{ perspective: 1500 }}>
          <Glass
            style={{ left: 330, top: 230, width: 1260, height: 620, transform: `rotateX(${tilt}deg) rotateY(${-tilt * 0.5}deg)`, transformOrigin: "50% 100%" }}
            accent={N.green}
            sheenAt={thousand}
          >
            <div style={{ position: "absolute", left: 40, top: 10 }}>
              <Grid frame={frame} appear={thousand} cards={false} solved={1e9} />
            </div>
          </Glass>
        </AbsoluteFill>
      </Cam>
      <div style={{ position: "absolute", top: 46, width: "100%", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "baseline", gap: 26, opacity: p01(frame, gpu - 4, gpu + 8), scale: `${1 + 0.3 * Math.exp(-Math.max(0, frame - gpu) / 5)}` }}>
          <span style={{ fontFamily: numFont, fontWeight: 900, fontSize: 110, color: "#fff", textShadow: `0 0 50px ${N.green}, 0 8px 30px #000` }}>GPU</span>
          <span style={{ fontFamily: headFont, fontWeight: 800, fontSize: 66, color: N.ink, textShadow: "0 6px 26px #000", opacity: p01(frame, thousand - 4, thousand + 6) }}>
            = <Counter to={1000} a={thousand} b={thousand + 24} fmt={(v) => Math.round(v).toLocaleString("en-US")} style={{ fontWeight: 900, color: N.greenHi }} /> জন ছাত্র
          </span>
        </div>
      </div>
      <HitFlash at={gpu} color={N.greenHi} />
    </AbsoluteFill>
  );
};

const Together: React.FC<{ readonly back: number; readonly together: number }> = ({ back, together }) => {
  const frame = useCurrentFrame();
  const z = 1 - p01(frame, back, together, ease.inOut);
  const zoom = 1 + 1.9 * z;
  const panX = interpolate(frame, [0, back], [140, -120], clamp) * z;
  const race = p01(frame, 0, together + 4, ease.in);
  const ok = frame >= together;
  const cpuBar = Math.min(0.04, race * 0.04);
  const gpuBar = ok ? p01(frame, together, together + 8) * 0.65 + 0.35 : race * 0.35;
  return (
    <AbsoluteFill>
      <Plate id="card" blur={16} dim={0.65} from={4} rate={0.8} />
      <Atmos seed="p1d" />
      <Cam push={0.06} drift={[-20, 0]} shakeAt={[together]}>
        <AbsoluteFill style={{ perspective: 1500 }}>
          <Glass style={{ left: 330, top: 120, width: 1260, height: 620, transform: "rotateX(6deg)" }} accent={N.green} sheenAt={together}>
            <div style={{ position: "absolute", left: 40, top: 10, width: GW, height: GH, scale: `${zoom}`, translate: `${panX}px 0`, transformOrigin: "50% 45%" }}>
              <Grid frame={frame} appear={-100} cards solved={together} />
            </div>
          </Glass>
        </AbsoluteFill>
        {/* race bars */}
        {[
          { l: "CPU · প্রফেসর", v: cpuBar, c: N.amber, y: 770 },
          { l: "GPU · ১০০০ ছাত্র", v: gpuBar, c: N.greenHi, y: 818 },
        ].map((b) => (
          <div key={b.l} style={{ position: "absolute", left: 330, top: b.y, width: 1260, display: "flex", alignItems: "center", gap: 22 }}>
            <div style={{ width: 290, fontFamily: headFont, fontWeight: 700, fontSize: 32, color: N.ink, textAlign: "right", textShadow: "0 3px 12px #000" }}>{b.l}</div>
            <div style={{ flex: 1, height: 26, borderRadius: 13, background: "rgba(255,255,255,0.1)", overflow: "hidden", boxShadow: "inset 0 2px 6px rgba(0,0,0,0.6)" }}>
              <div style={{ width: `${b.v * 100}%`, height: "100%", borderRadius: 13, background: `linear-gradient(90deg, ${b.c}55, ${b.c})`, boxShadow: `0 0 18px ${b.c}` }} />
            </div>
          </div>
        ))}
      </Cam>
      <div style={{ position: "absolute", top: 30, width: "100%" }}>
        <KText text="প্রত্যেকে ছোট একটা হিসাব" at={2} size={58} />
      </div>
      {ok ? (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 200 }}>
          <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 130, color: "#fff", scale: `${1 + 0.5 * Math.exp(-(frame - together) / 4)}`, textShadow: `0 0 60px ${N.green}, 0 10px 40px #000`, lineHeight: 1.3 }}>
            সবাই একসাথে!
          </div>
        </AbsoluteFill>
      ) : null}
      <HitFlash at={together} color={N.greenHi} />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 5: made for games */
const ForGames: React.FC<{ readonly game: number }> = ({ game }) => {
  const frame = useCurrentFrame();
  const k = p01(frame, game - 4, game + 10);
  return (
    <AbsoluteFill>
      <Plate id="card" from={0.5} drift={0.14} />
      <Atmos seed="p1e" bokeh={14} leak={0.4} />
      <div style={{ position: "absolute", left: 96, top: 90, width: 900 }}>
        <KText text="শুরুতে বানানো হয়েছিল" at={2} size={54} align="left" color={N.muted} />
      </div>
      <Glass style={{ left: 96, top: 200, padding: "14px 40px 22px", display: "flex", alignItems: "center", gap: 28, opacity: k, translate: `${(1 - k) * -80}px 0`, scale: `${0.9 + 0.1 * k}` }} accent={N.green} sheenAt={game}>
        <div style={{ rotate: `${Math.sin(frame / 5) * 7}deg` }}>
          <Pad color="#fff" />
        </div>
        <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 88, color: N.ink, lineHeight: 1.3 }}>
          <span style={{ color: N.greenHi }}>গেমের</span> জন্য
        </div>
      </Glass>
      <HitFlash at={game} color={N.greenHi} />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 6: pixels all at once */
const PC = 72;
const PR = 40;
const CELL = 15;
const rgb = (c: number[]) => `rgb(${c.map((v) => Math.round(v)).join(",")})`;
const mix = (a: number[], b: number[], k: number) => a.map((v, i) => v + (b[i] - v) * k);
const PIX = Array.from({ length: PC * PR }, (_, i) => {
  const cx = i % PC;
  const cy = Math.floor(i / PC);
  const u = (cx + 0.5) / PC;
  const v = (cy + 0.5) / PR;
  const hz = 0.6;
  let col: number[];
  if (v < hz) {
    col = mix([14, 8, 40], [255, 70, 150], (v / hz) ** 1.6);
    const sd = Math.hypot((u - 0.5) * 1.78, v - 0.38);
    if (sd < 0.2 && !(v > 0.42 && cy % 3 === 0)) col = mix([255, 230, 90], [255, 90, 60], Math.max(0, (v - 0.2) / 0.38));
    const m = hz - (0.1 * Math.abs(Math.sin(u * 9 + 1)) + 0.06 * Math.abs(Math.sin(u * 23)));
    if (v > m && (u < 0.33 || u > 0.67)) col = [40, 16, 70];
  } else {
    const d = (v - hz) / (1 - hz);
    col = [10, 4, 26];
    const gx = (u - 0.5) / (0.08 + d);
    if (Math.abs(gx * 6 - Math.round(gx * 6)) < 0.1 * (1 + d * 2) || Math.abs(Math.sin((1 / (d + 0.05)) * 2.2)) < 0.12) col = [118, 185, 0];
    if (Math.abs(u - 0.5) < 0.03 + d * 0.06 && cy % 2 === 0) col = [250, 250, 250];
  }
  return { x: cx * CELL, y: cy * CELL, c: rgb(col), j: random(`px${i}`) };
});

const Pixels: React.FC<{ readonly lakh: number; readonly once: number }> = ({ lakh, once }) => {
  const frame = useCurrentFrame();
  const tilt = interpolate(frame, [0, 80], [-22, -8], { ...clamp, easing: ease.out });
  const on = frame >= once;
  return (
    <AbsoluteFill>
      <Plate id="card" blur={18} dim={0.7} from={5} tint={on ? undefined : "#7090ff"} />
      <Atmos seed="p1f" color={on ? N.green : "#ff4fa0"} color2="#6a3cff" />
      <Cam push={0.1} drift={[-30, -10]} punch={[once]} shakeAt={[once]}>
        <AbsoluteFill style={{ perspective: 1600 }}>
          <div
            style={{
              position: "absolute",
              left: 960 - (PC * CELL) / 2 - 22 + 80,
              top: 220,
              padding: 22,
              borderRadius: 28,
              background: "linear-gradient(160deg,#22282c,#0a0c0e)",
              border: "2px solid #3a4248",
              transform: `rotateY(${tilt}deg) rotateX(3deg)`,
              boxShadow: `0 60px 120px rgba(0,0,0,0.85), 0 0 ${on ? 140 : 30}px ${on ? "#ff5fa2aa" : "#000"}`,
            }}
          >
            <svg width={PC * CELL} height={PR * CELL} style={{ display: "block", background: "#05070a", borderRadius: 6 }}>
              {PIX.map((p, i) => {
                const lit = frame >= once + Math.floor(p.j * 4);
                const sp = !lit && random(`sp${i}-${Math.floor(frame / 3)}`) > 0.982;
                return <rect key={i} x={p.x + 0.6} y={p.y + 0.6} width={CELL - 1.2} height={CELL - 1.2} rx={2} fill={lit ? p.c : sp ? "#4a5a3a" : "#11161a"} />;
              })}
            </svg>
          </div>
        </AbsoluteFill>
      </Cam>
      <div style={{ position: "absolute", top: 50, width: "100%" }}>
        <KText text="স্ক্রিনের লক্ষ লক্ষ বিন্দু" at={lakh - 12} size={64} />
      </div>
      {on ? (
        <div style={{ position: "absolute", top: 760, width: "100%" }}>
          <KText text="একসাথে!" at={once} size={80} color={N.greenHi} glow={`${N.green}aa`} />
        </div>
      ) : null}
      <HitFlash at={once} color="#ffd0e8" />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 7: AI training = same work */
const LAYERS = [5, 8, 8, 8, 4];
const NODES = LAYERS.flatMap((n, li) => Array.from({ length: n }, (_, k) => ({ li, x: 560 + li * 210, y: 500 + (k - (n - 1) / 2) * 70 })));
const EDGES = NODES.flatMap((a) => NODES.filter((b) => b.li === a.li + 1).map((b) => ({ a, b })));

const Net: React.FC<{ readonly frame: number; readonly hot: number }> = ({ frame, hot }) => {
  const t = frame / 30;
  return (
    <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
      <defs>
        <filter id="p1n">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      {EDGES.map((e, n) => (
        <line key={n} x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y} stroke={`rgba(166,242,42,${0.08 + 0.3 * hot})`} strokeWidth={1.6} />
      ))}
      {EDGES.filter((_, n) => n % 3 === 0).map((e, n) => {
        const ph = (t * 0.9 + random(`pe${n}`)) % 1;
        return <circle key={n} cx={e.a.x + (e.b.x - e.a.x) * ph} cy={e.a.y + (e.b.y - e.a.y) * ph} r={5} fill={N.greenHi} filter="url(#p1n)" />;
      })}
      {NODES.map((nd, n) => (
        <g key={n}>
          <circle cx={nd.x} cy={nd.y} r={30} fill={N.green} opacity={0.15 + 0.5 * hot * (0.6 + 0.4 * Math.sin(t * 5 + n))} filter="url(#p1n)" />
          <circle cx={nd.x} cy={nd.y} r={16} fill={hot > 0.5 ? N.greenHi : "#16200f"} stroke={N.greenHi} strokeWidth={3} />
        </g>
      ))}
    </svg>
  );
};

const AiSame: React.FC<{ readonly ai: number; readonly same: number }> = ({ ai, same }) => {
  const frame = useCurrentFrame();
  const sm = p01(frame, same, same + 12);
  return (
    <AbsoluteFill>
      <Plate id="chipmacro" blur={10} dim={0.62} from={3} />
      <Atmos seed="p1g" color2={N.cyan} />
      <Cam push={0.16} drift={[-60, 0]} rot={1} punch={[same]}>
        <AbsoluteFill style={{ perspective: 1500 }}>
          <AbsoluteFill style={{ transform: `rotateY(${interpolate(frame, [0, 120], [22, 6], clamp)}deg)` }}>
            <Net frame={frame} hot={0.3} />
          </AbsoluteFill>
        </AbsoluteFill>
      </Cam>
      <div style={{ position: "absolute", top: 50, width: "100%" }}>
        <KText text="AI শেখানোর কাজটাও" at={ai - 8} size={68} />
      </div>
      <Glass style={{ right: 110, top: 590, padding: "10px 36px 18px", textAlign: "center", opacity: sm, scale: `${0.8 + 0.2 * sm}`, translate: `0 ${(1 - sm) * 30}px` }} accent={N.green} sheenAt={same}>
        <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 64, color: N.ink, lineHeight: 1.3 }}>
          গেম <span style={{ color: N.greenHi }}>≈</span> AI
        </div>
        <div style={{ fontFamily: headFont, fontWeight: 600, fontSize: 32, color: N.muted, lineHeight: 1.3 }}>ঠিক একই ধরনের কাজ</div>
      </Glass>
    </AbsoluteFill>
  );
};

const OPS = Array.from({ length: 260 }, (_, i) => ({
  x: 30 + (i % 20) * 96 + random(`ox${i}`) * 40,
  y: 60 + Math.floor(i / 20) * 64 + random(`oy${i}`) * 20,
  s: ["×", "+", "×", "+", "−"][Math.floor(random(`os${i}`) * 5)],
  a: 1 + Math.floor(random(`oa${i}`) * 9),
  b: 1 + Math.floor(random(`ob${i}`) * 9),
  j: random(`oj${i}`),
  z: 0.6 + random(`oz${i}`) * 0.9,
}));

const Koti: React.FC<{ readonly once: number }> = ({ once }) => {
  const frame = useCurrentFrame();
  const all = frame >= once;
  return (
    <AbsoluteFill>
      <Plate id="chipmacro" blur={6} dim={0.55} from={5} rate={1.3} />
      <Atmos seed="p1h" />
      <Cam push={0.22} drift={[0, -20]} punch={[once]} shakeAt={[once]}>
        {OPS.map((o, i) => {
          const show = p01(frame, o.j * 22, o.j * 22 + 6);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: o.x,
                top: o.y + (all ? 0 : (1 - show) * 20),
                fontFamily: numFont,
                fontWeight: 700,
                fontSize: 26 * o.z,
                color: all ? N.greenHi : "#cfd6d2",
                opacity: all ? 0.95 : show * 0.45,
                textShadow: all ? `0 0 14px ${N.green}` : undefined,
                filter: o.z < 0.8 ? "blur(1.5px)" : undefined,
              }}
            >
              {o.a}
              {o.s}
              {o.b}
              {all ? `=${o.s === "×" ? o.a * o.b : o.s === "+" ? o.a + o.b : o.a - o.b}` : ""}
            </div>
          );
        })}
        <AbsoluteFill style={{ opacity: all ? 0.9 : 0.35 }}>
          <Net frame={frame} hot={all ? 1 : 0.2} />
        </AbsoluteFill>
      </Cam>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 140 }}>
        <Glass style={{ position: "relative", padding: "8px 46px 20px" }} accent={N.green} sheenAt={once}>
          <KText text="কোটি কোটি ছোট হিসাব" at={2} size={78} stagger={3} />
          {all ? <KText text="একসাথে" at={once} size={78} color={N.greenHi} glow={`${N.green}aa`} /> : null}
        </Glass>
      </AbsoluteFill>
      <HitFlash at={once} color={N.greenHi} />
      {frame >= once && frame < once + 6 ? <GlitchBars amount={1 - (frame - once) / 6} color={N.green} /> : null}
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 9: today's AI */
const PROMPT = "এনভিডিয়া কী বানায়?";
const ChatToday: React.FC<{ readonly gpt: number }> = ({ gpt }) => {
  const frame = useCurrentFrame();
  const n = Math.floor(interpolate(frame, [gpt, gpt + 24], [0, PROMPT.length], clamp));
  const tilt = interpolate(frame, [0, 80], [24, 10], { ...clamp, easing: ease.out });
  const others = ["AI চ্যাট", "AI ছবি", "AI ভিডিও", "AI কোড"];
  return (
    <AbsoluteFill>
      <Plate id="dc" blur={14} dim={0.55} from={1} />
      <Atmos seed="p1i" />
      <Cam push={0.1} drift={[30, -10]}>
        <AbsoluteFill style={{ perspective: 1500 }}>
          <Glass style={{ left: 300, top: 170, width: 820, height: 560, transform: `rotateY(${tilt}deg) rotateX(4deg)` }} accent={N.green} sheenAt={gpt}>
            <div style={{ padding: "26px 36px", fontFamily: numFont, fontWeight: 700, fontSize: 30, color: N.ink, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
              <span style={{ color: N.greenHi }}>●</span> ChatGPT
            </div>
            <div style={{ position: "absolute", right: 36, top: 120, background: `linear-gradient(135deg, ${N.greenHi}, ${N.green})`, color: "#081000", fontFamily: headFont, fontWeight: 700, fontSize: 40, padding: "10px 26px 16px", borderRadius: "26px 26px 6px 26px", opacity: n ? 1 : 0, lineHeight: 1.3 }}>
              {PROMPT.slice(0, n)}
            </div>
            <div style={{ position: "absolute", left: 36, top: 250, display: "flex", gap: 12, opacity: p01(frame, gpt + 26, gpt + 34) }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: 18, height: 18, borderRadius: 9, background: N.ink, opacity: 0.3 + 0.7 * Math.abs(Math.sin(frame / 5 + i)) }} />
              ))}
            </div>
          </Glass>
          {others.map((o, i) => {
            const k = p01(frame, gpt + 8 + i * 5, gpt + 20 + i * 5);
            return (
              <Glass key={o} style={{ left: 1230 + (i % 2) * 40, top: 180 + i * 130, padding: "12px 34px 16px", opacity: k, translate: `${(1 - k) * 120}px 0`, transform: `rotateY(${-tilt * 0.6}deg)` }} accent={N.cyan}>
                <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 40, color: N.ink, lineHeight: 1.3 }}>{o}</div>
              </Glass>
            );
          })}
        </AbsoluteFill>
      </Cam>
      <div style={{ position: "absolute", top: 40, width: "100%" }}>
        <KText text="আজকের বড় বড় AI" at={gpt - 4} size={60} />
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 10: runs on Nvidia chips */
const APPS = ["ChatGPT", "AI চ্যাট", "AI ছবি", "AI ভিডিও", "AI অনুবাদ"];
const OnChip: React.FC<{ readonly chip: number }> = ({ chip }) => {
  const frame = useCurrentFrame();
  const k = p01(frame, chip - 4, chip + 10);
  return (
    <AbsoluteFill>
      <Plate id="chipmacro" from={2} drift={0.18} />
      <Atmos seed="p1j" bokeh={14} leak={0.45} />
      <Cam push={0.08} punch={[chip]}>
        {APPS.map((a, i) => {
          const fly = p01(frame, i * 5, i * 5 + 26, ease.in);
          const ang = -2.4 + i * 1.2;
          const x0 = 960 + Math.cos(ang) * 820;
          const y0 = 480 + Math.sin(ang) * 380;
          return (
            <div
              key={a}
              style={{
                position: "absolute",
                left: x0 + (960 - x0) * fly - 120,
                top: y0 + (500 - y0) * fly - 30,
                opacity: 1 - fly ** 3,
                scale: `${1 - 0.7 * fly}`,
                filter: `blur(${fly * 6}px)`,
                background: "rgba(10,14,12,0.7)",
                border: `1.5px solid ${N.green}88`,
                borderRadius: 18,
                padding: "8px 26px 12px",
                fontFamily: /[a-zA-Z]/.test(a[0]) ? numFont : headFont,
                fontWeight: 800,
                fontSize: 38,
                color: N.ink,
                lineHeight: 1.3,
                boxShadow: `0 0 30px ${N.green}55`,
              }}
            >
              {a}
            </div>
          );
        })}
      </Cam>
      <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 80 }}>
        <Glass style={{ position: "relative", padding: "12px 46px 22px", opacity: k, scale: `${0.85 + 0.15 * k}` }} accent={N.green} sheenAt={chip}>
          <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 72, color: N.ink, lineHeight: 1.3 }}>
            চলে <span style={{ color: N.greenHi }}>এনভিডিয়ার চিপে</span>
          </div>
        </Glass>
      </AbsoluteFill>
      <HitFlash at={chip} color={N.greenHi} />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 11: 75–90 % */
const Share: React.FC<{ readonly market: number; readonly s75: number; readonly s90: number }> = ({ market, s75, s90 }) => {
  const frame = useCurrentFrame();
  const p75 = interpolate(frame, [market, s75], [0, 0.75], { ...clamp, easing: ease.inOut });
  const p90 = interpolate(frame, [s90, s90 + 8], [0, 0.15], { ...clamp, easing: ease.out });
  const R = 220;
  const C = 2 * Math.PI * R;
  const hit = p01(frame, s75, s75 + 8);
  const both = frame >= s90;
  const tilt = interpolate(frame, [0, 100], [20, 8], { ...clamp, easing: ease.out });
  return (
    <AbsoluteFill>
      <Plate id="tray" blur={12} dim={0.6} from={2} />
      <Atmos seed="p1k" />
      <Cam push={0.1} drift={[-30, -10]} punch={[s75, s90]} shakeAt={[s75]}>
        <AbsoluteFill style={{ perspective: 1600 }}>
          <Glass style={{ left: 170, top: 150, width: 1580, height: 640, transform: `rotateY(${-tilt * 0.6}deg) rotateX(${tilt * 0.4}deg)` }} accent={N.green} sheenAt={s75}>
            <svg viewBox="0 0 1580 640" style={{ position: "absolute", inset: 0 }}>
              <defs>
                <linearGradient id="p1dg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor={N.greenHi} />
                  <stop offset="1" stopColor="#3f7a00" />
                </linearGradient>
                <pattern id="p1h" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="16" height="16" fill={N.green} opacity={0.3} />
                  <rect width="7" height="16" fill={N.greenHi} />
                </pattern>
                <filter id="p1dgl">
                  <feGaussianBlur stdDeviation="16" />
                </filter>
              </defs>
              <g transform="translate(400 320) rotate(-90)">
                <circle r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={80} />
                <circle r={R} fill="none" stroke={N.green} strokeWidth={80} strokeDasharray={`${p75 * C} ${C}`} filter="url(#p1dgl)" opacity={0.6} />
                <circle r={R} fill="none" stroke="url(#p1dg)" strokeWidth={80} strokeDasharray={`${p75 * C} ${C}`} />
                <circle r={R} fill="none" stroke="url(#p1h)" strokeWidth={80} strokeDasharray={`0 ${0.75 * C} ${p90 * C} ${C}`} />
              </g>
              <text x={400} y={345} textAnchor="middle" fontFamily={numFont} fontWeight={900} fontSize={both ? 96 : 120} fill="#fff" style={{ fontVariantNumeric: "tabular-nums" }}>
                {both ? "75–90%" : `${Math.round(p75 * 100)}%`}
              </text>
            </svg>
            <div style={{ position: "absolute", left: 780, top: 70, width: 740 }}>
              <div style={{ fontFamily: headFont, fontWeight: 600, fontSize: 36, color: N.muted, lineHeight: 1.35 }}>বিশ্লেষকদের হিসাবে</div>
              <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 74, color: N.ink, lineHeight: 1.35 }}>
                <span style={{ fontFamily: numFont, fontWeight: 900 }}>AI</span> চিপের বাজার
              </div>
              <div style={{ height: 5, width: 600 * p01(frame, 6, 26), background: `linear-gradient(90deg, ${N.green}, transparent)`, margin: "14px 0 44px" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 20, opacity: hit, marginBottom: 26 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg, ${N.greenHi}, ${N.green})`, boxShadow: `0 0 20px ${N.green}` }} />
                <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 50, color: N.ink }}>
                  এনভিডিয়া <span style={{ fontFamily: numFont, fontWeight: 900, color: N.greenHi }}>{both ? "75–90%" : "75%"}</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 20, opacity: hit * 0.8 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.16)" }} />
                <div style={{ fontFamily: headFont, fontWeight: 600, fontSize: 40, color: N.muted }}>বাকি সবাই মিলে</div>
              </div>
            </div>
          </Glass>
        </AbsoluteFill>
      </Cam>
      <HitFlash at={s75} color={N.greenHi} />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- assembly */
export const P1Scene: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  const at = useAt(P1_ID);
  const f = (s: number) => Math.round(s * fps);

  const bProf = f(at("ধরুন") - 0.2);
  const bGpu = f(at("এনভিডিয়া") - 0.15);
  const bEach = f(at("প্রত্যেকে") - 0.15);
  const bGame = f(at("শুরুতে") - 0.2);
  const bPix = f(at("স্ক্রিনের") - 0.2);
  const bAi = f(at("পরে") - 0.1);
  const bKoti = f(at("কোটি") - 0.2);
  const bChat = f(at("ফলে") - 0.1);
  const bChip = f(at("চলে") - 0.2);
  const bShare = f(at("বিশ্লেষকদের") - 0.15);

  const beats: Beat[] = [
    { at: 0, name: "cpu brain", node: <CpuBrain brain={f(at("মগজ"))} cpu={f(at("সিপিইউ"))} /> },
    { at: bProf, trans: "whip", name: "professor", node: <ProfessorBeat prof={f(at("প্রফেসর")) - bProf} wise={f(at("জ্ঞানী")) - bProf} one={f(at("একটা")) - bProf} /> },
    { at: bGpu, trans: "zoom", name: "gpu 1000", node: <Thousand gpu={f(at("জিপিইউ")) - bGpu} thousand={f(at("হাজার")) - bGpu} /> },
    { at: bEach, trans: "blur", name: "together", node: <Together back={f(at("কিন্তু", 1)) - bEach} together={f(at("একসাথে")) - bEach} /> },
    { at: bGame, trans: "whipL", name: "games", node: <ForGames game={f(at("গেমের")) - bGame} /> },
    { at: bPix, trans: "slideUp", name: "pixels", node: <Pixels lakh={f(at("লক্ষ")) - bPix} once={f(at("একসাথে", 1)) - bPix} /> },
    { at: bAi, trans: "glitch", name: "ai same", node: <AiSame ai={f(at("AI")) - bAi} same={f(at("ঠিক")) - bAi} /> },
    { at: bKoti, trans: "zoom", name: "koti", node: <Koti once={f(at("একসাথে", 2)) - bKoti} /> },
    { at: bChat, trans: "whip", name: "chat", node: <ChatToday gpt={f(at("চ্যাটজিপিটির")) - bChat} /> },
    { at: bChip, trans: "zoom", name: "on chip", node: <OnChip chip={f(at("চিপে")) - bChip} /> },
    { at: bShare, trans: "flash", name: "share", node: <Share market={f(at("বাজারের")) - bShare} s75={f(at("৭৫")) - bShare} s90={f(at("৯০")) - bShare} /> },
  ];

  return (
    <AbsoluteFill style={{ background: N.bg }}>
      <Beats beats={beats} end={durationInFrames} />
    </AbsoluteFill>
  );
};

