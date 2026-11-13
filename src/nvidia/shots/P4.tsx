/**
 * P4 v2 — Jensen Huang, the man (144.5 → 184.6 s). Documentary desk + 3D plates, a transition on every cut,
 * camera always moving. Beats keyed to the spoken word:
 *  1 "জন্ম তাইওয়ানে … চলে যান আমেরিকায়"     portrait print + name; tilted glass map, Taiwan pulse → flight arc → USA
 *  2 "কিশোর বয়সে … রেস্টুরেন্টে, টেবিলে খাবার" illustrated diner, teen waiter walks in, plates land on "খাবার"
 *  3 "লাজুক স্বভাব থেকে বের করে এনেছিল"         "লাজুক" struck by marker, 2010 stage print tossed in
 *  4 "৩৩ বছর … একটানা এনভিডিয়ার সিইও"          ৩৩ counter + 1993→2026 bar, prints 2010 → 2016 → today
 *  5 "সবসময় কালো চামড়ার জ্যাকেট"               full-bleed 2016 photo push, marker circle on the jacket
 *  6 "AI হলো নতুন যুগের বিদ্যুৎ কেন্দ্র"         data-centre plate goes from dark to full power, bolt
 *  7 "AI আপনার চাকরি নেবে না …"                glass quote card, each word lands as spoken
 *  8 "এ বছরও … প্রোগ্রামার কমবে না, বরং আরো বেশি" Stanford 2026 split → coder tiles multiply, "</>" lights
 */
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Atmos, Beats, Cam, Counter, DocBg, Glass, GlitchBars, HitFlash, KText, Marker, PhotoCard, Plate, p01, type Beat } from "../kit";
import { SCENE_SPANS } from "../scenes";
import { N, clamp, ease, headFont, numFont } from "../theme";
import type { Cue } from "../types";
import { Photo } from "../ui/fx";
import { VO_WORDS, useAt } from "../vo";

export const P4_ID = "P4";
export const P4_KEYWORDS: string[] = ["তাইওয়ানে", "রেস্টুরেন্টে", "৩৩", "জ্যাকেট", "বিদ্যুৎ", "চাকরি", "প্রোগ্রামার"];

export const P4_CUES: Cue[] = [
  { sfx: "whoosh_big", word: "চলে", volume: 0.8 },
  { sfx: "ui_pop", word: "খাবার", volume: 0.8 },
  { sfx: "swoosh_up", word: "বের", offset: -0.1 },
  { sfx: "impact", word: "৩৩" },
  { sfx: "camera_shutter", word: "কালো", offset: -0.1 },
  { sfx: "power_on", word: "বিদ্যুৎ", offset: -0.15 },
  { sfx: "news_sting", word: "তার", offset: -0.1, volume: 0.7 },
  { sfx: "ui_pop", word: "জানে" },
  { sfx: "shimmer", word: "প্রোগ্রাম", nth: 1 },
];

const bn = (x: number) => String(x).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);

const Pill: React.FC<{ readonly at: number; readonly children: React.ReactNode; readonly accent?: string; readonly size?: number }> = ({ at, children, accent = N.green, size = 46 }) => {
  const frame = useCurrentFrame();
  const k = p01(frame, at, at + 12);
  return (
    <Glass style={{ position: "relative", padding: "4px 28px 12px", opacity: k, translate: `${(1 - k) * -50}px 0`, display: "inline-block" }} accent={accent} sheenAt={at}>
      <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: size, color: N.ink, lineHeight: 1.35 }}>{children}</div>
    </Glass>
  );
};

