/**
 * P6 — Nov 12 resignation, interim CEO, market reaction, Congress (254.6 → 294.6 s). STYLE v2, cold documentary grade.
 *  1 এরপর ১২ নভেম্বর, বৃহস্পতিবার        desk calendar flips ৮ → ১২, red ring
 *  2 এনভিডিয়া জানায়, জেনসেন … সিইও, বোর্ড  grey Jensen print, name + role glasses
 *  3 দুই জায়গা থেকেই পদত্যাগ              spot-lit empty chair, roles struck, stamp
 *  4 কারণ … বলেনি                        "কারণ?" + glass over blue 3D plate
 *  5 আপাতত … কলেট ক্রেস                  Kress print + name glass
 *  6 নতুন স্থায়ী সিইও খোঁজা হচ্ছে          candidate "?" cards + scanning magnifier
 *  7 শুরুতেই তেরো শতাংশ                  glass intraday chart, −13% hit
 *  8 দিনের শেষে চার শতাংশ                 same chart, new angle, recovery to −4%
 *  9 অক্টোবরের চূড়া … ১.৬ ট্রিলিয়ন         3D chip macro plate (red grade), $5.8T → −$1.6T
 * 10 কংগ্রেস … তারিখ এখনো ঠিক হয়নি        glowing drawn Capitol, question + date glass
 */
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Atmos, Beats, Cam, Counter, Glass, GlitchBars, HitFlash, KText, PhotoCard, Plate, p01, type Beat } from "../kit";
import { N, clamp, ease, headFont, numFont } from "../theme";
import { COOL, Calendar, ColdDesk, ColdPlate, Stamp } from "../two/P5_common";
import type { Cue } from "../types";
import { useAt } from "../vo";

export const P6_ID = "P6";
export const P6_KEYWORDS = ["পদত্যাগ", "কলেট", "ক্রেস", "তেরো", "ট্রিলিয়ন", "কংগ্রেসও"];

export const P6_CUES: Cue[] = [
  { sfx: "news_sting", word: "১২", offset: -0.2, volume: 0.8 },
  { sfx: "camera_shutter", word: "জেনসেন", offset: -0.1, volume: 0.6 },
  { sfx: "power_down", word: "পদত্যাগ", offset: -0.1, volume: 0.8 },
  { sfx: "ui_pop", word: "কলেট" },
  { sfx: "whoosh", word: "নতুন", offset: -0.2, volume: 0.6 },
  { sfx: "drop_down", word: "তেরো", offset: -0.1 },
  { sfx: "swoosh_up", word: "চার", offset: -0.2, volume: 0.6 },
  { sfx: "riser_short", word: "ট্রিলিয়ন", offset: -0.9, volume: 0.6 },
  { sfx: "impact_deep", word: "ট্রিলিয়ন" },
  { sfx: "whoosh", word: "আমেরিকার", offset: -0.2, volume: 0.7 },
  { sfx: "tick", word: "তারিখ", volume: 0.8 },
];

/* ---------------------------------------------------------------- 1 date */
const DateBeat: React.FC<{ readonly flip: number; readonly wd: number }> = ({ flip, wd }) => (
  <AbsoluteFill>
    <ColdDesk seed="e1" spot={[50, 42]} />
    <Cam push={0.14} drift={[0, -10]} rot={0.8} punch={[flip]}>
      <AbsoluteFill style={{ perspective: 1500, justifyContent: "center", alignItems: "center", paddingBottom: 150 }}>
        <div style={{ transform: "rotateX(14deg) rotateZ(3deg)" }}>
          <Calendar days={["৮", "১২"]} flips={[0, flip]} weekday="বৃহস্পতিবার" weekdayAt={wd} ring={wd + 3} />
        </div>
      </AbsoluteFill>
    </Cam>
  </AbsoluteFill>
);

