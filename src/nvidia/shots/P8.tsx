/**
 * P8 v2 — what it means for us + lesson + outro (346.8 → 384.5 s). VO ends at "লিখুন" (~380.6 s);
 * the update/follow end card is on-screen only and holds to the end.
 *  1 "বাংলাদেশে বসে … কী লাভ?"     3D Bangladesh map flies in, Dhaka pulse, question
 *  2 "পড়া বোঝেন, ছবি বানান, ফ্রিল্যান্সিং" three tilted screens toss in: student, phone image-gen, freelancer
 *  3 "বেশিরভাগ চলে এনভিডিয়ার চিপে" screens shrink, glowing wires into the 3D chip macro
 *  4 "দুলে উঠলে, দুলে ওঠে পুরো AI দুনিয়া"  data centre shakes red, AI apps wobble
 *  5 "কত সস্তা, কত দ্রুত … নির্ভর"     price + speed gauges wired to NVIDIA  (+ disclaimer pill)
 *  6 "আর একটা শিক্ষা"               lesson title card
 *  7 "যত বড়ই হোক … নড়ে যায়"        tall NVIDIA tower balanced on one person → crack → wobble
 *  8 "হুয়াংকে ছাড়াও AI-এর রাজা?"      crown over NVIDIA, Jensen print greys, "?" → comment bubble
 *  9 end card                       "১৭ নভেম্বরের পর আপডেট পর্ব আসছে" + bell + follow click, held
 */
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Atmos, Beats, Cam, DocBg, Glass, GlitchBars, HitFlash, KText, Marker, PhotoCard, Plate, p01, type Beat } from "../kit";
import { N, clamp, ease, headFont, numFont } from "../theme";
import { BD_PATH, BD_VIEWBOX } from "../two/bdPath";
import type { Cue } from "../types";
import { useAt } from "../vo";

export const P8_ID = "P8";

export const P8_KEYWORDS = ["বাংলাদেশে", "এনভিডিয়ার", "দুনিয়া।", "শিক্ষা।", "রাজা"];

export const P8_CUES: Cue[] = [
  { sfx: "whoosh_big", word: "এবার", offset: -0.3, volume: 0.8 },
  { sfx: "ui_pop", word: "লাভ" },
  { sfx: "ui_pop", word: "পড়া", volume: 0.6 },
  { sfx: "ui_pop", word: "ছবি", volume: 0.6 },
  { sfx: "ui_pop", word: "ফ্রিল্যান্সিংয়ের", volume: 0.6 },
  { sfx: "data_stream", word: "বেশিরভাগ", volume: 0.6 },
  { sfx: "power_on", word: "এনভিডিয়ার", volume: 0.8 },
  { sfx: "impact_deep", word: "দুলে", nth: 1 },
  { sfx: "tick", word: "সস্তা", volume: 0.6 },
  { sfx: "tick", word: "দ্রুত", volume: 0.6 },
  { sfx: "shimmer", word: "শিক্ষা", offset: -0.2, volume: 0.7 },
  { sfx: "hit_glitch", word: "ভুলে" },
  { sfx: "drop_down", word: "নড়ে", volume: 0.7 },
  { sfx: "impact", word: "রাজা" },
  { sfx: "ui_pop", word: "কমেন্টে" },
  { sfx: "shimmer", word: "লিখুন", offset: 0.5, volume: 0.7 },
  { sfx: "ui_click", word: "লিখুন", offset: 1.4, volume: 0.8 },
];