/* ---------------------------------------------------------------- 1: Taiwan → USA */
const Journey: React.FC<{ readonly tw: number; readonly fly: number; readonly us: number }> = ({ tw, fly, us }) => {
  const frame = useCurrentFrame();
  const twIn = p01(frame, tw - 4, tw + 6);
  const arc = p01(frame, fly, us + 4, ease.inOut);
  const usIn = p01(frame, us, us + 10);
  const A: [number, number] = [330, 470];
  const B: [number, number] = [1090, 330];
  const C: [number, number] = [710, 40];
  const q = (t: number) => {
    const u = 1 - t;
    return [u * u * A[0] + 2 * u * t * C[0] + t * t * B[0], u * u * A[1] + 2 * u * t * C[1] + t * t * B[1]];
  };
  const [px, py] = q(arc);
  const [nx, ny] = q(Math.min(1, arc + 0.01));
  const ang = (Math.atan2(ny - py, nx - px) * 180) / Math.PI;
  const pulse = (frame % 30) / 30;
  const path = `M${A[0]} ${A[1]} Q ${C[0]} ${C[1]} ${B[0]} ${B[1]}`;
  return (
    <AbsoluteFill>
      <DocBg tint="#14202a" spot={[60, 40]} />
      <Atmos seed="p4a" color={N.cyan} color2={N.green} leak={0.45} />
      <Cam push={0.1} drift={[-40, -10]} rot={-0.6} punch={[us]}>
        <AbsoluteFill style={{ perspective: 1700 }}>
          <Glass style={{ left: 560, top: 150, width: 1280, height: 680, transform: "rotateY(-14deg) rotateX(8deg)", transformOrigin: "100% 50%" }} accent={N.cyan}>
            <svg viewBox="0 0 1280 680" style={{ position: "absolute", inset: 0 }}>
              {[-3, -2, -1, 0, 1, 2, 3].map((k) => (
                <ellipse key={k} cx={640} cy={360} rx={Math.abs(k) * 120 + 16} ry={420} fill="none" stroke="rgba(63,216,255,0.10)" strokeWidth={2} />
              ))}
              {[120, 240, 360, 480, 600].map((y) => (
                <line key={y} x1={0} x2={1280} y1={y} y2={y} stroke="rgba(63,216,255,0.08)" strokeWidth={2} />
              ))}
              <text x={700} y={560} textAnchor="middle" fill="rgba(63,216,255,0.45)" fontFamily={headFont} fontWeight={600} fontSize={32}>
                প্রশান্ত মহাসাগর
              </text>
              <g transform={`translate(${A[0]} ${A[1]})`} opacity={twIn}>
                <path d="M6 -46 C 22 -30 22 10 4 46 C -10 30 -20 -6 6 -46 Z" fill={N.green} stroke={N.greenHi} strokeWidth={3} style={{ filter: `drop-shadow(0 0 12px ${N.green})` }} />
                <circle r={14 + 60 * pulse} fill="none" stroke={N.greenHi} strokeWidth={3} opacity={1 - pulse} />
              </g>
              <g transform={`translate(${B[0]} ${B[1]})`} opacity={usIn}>
                <circle r={16} fill={N.cyan} style={{ filter: `drop-shadow(0 0 12px ${N.cyan})` }} />
                <circle r={16 + 40 * usIn} fill="none" stroke={N.cyan} strokeWidth={3} opacity={1 - usIn * 0.6} />
              </g>
              <path d={path} fill="none" stroke="#fff" strokeWidth={4} strokeDasharray="2 14" strokeLinecap="round" opacity={0.25} />
              <path d={path} fill="none" stroke={N.cyan} strokeWidth={6} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - arc} style={{ filter: `drop-shadow(0 0 10px ${N.cyan})` }} />
              {arc > 0 && arc < 1 ? (
                <g transform={`translate(${px} ${py}) rotate(${ang})`}>
                  <path d="M28 0 L-14 -8 L-24 -26 L-32 -26 L-24 -6 L-34 -4 L-40 -14 L-46 -14 L-42 0 L-46 14 L-40 14 L-34 4 L-24 6 L-32 26 L-24 26 L-14 8 Z" fill="#fff" style={{ filter: "drop-shadow(0 0 8px #fff)" }} />
                </g>
              ) : null}
            </svg>
            <div style={{ position: "absolute", left: A[0] - 160, width: 320, top: A[1] + 60, textAlign: "center", opacity: twIn }}>
              <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 50, color: N.greenHi, lineHeight: 1.35 }}>তাইওয়ান</div>
              <div style={{ fontFamily: headFont, fontWeight: 600, fontSize: 30, color: N.muted, lineHeight: 1.4 }}>জন্ম · ১৯৬৩</div>
            </div>
            <div style={{ position: "absolute", left: B[0] - 170, width: 340, top: B[1] + 36, textAlign: "center", opacity: usIn }}>
              <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 50, color: N.cyan, lineHeight: 1.35 }}>আমেরিকা</div>
              <div style={{ fontFamily: headFont, fontWeight: 600, fontSize: 30, color: N.muted, lineHeight: 1.4 }}>ছোটবেলায়</div>
            </div>
          </Glass>
        </AbsoluteFill>
        <PhotoCard src="nvidia/img/jensen_portrait.jpg" x={96} y={300} w={400} h={500} at={2} rot={-4} pos="50% 22%" />
      </Cam>
      <div style={{ position: "absolute", left: 96, top: 60 }}>
        <KText text="জেনসেন হুয়াং" at={4} size={78} align="left" />
        <div style={{ opacity: p01(frame, 12, 24), fontFamily: headFont, fontWeight: 600, fontSize: 34, color: N.muted, marginTop: -10 }}>জন্ম তাইওয়ান · বয়স ৬৩</div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 2: restaurant */
