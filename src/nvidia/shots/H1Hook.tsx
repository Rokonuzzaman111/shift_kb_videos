/**
 * H1 — HOOK v2 (3D + documentary). 7 beats in 26.7 s with movement inside each, real 3D plates behind
 * everything, a transition on every cut, camera always moving, every cut keyed to the spoken word.
 */
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Atmos, Beats, Cam, Counter, DocBg, Glass, GlitchBars, HitFlash, KText, PhotoCard, Plate, p01, type Beat } from "../kit";
import { N, clamp, ease, headFont, numFont } from "../theme";
import { BD_PATH, BD_VIEWBOX } from "../two/bdPath";
import type { Cue } from "../types";
import { useAt } from "../vo";

export const H1_ID = "H1";
export const H1_KEYWORDS = ["ট্রিলিয়ন", "বাংলাদেশের", "এনভিডিয়া।", "চিপ।", "পদত্যাগ"];

export const H1_CUES: Cue[] = [
  { sfx: "riser_short", word: "দশমিক", offset: -0.45, volume: 0.8 },
  { sfx: "impact_deep", word: "ট্রিলিয়ন" },
  { sfx: "drop_down", word: "হারিয়েছে", offset: -0.1, volume: 0.8 },
  { sfx: "whoosh_big", word: "বাংলাদেশের", offset: -0.3 },
  { sfx: "ui_pop", word: "তিন" },
  { sfx: "reverse_swell", word: "এনভিডিয়া", offset: -1.15, volume: 0.8 },
  { sfx: "impact", word: "এনভিডিয়া" },
  { sfx: "whoosh", word: "আপনি", offset: -0.15 },
  { sfx: "type", word: "প্রশ্নই", offset: -0.2, volume: 0.6 },
  { sfx: "data_stream", word: "উত্তরটা", offset: -0.1, volume: 0.8 },
  { sfx: "bass_drop", word: "চিপ।", volume: 0.8 },
  { sfx: "news_sting", word: "বৃহস্পতিবার", offset: -0.35 },
  { sfx: "camera_shutter", word: "প্রতিষ্ঠাতা" },
  { sfx: "hit_glitch", word: "পদত্যাগ" },
  { sfx: "heartbeat", word: "কেন" },
  { sfx: "reverse_swell", word: "বলি", offset: -1.0 },
  { sfx: "whoosh_big", word: "বলি", offset: 0.2 },
];

/* ------------------------------------------------------------------ shared bits */
const Ticker: React.FC<{ readonly red?: boolean }> = ({ red = true }) => {
  const frame = useCurrentFrame();
  const items = ["NVIDIA ▼ 4.3%", "AI CHIPS", "$5.8T → $4.2T", "NASDAQ", "NVIDIA ▼ 13% AT OPEN", "CEO RESIGNS", "AMD ▲", "BROADCOM ▲"];
  const line = [...items, ...items, ...items].join("   •   ");
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 54, background: "rgba(0,0,0,0.72)", borderBottom: `2px solid ${red ? N.red : N.green}`, overflow: "hidden" }}>
      <div style={{ whiteSpace: "nowrap", fontFamily: numFont, fontWeight: 700, fontSize: 26, color: red ? "#ff8a8a" : N.greenHi, lineHeight: "54px", translate: `${-(frame * 6) % 1400}px 0` }}>{line}</div>
    </div>
  );
};

/* ------------------------------------------------------------------ beat 1: market screen, climb → crash → −$1.6T */
const CH: [number, number][] = [
  [0, 520], [90, 505], [180, 470], [270, 482], [360, 430], [450, 392], [540, 405], [630, 342], [720, 300], [810, 262], [900, 232], [990, 180], [1060, 150], [1120, 120],
  [1180, 210], [1240, 236], [1300, 318], [1360, 300], [1420, 400], [1480, 420], [1540, 500],
];
const PEAK = 13;