/* ---------------------------------------------------------------- shared role pill */
const Role: React.FC<{ readonly label: string; readonly at: number; readonly strike?: number }> = ({ label, at, strike = 1e9 }) => {
  const frame = useCurrentFrame();
  const k = p01(frame, at - 3, at + 10);
  const s = p01(frame, strike, strike + 10);
  return (
    <div style={{ position: "relative", width: 250, height: 100, opacity: k, translate: `0 ${(1 - k) * 30}px` }}>
      <Glass accent={s > 0 ? N.red : COOL} sheenAt={at} style={{ inset: 0 }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "center", alignItems: "center", fontFamily: headFont, fontWeight: 800, fontSize: 52, color: N.ink, paddingBottom: 6, opacity: 1 - 0.45 * s }}>{label}</div>
      </Glass>
      <div style={{ position: "absolute", left: -10, top: 47, height: 7, width: 270 * s, background: N.red, borderRadius: 4, boxShadow: `0 0 16px ${N.red}` }} />
    </div>
  );
};

/* ---------------------------------------------------------------- 2 Jensen + roles */
const WhoBeat: React.FC<{ readonly name: number; readonly ceo: number; readonly board: number }> = ({ name, ceo, board }) => (
  <AbsoluteFill>
    <ColdDesk seed="e2" spot={[64, 40]} />
    <Cam push={0.1} drift={[-40, 0]} rot={-0.6} punch={[name]} origin="60% 45%">
      <PhotoCard src="nvidia/img/jensen_portrait.jpg" x={1110} y={110} w={540} h={660} at={0} rot={-3} gray={0.85} pos="50% 25%" />
      <div style={{ position: "absolute", left: 110, top: 160, width: 900 }}>
        <div style={{ fontFamily: headFont, fontWeight: 700, fontSize: 40, color: "#b9c4cf", lineHeight: 1.35 }}>এনভিডিয়া জানায়</div>
        <KText text="জেনসেন হুয়াং" at={name - 3} size={104} align="left" />
      </div>
      <div style={{ position: "absolute", left: 110, top: 470, display: "flex", gap: 26 }}>
        <Role label="সিইও" at={ceo} />
        <Role label="বোর্ড" at={board} />
      </div>
    </Cam>
  </AbsoluteFill>
);