/* ---------------------------------------------------------------- 1 Bangladesh question */
const BdQuestion: React.FC<{ readonly bd: number; readonly q: number }> = ({ bd, q }) => {
  const frame = useCurrentFrame();
  const fly = p01(frame, 0, 26, ease.out);
  const pulse = (frame % 30) / 30;
  return (
    <AbsoluteFill>
      <Plate id="dc" from={4.5} blur={16} dim={0.62} />
      <Atmos seed="p8a" />
      <Cam push={0.1} drift={[30, -10]} punch={[q]}>
        <div
          style={{
            position: "absolute",
            left: 1080,
            top: 150,
            width: 450,
            height: 625,
            scale: `${2.6 - 1.6 * fly}`,
            rotate: `${(1 - fly) * 14}deg`,
            filter: fly < 1 ? `blur(${(1 - fly) * 12}px)` : undefined,
            transformOrigin: "50% 40%",
            opacity: Math.min(1, fly * 2),
          }}
        >
          <svg viewBox={BD_VIEWBOX} style={{ width: "100%", height: "100%", overflow: "visible" }}>
            <defs>
              <linearGradient id="p8bd" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor={N.greenHi} stopOpacity="0.95" />
                <stop offset="1" stopColor="#1e4d00" stopOpacity="0.95" />
              </linearGradient>
            </defs>
            {[22, 15, 8].map((o) => (
              <path key={o} d={BD_PATH} fill="#0a1a00" transform={`translate(${o * 0.6} ${o})`} opacity={0.85} />
            ))}
            <path d={BD_PATH} fill="url(#p8bd)" stroke={N.greenHi} strokeWidth={4} style={{ filter: `drop-shadow(0 0 24px ${N.green}aa)` }} />
          </svg>
          {/* Dhaka */}
          <div style={{ position: "absolute", left: "47%", top: "44%", opacity: p01(frame, bd, bd + 8) }}>
            <div style={{ position: "absolute", width: 22, height: 22, borderRadius: 11, background: "#fff", translate: "-50% -50%", boxShadow: `0 0 20px #fff, 0 0 40px ${N.greenHi}` }} />
            <div style={{ position: "absolute", width: 120 * pulse, height: 120 * pulse, borderRadius: "50%", border: "3px solid #fff", opacity: 1 - pulse, translate: "-50% -50%" }} />
            <div style={{ position: "absolute", left: 24, top: -30, fontFamily: headFont, fontWeight: 800, fontSize: 34, color: "#fff", textShadow: "0 3px 12px #000", whiteSpace: "nowrap", lineHeight: 1.3 }}>ঢাকা</div>
          </div>
        </div>
        <div style={{ position: "absolute", left: 96, top: 230, width: 900 }}>
          <KText text="এবার প্রশ্ন" at={2} size={52} color={N.muted} align="left" />
          <KText text="বাংলাদেশে বসে এগুলো জেনে" at={bd} size={66} align="left" />
          <KText text="আমার কী লাভ?" at={q} size={130} align="left" color={N.greenHi} glow={`${N.green}aa`} stagger={4} />
        </div>
      </Cam>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- screens used in 2 & 3 */
const Student: React.FC = () => {
  const frame = useCurrentFrame();
  const n = Math.floor(interpolate(frame, [4, 40], [0, 26], clamp));
  const text = "সালোকসংশ্লেষণ সহজ করে বোঝাও".slice(0, n);
  return (
    <div style={{ position: "absolute", inset: 0, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontFamily: numFont, fontWeight: 700, fontSize: 18, color: N.muted, letterSpacing: 2 }}>● AI TUTOR</div>
      <div style={{ alignSelf: "flex-end", background: `linear-gradient(135deg, ${N.greenHi}, ${N.green})`, color: "#081000", fontFamily: headFont, fontWeight: 700, fontSize: 24, borderRadius: "18px 18px 4px 18px", padding: "8px 16px 12px", lineHeight: 1.4, maxWidth: 330, minHeight: 40 }}>
        {text}
      </div>
      <div style={{ alignSelf: "flex-start", width: 300, display: "flex", flexDirection: "column", gap: 8, opacity: p01(frame, 40, 50) }}>
        {[1, 0.8, 0.9, 0.55].map((w, i) => (
          <div key={i} style={{ height: 12, width: `${w * 100}%`, borderRadius: 6, background: "rgba(255,255,255,0.25)" }} />
        ))}
      </div>
    </div>
  );
};

const ImageGen: React.FC = () => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [6, 50], [0, 100], clamp);
  return (
    <div style={{ position: "absolute", inset: 0, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontFamily: headFont, fontWeight: 700, fontSize: 20, color: N.ink, background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "4px 12px 8px", lineHeight: 1.4 }}>নদীতে নৌকা, সূর্যাস্ত</div>
      <div style={{ flex: 1, borderRadius: 14, overflow: "hidden", position: "relative", background: "#111" }}>
        <svg viewBox="0 0 200 260" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", clipPath: `inset(0 0 ${100 - reveal}% 0)` }}>
          <defs>
            <linearGradient id="p8sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2b1b5a" />
              <stop offset="0.55" stopColor="#ff7a3c" />
              <stop offset="1" stopColor="#ffcf6b" />
            </linearGradient>
          </defs>
          <rect width={200} height={150} fill="url(#p8sky)" />
          <circle cx={100} cy={140} r={30} fill="#ffe08a" />
          <rect y={150} width={200} height={110} fill="#1b3550" />
          {[165, 185, 210].map((y) => (
            <line key={y} x1={40} x2={160} y1={y} y2={y} stroke="#ffcf6b" strokeOpacity={0.5} strokeWidth={2} />
          ))}
          <path d="M60 180 L140 180 L128 194 L72 194 Z" fill="#0b0b0b" />
          <line x1={100} y1={180} x2={100} y2={140} stroke="#0b0b0b" strokeWidth={3} />
          <path d="M100 142 L124 176 L100 176 Z" fill="#0b0b0b" />
        </svg>
        {reveal < 100 ? <div style={{ position: "absolute", left: 0, right: 0, top: `${reveal}%`, height: 6, background: N.greenHi, boxShadow: `0 0 20px ${N.greenHi}` }} /> : null}
      </div>
    </div>
  );
};