const Market: React.FC<{ readonly crashAt: number; readonly hit: number }> = ({ crashAt, hit }) => {
  const frame = useCurrentFrame();
  const climb = p01(frame, 0, 12, ease.out);
  const fall = p01(frame, crashAt, hit + 8, ease.in);
  const upto = climb * PEAK + fall * (CH.length - 1 - PEAK);
  const i = Math.floor(upto);
  const pts: [number, number][] = CH.slice(0, i + 1);
  if (i < CH.length - 1) {
    const fr = upto - i;
    pts.push([CH[i][0] + (CH[i + 1][0] - CH[i][0]) * fr, CH[i][1] + (CH[i + 1][1] - CH[i][1]) * fr]);
  }
  const g = pts.filter((p) => p[0] <= CH[PEAK][0]);
  const r = upto > PEAK ? [CH[PEAK], ...pts.filter((p) => p[0] > CH[PEAK][0])] : [];
  const d = (p: [number, number][]) => p.map(([x, y], k) => `${k ? "L" : "M"}${x} ${y}`).join(" ");
  const head = pts[pts.length - 1];
  const red = upto > PEAK;
  const val = upto <= PEAK ? 3.1 + 2.7 * (upto / PEAK) : 5.8 - 1.6 * ((upto - PEAK) / (CH.length - 1 - PEAK));
  return (
    <AbsoluteFill>
      <Plate id="chipmacro" blur={10} dim={0.55} tint={red ? "#ff6060" : undefined} />
      <Atmos color={red ? N.red : N.green} seed="m" />
      <Cam push={0.16} drift={[-60, -20]} rot={-1.2} shakeAt={[hit]}>
        <AbsoluteFill style={{ perspective: 1600 }}>
          <Glass style={{ left: 170, top: 140, width: 1580, height: 660, transform: "rotateX(12deg) rotateY(-9deg)", transformOrigin: "50% 100%" }} accent={red ? N.red : N.green}>
            <div style={{ position: "absolute", left: 40, top: 26, fontFamily: numFont, fontWeight: 900, fontSize: 40, color: N.ink, letterSpacing: 2 }}>
              NVIDIA <span style={{ color: N.muted, fontWeight: 600, fontSize: 28, fontFamily: headFont }}>· শেয়ারবাজারে মোট মূল্য</span>
            </div>
            <div style={{ position: "absolute", right: 40, top: 18, fontFamily: numFont, fontWeight: 900, fontSize: 64, color: red ? N.red : N.greenHi, fontVariantNumeric: "tabular-nums" }}>
              ${val.toFixed(2)}T {red ? "▼" : "▲"}
            </div>
            <svg viewBox="0 0 1580 660" style={{ position: "absolute", inset: 0 }}>
              <defs>
                <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={N.green} stopOpacity="0.45" />
                  <stop offset="1" stopColor={N.green} stopOpacity="0" />
                </linearGradient>
                <linearGradient id="ra" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={N.red} stopOpacity="0.45" />
                  <stop offset="1" stopColor={N.red} stopOpacity="0" />
                </linearGradient>
                <filter id="gl">
                  <feGaussianBlur stdDeviation="7" />
                </filter>
              </defs>
              <g transform="translate(20 60)">
                {Array.from({ length: 6 }).map((_, k) => (
                  <line key={k} x1={0} x2={1540} y1={k * 100 + 30} y2={k * 100 + 30} stroke="rgba(255,255,255,0.06)" />
                ))}
                {g.length > 1 ? <path d={`${d(g)} L${g[g.length - 1][0]} 580 L0 580 Z`} fill="url(#ga)" /> : null}
                {r.length > 1 ? <path d={`${d(r)} L${r[r.length - 1][0]} 580 L${CH[PEAK][0]} 580 Z`} fill="url(#ra)" /> : null}
                <path d={d(g)} fill="none" stroke={N.green} strokeWidth={10} filter="url(#gl)" />
                <path d={d(g)} fill="none" stroke={N.greenHi} strokeWidth={4.5} />
                {r.length > 1 ? (
                  <>
                    <path d={d(r)} fill="none" stroke={N.red} strokeWidth={12} filter="url(#gl)" />
                    <path d={d(r)} fill="none" stroke="#ff7a7a" strokeWidth={5} />
                  </>
                ) : null}
                <circle cx={head[0]} cy={head[1]} r={12} fill={red ? N.red : N.greenHi} />
                <circle cx={head[0]} cy={head[1]} r={30 + 8 * Math.sin(frame / 3)} fill={red ? N.red : N.greenHi} opacity={0.25} />
                <g opacity={p01(frame, 6, 16)}>
                  <line x1={CH[PEAK][0]} x2={CH[PEAK][0]} y1={CH[PEAK][1]} y2={580} stroke="#fff" strokeDasharray="6 8" opacity={0.4} />
                  <text x={CH[PEAK][0] - 18} y={CH[PEAK][1] - 22} textAnchor="end" fill={N.ink} fontFamily={headFont} fontWeight={700} fontSize={30}>
                    অক্টোবরের চূড়া · $5.8T
                  </text>
                </g>
              </g>
            </svg>
          </Glass>
        </AbsoluteFill>
      </Cam>
      <Ticker red={red} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 120 }}>
        {frame >= hit ? (
          <div style={{ position: "relative", scale: `${1 + 0.6 * Math.exp(-(frame - hit) / 4)}` }}>
            <div style={{ position: "absolute", inset: 0, fontFamily: numFont, fontWeight: 900, fontSize: 230, letterSpacing: -8, color: N.cyan, opacity: 0.5, translate: `${10 * Math.exp(-(frame - hit) / 6)}px 0`, mixBlendMode: "screen" }}>
              −$1.6T
            </div>
            <div style={{ fontFamily: numFont, fontWeight: 900, fontSize: 230, letterSpacing: -8, color: "#fff", textShadow: `0 0 80px ${N.red}, 0 0 20px ${N.red}, 0 20px 60px #000`, WebkitTextStroke: `3px ${N.red}` }}>
              −$1.6T
            </div>
            <div style={{ textAlign: "center", fontFamily: headFont, fontWeight: 800, fontSize: 54, color: N.ink, marginTop: -20, opacity: p01(frame, hit + 6, hit + 16), textShadow: "0 4px 20px #000" }}>
              মাত্র <span style={{ color: N.red }}>১ মাসে</span> উধাও
            </div>
          </div>
        ) : null}
      </AbsoluteFill>
      <HitFlash at={hit} color="#ff9a9a" />
      {frame >= hit && frame < hit + 6 ? <GlitchBars amount={1 - (frame - hit) / 6} /> : null}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ beat 2: dive onto Bangladesh, ×3 years */