const Restaurant: React.FC<{ readonly rest: number; readonly table: number; readonly food: number }> = ({ rest, table, food }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const walk = p01(frame, 0, table);
  const wx = 150 + 900 * walk;
  const moving = frame < table - 4;
  const step = moving ? Math.sin(frame * 0.55) : 0;
  const bob = moving ? Math.abs(Math.sin(frame * 0.55)) * -8 : 0;
  const drop = p01(frame, food, food + 10);
  const sign = frame % 47 < 3 ? 0.4 : 1;
  const steam = (frame / fps) * 40;
  const TRAY: [number, number][] = [
    [-52, -8],
    [48, -8],
  ];
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #2a1a10 0%, #0d0907 75%)" }}>
      <Cam push={0.12} drift={[-140, -10]} punch={[food]} origin="55% 65%">
        <svg viewBox="0 0 2100 1080" style={{ position: "absolute", left: 0, top: 0, width: 2100, height: 1080 }}>
          <defs>
            <linearGradient id="p4wall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#3a2414" />
              <stop offset="1" stopColor="#1a100a" />
            </linearGradient>
            <radialGradient id="p4lamp" cx="0.5" cy="0" r="1">
              <stop offset="0" stopColor="#ffcf8a" stopOpacity="0.45" />
              <stop offset="1" stopColor="#ffcf8a" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect x={0} y={0} width={2100} height={780} fill="url(#p4wall)" />
          {Array.from({ length: 14 }, (_, i) => (
            <rect key={i} x={i * 150} y={0} width={75} height={780} fill="rgba(255,190,120,0.035)" />
          ))}
          {[260, 860, 1460].map((x) => (
            <g key={x}>
              <rect x={x} y={170} width={380} height={300} rx={20} fill="#0f1a24" stroke="#4a3220" strokeWidth={14} />
              <circle cx={x + 290} cy={250} r={26} fill="#f5e7b0" opacity={0.6} />
              <rect x={x + 10} y={180} width={360} height={60} fill="rgba(255,255,255,0.04)" />
            </g>
          ))}
          <g opacity={sign}>
            <rect x={760} y={40} width={560} height={96} rx={48} fill="none" stroke={N.amber} strokeWidth={6} style={{ filter: `drop-shadow(0 0 16px ${N.amber})` }} />
            <text x={1040} y={108} textAnchor="middle" fill={N.amber} fontFamily={numFont} fontWeight={900} fontSize={58} letterSpacing={10} style={{ filter: `drop-shadow(0 0 14px ${N.amber})` }}>
              RESTAURANT
            </text>
          </g>
          {[500, 1320].map((x) => (
            <g key={x}>
              <line x1={x} x2={x} y1={0} y2={520} stroke="#4a3220" strokeWidth={4} />
              <path d={`M${x - 60} 560 L${x - 30} 520 L${x + 30} 520 L${x + 60} 560 Z`} fill={N.amber} style={{ filter: `drop-shadow(0 0 20px ${N.amber})` }} />
              <path d={`M${x - 60} 560 L${x + 60} 560 L${x + 300} 1080 L${x - 300} 1080 Z`} fill="url(#p4lamp)" />
            </g>
          ))}
          <rect x={0} y={780} width={2100} height={300} fill="#170f0a" />
          {Array.from({ length: 22 }, (_, i) => (
            <rect key={i} x={i * 100} y={780} width={50} height={300} fill="rgba(255,255,255,0.025)" />
          ))}
          <g transform="translate(1320 0)">
            <ellipse cx={0} cy={792} rx={220} ry={16} fill="rgba(0,0,0,0.5)" />
            <rect x={-260} y={600} width={520} height={30} rx={8} fill="#efe8d6" />
            <path d="M-260 630 L260 630 L240 700 L-240 700 Z" fill="#b8281f" />
            <rect x={-12} y={700} width={24} height={90} fill="#3a2a1c" />
            <rect x={-90} y={780} width={180} height={14} rx={6} fill="#3a2a1c" />
            {TRAY.map(([dx], i) => {
              const tx = -110 + i * 220;
              const fx = wx - 1320 + dx + 160;
              const x = fx + (tx - fx) * drop;
              const y = 392 + (590 - 392) * drop - Math.sin(drop * Math.PI) * 50;
              return drop > 0 ? (
                <g key={i} transform={`translate(${x} ${y})`}>
                  <ellipse rx={64} ry={14} fill="#f4f6f2" />
                  <ellipse cy={-10} rx={36} ry={14} fill={i ? "#c8862c" : "#7aa83a"} />
                </g>
              ) : null;
            })}
            {drop >= 1
              ? [0, 1].map((i) => (
                  <path key={i} d={`M${-110 + i * 220 - 10} 560 q 10 -20 0 -40 q -10 -20 0 -40`} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={4} strokeDasharray="10 8" strokeDashoffset={-steam} />
                ))
              : null}
          </g>
          <g transform={`translate(${wx} ${bob})`}>
            <ellipse cx={0} cy={784} rx={70} ry={10} fill="rgba(0,0,0,0.5)" />
            <g transform={`rotate(${step * 18} 0 640)`}>
              <rect x={-18} y={640} width={26} height={140} rx={10} fill="#1d1f22" />
            </g>
            <g transform={`rotate(${-step * 18} 0 640)`}>
              <rect x={-4} y={640} width={26} height={140} rx={10} fill="#2a2d31" />
            </g>
            <rect x={-46} y={470} width={100} height={190} rx={30} fill="#f1f1ee" />
            <rect x={-40} y={560} width={88} height={110} rx={10} fill="#1d1f22" />
            <path d="M-6 478 L4 500 L14 478 Z" fill="#c9312c" />
            <circle cx={4} cy={420} r={44} fill="#e2b58f" />
            <path d="M-40 412 Q 4 350 48 410 Q 30 380 -40 412 Z" fill="#141414" />
            <path d="M40 500 L120 470 L150 410" fill="none" stroke="#f1f1ee" strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={150} cy={406} r={14} fill="#e2b58f" />
            <g transform="translate(160 400)">
              <ellipse rx={120} ry={14} fill="#c3c8cc" />
              {drop <= 0
                ? TRAY.map(([dx, dy], i) => (
                    <g key={i} transform={`translate(${dx} ${dy})`}>
                      <ellipse rx={50} ry={11} fill="#f4f6f2" />
                      <ellipse cy={-8} rx={28} ry={11} fill={i ? "#c8862c" : "#7aa83a"} />
                    </g>
                  ))
                : null}
            </g>
            <path d={`M-40 500 L${-60 + step * 20} 600`} fill="none" stroke="#f1f1ee" strokeWidth={24} strokeLinecap="round" />
          </g>
        </svg>
      </Cam>
      <Atmos seed="p4b" color={N.amber} color2="#ff7a3a" leak={0.4} bokeh={18} />
      <div style={{ position: "absolute", left: 96, top: 170, display: "flex", flexDirection: "column", gap: 18, alignItems: "flex-start" }}>
        <Pill at={4} accent={N.amber}>কিশোর বয়সে</Pill>
        <Pill at={rest}>রেস্টুরেন্টে কাজ · টেবিলে খাবার দিতেন</Pill>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 3: shy → out on stage */
const Shy: React.FC<{ readonly shy: number; readonly out: number }> = ({ shy, out }) => {
  const frame = useCurrentFrame();
  const shyIn = p01(frame, shy - 4, shy + 8);
  return (
    <AbsoluteFill>
      <DocBg tint="#262019" spot={[30, 50]} />
      <Atmos seed="p4c" color={N.amber} leak={0.35} bokeh={14} />
      <Cam push={0.1} drift={[-40, 0]} punch={[out]} shakeAt={[out]}>
        <div style={{ position: "absolute", left: 180, top: 300, width: 460, height: 560, opacity: 0.85 - 0.4 * p01(frame, out, out + 12), scale: `${1 - 0.06 * p01(frame, shy, out)}`, transformOrigin: "50% 100%" }}>
          <svg viewBox="0 0 460 560" style={{ width: "100%", height: "100%" }}>
            <defs>
              <linearGradient id="p4sil" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#5a6166" />
                <stop offset="1" stopColor="#1e2326" />
              </linearGradient>
            </defs>
            <circle cx={250} cy={180} r={70} fill="url(#p4sil)" />
            <path d="M110 560 Q 120 310 240 280 Q 360 300 370 560 Z" fill="url(#p4sil)" />
          </svg>
        </div>
        <div style={{ position: "absolute", left: 230, top: 330, opacity: shyIn, scale: `${1.3 - 0.3 * shyIn}` }}>
          <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 120, color: N.amber, lineHeight: 1.35, textShadow: `0 0 40px ${N.amber}66, 0 8px 30px #000` }}>লাজুক</div>
        </div>
        <Marker d="M215 440 Q 380 400 590 430" at={out} len={8} color={N.red} width={16} />
        <PhotoCard src="nvidia/img/jensen_2010.jpg" x={900} y={230} w={880} h={540} at={out - 2} rot={3} pos="30% 40%" caption="২০১০ · লাজুকতা থেকে মঞ্চে" zoom={0.14} />
      </Cam>
      <div style={{ position: "absolute", top: 50, width: "100%" }}>
        <KText text="পরে নিজেই বলেছেন —" at={2} size={46} color={N.muted} />
        <div style={{ marginTop: -24 }}>
          <KText text="সেই কাজটাই তাকে বদলে দিয়েছিল" at={10} size={60} />
        </div>
      </div>
      <HitFlash at={out} color="#ffe2a8" />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 4: 33 years CEO */
const Years33: React.FC<{ readonly ceo: number }> = ({ ceo }) => {
  const frame = useCurrentFrame();
  const bar = p01(frame, 0, 26);
  return (
    <AbsoluteFill>
      <DocBg tint="#1d2321" spot={[65, 40]} />
      <Atmos seed="p4d" leak={0.35} bokeh={14} color="#ffcf8a" />
      <Cam push={0.1} drift={[-40, 10]} rot={0.6} punch={[0, ceo]} origin="40% 45%">
        <PhotoCard src="nvidia/img/jensen_2010.jpg" x={930} y={120} w={520} h={330} at={2} rot={-7} pos="30% 40%" caption="২০১০" />
        <PhotoCard src="nvidia/img/jensen_2016.jpg" x={1060} y={430} w={500} h={340} at={12} rot={5} pos="50% 30%" caption="২০১৬" />
        <PhotoCard src="nvidia/img/jensen_portrait.jpg" x={1440} y={150} w={380} h={500} at={22} rot={3} pos="50% 22%" caption="২০২৬" tape={false} />
        <div style={{ position: "absolute", left: 110, top: 130 }}>
          <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 280, lineHeight: 1.2, color: "#fff", WebkitTextStroke: `3px ${N.greenHi}`, textShadow: `0 0 70px ${N.green}` }}>
            <Counter to={33} a={0} b={20} fmt={(v) => bn(Math.round(v))} style={{ fontFamily: headFont }} />
          </div>
          <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 90, lineHeight: 1.2, color: N.ink, marginTop: -40 }}>বছর</div>
          <div style={{ marginTop: 34, width: 640 }}>
            <div style={{ height: 10, borderRadius: 5, background: "rgba(255,255,255,0.1)" }}>
              <div style={{ width: `${bar * 100}%`, height: "100%", borderRadius: 5, background: `linear-gradient(90deg, ${N.green}, ${N.greenHi})`, boxShadow: `0 0 20px ${N.green}` }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: numFont, fontWeight: 900, fontSize: 36, color: N.muted, marginTop: 10 }}>
              <span>1993</span>
              <span style={{ color: N.ink }}>{Math.round(1993 + 33 * bar)}</span>
            </div>
          </div>
          <div style={{ marginTop: 26 }}>
            <Pill at={ceo}>একটানা এনভিডিয়ার সিইও</Pill>
          </div>
        </div>
      </Cam>
      <HitFlash at={0} color={N.greenHi} />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 5: leather jacket */