/* ---------------------------------------------------------------- 3 empty chair */
const ChairBeat: React.FC<{ readonly resign: number }> = ({ resign }) => {
  const frame = useCurrentFrame();
  const flick = frame >= resign && frame < resign + 4 ? 0.4 : 1;
  const light = p01(frame, 0, 10) * flick * (frame >= resign ? 0.8 : 1);
  return (
    <AbsoluteFill style={{ background: "#05070a" }}>
      <ColdDesk seed="e3" spot={[50, 70]} />
      <Cam push={0.12} drift={[0, -20]} punch={[resign]} shakeAt={[resign]} origin="50% 60%">
        <AbsoluteFill style={{ opacity: light, background: "radial-gradient(ellipse 380px 110px at 50% 80%, rgba(190,215,235,0.32), transparent 70%)" }} />
        <AbsoluteFill style={{ opacity: 0.6 * light, background: "linear-gradient(180deg, rgba(190,215,235,0.34), rgba(190,215,235,0.03))", clipPath: "polygon(44% 0%, 56% 0%, 72% 84%, 28% 84%)", filter: "blur(20px)" }} />
        <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
          <defs>
            <linearGradient id="p6seat" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#0b0e11" />
              <stop offset="0.5" stopColor="#323b43" />
              <stop offset="1" stopColor="#0b0e11" />
            </linearGradient>
            <linearGradient id="p6rim" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#c9dcec" stopOpacity="0.9" />
              <stop offset="1" stopColor="#c9dcec" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g opacity={0.4 + 0.6 * light} style={{ filter: "drop-shadow(0 40px 40px rgba(0,0,0,0.8))" }}>
            <path d="M820 250 Q960 220 1100 250 L1112 560 Q960 585 808 560 Z" fill="url(#p6seat)" stroke="url(#p6rim)" strokeWidth={4} />
            <path d="M860 300 Q960 282 1060 300 M860 420 Q960 402 1060 420" stroke="#3d464e" strokeWidth={3} fill="none" />
            <rect x={760} y={560} width={60} height={30} rx={12} fill="#22282d" stroke="#6f7b85" strokeWidth={2} />
            <rect x={1100} y={560} width={60} height={30} rx={12} fill="#22282d" stroke="#6f7b85" strokeWidth={2} />
            <path d="M780 590 Q960 560 1140 590 L1120 650 Q960 672 800 650 Z" fill="url(#p6seat)" stroke="url(#p6rim)" strokeWidth={3} />
            <rect x={948} y={660} width={24} height={110} fill="#3a4148" />
            <path d="M960 770 L800 820 M960 770 L1120 820 M960 770 L880 835 M960 770 L1040 835" stroke="#3a4148" strokeWidth={16} strokeLinecap="round" />
          </g>
        </svg>
        <div style={{ position: "absolute", left: 120, top: 330, display: "flex", flexDirection: "column", gap: 22 }}>
          <Role label="সিইও" at={-20} strike={resign} />
          <Role label="বোর্ড" at={-20} strike={resign + 4} />
        </div>
        <Stamp at={resign} text="পদত্যাগ" size={110} rot={-7} style={{ left: 1260, top: 330 }} />
        <div style={{ position: "absolute", left: 1220, top: 520, width: 560, textAlign: "center", opacity: p01(frame, resign + 8, resign + 20), fontFamily: headFont, fontWeight: 700, fontSize: 36, color: "#c9d3dc", lineHeight: 1.35 }}>
          দুই পদ থেকেই
        </div>
      </Cam>
      <HitFlash at={resign} color="#ff9a9a" />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 4 no official reason */
const NoReason: React.FC<{ readonly said: number }> = ({ said }) => {
  const frame = useCurrentFrame();
  const k = p01(frame, said - 4, said + 10);
  return (
    <AbsoluteFill>
      <ColdPlate from={3} blur={12} dim={0.55} seed="e4" />
      <Cam push={0.12} drift={[20, -10]} punch={[said]}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 300 }}>
          <KText text="কারণ?" at={0} size={200} stagger={0} color="#dfe6ec" glow="rgba(127,166,201,0.5)" />
        </AbsoluteFill>
        <div style={{ position: "absolute", left: 360, top: 560, width: 1200, height: 140, opacity: k, scale: `${0.92 + 0.08 * k}`, perspective: 1400 }}>
          <Glass accent={COOL} sheenAt={said} style={{ inset: 0, transform: "rotateX(8deg)" }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "center", alignItems: "center", fontFamily: headFont, fontWeight: 800, fontSize: 64, color: N.ink, paddingBottom: 8 }}>
              আনুষ্ঠানিক কারণ জানানো হয়নি
            </div>
          </Glass>
        </div>
      </Cam>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 5 Kress */
const KressBeat: React.FC<{ readonly cfo: number; readonly name: number }> = ({ cfo, name }) => {
  const frame = useCurrentFrame();
  const c = p01(frame, cfo - 3, cfo + 10);
  return (
    <AbsoluteFill>
      <ColdDesk seed="e5" spot={[36, 40]} />
      <Cam push={0.1} drift={[30, -10]} rot={0.5} punch={[name]} origin="35% 45%">
        <PhotoCard src="nvidia/img/kress.png" x={170} y={110} w={500} h={660} at={0} rot={-3} pos="50% 20%" />
        <div style={{ position: "absolute", left: 790, top: 150 }}>
          <KText text="আপাতত দায়িত্বে" at={0} size={52} color="#b9c4cf" align="left" />
        </div>
        <div style={{ position: "absolute", left: 790, top: 280 }}>
          <KText text="কলেট ক্রেস" at={name - 2} size={120} align="left" glow={`${N.green}44`} />
          <div style={{ fontFamily: numFont, fontWeight: 700, fontSize: 34, color: N.muted, letterSpacing: 4, marginTop: -10, opacity: p01(frame, name + 6, name + 16) }}>COLETTE KRESS</div>
        </div>
        <div style={{ position: "absolute", left: 790, top: 570, width: 960, height: 120, opacity: c, translate: `${(1 - c) * 40}px 0`, perspective: 1400 }}>
          <Glass accent={N.green} sheenAt={cfo} style={{ inset: 0, transform: "rotateY(-8deg)" }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", paddingLeft: 40, gap: 18, fontFamily: headFont, fontWeight: 800, fontSize: 50, color: N.ink, paddingBottom: 6 }}>
              অর্থ প্রধান <span style={{ color: N.muted, fontFamily: numFont }}>→</span> <span style={{ color: N.greenHi }}>অন্তর্বর্তী সিইও</span>
            </div>
          </Glass>
        </div>
      </Cam>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 6 search for a permanent CEO */
const Search: React.FC<{ readonly perm: number }> = ({ perm }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const sx = interpolate(frame, [0, durationInFrames], [380, 1500], { ...clamp, easing: ease.inOut });
  return (
    <AbsoluteFill>
      <ColdPlate from={6} blur={14} dim={0.6} seed="e6" />
      <Cam push={0.1} drift={[-30, 0]} punch={[perm]}>
        <div style={{ position: "absolute", top: 90, width: "100%" }}>
          <KText text="নতুন স্থায়ী সিইও খোঁজা হচ্ছে" at={0} size={78} stagger={4} />
        </div>
        <AbsoluteFill style={{ perspective: 1600 }}>
          {[0, 1, 2, 3, 4].map((i) => {
            const k = p01(frame, 4 + i * 4, 18 + i * 4);
            const x = 300 + i * 270;
            const lit = Math.max(0, 1 - Math.abs(sx - (x + 110)) / 200);
            return (
              <div key={i} style={{ position: "absolute", left: x, top: 380 + (i % 2) * 30, width: 220, height: 300, opacity: k, translate: `0 ${(1 - k) * 60}px`, transform: `rotateY(${(i - 2) * -9}deg)` }}>
                <Glass accent={lit > 0.3 ? N.amber : COOL} style={{ inset: 0 }}>
                  <svg viewBox="0 0 220 300" style={{ position: "absolute", inset: 0 }}>
                    <circle cx={110} cy={110} r={46} fill={`rgba(200,215,230,${0.18 + 0.3 * lit})`} />
                    <path d="M40 260 Q40 175 110 170 Q180 175 180 260 Z" fill={`rgba(200,215,230,${0.18 + 0.3 * lit})`} />
                    <text x={110} y={128} textAnchor="middle" fontFamily={numFont} fontWeight={900} fontSize={56} fill={lit > 0.3 ? N.amber : "#dfe6ec"}>?</text>
                  </svg>
                </Glass>
              </div>
            );
          })}
          <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
            <g transform={`translate(${sx} 560)`} style={{ filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.6))" }}>
              <circle r={95} fill="rgba(200,225,245,0.10)" stroke="#2b2f33" strokeWidth={16} />
              <circle r={95} fill="none" stroke="#c8cdd2" strokeWidth={4} />
              <line x1={70} y1={70} x2={160} y2={160} stroke="#2b2f33" strokeWidth={28} strokeLinecap="round" />
            </g>
          </svg>
        </AbsoluteFill>
      </Cam>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 7 + 8 intraday chart */
const CANDLES: [number, number, number, number][] = [
  // [open, close, high, low] in % vs previous close: crash to −13 at the open, recover to −4 by the close
  [0, -9.5, 0, -10.5],
  [-9.5, -13, -9, -13.4],
  [-13, -11.2, -10.6, -13.1],
  [-11.2, -9.6, -9.1, -11.8],
  [-9.6, -10.4, -9.2, -11],
  [-10.4, -8.1, -7.9, -10.6],
  [-8.1, -7.2, -6.6, -8.6],
  [-7.2, -7.9, -6.9, -8.4],
  [-7.9, -6.0, -5.7, -8.1],
  [-6.0, -5.1, -4.8, -6.3],
  [-5.1, -5.6, -4.9, -5.9],
  [-5.6, -4.3, -4.1, -5.8],
  [-4.3, -4.0, -3.8, -4.6],
];
const CW = 1500;
const X0 = 110;
const DX = 105;
const Y = (v: number) => 120 + (-v / 14) * 460;

/** `drawn(i)` 0..1 per candle; `l13` / `l4` label progress. */
const Chart: React.FC<{ readonly drawn: (i: number) => number; readonly l13: number; readonly l4: number; readonly day: number; readonly accent: string }> = ({ drawn, l13, l4, day, accent }) => (
  <Glass accent={accent} style={{ left: 0, top: 0, width: CW, height: 680 }}>
    <div style={{ position: "absolute", left: 36, top: 22, fontFamily: numFont, fontWeight: 900, fontSize: 38, color: N.ink, letterSpacing: 2 }}>
      NVDA <span style={{ color: N.muted, fontWeight: 500, fontSize: 26 }}>· ১২ নভেম্বর · INTRADAY</span>
    </div>
    <svg viewBox={`0 0 ${CW} 680`} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <filter id="p6gl">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <linearGradient id="p6red" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff6b6b" />
          <stop offset="1" stopColor="#b3141c" />
        </linearGradient>
        <linearGradient id="p6grn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={N.greenHi} />
          <stop offset="1" stopColor="#3f6b00" />
        </linearGradient>
      </defs>
      {[0, -4, -8, -13].map((v) => (
        <g key={v}>
          <line x1={90} x2={CW - 40} y1={Y(v)} y2={Y(v)} stroke={v === 0 ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.08)"} strokeDasharray={v === 0 ? "0" : "6 10"} />
          <text x={78} y={Y(v) + 9} textAnchor="end" fill={N.muted} fontFamily={numFont} fontWeight={700} fontSize={24}>
            {v === 0 ? "0%" : `${v}%`}
          </text>
        </g>
      ))}
      {CANDLES.map(([o, c, h, l], i) => {
        const p = drawn(i);
        if (p <= 0) return null;
        const x = X0 + 40 + i * DX;
        const up = c > o;
        const top = Y(Math.max(o, c));
        const bot = Y(Math.min(o, c));
        return (
          <g key={i} opacity={p} transform={`translate(0 ${(1 - p) * -24})`}>
            <rect x={x - 30} y={top} width={60} height={Math.max(6, bot - top)} rx={5} fill={up ? N.green : N.red} filter="url(#p6gl)" opacity={0.6} />
            <line x1={x} x2={x} y1={Y(h)} y2={Y(l)} stroke={up ? N.greenHi : "#ff7a7a"} strokeWidth={4} />
            <rect x={x - 28} y={top} width={56} height={Math.max(6, bot - top)} rx={5} fill={up ? "url(#p6grn)" : "url(#p6red)"} />
          </g>
        );
      })}
      <text x={X0 + 40} y={660} textAnchor="middle" fill={N.muted} fontFamily={headFont} fontWeight={700} fontSize={28}>শুরু</text>
      <text x={X0 + 40 + 12 * DX} y={660} textAnchor="middle" fill={N.muted} fontFamily={headFont} fontWeight={700} fontSize={28} opacity={day}>দিনের শেষ</text>
    </svg>
    <div style={{ position: "absolute", left: X0 + 40 + DX + 70, top: Y(-13) - 80, opacity: l13, scale: `${1.5 - 0.5 * l13}`, transformOrigin: "left center", display: "flex", alignItems: "baseline", gap: 16 }}>
      <span style={{ fontFamily: numFont, fontWeight: 900, fontSize: 120, color: "#fff", WebkitTextStroke: `3px ${N.red}`, textShadow: `0 0 50px ${N.red}, 0 10px 30px #000` }}>−13%</span>
      <span style={{ fontFamily: headFont, fontWeight: 800, fontSize: 44, color: N.ink }}>শুরুতেই</span>
    </div>
    <div style={{ position: "absolute", left: X0 + 40 + 12 * DX - 440, top: Y(-4) - 210, width: 460, textAlign: "right", opacity: l4, scale: `${1.4 - 0.4 * l4}`, transformOrigin: "right center" }}>
      <div style={{ fontFamily: numFont, fontWeight: 900, fontSize: 110, color: "#ffd0c8", textShadow: `0 0 40px ${N.red}aa, 0 10px 30px #000` }}>−4%</div>
      <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 40, color: N.ink, lineHeight: 1.3 }}>দিন শেষে</div>
    </div>
  </Glass>
);

const OpenCrash: React.FC<{ readonly low: number }> = ({ low }) => {
  const frame = useCurrentFrame();
  const drawn = (i: number) => (i < 3 ? p01(frame, low - 22 + i * 10, low - 12 + i * 10) : 0);
  return (
    <AbsoluteFill>
      <Plate id="dc" from={2} blur={14} dim={0.6} tint="#c07070" />
      <Atmos color={N.red} color2="#2a4f8f" leak={0.4} bokeh={14} seed="e7" />
      <Cam push={0.14} drift={[-40, -10]} rot={-0.8} punch={[low]} shakeAt={[low]}>
        <AbsoluteFill style={{ perspective: 1700 }}>
          <div style={{ position: "absolute", left: 210, top: 120, width: CW, height: 680, transform: "rotateX(10deg) rotateY(-10deg)", transformOrigin: "50% 100%" }}>
            <Chart drawn={drawn} l13={p01(frame, low, low + 10)} l4={0} day={0} accent={N.red} />
          </div>
        </AbsoluteFill>
      </Cam>
      <HitFlash at={low} color="#ff9a9a" />
      {frame >= low && frame < low + 6 ? <GlitchBars amount={1 - (frame - low) / 6} /> : null}
    </AbsoluteFill>
  );
};

const Recover: React.FC<{ readonly endDay: number; readonly close: number }> = ({ endDay, close }) => {
  const frame = useCurrentFrame();
  const step = Math.max(3, (close - 6) / 10);
  const drawn = (i: number) => (i < 3 ? 1 : p01(frame, 2 + (i - 3) * step, 10 + (i - 3) * step));
  return (
    <AbsoluteFill>
      <Plate id="dc" from={5} blur={14} dim={0.6} tint="#a08080" />
      <Atmos color={N.red} color2="#2a4f8f" leak={0.35} bokeh={14} seed="e8" />
      <Cam push={0.1} drift={[40, -10]} rot={0.6} punch={[close]}>
        <AbsoluteFill style={{ perspective: 1700 }}>
          <div style={{ position: "absolute", left: 210, top: 120, width: CW, height: 680, transform: "rotateX(8deg) rotateY(10deg)", transformOrigin: "50% 100%" }}>
            <Chart drawn={drawn} l13={1} l4={p01(frame, close, close + 10)} day={p01(frame, endDay, endDay + 12)} accent={N.red} />
          </div>
        </AbsoluteFill>
      </Cam>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 9 since peak: −$1.6T */
const SincePeak: React.FC<{ readonly peak: number; readonly hit: number }> = ({ peak, hit }) => {
  const frame = useCurrentFrame();
  const pk = p01(frame, peak - 3, peak + 10);
  const big = p01(frame, hit, hit + 8);
  return (
    <AbsoluteFill>
      <Plate id="chipmacro" from={1} rate={0.8} blur={4 + 6 * big} dim={0.45 + 0.15 * big} tint="#d08080" />
      <Atmos color={N.red} color2="#2a4f8f" leak={0.4} bokeh={16} seed="e9" />
      <Cam push={0.12} drift={[-20, -10]} punch={[peak, hit]} shakeAt={[hit]}>
        <div style={{ position: "absolute", left: 120, top: 100, width: 560, height: 210, opacity: pk, translate: `${(1 - pk) * -40}px 0` }}>
          <Glass accent={N.green} sheenAt={peak} style={{ inset: 0 }}>
            <div style={{ position: "absolute", left: 34, top: 16, fontFamily: headFont, fontWeight: 700, fontSize: 38, color: "#c9d3dc" }}>অক্টোবরের চূড়া</div>
            <div style={{ position: "absolute", left: 34, top: 70, fontFamily: numFont, fontWeight: 900, fontSize: 100, color: N.greenHi, letterSpacing: -2 }}>$5.8T</div>
          </Glass>
          <div style={{ position: "absolute", left: 24, top: 128, height: 9, width: 330 * p01(frame, hit, hit + 8), background: N.red, borderRadius: 5, rotate: "-6deg", boxShadow: `0 0 16px ${N.red}` }} />
        </div>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingTop: 80 }}>
          <div style={{ position: "relative", opacity: p01(frame, peak + 4, peak + 14), scale: `${1 + 0.4 * Math.exp(-Math.max(0, frame - hit) / 4) * (frame >= hit ? 1 : 0)}` }}>
            <div style={{ fontFamily: numFont, fontWeight: 900, fontSize: 230, letterSpacing: -8, color: "#fff", WebkitTextStroke: `3px ${N.red}`, textShadow: `0 0 ${40 + 50 * big}px ${N.red}, 0 20px 60px #000` }}>
              −$<Counter from={0} to={1.6} a={peak + 6} b={hit} fmt={(v) => v.toFixed(1)} style={{ fontWeight: 900 }} />T
            </div>
            <div style={{ textAlign: "center", fontFamily: headFont, fontWeight: 800, fontSize: 52, color: N.ink, marginTop: -16, opacity: big, textShadow: "0 4px 20px #000" }}>
              চূড়া থেকে এখন পর্যন্ত কমেছে
            </div>
          </div>
        </AbsoluteFill>
      </Cam>
      <HitFlash at={hit} color="#ff9a9a" />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 10 Congress */
const Congress: React.FC<{ readonly cong: number; readonly ask: number; readonly date: number }> = ({ cong, ask, date }) => {
  const frame = useCurrentFrame();
  const draw = p01(frame, 0, 30, ease.inOut);
  const fill = p01(frame, 20, 40);
  const d = p01(frame, date - 3, date + 8);
  const line = { fill: `rgba(159,195,221,${0.12 * fill})`, stroke: "#bcd6ea", strokeWidth: 4, pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - draw } as const;
  return (
    <AbsoluteFill>
      <ColdPlate from={4} blur={16} dim={0.65} seed="e10" />
      <Cam push={0.12} drift={[-30, -10]} punch={[cong, date]} origin="40% 55%">
        <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, filter: "drop-shadow(0 0 14px rgba(127,166,201,0.7))" }}>
          <g transform="translate(-300 60)">
            <rect x={560} y={640} width={1000} height={40} {...line} />
            <rect x={600} y={560} width={300} height={80} {...line} />
            <rect x={1220} y={560} width={300} height={80} {...line} />
            <rect x={880} y={500} width={360} height={140} {...line} />
            {[910, 960, 1010, 1060, 1110, 1160, 1210].map((x) => (
              <line key={x} x1={x} x2={x} y1={520} y2={640} stroke="#bcd6ea" strokeWidth={4} opacity={draw} />
            ))}
            {[630, 690, 750, 810, 870, 1250, 1310, 1370, 1430, 1490].map((x) => (
              <line key={x} x1={x} x2={x} y1={575} y2={630} stroke="#bcd6ea" strokeWidth={3} opacity={0.6 * draw} />
            ))}
            <path d="M870 500 L1060 440 L1250 500 Z" {...line} />
            <rect x={960} y={360} width={200} height={80} {...line} />
            <path d="M940 362 Q1060 180 1180 362 Z" {...line} />
            <rect x={1048} y={200} width={24} height={60} {...line} />
            <circle cx={1060} cy={190} r={12} {...line} />
          </g>
        </svg>
        <div style={{ position: "absolute", left: 1000, top: 150, width: 820 }}>
          <KText text="মার্কিন কংগ্রেস" at={cong - 3} size={90} align="left" />
          <div style={{ fontFamily: numFont, fontWeight: 700, fontSize: 30, color: N.muted, letterSpacing: 4, marginTop: -10, opacity: p01(frame, cong + 6, cong + 16) }}>U.S. CONGRESS</div>
          <div style={{ marginTop: 20 }}>
            <KText text="হুয়াংকে ডেকে প্রশ্ন করতে চায়" at={ask - 3} size={54} align="left" color="#c9dcec" />
          </div>
        </div>
        <div style={{ position: "absolute", left: 1000, top: 560, width: 700, height: 130, opacity: d, scale: `${1.15 - 0.15 * d}`, transformOrigin: "left center" }}>
          <Glass accent={N.amber} sheenAt={date} style={{ inset: 0, border: `2px solid ${N.amber}aa` }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", gap: 22, paddingLeft: 34, paddingBottom: 6 }}>
              <svg viewBox="0 0 60 60" width={64} height={64}>
                <rect x={4} y={10} width={52} height={46} rx={6} fill="none" stroke={N.amber} strokeWidth={5} />
                <line x1={4} y1={24} x2={56} y2={24} stroke={N.amber} strokeWidth={5} />
                <text x={30} y={51} textAnchor="middle" fontFamily={numFont} fontWeight={900} fontSize={24} fill={N.amber}>?</text>
              </svg>
              <span style={{ fontFamily: headFont, fontWeight: 800, fontSize: 54, color: N.amber }}>তারিখ এখনো ঠিক হয়নি</span>
            </div>
          </Glass>
        </div>
      </Cam>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- assembly */
export const P6Scene: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  const at = useAt(P6_ID);
  const f = (s: number) => Math.round(s * fps);
  const w = (word: string, nth = 0) => f(at(word, nth));

  const b2 = f(at("এনভিডিয়া") - 0.25);
  const b3 = f(at("দুই") - 0.15);
  const b4 = f(at("কারণ") - 0.15);
  const b5 = f(at("আপাতত") - 0.2);
  const b6 = f(at("নতুন") - 0.15);
  const b7 = f(at("খবর") - 0.25);
  const b8 = f(at("দিনের") - 0.15);
  const b9 = f(at("আর") - 0.1);
  const b10 = f(at("আমেরিকার") - 0.2);

  const beats: Beat[] = [
    { at: 0, name: "date", node: <DateBeat flip={w("১২")} wd={w("বৃহস্পতিবার")} /> },
    { at: b2, trans: "whip", name: "who", node: <WhoBeat name={w("জেনসেন") - b2} ceo={w("সিইও") - b2} board={w("বোর্ড") - b2} /> },
    { at: b3, trans: "zoom", name: "empty chair", node: <ChairBeat resign={w("পদত্যাগ") - b3} /> },
    { at: b4, trans: "blur", name: "no reason", node: <NoReason said={w("আনুষ্ঠানিকভাবে") - b4} /> },
    { at: b5, trans: "whipL", name: "kress", node: <KressBeat cfo={w("অর্থ") - b5} name={w("কলেট") - b5} /> },
    { at: b6, trans: "slideUp", name: "search", node: <Search perm={w("স্থায়ী") - b6} /> },
    { at: b7, trans: "zoom", name: "−13%", node: <OpenCrash low={w("তেরো") - b7} /> },
    { at: b8, trans: "whip", name: "−4%", node: <Recover endDay={w("শেষে") - b8} close={w("চার") - b8} /> },
    { at: b9, trans: "flash", name: "−1.6T", node: <SincePeak peak={w("অক্টোবরের") - b9} hit={w("ট্রিলিয়ন") - b9} /> },
    { at: b10, trans: "whipL", name: "congress", node: <Congress cong={w("কংগ্রেসও") - b10} ask={w("ডেকে") - b10} date={w("তারিখ") - b10} /> },
  ];

  return (
    <AbsoluteFill style={{ background: N.bg }}>
      <Beats beats={beats} end={durationInFrames} />
    </AbsoluteFill>
  );
};