const BdMap: React.FC<{ readonly i: number; readonly split: number; readonly eq: number }> = ({ i, split, eq }) => {
  const on = i === 1 ? 1 : split;
  const x = (i - 1) * 470 * split;
  const lift = i === 1 ? 0 : (1 - split) * 60;
  return (
    <div style={{ position: "absolute", left: 960 - 190 + x, top: 190 + lift, width: 380, height: 528, opacity: on }}>
      <svg viewBox={BD_VIEWBOX} style={{ width: "100%", height: "100%", overflow: "visible" }}>
        <defs>
          <linearGradient id={`bdg${i}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={N.greenHi} stopOpacity="0.95" />
            <stop offset="1" stopColor="#1e4d00" stopOpacity="0.95" />
          </linearGradient>
        </defs>
        {[22, 15, 8].map((o) => (
          <path key={o} d={BD_PATH} fill="#0a1a00" transform={`translate(${o * 0.6} ${o})`} opacity={0.85} />
        ))}
        <path d={BD_PATH} fill={`url(#bdg${i})`} stroke={N.greenHi} strokeWidth={4} style={{ filter: `drop-shadow(0 0 24px ${N.green}aa)` }} />
      </svg>
      <div style={{ position: "absolute", bottom: -92, width: "100%", textAlign: "center", opacity: i === 1 ? 1 - eq : 1 }}>
        <div style={{ fontFamily: numFont, fontWeight: 900, fontSize: 46, color: N.ink, textShadow: "0 4px 18px #000" }}>$0.51T</div>
        <div style={{ fontFamily: headFont, fontWeight: 700, fontSize: 28, color: N.muted, marginTop: -4 }}>{["১ম বছর", "২য় বছর", "৩য় বছর"][i === 1 ? 0 : i === 0 ? 1 : 2]}</div>
      </div>
    </div>
  );
};

const Bangladesh: React.FC<{ readonly three: number; readonly sum: number }> = ({ three, sum }) => {
  const frame = useCurrentFrame();
  const fly = p01(frame, 0, 24, ease.out);
  const split = p01(frame, three, three + 16, ease.out);
  const eq = p01(frame, sum, sum + 14);
  return (
    <AbsoluteFill>
      <Plate id="dc" blur={16} dim={0.68} from={2} />
      <Atmos seed="b" leak={0.45} />
      <Cam push={0.06} drift={[0, -20]}>
        <AbsoluteFill style={{ scale: `${3.4 - 2.4 * fly}`, filter: fly < 1 ? `blur(${(1 - fly) * 14}px)` : undefined, transformOrigin: "50% 42%", rotate: `${(1 - fly) * -12}deg` }}>
          <BdMap i={0} split={split} eq={eq} />
          <BdMap i={2} split={split} eq={eq} />
          <BdMap i={1} split={split} eq={eq} />
        </AbsoluteFill>
      </Cam>
      <div style={{ position: "absolute", top: 50, width: "100%" }}>
        <KText text="বাংলাদেশের পুরো অর্থনীতি" at={6} size={62} />
      </div>
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 232 }}>
        <div style={{ opacity: eq, scale: `${0.7 + 0.3 * eq}`, fontFamily: numFont, fontWeight: 900, fontSize: 62, color: N.ink, background: "rgba(0,0,0,0.6)", padding: "4px 30px 10px", borderRadius: 14, border: `2px solid ${N.red}` }}>
          <span style={{ color: N.red }}>$1.6T</span> ≈ <span style={{ fontFamily: headFont }}>৩ বছর</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ beat 3: real 3D chip explodes, NVIDIA reveal */
const NvidiaReveal: React.FC<{ readonly name: number }> = ({ name }) => {
  const frame = useCurrentFrame();
  const k = p01(frame, name - 2, name + 14);
  const sweep = interpolate(frame, [name, name + 28], [-30, 140], clamp);
  return (
    <AbsoluteFill>
      <Plate id="chipexplode" from={0.4} rate={1.2} drift={0.12} />
      <Atmos seed="c" bokeh={14} leak={0.45} />
      <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 80 }}>
        <div
          style={{
            opacity: k,
            letterSpacing: `${40 - 22 * k}px`,
            fontFamily: numFont,
            fontWeight: 900,
            fontSize: 180,
            backgroundImage: `linear-gradient(100deg, #e9ecef ${sweep - 18}%, #ffffff ${sweep - 4}%, ${N.greenHi} ${sweep}%, #e9ecef ${sweep + 18}%)`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: `drop-shadow(0 10px 40px rgba(0,0,0,0.9)) drop-shadow(0 0 40px ${N.green}66) blur(${(1 - k) * 10}px)`,
            scale: `${1.3 - 0.3 * k}`,
          }}
        >
          NVIDIA
        </div>
        <div style={{ opacity: p01(frame, name + 8, name + 20), fontFamily: headFont, fontWeight: 700, fontSize: 40, color: N.greenHi, letterSpacing: 6, marginTop: -16 }}>এনভিডিয়া</div>
      </AbsoluteFill>
      <HitFlash at={name} color={N.greenHi} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ beat 4a: you ask AI (3D phone over blurred data center) */
const Q = "এআই, ব্ল্যাক হোল কী? সহজ করে বলো।";
const A = "ব্ল্যাক হোল হলো মহাকাশের এমন জায়গা, যেখানে মাধ্যাকর্ষণ এত বেশি যে আলোও বের হতে পারে না…";
const AskAI: React.FC<{ readonly answerAt: number }> = ({ answerAt }) => {
  const frame = useCurrentFrame();
  const qN = Math.floor(interpolate(frame, [6, 40], [0, Q.length], clamp));
  const aN = Math.floor(interpolate(frame, [answerAt - 6, answerAt + 40], [0, A.length], clamp));
  const tilt = interpolate(frame, [0, 90], [20, 5], { ...clamp, easing: ease.out });
  return (
    <AbsoluteFill>
      <Plate id="dc" blur={18} dim={0.5} from={4} />
      <Atmos seed="d" />
      <Cam push={0.1} drift={[30, -10]}>
        <AbsoluteFill style={{ perspective: 1400, justifyContent: "center", alignItems: "center" }}>
          <div
            style={{
              width: 440,
              height: 860,
              borderRadius: 66,
              background: "linear-gradient(160deg,#1a1f24,#07090b)",
              border: "3px solid #3a4148",
              boxShadow: `0 60px 140px rgba(0,0,0,0.85), 0 0 120px ${N.green}30, inset 0 0 0 10px #0b0d10`,
              transform: `rotateY(${-tilt}deg) rotateX(${tilt * 0.4}deg)`,
              padding: "76px 30px",
              display: "flex",
              flexDirection: "column",
              gap: 24,
              fontFamily: headFont,
              overflow: "hidden",
              marginTop: -70,
            }}
          >
            <div style={{ color: N.muted, fontSize: 24, textAlign: "center", fontFamily: numFont, letterSpacing: 2 }}>● AI ASSISTANT</div>
            <div style={{ alignSelf: "flex-end", background: `linear-gradient(135deg, ${N.greenHi}, ${N.green})`, color: "#081000", fontSize: 30, fontWeight: 700, borderRadius: "26px 26px 6px 26px", padding: "12px 20px 16px", maxWidth: 340, opacity: qN ? 1 : 0, lineHeight: 1.4 }}>
              {Q.slice(0, qN)}
            </div>
            <div style={{ alignSelf: "flex-start", background: "#1d242a", color: N.ink, fontSize: 28, fontWeight: 600, lineHeight: 1.5, borderRadius: "26px 26px 26px 6px", padding: "12px 20px 16px", maxWidth: 350, opacity: aN ? 1 : 0, border: "1px solid rgba(255,255,255,0.08)" }}>
              {A.slice(0, aN)}
              {aN > 0 && aN < A.length ? <span style={{ color: N.greenHi }}>▍</span> : null}
            </div>
          </div>
        </AbsoluteFill>
      </Cam>
      <div style={{ position: "absolute", left: 110, top: 330, width: 560 }}>
        <KText text="আপনার প্রতিটা প্রশ্ন" at={2} size={62} align="left" />
      </div>
      <div style={{ position: "absolute", right: 100, top: 400, width: 580 }}>
        <KText text="উত্তর বানায় কে?" at={answerAt} size={66} color={N.greenHi} align="right" glow={`${N.green}88`} />
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ beat 4b: real 3D GPU tray, data flies in */
const BehindIt: React.FC<{ readonly chip: number }> = ({ chip }) => {
  const frame = useCurrentFrame();
  const k = p01(frame, chip - 4, chip + 10);
  return (
    <AbsoluteFill>
      <Plate id="chipexplode" from={5} rate={0.5} drift={0.16} dim={0.25} />
      <Atmos seed="e" bokeh={10} leak={0.35} />
      <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 18 }).map((_, i) => {
          const t = ((frame * 1.6 + i * 23) % 70) / 70;
          const x = 120 + i * 95 + Math.sin(i) * 40;
          return <rect key={i} x={x + (960 - x) * t} y={-20 + 560 * t} width={10} height={36} rx={4} fill={N.greenHi} opacity={(1 - t) * 0.8} style={{ filter: `blur(${1 + t * 2}px)` }} />;
        })}
      </svg>
      <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 110 }}>
        <Glass style={{ position: "relative", padding: "12px 44px 22px", opacity: k, scale: `${0.85 + 0.15 * k}` }} accent={N.green} sheenAt={chip}>
          <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 70, color: N.ink, lineHeight: 1.3 }}>
            পেছনে <span style={{ color: N.greenHi }}>এনভিডিয়ার চিপ</span>
          </div>
        </Glass>
      </AbsoluteFill>
      <HitFlash at={chip} color={N.greenHi} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ beat 5: documentary desk — Jensen, 33 years, RESIGNED */