const Freelance: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />
        ))}
        <div style={{ marginLeft: 14, fontFamily: numFont, fontWeight: 700, fontSize: 18, color: N.muted, letterSpacing: 1 }}>client_project · logo + website</div>
      </div>
      {Array.from({ length: 6 }).map((_, i) => {
        const k = p01(frame, 4 + i * 5, 12 + i * 5);
        return (
          <div key={i} style={{ display: "flex", gap: 10, opacity: k }}>
            <div style={{ width: 30 + (i % 3) * 20, height: 12, borderRadius: 6, background: i % 2 ? N.cyan : N.greenHi, opacity: 0.8 }} />
            <div style={{ width: 120 + ((i * 47) % 140), height: 12, borderRadius: 6, background: "rgba(255,255,255,0.28)" }} />
          </div>
        );
      })}
      <div style={{ marginTop: "auto", alignSelf: "flex-end", fontFamily: headFont, fontWeight: 800, fontSize: 24, color: "#081000", background: N.greenHi, borderRadius: 10, padding: "2px 16px 6px", lineHeight: 1.4, opacity: p01(frame, 38, 46) }}>
        ✓ ডেলিভারি সম্পন্ন
      </div>
    </div>
  );
};

const Screen: React.FC<{ readonly x: number; readonly y: number; readonly w: number; readonly h: number; readonly at: number; readonly label: string; readonly ry: number; readonly children: React.ReactNode; readonly radius?: number }> = ({
  x,
  y,
  w,
  h,
  at,
  label,
  ry,
  children,
  radius = 22,
}) => {
  const frame = useCurrentFrame();
  const k = p01(frame, at, at + 14);
  if (frame < at) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, opacity: k, transform: `translateY(${(1 - k) * 120}px) rotateY(${ry}deg) rotateZ(${(1 - k) * 8}deg) scale(${1.2 - 0.2 * k})` }}>
      <div
        style={{
          position: "relative",
          height: h,
          borderRadius: radius,
          background: "linear-gradient(160deg,#1a1f24,#07090b)",
          border: "3px solid #3a4148",
          boxShadow: `0 40px 90px rgba(0,0,0,0.7), 0 0 60px ${N.green}22, inset 0 0 0 6px #0b0d10`,
          overflow: "hidden",
        }}
      >
        <Sequence0 at={at}>{children}</Sequence0>
      </div>
      <div style={{ marginTop: 12, textAlign: "center", fontFamily: headFont, fontWeight: 800, fontSize: 38, color: "#fff", textShadow: "0 4px 18px #000", lineHeight: 1.3 }}>{label}</div>
    </div>
  );
};

/** shift the inner screen animation so it starts when the screen lands */
const Sequence0: React.FC<{ readonly at: number; readonly children: React.ReactNode }> = ({ at, children }) => {
  return (
    <Sequence from={at} layout="none">
      {children}
    </Sequence>
  );
};

/* ---------------------------------------------------------------- 2 montage */
const Montage: React.FC<{ readonly read: number; readonly pic: number; readonly free: number }> = ({ read, pic, free }) => (
  <AbsoluteFill>
    <DocBg tint="#18211c" spot={[50, 45]} />
    <Atmos seed="p8b" leak={0.4} />
    <Cam push={0.08} drift={[-60, -10]} punch={[read, pic, free]}>
      <div style={{ position: "absolute", left: 96, top: 70, width: 1700 }}>
        <KText text="আপনি যে AI দিয়ে…" at={0} size={56} align="left" color={N.muted} />
      </div>
      <AbsoluteFill style={{ perspective: 1600 }}>
        <Screen x={110} y={230} w={560} h={380} at={read - 6} label="পড়া বোঝেন" ry={16}>
          <Student />
        </Screen>
        <Screen x={780} y={190} w={330} h={480} at={pic - 6} label="ছবি বানান" ry={0} radius={44}>
          <ImageGen />
        </Screen>
        <Screen x={1230} y={230} w={580} h={380} at={free - 6} label="ফ্রিল্যান্সিং" ry={-16}>
          <Freelance />
        </Screen>
      </AbsoluteFill>
    </Cam>
  </AbsoluteFill>
);