const Jacket: React.FC<{ readonly black: number; readonly dur: number }> = ({ black, dur }) => {
  return (
    <AbsoluteFill style={{ background: N.bg }}>
      <Cam push={0.16} drift={[-60, -30]} punch={[black]} origin="55% 65%">
        <Photo src="nvidia/img/jensen_2016.jpg" dur={dur} zoom={[1.0, 1.05]} pos="50% 30%" />
        <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(5,6,7,0.88) 0%, rgba(5,6,7,0.25) 42%, transparent 65%), linear-gradient(0deg, rgba(10,20,10,0.35), transparent 40%)" }} />
        <Marker d="M1030 470 C 1350 440 1420 760 1240 900 C 1060 1010 760 960 700 760 C 650 590 820 470 1060 470" at={black} len={14} color={N.greenHi} width={9} />
      </Cam>
      <Atmos seed="p4e" leak={0.3} bokeh={10} />
      <div style={{ position: "absolute", left: 96, top: 230 }}>
        <Pill at={0} accent={N.muted} size={42}>সবসময়</Pill>
        <div style={{ marginTop: 10, width: 700 }}>
          <KText text="কালো চামড়ার" at={black - 2} size={96} align="left" />
          <div style={{ marginTop: -30 }}>
            <KText text="জ্যাকেট" at={black + 6} size={120} align="left" color={N.greenHi} glow={`${N.green}88`} />
          </div>
        </div>
      </div>
      <HitFlash at={black} />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 6: AI = power plant */
const PowerPlant: React.FC<{ readonly ai: number; readonly power: number; readonly kendro: number }> = ({ ai, power, kendro }) => {
  const frame = useCurrentFrame();
  const pw = interpolate(frame, [0, power - 2, power + 30, kendro + 10], [0, 0.05, 0.7, 1], { ...clamp, easing: ease.inOut });
  const pIn = p01(frame, power, power + 12);
  const k = p01(frame, kendro, kendro + 8);
  return (
    <AbsoluteFill>
      <Plate id="dc" from={0.5} rate={0.9} drift={0.18} blur={4 * (1 - pw)} dim={0.9 - 0.55 * pw} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, ${N.amber}${Math.round(40 * pIn).toString(16).padStart(2, "0")} 0%, transparent 55%)`, mixBlendMode: "screen" }} />
      <Atmos seed="p4f" color={N.amber} leak={0.2 + 0.4 * pw} bokeh={20} />
      <div style={{ position: "absolute", top: 64, width: "100%", textAlign: "center", opacity: 1 - 0.7 * p01(frame, ai, ai + 10) }}>
        <Pill at={4} accent={N.muted} size={42}>প্রতিটা অনুষ্ঠানে একটাই কথা</Pill>
      </div>
      <Cam push={0.1} punch={[ai, power, kendro]} shakeAt={[kendro]}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 140 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
            <KText text="AI =" at={ai} size={170} font="num" weight={900} glow={`${N.green}66`} />
            <svg viewBox="0 0 100 160" style={{ width: 120, height: 190, opacity: pIn, scale: `${0.5 + 0.5 * pIn + 0.12 * k}`, filter: `drop-shadow(0 0 ${30 + 30 * k}px ${N.amber})` }}>
              <defs>
                <linearGradient id="p4bolt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#fff3c4" />
                  <stop offset="1" stopColor={N.amber} />
                </linearGradient>
              </defs>
              <path d="M60 0 L10 90 L45 90 L30 160 L90 60 L55 60 L75 0 Z" fill="url(#p4bolt)" />
            </svg>
          </div>
          <div style={{ marginTop: -20 }}>
            <KText text="নতুন যুগের বিদ্যুৎ কেন্দ্র" at={power - 8} size={88} stagger={4} />
          </div>
        </AbsoluteFill>
      </Cam>
      <HitFlash at={power} color={N.amber} />
      <HitFlash at={kendro} color="#fff3c4" />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 7: the famous quote */
type QW = { text: string; t: number };

const Quote: React.FC<{ readonly line1: QW[]; readonly line2: QW[]; readonly no: number; readonly knows: number }> = ({ line1, line2, no, knows }) => {
  const frame = useCurrentFrame();
  const marks = p01(frame, line1[0].t - 10, line1[0].t + 4);
  const red = p01(frame, no, no + 10);
  const green = p01(frame, knows, knows + 12);
  const hlFrom = line2.findIndex((w) => w.text.startsWith("যে"));
  const Word: React.FC<{ readonly w: QW; readonly hl?: boolean }> = ({ w, hl }) => {
    const p = p01(frame, w.t - 2, w.t + 8);
    const isAI = w.text.startsWith("AI");
    return (
      <span style={{ display: "inline-block", overflow: "hidden", padding: "6px 0 14px", marginRight: 18 }}>
        <span
          style={{
            display: "inline-block",
            translate: `0 ${(1 - p) * 110}%`,
            filter: p < 1 ? `blur(${(1 - p) * 6}px)` : undefined,
            color: isAI ? N.greenHi : N.ink,
            fontFamily: isAI ? numFont : headFont,
            fontWeight: isAI ? 900 : 800,
            lineHeight: 1.3,
            textShadow: isAI ? `0 0 24px ${N.green}` : "0 4px 20px rgba(0,0,0,0.6)",
            backgroundImage: hl ? `linear-gradient(${N.green}66, ${N.green}66)` : undefined,
            backgroundSize: `${green * 100}% 38%`,
            backgroundPosition: "0 88%",
            backgroundRepeat: "no-repeat",
          }}
        >
          {w.text}
        </span>
      </span>
    );
  };
  return (
    <AbsoluteFill>
      <DocBg tint="#1a2220" spot={[30, 40]} />
      <Plate id="dc" blur={22} dim={0.75} from={4} style={{ opacity: 0.55 }} />
      <Atmos seed="p4g" leak={0.4} />
      <Cam push={0.08} drift={[-30, -10]} punch={[no, knows]}>
        <PhotoCard src="nvidia/img/jensen_portrait.jpg" x={90} y={150} w={500} h={640} at={0} rot={-4} pos="50% 22%" tape={false} />
        <AbsoluteFill style={{ perspective: 1700 }}>
          <Glass style={{ left: 680, top: 130, width: 1150, height: 700, transform: "rotateY(-8deg)", transformOrigin: "100% 50%" }}>
            <div style={{ position: "absolute", left: 70, top: 46, fontFamily: headFont, fontWeight: 700, fontSize: 36, color: N.muted, lineHeight: 1.4, opacity: p01(frame, 2, 14) }}>তার খুব পরিচিত একটা কথা</div>
            <div style={{ position: "absolute", left: 40, top: 70, fontFamily: "Georgia, serif", fontWeight: 900, fontSize: 300, lineHeight: 1, color: N.green, opacity: 0.45 * marks, scale: `${1.5 - 0.5 * marks}`, textShadow: `0 0 40px ${N.green}` }}>“</div>
            <div style={{ position: "absolute", left: 90, right: 70, top: 200, fontSize: 68 }}>
              <div style={{ position: "relative", display: "inline-block" }}>
                {line1.map((w, i) => (
                  <Word key={i} w={w} />
                ))}
                <div style={{ position: "absolute", left: 0, bottom: 18, height: 8, width: `${red * 96}%`, background: N.red, borderRadius: 4, boxShadow: `0 0 16px ${N.red}` }} />
              </div>
              <div style={{ marginTop: 10 }}>
                {line2.map((w, i) => (
                  <Word key={i} w={w} hl={i >= hlFrom} />
                ))}
              </div>
            </div>
            <div style={{ position: "absolute", right: 60, bottom: -50, fontFamily: "Georgia, serif", fontWeight: 900, fontSize: 300, lineHeight: 1, color: N.green, opacity: 0.45 * green, textShadow: `0 0 40px ${N.green}` }}>”</div>
          </Glass>
        </AbsoluteFill>
      </Cam>
      {frame >= no && frame < no + 6 ? <GlitchBars amount={1 - (frame - no) / 6} /> : null}
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 8a: this year, Stanford photos */
const ThisYear: React.FC<{ readonly said: number; readonly ai: number; readonly dur: number }> = ({ said, ai, dur }) => {
  const frame = useCurrentFrame();
  const slide = p01(frame, said, said + 16, ease.inOut);
  return (
    <AbsoluteFill style={{ background: N.bg }}>
      <Cam push={0.08} drift={[-30, 0]} punch={[ai]}>
        <div style={{ position: "absolute", left: 0, top: 0, height: 1080, width: 1920 - 860 * slide, overflow: "hidden" }}>
          <Photo src="nvidia/img/jensen_stage1.jpg" dur={dur} zoom={[1.05, 1.2]} pan={[0, 0, -40, 10]} pos="70% 40%" />
        </div>
        <div style={{ position: "absolute", left: 1920 - 860 * slide, top: 0, height: 1080, width: 860, overflow: "hidden", borderLeft: `6px solid ${N.green}`, boxShadow: "-20px 0 60px rgba(0,0,0,0.7)" }}>
          <Photo src="nvidia/img/jensen_stage3.jpg" from={said} dur={dur - said} zoom={[1.15, 1.3]} pan={[30, 0, -30, 0]} pos="45% 40%" />
        </div>
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(5,6,7,0.75) 0%, transparent 30%, transparent 55%, rgba(5,6,7,0.8) 100%)" }} />
      </Cam>
      <Atmos seed="p4h" leak={0.3} bokeh={10} />
      <div style={{ position: "absolute", left: 96, top: 64, display: "flex", gap: 20, alignItems: "center" }}>
        <Pill at={0}>এ বছরও</Pill>
        <Glass style={{ position: "relative", padding: "8px 18px", opacity: p01(frame, 6, 16) }}>
          <div style={{ fontFamily: numFont, fontWeight: 800, fontSize: 30, color: N.ink, letterSpacing: 2 }}>STANFORD · 2026</div>
        </Glass>
      </div>
      <div style={{ position: "absolute", left: 96, top: 620, width: 1400 }}>
        <KText text="AI আসায় প্রোগ্রামার…?" at={ai} size={84} align="left" />
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 8b: more people will code */
const Coder: React.FC<{ readonly x: number; readonly y: number; readonly p: number; readonly code: number; readonly first: boolean }> = ({ x, y, p, code, first }) => (
  <g transform={`translate(${x} ${y}) scale(${1.15 * (0.6 + 0.4 * p)})`} opacity={p}>
    <rect x={-56} y={-96} width={112} height={124} rx={18} fill="rgba(255,255,255,0.06)" stroke={code > 0.5 ? N.greenHi : "rgba(255,255,255,0.18)"} strokeWidth={2} />
    <circle cx={0} cy={-58} r={20} fill={first ? "#dfe6e2" : "#9aa5a0"} />
    <path d="M-34 6 Q -32 -30 0 -30 Q 32 -30 34 6 Z" fill={first ? "#dfe6e2" : "#9aa5a0"} />
    <path d="M-42 8 L42 8 L34 -18 L-34 -18 Z" fill="#1c2226" stroke={code > 0 ? N.greenHi : N.muted} strokeWidth={3} />
    <text x={0} y={2} textAnchor="middle" fontFamily={numFont} fontWeight={900} fontSize={17} fill={N.greenHi} opacity={code}>
      {"</>"}
    </text>
    <rect x={-56} y={-96} width={112} height={124} rx={18} fill={N.green} opacity={0.14 * code} />
  </g>
);

const MoreCoders: React.FC<{ readonly less: number; readonly no: number; readonly more: number; readonly code: number }> = ({ less, no, more, code }) => {
  const frame = useCurrentFrame();
  const arrow = p01(frame, less, less + 8);
  const cross = p01(frame, no, no + 8);
  const grow = p01(frame, more, code + 4);
  const cd = (i: number) => p01(frame, code + (i % 11) * 0.8, code + (i % 11) * 0.8 + 8);
  const people: { x: number; y: number; i: number; first: boolean }[] = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 11; c++) people.push({ x: 260 + c * 140, y: 370 + r * 135, i: r * 11 + c, first: r === 1 && c >= 3 && c <= 7 });
  const rest = people.filter((p) => !p.first);
  return (
    <AbsoluteFill>
      <Plate id="dc" blur={14} dim={0.62} from={3} />
      <Atmos seed="p4i" leak={0.45} />
      <Cam push={0.06} drift={[0, -10]} punch={[no, code]} origin="50% 50%">
        <AbsoluteFill style={{ scale: `${interpolate(grow, [0, 1], [1.25, 1])}`, transformOrigin: "50% 52%" }}>
          <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
            {people
              .filter((p) => p.first)
              .map((p) => (
                <Coder key={p.i} x={p.x} y={p.y} p={p01(frame, 0, 12)} code={cd(p.i)} first />
              ))}
            {rest.map((p, k) => {
              const a = (k / rest.length) * 0.7;
              return <Coder key={p.i} x={p.x} y={p.y} p={interpolate(grow, [a, a + 0.3], [0, 1], clamp)} code={cd(p.i)} first={false} />;
            })}
          </svg>
        </AbsoluteFill>
        <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, opacity: arrow * (1 - grow) }}>
          <path d="M1700 380 L1700 540 M1650 490 L1700 550 L1750 490" fill="none" stroke={N.red} strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 12px ${N.red})` }} />
          <path d="M1620 380 L1780 540 M1780 380 L1620 540" stroke="#fff" strokeWidth={14} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - cross} />
        </svg>
      </Cam>
      <div style={{ position: "absolute", top: 50, width: "100%", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "baseline", gap: 24 }}>
          <KText text="প্রোগ্রামার" at={0} size={68} />
          <span style={{ fontFamily: headFont, fontWeight: 800, fontSize: 68, color: N.red, opacity: cross, display: "inline-block", scale: `${1.5 - 0.5 * cross}`, textShadow: `0 0 30px ${N.red}88` }}>কমবে না</span>
        </div>
        <div style={{ marginTop: -30 }}>
          <KText text="আরো বেশি মানুষ প্রোগ্রাম লিখবে </>" at={more} size={54} color={N.greenHi} stagger={4} glow={`${N.green}66`} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- assembly */