const Resign: React.FC<{ readonly founder: number; readonly years: number; readonly stamp: number }> = ({ founder, years, stamp }) => {
  const frame = useCurrentFrame();
  const gray = interpolate(frame, [stamp, stamp + 12], [0, 0.9], clamp);
  const st = p01(frame, stamp, stamp + 7, ease.out);
  const line = p01(frame, years, years + 18, ease.inOut);
  return (
    <AbsoluteFill>
      <DocBg tint="#1d2321" spot={[62, 35]} />
      <Atmos seed="f" leak={0.25} bokeh={10} color="#ffcf8a" />
      <Cam push={0.05} drift={[12, 0]} rot={0.5} shakeAt={[stamp]} origin="50% 45%">
        <div style={{ position: "absolute", left: 96, top: 100 }}>
          <div style={{ display: "inline-block", background: N.red, color: "#fff", fontFamily: numFont, fontWeight: 900, fontSize: 28, padding: "6px 18px", letterSpacing: 5, opacity: 0.75 + 0.25 * Math.sin(frame / 4) }}>● BREAKING</div>
          <KText text="গত বৃহস্পতিবার" at={2} size={78} align="left" />
          <div style={{ fontFamily: headFont, fontWeight: 600, fontSize: 38, color: N.muted, marginTop: -14, opacity: p01(frame, 8, 20) }}>১২ নভেম্বর ২০২৬</div>
        </div>
        <PhotoCard src="nvidia/img/jensen_2010.jpg" x={1000} y={120} w={430} h={300} at={4} rot={-7} gray={gray} pos="50% 30%" caption="২০১০" />
        <PhotoCard src="nvidia/img/jensen_2016.jpg" x={1450} y={170} w={380} h={300} at={10} rot={5} gray={gray} pos="40% 30%" caption="২০১৬" />
        <PhotoCard src="nvidia/img/jensen_portrait.jpg" x={1130} y={290} w={450} h={540} at={founder - 8} rot={-2} gray={gray} pos="50% 25%" tape={false} />
        <div style={{ position: "absolute", left: 96, top: 420, opacity: p01(frame, founder - 6, founder + 8) }}>
          <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 84, color: N.ink, textShadow: "0 6px 30px #000" }}>জেনসেন হুয়াং</div>
          <div style={{ fontFamily: headFont, fontWeight: 600, fontSize: 40, color: N.greenHi }}>প্রতিষ্ঠাতা · সিইও</div>
        </div>
        <div style={{ position: "absolute", left: 96, top: 660, width: 820, opacity: p01(frame, years - 4, years + 6) }}>
          <div style={{ height: 6, width: 760 * line, background: `linear-gradient(90deg, ${N.green}, ${N.greenHi})`, boxShadow: `0 0 20px ${N.green}` }} />
          <div style={{ display: "flex", justifyContent: "space-between", width: 760, marginTop: 10, fontFamily: numFont, fontWeight: 900, fontSize: 40, color: N.ink }}>
            <span>1993</span>
            <span style={{ fontFamily: headFont, color: N.greenHi, fontSize: 52 }}>
              <Counter to={33} a={years} b={years + 18} fmt={(v) => String(Math.round(v)).replace(/\d/g, (c) => "০১২৩৪৫৬৭৮৯"[Number(c)])} style={{ fontFamily: headFont }} /> বছর
            </span>
            <span>2026</span>
          </div>
        </div>
        {frame >= stamp ? (
          <div
            style={{
              position: "absolute",
              left: 1150,
              top: 470,
              opacity: st,
              scale: `${2.2 - 1.2 * st}`,
              rotate: "-10deg",
              border: `9px solid ${N.red}`,
              color: N.red,
              fontFamily: headFont,
              fontWeight: 800,
              fontSize: 120,
              padding: "0 36px 14px",
              borderRadius: 16,
              background: "rgba(40,0,0,0.3)",
              textShadow: `0 0 30px ${N.red}aa`,
            }}
          >
            পদত্যাগ
          </div>
        ) : null}
      </Cam>
      <HitFlash at={stamp} color="#ff8080" />
      {frame >= stamp && frame < stamp + 7 ? <GlitchBars amount={1 - (frame - stamp) / 7} /> : null}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ beat 6: কেন? → rewind to 1993 */