/* ---------------------------------------------------------------- 3 → NVIDIA chip */
const ToChip: React.FC<{ readonly nv: number }> = ({ nv }) => {
  const frame = useCurrentFrame();
  const wires = p01(frame, 4, 26, ease.inOut);
  const lit = p01(frame, nv, nv + 10);
  const cards = [
    { x: 150, y: 170, t: "পড়া" },
    { x: 150, y: 560, t: "ছবি" },
    { x: 1490, y: 360, t: "ফ্রিল্যান্সিং" },
  ];
  return (
    <AbsoluteFill>
      <Plate id="chipmacro" from={1} drift={0.14} dim={0.35 - 0.25 * lit} />
      <Atmos seed="p8c" leak={0.4 + 0.3 * lit} />
      <Cam push={0.14} drift={[0, -10]} punch={[nv]}>
        <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
          {cards.map((c, i) => {
            const sx = c.x + 140;
            const sy = c.y + 80;
            const d = `M${sx} ${sy} C ${(sx + 960) / 2} ${sy}, ${(sx + 960) / 2} 470, 960 470`;
            const t = ((frame * 0.03 + i * 0.33) % 1);
            return (
              <g key={i}>
                <path d={d} fill="none" stroke={N.greenHi} strokeWidth={14} opacity={0.25 * wires} style={{ filter: "blur(6px)" }} />
                <path d={d} fill="none" stroke={N.greenHi} strokeWidth={4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - wires} />
                <path d={d} fill="none" stroke="#fff" strokeWidth={8} pathLength={1} strokeDasharray="0.06 0.94" strokeDashoffset={-t} opacity={wires} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 10px ${N.greenHi})` }} />
              </g>
            );
          })}
        </svg>
        {cards.map((c, i) => (
          <Glass key={c.t} accent={N.green} style={{ left: c.x, top: c.y, width: 280, height: 160, display: "flex", alignItems: "center", justifyContent: "center", opacity: p01(frame, i * 3, i * 3 + 10) }}>
            <span style={{ fontFamily: headFont, fontWeight: 800, fontSize: 44, color: "#fff", lineHeight: 1.3 }}>{c.t}</span>
          </Glass>
        ))}
        <div style={{ position: "absolute", left: 0, right: 0, top: 640 }}>
          <KText text="বেশিরভাগ চলে" at={0} size={56} />
          <div style={{ marginTop: -16 }}>
            <KText text="এনভিডিয়ার চিপে" at={nv} size={110} color={N.greenHi} glow={`${N.green}cc`} />
          </div>
        </div>
      </Cam>
      <HitFlash at={nv} color={N.greenHi} />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 4 shake */
const APPS = [
  { t: "চ্যাট", x: 260, y: 300 },
  { t: "ছবি", x: 1560, y: 260 },
  { t: "কোড", x: 330, y: 640 },
  { t: "অনুবাদ", x: 1500, y: 620 },
  { t: "ভিডিও", x: 920, y: 180 },
];
const Shake: React.FC<{ readonly s1: number; readonly s2: number }> = ({ s1, s2 }) => {
  const frame = useCurrentFrame();
  const r = p01(frame, s1, s1 + 10);
  const w = (k: number) => (frame >= s2 ? Math.sin((frame - s2) * 0.9 + k) * 12 * Math.exp(-(frame - s2) / 30) : 0);
  const flick = frame >= s1 && frame < s1 + 10 ? (frame % 3 === 0 ? 0.35 : 0) : 0;
  return (
    <AbsoluteFill>
      <Plate id="dc" from={1.5} blur={3} dim={0.3 + flick} tint={r > 0 ? `rgb(255,${Math.round(255 - 140 * r)},${Math.round(255 - 140 * r)})` : undefined} />
      <Atmos seed="p8d" color={r > 0.5 ? N.red : N.green} />
      <Cam push={0.12} drift={[-20, 0]} shakeAt={[s1, s2, s2 + 8]} punch={[s1, s2]}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 180 }}>
          <Glass accent={r > 0.5 ? N.red : N.green} style={{ position: "relative", padding: "14px 46px 22px", rotate: `${w(0) * 0.4}deg` }}>
            <div style={{ fontFamily: numFont, fontWeight: 900, fontSize: 90, color: "#fff", letterSpacing: 4, textAlign: "center", textShadow: `0 0 30px ${r > 0.5 ? N.red : N.green}` }}>NVIDIA</div>
            <div style={{ fontFamily: headFont, fontWeight: 700, fontSize: 36, color: N.muted, textAlign: "center", lineHeight: 1.3 }}>১টি কোম্পানি</div>
          </Glass>
        </AbsoluteFill>
        {APPS.map((a, i) => {
          const k = p01(frame, s2 - 6 + i * 2, s2 + 6 + i * 2);
          return (
            <Glass
              key={a.t}
              accent={N.red}
              style={{ left: a.x, top: a.y, padding: "10px 28px 14px", opacity: k, rotate: `${w(i) * (i % 2 ? 1 : -1)}deg`, translate: `${w(i + 2)}px ${(1 - k) * 40}px` }}
            >
              <span style={{ fontFamily: headFont, fontWeight: 800, fontSize: 36, color: "#fff", lineHeight: 1.3 }}>AI {a.t}</span>
            </Glass>
          );
        })}
        <div style={{ position: "absolute", left: 0, right: 0, top: 660 }}>
          <KText text="এক কোম্পানি দুলে উঠলে" at={2} size={56} />
          <div style={{ marginTop: -14 }}>
            <KText text="দুলে ওঠে পুরো AI দুনিয়া" at={s2} size={86} color="#fff" glow={`${N.red}cc`} />
          </div>
        </div>
      </Cam>
      <HitFlash at={s2} color="#ff9090" />
      {frame >= s2 && frame < s2 + 8 ? <GlitchBars amount={1 - (frame - s2) / 8} /> : null}
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 5 cheap / fast gauges */
const Gauge: React.FC<{ readonly x: number; readonly at: number; readonly title: string; readonly unit: string; readonly color: string }> = ({ x, at, title, unit, color }) => {
  const frame = useCurrentFrame();
  const k = p01(frame, at - 4, at + 10);
  const sweep = interpolate(frame, [at, at + 30], [-110, 40], { ...clamp, easing: ease.out }) + Math.sin(frame / 6) * 6 * k;
  return (
    <Glass accent={color} sheenAt={at} style={{ left: x, top: 200, width: 520, height: 470, opacity: k, transform: `translateY(${(1 - k) * 80}px) rotateY(${x < 900 ? 12 : -12}deg)` }}>
      <svg viewBox="0 0 400 300" style={{ position: "absolute", left: 60, top: 40, width: 400, height: 300 }}>
        <path d="M60 240 A140 140 0 0 1 340 240" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={22} strokeLinecap="round" />
        <path d="M60 240 A140 140 0 0 1 340 240" fill="none" stroke={color} strokeWidth={22} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - (sweep + 110) / 220} style={{ filter: `drop-shadow(0 0 12px ${color})` }} />
        <g transform={`rotate(${sweep} 200 240)`}>
          <line x1={200} y1={240} x2={200} y2={120} stroke="#fff" strokeWidth={7} strokeLinecap="round" />
        </g>
        <circle cx={200} cy={240} r={14} fill="#fff" />
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: 320, textAlign: "center" }}>
        <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 60, color: "#fff", lineHeight: 1.3 }}>{title}</div>
        <div style={{ fontFamily: numFont, fontWeight: 700, fontSize: 24, color: N.muted, letterSpacing: 3 }}>{unit}</div>
      </div>
    </Glass>
  );
};

const CostSpeed: React.FC<{ readonly cheap: number; readonly fast: number; readonly dep: number }> = ({ cheap, fast, dep }) => {
  const frame = useCurrentFrame();
  const d = p01(frame, dep - 4, dep + 12);
  return (
    <AbsoluteFill>
      <Plate id="tray" from={2} blur={12} dim={0.6} />
      <Atmos seed="p8e" color={N.cyan} />
      <Cam push={0.1} drift={[20, -10]} punch={[cheap, fast, dep]}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 70 }}>
          <KText text="AI কত সস্তা, কত দ্রুত হবে?" at={0} size={60} />
        </div>
        <AbsoluteFill style={{ perspective: 1600 }}>
          <Gauge x={150} at={cheap} title="সস্তা?" unit="COST" color={N.gold} />
          <Gauge x={1250} at={fast} title="দ্রুত?" unit="SPEED" color={N.cyan} />
        </AbsoluteFill>
        <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
          {[
            "M670 440 C 780 440, 800 470, 860 470",
            "M1250 440 C 1140 440, 1120 470, 1060 470",
          ].map((p) => (
            <path key={p} d={p} fill="none" stroke={N.greenHi} strokeWidth={5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - d} style={{ filter: `drop-shadow(0 0 10px ${N.greenHi})` }} />
          ))}
        </svg>
        <Glass accent={N.green} style={{ left: 860, top: 400, width: 200, height: 140, display: "flex", alignItems: "center", justifyContent: "center", opacity: d, scale: `${0.7 + 0.3 * d}` }}>
          <span style={{ fontFamily: numFont, fontWeight: 900, fontSize: 40, color: "#fff", textShadow: `0 0 20px ${N.green}` }}>NVIDIA</span>
        </Glass>
        <div style={{ position: "absolute", left: 0, right: 0, top: 690 }}>
          <KText text="অনেকটাই এর উপর নির্ভর করে" at={dep - 6} size={62} color={N.greenHi} glow={`${N.green}88`} />
        </div>
      </Cam>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 6 lesson title */
const LessonTitle: React.FC<{ readonly word: number }> = ({ word }) => {
  const frame = useCurrentFrame();
  const glow = p01(frame, word - 4, word + 10);
  return (
    <AbsoluteFill>
      <DocBg tint="#2a2416" spot={[50, 42]} />
      <Atmos seed="p8f" color={N.amber} leak={0.5} />
      <Cam push={0.14} punch={[word]}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 170 }}>
          <svg width={150} height={190} viewBox="0 0 60 76" style={{ filter: `drop-shadow(0 0 ${10 + 40 * glow}px ${N.amber})`, opacity: 0.4 + 0.6 * glow }}>
            <path d="M30 4 C14 4 6 16 6 27 C6 37 13 42 17 48 L17 56 L43 56 L43 48 C47 42 54 37 54 27 C54 16 46 4 30 4 Z" fill={`rgba(255,176,32,${0.2 + 0.6 * glow})`} stroke="#ffd27a" strokeWidth={3} />
            <rect x={19} y={60} width={22} height={5} rx={2} fill="#ffd27a" />
            <rect x={22} y={68} width={16} height={5} rx={2} fill="#ffd27a" />
          </svg>
          <KText text="আর" at={0} size={60} color={N.muted} />
          <div style={{ marginTop: -20 }}>
            <KText text="একটা শিক্ষা" at={word - 8} size={150} color="#fff" glow={`${N.amber}aa`} />
          </div>
        </AbsoluteFill>
      </Cam>
      <HitFlash at={word} color="#ffd9a0" />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 7 tower on one person */
const Tower: React.FC<{ readonly big: number; readonly one: number; readonly dep: number; readonly err: number; readonly shake: number }> = ({ big, one, dep, err, shake }) => {
  const frame = useCurrentFrame();
  const blocks = 7;
  const person = p01(frame, one - 4, one + 10);
  const crack = p01(frame, err, err + 6);
  const sway = frame >= err ? Math.sin((frame - err) * 0.5) * (2 + 6 * p01(frame, shake, shake + 10)) * Math.min(1, (frame - err) / 10) : 0;
  const lean = frame >= shake ? interpolate(frame, [shake, shake + 30], [0, 4], clamp) : 0;
  const stumble = crack * 10;
  return (
    <AbsoluteFill>
      <DocBg tint="#1b2420" spot={[62, 50]} />
      <Atmos seed="p8g" color={crack > 0.5 ? N.red : N.green} leak={0.35} />
      <Cam push={0.1} drift={[-20, 30]} punch={[big, one, err]} shakeAt={[err, shake]} origin="62% 70%">
        <div style={{ position: "absolute", left: 96, top: 120, width: 820 }}>
          <KText text="একটা কোম্পানি যত বড়ই হোক," at={0} size={58} align="left" />
          <div style={{ opacity: person }}>
            <KText text="একজন মানুষের উপর বেশি নির্ভর করলে" at={one} size={52} align="left" color={N.amber} />
          </div>
          <div style={{ marginTop: 10 }}>
            <KText text="তার একটা ভুলে" at={err - 4} size={60} align="left" color={N.red} />
            <KText text="পুরো কোম্পানি নড়ে যায়" at={shake - 2} size={72} align="left" color="#fff" glow={`${N.red}aa`} />
          </div>
        </div>
        {/* tower */}
        <div style={{ position: "absolute", left: 1180, top: 0, width: 520, height: 860, transformOrigin: "50% 100%", rotate: `${sway + lean}deg` }}>
          {Array.from({ length: blocks }).map((_, i) => {
            const k = p01(frame, i * 3, i * 3 + 12);
            const bw = 460 - (i % 2) * 40;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: (520 - bw) / 2,
                  bottom: 220 + i * 84,
                  width: bw,
                  height: 78,
                  borderRadius: 10,
                  opacity: k,
                  translate: `0 ${(1 - k) * -200}px`,
                  background: `linear-gradient(145deg, rgba(166,242,42,${0.35 - i * 0.02}), rgba(30,60,0,0.6))`,
                  border: "1.5px solid rgba(255,255,255,0.22)",
                  boxShadow: `0 10px 30px rgba(0,0,0,0.5), 0 0 30px ${N.green}33`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: numFont,
                  fontWeight: 900,
                  fontSize: 34,
                  color: "rgba(255,255,255,0.85)",
                  letterSpacing: 6,
                }}
              >
                {i === 3 ? "NVIDIA" : ""}
              </div>
            );
          })}
          {/* person pillar */}
          <svg viewBox="0 0 100 220" style={{ position: "absolute", left: 210, bottom: 0, width: 100, height: 220, opacity: person, transformOrigin: "50% 100%", rotate: `${stumble}deg` }}>
            <circle cx={50} cy={22} r={16} fill={crack > 0.5 ? N.red : N.amber} />
            <path d="M50 40 L50 140 M50 140 L28 216 M50 140 L72 216 M50 62 L18 6 M50 62 L82 6" stroke={crack > 0.5 ? N.red : N.amber} strokeWidth={13} strokeLinecap="round" fill="none" style={{ filter: `drop-shadow(0 0 12px ${crack > 0.5 ? N.red : N.amber})` }} />
          </svg>
          <div style={{ position: "absolute", left: 330, bottom: 70, opacity: p01(frame, dep - 4, dep + 8), fontFamily: headFont, fontWeight: 700, fontSize: 30, color: N.amber, lineHeight: 1.3, whiteSpace: "nowrap" }}>← ১ জন মানুষ</div>
          {crack > 0 ? (
            <svg viewBox="0 0 520 860" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
              <path d="M260 640 L240 600 L275 560 L248 510 L282 470 L262 420" fill="none" stroke={N.red} strokeWidth={5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - crack} style={{ filter: `drop-shadow(0 0 8px ${N.red})` }} />
            </svg>
          ) : null}
        </div>
        <div style={{ position: "absolute", left: 1080, top: 850, width: 720, height: 6, background: "rgba(255,255,255,0.25)", borderRadius: 3 }} />
      </Cam>
      <HitFlash at={err} color="#ff8080" />
      {frame >= err && frame < err + 6 ? <GlitchBars amount={1 - (frame - err) / 6} /> : null}
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 8 crown + comment */
const Crown: React.FC<{ readonly without: number; readonly king: number; readonly q: number; readonly comment: number }> = ({ without, king, q, comment }) => {
  const frame = useCurrentFrame();
  const drop = interpolate(frame, [king - 10, king + 4], [-300, 0], { ...clamp, easing: ease.in });
  const crownIn = p01(frame, king - 10, king - 4);
  const wob = frame >= king ? Math.sin((frame - king) * 0.4) * 10 * Math.exp(-(frame - king) / 25) + 6 * p01(frame, q, q + 20) : 0;
  const qk = p01(frame, q, q + 10);
  const gray = p01(frame, without, without + 14);
  const cm = p01(frame, comment - 4, comment + 10);
  const dots = Math.floor(frame / 6) % 4;
  return (
    <AbsoluteFill>
      <Plate id="chipexplode" from={2} rate={0.8} drift={0.1} dim={0.5} blur={4} />
      <Atmos seed="p8h" color={N.gold} leak={0.45} />
      <Cam push={0.12} drift={[0, -20]} punch={[king, q]}>
        <PhotoCard src="nvidia/img/jensen_portrait.jpg" x={110} y={160} w={360} h={460} at={2} rot={-6} gray={gray} pos="50% 25%" caption="হুয়াং ছাড়া?" />
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 200, paddingLeft: 260 }}>
          <div style={{ position: "relative" }}>
            <svg width={300} height={200} viewBox="0 0 150 100" style={{ position: "absolute", left: "50%", top: -170, marginLeft: -150, translate: `0 ${drop}px`, rotate: `${wob}deg`, opacity: crownIn, filter: `drop-shadow(0 0 30px ${N.gold})` }}>
              <defs>
                <linearGradient id="p8gold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#ffe9a8" />
                  <stop offset="1" stopColor="#b8862a" />
                </linearGradient>
              </defs>
              <path d="M10 85 L18 25 L48 55 L75 10 L102 55 L132 25 L140 85 Z" fill="url(#p8gold)" stroke="#fff3c4" strokeWidth={3} />
              {[18, 75, 132].map((x, i) => (
                <circle key={x} cx={x} cy={i === 1 ? 10 : 25} r={7} fill={i === 1 ? N.greenHi : N.red} />
              ))}
              <rect x={10} y={80} width={130} height={12} rx={3} fill="#8a6418" />
            </svg>
            <div style={{ fontFamily: numFont, fontWeight: 900, fontSize: 200, letterSpacing: 10, color: "#fff", textShadow: `0 0 50px ${N.green}, 0 12px 40px #000`, opacity: p01(frame, 0, 12) }}>NVIDIA</div>
            <div style={{ textAlign: "center", fontFamily: headFont, fontWeight: 800, fontSize: 60, color: N.gold, marginTop: -20, lineHeight: 1.3, opacity: p01(frame, king, king + 8) }}>AI-এর রাজা</div>
            <div style={{ position: "absolute", right: -150, top: -60, fontFamily: headFont, fontWeight: 800, fontSize: 260, color: N.amber, opacity: qk, scale: `${1 + 0.6 * (1 - qk)}`, rotate: "10deg", textShadow: `0 0 50px ${N.amber}` }}>?</div>
          </div>
        </AbsoluteFill>
        {/* comment bubble */}
        <Glass accent={N.cyan} style={{ left: 760, top: 610, width: 860, padding: "18px 30px 22px", opacity: cm, transform: `translateY(${(1 - cm) * 80}px) scale(${0.9 + 0.1 * cm})`, borderRadius: "28px 28px 28px 6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: 32, background: `linear-gradient(135deg, ${N.cyan}, ${N.green})`, flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 44, color: "#fff", lineHeight: 1.3 }}>আপনার মত কমেন্টে লিখুন</div>
              <div style={{ fontFamily: numFont, fontWeight: 900, fontSize: 40, color: N.cyan, letterSpacing: 6 }}>{"•".repeat(dots + 1)}</div>
            </div>
          </div>
        </Glass>
      </Cam>
      <HitFlash at={king} color="#ffe2a0" />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 9 end card */
const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const k = p01(frame, 0, 16);
  const ring = Math.sin(frame * 0.9) * 18 * Math.exp(-((frame - 6) % 45) / 10) * (frame > 6 ? 1 : 0);
  const click = 30;
  const pressed = frame >= click;
  const press = frame >= click && frame < click + 6 ? 0.92 : 1;
  const cur = interpolate(frame, [10, click], [0, 1], { ...clamp, easing: ease.inOut });
  const out = interpolate(frame, [durationInFrames - 10, durationInFrames - 1], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <Plate id="dc" from={0} rate={0.6} blur={10} dim={0.55} />
      <Atmos seed="p8i" color={N.green} leak={0.5} />
      <Cam push={0.08} drift={[0, -10]} punch={[click]}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 200 }}>
          <Glass accent={N.green} sheenAt={4} style={{ position: "relative", width: 1300, padding: "40px 60px 46px", opacity: k, transform: `perspective(1600px) rotateX(${(1 - k) * 20}deg) scale(${0.9 + 0.1 * k})` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
              <svg width={150} height={150} viewBox="0 0 60 60" style={{ rotate: `${ring}deg`, transformOrigin: "50% 10%", filter: `drop-shadow(0 0 20px ${N.gold})`, flexShrink: 0 }}>
                <path d="M30 6 C20 6 15 14 15 24 L15 36 L9 44 L51 44 L45 36 L45 24 C45 14 40 6 30 6 Z" fill={N.gold} stroke="#fff3c4" strokeWidth={2} />
                <circle cx={30} cy={50} r={6} fill={N.gold} />
                <circle cx={46} cy={12} r={7} fill={N.red} />
              </svg>
              <div>
                <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 64, color: "#fff", lineHeight: 1.35 }}>
                  <span style={{ color: N.greenHi }}>১৭ নভেম্বরের</span> পর
                </div>
                <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 64, color: "#fff", lineHeight: 1.35 }}>আপডেট পর্ব আসছে</div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 30 }}>
              <div
                style={{
                  scale: `${press}`,
                  fontFamily: headFont,
                  fontWeight: 800,
                  fontSize: 52,
                  lineHeight: 1.3,
                  padding: "8px 56px 16px",
                  borderRadius: 40,
                  color: pressed ? "#081000" : "#fff",
                  background: pressed ? `linear-gradient(135deg, ${N.greenHi}, ${N.green})` : "rgba(255,255,255,0.08)",
                  border: `2px solid ${N.greenHi}`,
                  boxShadow: pressed ? `0 0 50px ${N.green}` : "none",
                }}
              >
                {pressed ? "✓ ফলো করা হয়েছে" : "+ ফলো করুন"}
              </div>
            </div>
          </Glass>
        </AbsoluteFill>
        {/* cursor */}
        <svg width={56} height={56} viewBox="0 0 24 24" style={{ position: "absolute", left: interpolate(cur, [0, 1], [1500, 1010]), top: interpolate(cur, [0, 1], [820, 615]), opacity: k * (frame < click + 20 ? 1 : 0), filter: "drop-shadow(0 4px 8px #000)" }}>
          <path d="M3 2 L3 20 L8 15 L11 22 L14 21 L11 14 L18 14 Z" fill="#fff" stroke="#000" strokeWidth={1.2} />
        </svg>
        <Marker d="M700 690 C 850 705, 1070 700, 1220 688" at={click + 4} color={N.greenHi} width={7} />
      </Cam>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- disclaimer overlay */
const Disclaimer: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const k = p01(frame, 0, 12) * interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        right: 96,
        top: 830,
        opacity: k,
        fontFamily: headFont,
        fontWeight: 700,
        fontSize: 26,
        color: N.ink,
        lineHeight: 1.3,
        padding: "3px 16px 7px",
        borderRadius: 10,
        background: "rgba(0,0,0,0.55)",
        border: `1px solid ${N.amber}88`,
      }}
    >
      ⓘ এটা বিনিয়োগ পরামর্শ নয়
    </div>
  );
};