export const P4Scene: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  const at = useAt(P4_ID);
  const f = (s: number) => Math.round(s * fps);

  const b2 = f(at("কিশোর") - 0.2);
  const b3 = f(at("পরে") - 0.1);
  const b4 = f(at("৩৩") - 0.2);
  const b5 = f(at("সবসময়") - 0.2);
  const b6 = f(at("আর") - 0.15);
  const b7 = f(at("তার") - 0.2);
  const b8 = f(at("বছরও") - 0.3);
  const b9 = f(at("প্রোগ্রামার") - 0.3);

  // quote words straight from the VO timeline so every word lands as it is spoken
  const span = SCENE_SPANS[P4_ID];
  const q0 = at("AI", 1) - 0.05;
  const qEnd = at("জানে") + 0.05;
  const qWords = VO_WORDS.filter((w) => w.startMs / 1000 - span[0] >= q0 && w.startMs / 1000 - span[0] <= qEnd).map((w) => ({ text: w.text, t: f(w.startMs / 1000 - span[0]) - b7 }));
  const split = qWords.findIndex((w) => w.text.includes("।")) + 1;

  const beats: Beat[] = [
    { at: 0, name: "taiwan→usa", node: <Journey tw={f(at("তাইওয়ানে"))} fly={f(at("চলে"))} us={f(at("আমেরিকায়"))} /> },
    { at: b2, trans: "whip", name: "restaurant", node: <Restaurant rest={f(at("রেস্টুরেন্টে")) - b2} table={f(at("টেবিলে")) - b2} food={f(at("খাবার")) - b2} /> },
    { at: b3, trans: "blur", name: "shy", node: <Shy shy={f(at("লাজুক")) - b3} out={f(at("বের")) - b3} /> },
    { at: b4, trans: "zoom", name: "33 years", node: <Years33 ceo={f(at("সিইও")) - b4} /> },
    { at: b5, trans: "whipL", name: "jacket", node: <Jacket black={f(at("কালো")) - b5} dur={b6 - b5 + 10} /> },
    { at: b6, trans: "flash", name: "power plant", node: <PowerPlant ai={f(at("AI")) - b6} power={f(at("বিদ্যুৎ")) - b6} kendro={f(at("কেন্দ্র")) - b6} /> },
    { at: b7, trans: "glitch", name: "quote", node: <Quote line1={qWords.slice(0, split)} line2={qWords.slice(split)} no={f(at("না", 1)) - b7} knows={f(at("জানে")) - b7} /> },
    { at: b8, trans: "slideUp", name: "this year", node: <ThisYear said={f(at("বলেছেন", 1)) - b8} ai={f(at("AI", 3)) - b8} dur={b9 - b8 + 10} /> },
    { at: b9, trans: "zoom", name: "more coders", node: <MoreCoders less={f(at("কমবে")) - b9} no={f(at("না", 2)) - b9} more={f(at("আরো")) - b9} code={f(at("প্রোগ্রাম", 1)) - b9} /> },
  ];

  return (
    <AbsoluteFill style={{ background: N.bg }}>
      <Beats beats={beats} end={durationInFrames} />
    </AbsoluteFill>
  );
};