const WhyRewind: React.FC<{ readonly q2: number; readonly back: number }> = ({ q2, back }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const rw = p01(frame, back, durationInFrames, ease.in);
  const year = Math.round(2026 - 33 * rw);
  return (
    <AbsoluteFill>
      <Plate id="dc" from={5} rate={0.6} blur={6 + rw * 18} dim={0.55} drift={0.2} />
      <Atmos seed="g" color={N.amber} leak={0.35} />
      <Cam push={0.12} punch={[0, q2]}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: Math.max(0, 1 - rw * 7) }}>
          <KText text="কেন?" at={0} size={230} stagger={0} glow={`${N.ink}55`} />
          <div style={{ marginTop: -40 }}>
            <KText text="এখন কী হবে?" at={q2} size={86} color={N.amber} stagger={3} />
          </div>
        </AbsoluteFill>
      </Cam>
      {rw > 0 ? (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0 2px, transparent 2px 6px)", opacity: rw }} />
          <div style={{ fontFamily: numFont, fontWeight: 900, fontSize: 280, color: "#fff", opacity: Math.min(1, Math.max(0, (rw - 0.12) * 5)), textShadow: `0 0 70px ${N.green}`, letterSpacing: -6 }}>{year}</div>
          <div style={{ position: "absolute", top: 110, left: 120, fontFamily: numFont, fontWeight: 700, fontSize: 44, color: "#fff", letterSpacing: 6, opacity: Math.min(1, Math.max(0, (rw - 0.12) * 5)) }}>◀◀ REWIND</div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ assembly */
export const H1Hook: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  const at = useAt(H1_ID);
  const f = (s: number) => Math.round(s * fps);

  const bBd = f(at("বাংলাদেশের") - 0.3);
  const bNv = f(at("কোম্পানির") - 0.1);
  const bAsk = f(at("আপনি") - 0.15);
  const bChip = f(at("বানায়") - 0.25);
  const bNews = f(at("বৃহস্পতিবার") - 0.5);
  const bWhy = f(at("কেন") - 0.1);

  const beats: Beat[] = [
    { at: 0, name: "market crash", node: <Market crashAt={f(at("ট্রিলিয়ন")) - 22} hit={f(at("ট্রিলিয়ন"))} /> },
    { at: bBd, trans: "zoom", name: "bangladesh", node: <Bangladesh three={f(at("তিন")) - bBd} sum={f(at("অর্থনীতির")) - bBd} /> },
    { at: bNv, trans: "flash", name: "nvidia 3D", node: <NvidiaReveal name={f(at("এনভিডিয়া")) - bNv} /> },
    { at: bAsk, trans: "whip", name: "ask AI", node: <AskAI answerAt={f(at("উত্তরটা")) - bAsk} /> },
    { at: bChip, trans: "zoom", name: "3D tray", node: <BehindIt chip={f(at("চিপ।")) - bChip} /> },
    { at: bNews, trans: "glitch", name: "resign", node: <Resign founder={f(at("প্রতিষ্ঠাতা")) - bNews} years={f(at("৩৩")) - bNews} stamp={f(at("পদত্যাগ")) - bNews} /> },
    { at: bWhy, trans: "whipL", name: "why + rewind", node: <WhyRewind q2={f(at("এখন")) - bWhy} back={f(at("শুরু")) - bWhy} /> },
  ];

  return (
    <AbsoluteFill style={{ background: N.bg }}>
      <Beats beats={beats} end={durationInFrames} />
    </AbsoluteFill>
  );
};