/* ---------------------------------------------------------------- assembly */
export const P8Scene: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  const at = useAt(P8_ID);
  const f = (s: number) => Math.round(s * fps);

  const b1 = f(at("আপনি") - 0.2);
  const b2 = f(at("বেশিরভাগ") - 0.25);
  const b3 = f(at("এই") - 0.2);
  const b4 = f(at("AI", 2) - 0.2);
  const b5 = f(at("আর") - 0.2);
  const b6 = f(at("কোম্পানি", 1) - 0.3);
  const b7 = f(at("এনভিডিয়া", 1) - 0.2);
  const b8 = f(at("লিখুন") + 0.5);

  const beats: Beat[] = [
    { at: 0, name: "bd question", node: <BdQuestion bd={f(at("বাংলাদেশে"))} q={f(at("আমার"))} /> },
    { at: b1, trans: "whip", name: "montage", node: <Montage read={f(at("পড়া")) - b1} pic={f(at("ছবি")) - b1} free={f(at("ফ্রিল্যান্সিংয়ের")) - b1} /> },
    { at: b2, trans: "zoom", name: "to chip", node: <ToChip nv={f(at("এনভিডিয়ার")) - b2} /> },
    { at: b3, trans: "glitch", name: "shake", node: <Shake s1={f(at("দুলে")) - b3} s2={f(at("দুলে", 1)) - b3} /> },
    { at: b4, trans: "slideUp", name: "cost/speed", node: <CostSpeed cheap={f(at("সস্তা")) - b4} fast={f(at("দ্রুত")) - b4} dep={f(at("নির্ভর")) - b4} /> },
    { at: b5, trans: "flash", name: "lesson", node: <LessonTitle word={f(at("শিক্ষা")) - b5} /> },
    {
      at: b6,
      trans: "whipL",
      name: "tower",
      node: <Tower big={f(at("বড়ই")) - b6} one={f(at("একজন")) - b6} dep={f(at("নির্ভর", 1)) - b6} err={f(at("ভুলে")) - b6} shake={f(at("নড়ে")) - b6} />,
    },
    { at: b7, trans: "zoom", name: "crown", node: <Crown without={f(at("ছাড়াও")) - b7} king={f(at("রাজা")) - b7} q={f(at("থাকবে")) - b7} comment={f(at("কমেন্টে")) - b7} /> },
    { at: b8, trans: "blur", name: "end card", node: <EndCard /> },
  ];

  return (
    <AbsoluteFill style={{ background: N.bg }}>
      <Beats beats={beats} end={durationInFrames} />
      <Sequence from={b4} durationInFrames={b7 - b4} name="disclaimer">
        <Disclaimer />
      </Sequence>
    </AbsoluteFill>
  );
};
