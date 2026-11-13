/**
 * P3 v2 — how big is NVIDIA (110.6 → 144.5 s). 3D plates behind everything, glass graphics, a transition on
 * every cut, camera always moving. Beats keyed to the spoken word:
 *  1 "এপ্রিল থেকে জুলাই … ৯৬ বিলিয়ন ডলার"   glass month strip (Apr–Jul bracket) → $0 → $96B counter slams
 *  2 "এক বছর আগের চেয়ে দ্বিগুণের বেশি"       glowing bars 2025 $47B vs 2026 $96B, ×2+ pops
 *  3 "পুরোটাই … AI ডেটা সেন্টারের চিপ"         glass donut fills to 93 % + data-centre photo print
 *  4 "অক্টোবরে … পাঁচ দশমিক আট ট্রিলিয়ন"     HQ print tossed in, tilted glass market chart → $5.8T
 *  5 "বাংলাদেশের … এগারো গুণ"                 extruded Bangladesh + tower of 11 glass GDP blocks, tilt-up
 *  6 "ইতিহাসে … ছয় ট্রিলিয়নের"               glass gauge, needle stops just short of the amber $6T line
 *  7 "নতুন চিপ … ভেরা রুবিন"                   3D tray plate, VERA RUBIN light-sweep reveal
 *  8 "যত চিপ চাওয়া হচ্ছে, তত বানানো যাচ্ছে না" chips on a conveyor vs a demand bar bursting past MAX, stamp
 */
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Atmos, Beats, Cam, Counter, DocBg, Glass, GlitchBars, HitFlash, KText, PhotoCard, Plate, p01, type Beat } from "../kit";
import { N, clamp, ease, headFont, numFont } from "../theme";
import { BD_PATH, BD_VIEWBOX } from "../two/bdPath";
import type { Cue } from "../types";
import { useAt } from "../vo";

export const P3_ID = "P3";
export const P3_KEYWORDS: string[] = ["৯৬", "দ্বিগুণের", "ট্রিলিয়ন", "এগারো", "ভেরা", "চাহিদা"];

export const P3_CUES: Cue[] = [
  { sfx: "cash", word: "৯৬" },
  { sfx: "swoosh_up", word: "দ্বিগুণের", offset: -0.1 },
  { sfx: "whoosh_big", word: "আর", offset: -0.3 },
  { sfx: "impact_deep", word: "ট্রিলিয়ন" },
  { sfx: "impact", word: "এগারো" },
  { sfx: "shimmer", word: "ভেরা" },
  { sfx: "hit_glitch", word: "বানানো", volume: 0.8 },
];

const BigNum: React.FC<{ readonly hit: number; readonly children: React.ReactNode; readonly size?: number; readonly color?: string }> = ({ hit, children, size = 230, color = N.greenHi }) => {
  const frame = useCurrentFrame();
  const k = frame >= hit ? Math.exp(-(frame - hit) / 4) : 0;
  const on = frame >= hit;
  return (
    <div style={{ position: "relative", scale: `${1 + 0.35 * k}` }}>
      <div
        style={{
          fontFamily: numFont,
          fontWeight: 900,
          fontSize: size,
          letterSpacing: -6,
          lineHeight: 1.05,
          color: "#fff",
          WebkitTextStroke: on ? `3px ${color}` : undefined,
          textShadow: on ? `0 0 80px ${color}, 0 0 20px ${color}, 0 20px 60px #000` : "0 20px 60px #000",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {children}
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- 1: three months → $96B */
const MONTHS = ["জানু", "ফেব্রু", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টে", "অক্টো", "নভে", "ডিসে"];

const Revenue: React.FC<{ readonly apr: number; readonly three: number; readonly nv: number; readonly land: number }> = ({ apr, three, nv, land }) => {
  const frame = useCurrentFrame();
  const br = p01(frame, apr, three + 8, ease.inOut);
  const up = p01(frame, nv - 8, nv + 14, ease.inOut);
  const cntIn = p01(frame, nv - 4, nv + 8);
  const x0 = 3.85 * 118;
  const x1 = 6.85 * 118;
  return (
    <AbsoluteFill>
      <Plate id="dc" blur={12} dim={0.6} from={1} />
      <Atmos seed="p3a" />
      <Cam push={0.1} drift={[-30, -10]} punch={[land]} shakeAt={[land]}>
        <AbsoluteFill style={{ perspective: 1600 }}>
          <Glass
            style={{
              left: 230,
              top: 190 - 120 * up,
              width: 1460,
              height: 250,
              transform: `rotateX(${18 + 10 * up}deg) scale(${1 - 0.15 * up})`,
              transformOrigin: "50% 0%",
              opacity: 1 - 0.35 * up,
            }}
          >
            <div style={{ position: "absolute", left: 30, top: 16, fontFamily: numFont, fontWeight: 900, fontSize: 34, color: N.muted, letterSpacing: 10 }}>2026</div>
            <div style={{ position: "absolute", left: 30, top: 66, display: "flex" }}>
              {MONTHS.map((m, i) => {
                const on = i >= 3 && i <= 6 ? br : 0;
                const pop = p01(frame, i * 1.2, i * 1.2 + 10);
                return (
                  <div
                    key={m}
                    style={{
                      width: 110,
                      marginRight: 8,
                      height: 86,
                      borderRadius: 12,
                      background: on > 0.3 ? `linear-gradient(180deg, ${N.green}88, ${N.green}22)` : "rgba(255,255,255,0.05)",
                      border: `1.5px solid ${on > 0.3 ? N.greenHi : "rgba(255,255,255,0.12)"}`,
                      boxShadow: on > 0.3 ? `0 0 30px ${N.green}66` : undefined,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: headFont,
                      fontWeight: 700,
                      fontSize: 28,
                      lineHeight: 1.4,
                      color: on > 0.3 ? "#fff" : N.muted,
                      opacity: pop,
                      translate: `0 ${(1 - pop) * 30}px`,
                    }}
                  >
                    {m}
                  </div>
                );
              })}
            </div>
            <svg width={1460} height={90} style={{ position: "absolute", left: 30, top: 160, overflow: "visible" }}>
              <path d={`M${x0} 6 L${x0} 26 L${x1} 26 L${x1} 6`} fill="none" stroke={N.greenHi} strokeWidth={5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - br} style={{ filter: `drop-shadow(0 0 8px ${N.green})` }} />
              <text x={(x0 + x1) / 2} y={70} textAnchor="middle" fill={N.greenHi} fontFamily={headFont} fontWeight={800} fontSize={40} opacity={p01(frame, three, three + 10)}>
                ৩ মাস
              </text>
            </svg>
          </Glass>
        </AbsoluteFill>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingTop: 180, opacity: cntIn }}>
          <KText text="এনভিডিয়ার আয় · ৩ মাসে" at={nv - 4} size={50} color={N.muted} />
          <div style={{ marginTop: -20 }}>
            <BigNum hit={land}>
              <Counter to={96} a={nv} b={land} fmt={(v) => `$${Math.round(v)}B`} />
            </BigNum>
          </div>
          <div style={{ opacity: p01(frame, land + 4, land + 14), fontFamily: headFont, fontWeight: 800, fontSize: 52, color: N.ink, lineHeight: 1.4, marginTop: -6, textShadow: "0 4px 20px #000" }}>
            প্রায় <span style={{ color: N.greenHi }}>৯৬ বিলিয়ন ডলার</span>
          </div>
        </AbsoluteFill>
      </Cam>
      <HitFlash at={land} color={N.greenHi} />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 2: doubled vs a year ago */
const Doubled: React.FC<{ readonly dbl: number }> = ({ dbl }) => {
  const frame = useCurrentFrame();
  const g1 = p01(frame, 0, 14);
  const g2 = p01(frame, 6, dbl + 2);
  const x2 = p01(frame, dbl, dbl + 10);
  const base = 560;
  const h1 = 230 * g1;
  const h2 = 470 * g2;
  const Bar: React.FC<{ readonly x: number; readonly h: number; readonly c: string; readonly c2: string; readonly v: string; readonly y: string }> = ({ x, h, c, c2, v, y }) => (
    <>
      <div style={{ position: "absolute", left: x, top: base - h, width: 220, height: h, borderRadius: "18px 18px 4px 4px", background: `linear-gradient(180deg, ${c} 0%, ${c2} 100%)`, boxShadow: `0 0 60px ${c}66, inset 0 2px 0 rgba(255,255,255,0.5)` }} />
      <div style={{ position: "absolute", left: x + 20, top: base - h + 6, width: 40, height: Math.max(0, h - 12), borderRadius: 10, background: "linear-gradient(180deg, rgba(255,255,255,0.35), transparent)" }} />
      <div style={{ position: "absolute", left: x - 40, top: base - h - 84, width: 300, textAlign: "center", fontFamily: numFont, fontWeight: 900, fontSize: 60, color: N.ink, opacity: h > 20 ? 1 : 0, textShadow: "0 4px 20px #000" }}>{v}</div>
      <div style={{ position: "absolute", left: x - 60, top: base + 14, width: 340, textAlign: "center", fontFamily: headFont, fontWeight: 700, fontSize: 32, color: N.muted, lineHeight: 1.4 }}>{y}</div>
    </>
  );
  return (
    <AbsoluteFill>
      <Plate id="chipmacro" blur={14} dim={0.6} from={2} />
      <Atmos seed="p3b" />
      <Cam push={0.1} drift={[20, -20]} rot={0.6} punch={[dbl]}>
        <AbsoluteFill style={{ perspective: 1600 }}>
          <Glass style={{ left: 330, top: 200, width: 1260, height: 650, transform: "rotateY(-10deg) rotateX(6deg)" }} accent={N.green}>
            <div style={{ position: "absolute", left: 60, top: base, width: 1140, height: 3, background: "rgba(255,255,255,0.18)" }} />
            <Bar x={260} h={h1} c="#7d8a85" c2="#2a302e" v="$47B" y="২০২৫ · একই ৩ মাস" />
            <Bar x={780} h={h2} c={N.greenHi} c2="#1e4d00" v="$96B" y="২০২৬" />
            <svg viewBox="0 0 1260 650" style={{ position: "absolute", inset: 0 }}>
              <defs>
                <marker id="p3arr" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                  <path d="M0 0 L8 4 L0 8 Z" fill={N.greenHi} />
                </marker>
              </defs>
              <path d={`M 510 ${base - h1 - 100} Q 650 ${base - 560} 760 ${base - h2 + 30}`} fill="none" stroke={N.greenHi} strokeWidth={6} strokeDasharray="14 12" opacity={x2} markerEnd="url(#p3arr)" />
            </svg>
          </Glass>
        </AbsoluteFill>
      </Cam>
      <div style={{ position: "absolute", top: 46, width: "100%" }}>
        <KText text="এক বছর আগের চেয়ে" at={2} size={56} color={N.muted} />
      </div>
      <div style={{ position: "absolute", right: 120, top: 250, opacity: x2, scale: `${1.5 - 0.5 * x2}`, rotate: "-6deg" }}>
        <div style={{ fontFamily: numFont, fontWeight: 900, fontSize: 150, color: "#fff", WebkitTextStroke: `3px ${N.greenHi}`, textShadow: `0 0 60px ${N.green}` }}>×2+</div>
        <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 46, color: N.greenHi, marginTop: -20, textAlign: "center" }}>দ্বিগুণের বেশি</div>
      </div>
      <HitFlash at={dbl} color={N.greenHi} />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 3: almost all = data-center chips */
const Donut: React.FC<{ readonly all: number; readonly dc: number }> = ({ all, dc }) => {
  const frame = useCurrentFrame();
  const fill = interpolate(frame, [all - 4, dc + 6], [0, 89 / 96], { ...clamp, easing: ease.inOut });
  const lbl = p01(frame, dc, dc + 10);
  const R = 200;
  const C = 2 * Math.PI * R;
  return (
    <AbsoluteFill>
      <Plate id="dc" blur={4} dim={0.45} from={3} drift={0.12} />
      <Atmos seed="p3c" leak={0.4} />
      <Cam push={0.08} drift={[-30, 0]} punch={[dc]}>
        <AbsoluteFill style={{ perspective: 1600 }}>
          <Glass style={{ left: 140, top: 150, width: 680, height: 680, transform: "rotateY(12deg)" }}>
            <svg viewBox="0 0 680 680" style={{ position: "absolute", inset: 0 }}>
              <defs>
                <linearGradient id="p3don" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor={N.greenHi} />
                  <stop offset="1" stopColor="#2c7000" />
                </linearGradient>
              </defs>
              <g transform="rotate(-90 340 320)">
                <circle cx={340} cy={320} r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={64} />
                <circle cx={340} cy={320} r={R} fill="none" stroke="url(#p3don)" strokeWidth={64} strokeLinecap="round" strokeDasharray={`${C * fill} ${C}`} style={{ filter: `drop-shadow(0 0 22px ${N.green})` }} />
              </g>
            </svg>
            <div style={{ position: "absolute", left: 0, right: 0, top: 230, textAlign: "center" }}>
              <div style={{ fontFamily: numFont, fontWeight: 900, fontSize: 116, color: "#fff", lineHeight: 1, textShadow: `0 0 40px ${N.green}` }}>{Math.round(fill * 100)}%</div>
              <div style={{ fontFamily: headFont, fontWeight: 700, fontSize: 34, color: N.greenHi, lineHeight: 1.4, opacity: lbl }}>ডেটা সেন্টার</div>
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 580, textAlign: "center", fontFamily: numFont, fontWeight: 800, fontSize: 44, color: N.ink, opacity: lbl }}>
              $89B <span style={{ color: N.muted, fontWeight: 500 }}>/ $96B</span>
            </div>
          </Glass>
        </AbsoluteFill>
        <PhotoCard src="nvidia/img/dc_racks.jpg" x={980} y={210} w={800} h={540} at={dc - 10} rot={3} caption="AI ডেটা সেন্টারের চিপ" />
      </Cam>
      <div style={{ position: "absolute", top: 46, width: "100%" }}>
        <KText text="প্রায় পুরোটাই এসেছে কোথা থেকে?" at={2} size={56} />
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 4: market value $5.8T */
const LINE: [number, number][] = [
  [0, 440], [70, 430], [140, 400], [210, 410], [280, 360], [350, 340], [420, 300], [490, 310], [560, 250], [630, 215], [700, 190], [770, 130], [840, 95], [900, 50],
];

const MarketValue: React.FC<{ readonly share: number; readonly dam: number; readonly tri: number }> = ({ share, dam, tri }) => {
  const frame = useCurrentFrame();
  const draw = p01(frame, share, tri, ease.inOut);
  const n = LINE.length;
  const upto = draw * (n - 1);
  const i = Math.floor(upto);
  const p: [number, number][] = LINE.slice(0, i + 1);
  if (i < n - 1) {
    const fr = upto - i;
    p.push([LINE[i][0] + (LINE[i + 1][0] - LINE[i][0]) * fr, LINE[i][1] + (LINE[i + 1][1] - LINE[i][1]) * fr]);
  }
  const head = p[p.length - 1];
  const d = p.map(([x, y], k) => `${k ? "L" : "M"}${x} ${y}`).join(" ");
  return (
    <AbsoluteFill>
      <Plate id="chipmacro" blur={10} dim={0.55} from={4} />
      <Atmos seed="p3d" />
      <Cam push={0.14} drift={[-50, -10]} rot={-0.8} punch={[tri]} shakeAt={[tri]} origin="65% 45%">
        <PhotoCard src="nvidia/img/hq.jpg" x={90} y={250} w={620} h={440} at={2} rot={-5} pos="60% 50%" caption="এনভিডিয়া · সদর দপ্তর" />
        <AbsoluteFill style={{ perspective: 1600 }}>
          <Glass style={{ left: 780, top: 130, width: 1050, height: 700, transform: "rotateY(-12deg) rotateX(6deg)", transformOrigin: "100% 50%" }}>
            <div style={{ position: "absolute", left: 36, top: 24, fontFamily: numFont, fontWeight: 900, fontSize: 34, color: N.ink, letterSpacing: 2 }}>
              NVDA <span style={{ color: N.muted, fontWeight: 500, fontSize: 24 }}>· MARKET VALUE</span>
            </div>
            <div style={{ position: "absolute", right: 36, top: 22, fontFamily: headFont, fontWeight: 700, fontSize: 32, color: N.muted, opacity: p01(frame, share - 6, share + 6) }}>অক্টোবর ২০২৬</div>
            <svg viewBox="0 0 1050 700" style={{ position: "absolute", inset: 0 }}>
              <defs>
                <linearGradient id="p3ma" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={N.green} stopOpacity="0.5" />
                  <stop offset="1" stopColor={N.green} stopOpacity="0" />
                </linearGradient>
                <filter id="p3gl">
                  <feGaussianBlur stdDeviation="7" />
                </filter>
              </defs>
              <g transform="translate(60 220)">
                {[0, 1, 2, 3, 4].map((k) => (
                  <line key={k} x1={0} x2={930} y1={k * 110} y2={k * 110} stroke="rgba(255,255,255,0.06)" />
                ))}
                {p.length > 1 ? <path d={`${d} L${head[0]} 450 L0 450 Z`} fill="url(#p3ma)" /> : null}
                <path d={d} fill="none" stroke={N.green} strokeWidth={10} filter="url(#p3gl)" />
                <path d={d} fill="none" stroke={N.greenHi} strokeWidth={4.5} />
                <circle cx={head[0]} cy={head[1]} r={12} fill={N.greenHi} />
                <circle cx={head[0]} cy={head[1]} r={30 + 8 * Math.sin(frame / 3)} fill={N.greenHi} opacity={0.25} />
              </g>
            </svg>
            <div style={{ position: "absolute", left: 50, top: 80, opacity: p01(frame, dam - 6, dam + 4) }}>
              <BigNum hit={tri} size={150}>
                <Counter to={5.8} a={dam} b={tri} fmt={(v) => `$${v.toFixed(1)}T`} />
              </BigNum>
            </div>
          </Glass>
        </AbsoluteFill>
      </Cam>
      <div style={{ position: "absolute", left: 96, top: 60, width: 1200 }}>
        <KText text="শেয়ারবাজারে কোম্পানির দাম" at={share - 6} size={54} align="left" />
      </div>
      <HitFlash at={tri} color={N.greenHi} />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 5: 11 × Bangladesh */
const Times11: React.FC<{ readonly gdp: number; readonly eleven: number }> = ({ gdp, eleven }) => {
  const frame = useCurrentFrame();
  const mapIn = p01(frame, 0, 18);
  const hit = p01(frame, eleven, eleven + 10);
  const BH = 60;
  const baseY = 820;
  const k = (i: number) => p01(frame, gdp + ((eleven - gdp) * i) / 11, gdp + ((eleven - gdp) * i) / 11 + 8);
  const stackTop = baseY - 11 * BH;
  // camera tilt-up: starts close & low on the map, rises with the tower, settles wide on ১১×
  const camS = interpolate(frame, [0, gdp, eleven + 8], [1.6, 1.45, 1], { ...clamp, easing: ease.inOut });
  const camY = interpolate(frame, [0, gdp, eleven + 8], [-300, -200, 0], { ...clamp, easing: ease.inOut });
  return (
    <AbsoluteFill>
      <DocBg tint="#18231a" spot={[50, 55]} />
      <Plate id="dc" blur={20} dim={0.78} from={5} style={{ opacity: 0.6 }} />
      <Atmos seed="p3e" leak={0.45} />
      <Cam push={0.05} drift={[0, -10]} punch={[eleven]} shakeAt={[eleven]}>
        <AbsoluteFill style={{ scale: `${camS}`, translate: `0 ${camY}px`, transformOrigin: "40% 82%" }}>
          <div style={{ position: "absolute", left: 520, top: baseY - 200, width: 150, height: 200, opacity: mapIn, scale: `${0.7 + 0.3 * mapIn}` }}>
            <svg viewBox={BD_VIEWBOX} style={{ width: "100%", height: "100%", overflow: "visible" }}>
              <defs>
                <linearGradient id="p3bd" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor={N.greenHi} />
                  <stop offset="1" stopColor="#1e4d00" />
                </linearGradient>
              </defs>
              {[22, 15, 8].map((o) => (
                <path key={o} d={BD_PATH} fill="#0a1a00" transform={`translate(${o * 0.6} ${o})`} opacity={0.85} />
              ))}
              <path d={BD_PATH} fill="url(#p3bd)" stroke={N.greenHi} strokeWidth={4} style={{ filter: `drop-shadow(0 0 20px ${N.green})` }} />
            </svg>
          </div>
          <div style={{ position: "absolute", left: 440, width: 310, top: baseY + 12, textAlign: "center", fontFamily: headFont, fontWeight: 700, fontSize: 30, color: N.ink, lineHeight: 1.35, opacity: mapIn }}>
            বাংলাদেশ · ১ বছর
            <div style={{ fontFamily: numFont, fontWeight: 800, fontSize: 28, color: N.muted }}>≈ $0.51T</div>
          </div>
          {Array.from({ length: 11 }, (_, i) => {
            const p = k(i);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 900,
                  top: baseY - (i + 1) * BH - (1 - p) * 80,
                  width: 320,
                  height: BH - 6,
                  borderRadius: 10,
                  background: `linear-gradient(180deg, ${N.greenHi}ee, #2c7000ee)`,
                  border: "1.5px solid rgba(255,255,255,0.4)",
                  boxShadow: `0 0 ${24 * p}px ${N.green}88, inset 0 2px 0 rgba(255,255,255,0.5)`,
                  opacity: p,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 20px",
                  boxSizing: "border-box",
                  fontFamily: numFont,
                  fontWeight: 800,
                  fontSize: 26,
                  color: "#071000",
                }}
              >
                <span>$0.51T</span>
                <span style={{ fontWeight: 900, fontSize: 30 }}>{i + 1}</span>
              </div>
            );
          })}
          <div style={{ position: "absolute", left: 900, width: 320, top: baseY + 14, textAlign: "center", fontFamily: numFont, fontWeight: 900, fontSize: 34, color: N.ink, opacity: p01(frame, gdp, gdp + 10) }}>
            NVIDIA $5.8T
          </div>
          <div style={{ position: "absolute", left: 1280, top: stackTop + 40, opacity: hit, scale: `${1.6 - 0.6 * hit}`, transformOrigin: "left center", rotate: "-4deg" }}>
            <div style={{ fontFamily: numFont, fontWeight: 900, fontSize: 210, lineHeight: 1, color: "#fff", WebkitTextStroke: `3px ${N.greenHi}`, textShadow: `0 0 70px ${N.green}` }}>×11</div>
            <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 52, color: N.greenHi, lineHeight: 1.35, marginTop: 6 }}>প্রায় এগারো গুণ</div>
          </div>
        </AbsoluteFill>
      </Cam>
      <div style={{ position: "absolute", top: 46, width: "100%" }}>
        <KText text="বাংলাদেশের এক বছরের পুরো অর্থনীতি" at={gdp - 8} size={56} />
      </div>
      <HitFlash at={eleven} color={N.greenHi} />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 6: never this close to $6T */
const SixT: React.FC<{ readonly close: number; readonly six: number }> = ({ close, six }) => {
  const frame = useCurrentFrame();
  const v = interpolate(frame, [4, close + 4], [0, 5.8], { ...clamp, easing: ease.out });
  const line6 = p01(frame, six - 4, six + 8);
  const gap = p01(frame, six + 4, six + 14);
  const W = 1240;
  const x = (val: number) => (val / 6.2) * W;
  return (
    <AbsoluteFill>
      <Plate id="dc" blur={10} dim={0.6} from={6} rate={0.8} />
      <Atmos seed="p3f" color={N.amber} leak={0.4} />
      <Cam push={0.18} drift={[-120, 0]} punch={[six]} origin="78% 55%">
        <AbsoluteFill style={{ perspective: 1600 }}>
          <Glass style={{ left: 200, top: 330, width: 1520, height: 420, transform: "rotateX(14deg) rotateY(-6deg)" }} accent={N.amber}>
            <div style={{ position: "absolute", left: 120, top: 120, width: W, height: 90, borderRadius: 45, background: "rgba(0,0,0,0.35)", border: "1.5px solid rgba(255,255,255,0.12)" }} />
            <div style={{ position: "absolute", left: 120, top: 120, width: x(v), height: 90, borderRadius: 45, background: `linear-gradient(90deg, #1e4d00, ${N.greenHi})`, boxShadow: `0 0 50px ${N.green}aa, inset 0 2px 0 rgba(255,255,255,0.5)` }} />
            {[0, 1, 2, 3, 4, 5].map((t) => (
              <div key={t} style={{ position: "absolute", left: 120 + x(t) - 40, width: 80, top: 230, textAlign: "center", fontFamily: numFont, fontWeight: 700, fontSize: 28, color: N.muted }}>
                ${t}T
              </div>
            ))}
            <div style={{ position: "absolute", left: 120 + x(6) - 3, top: 60, width: 6, height: 210, background: N.amber, opacity: line6, boxShadow: `0 0 24px ${N.amber}` }} />
            <div style={{ position: "absolute", left: 120 + x(6) - 90, width: 180, top: 0, textAlign: "center", fontFamily: numFont, fontWeight: 900, fontSize: 52, color: N.amber, opacity: line6, textShadow: `0 0 30px ${N.amber}` }}>$6T</div>
            <div style={{ position: "absolute", left: 120 + x(v) - 130, width: 260, top: 290, textAlign: "center", fontFamily: numFont, fontWeight: 900, fontSize: 56, color: "#fff", textShadow: `0 0 30px ${N.green}` }}>${v.toFixed(1)}T</div>
            <div style={{ position: "absolute", left: 120 + x(5.8) + 4, width: x(6) - x(5.8) - 4, top: 112, height: 106, border: `3px dashed ${N.amber}`, borderRadius: 10, opacity: gap * (0.6 + 0.4 * Math.sin(frame / 3)) }} />
          </Glass>
        </AbsoluteFill>
      </Cam>
      <div style={{ position: "absolute", top: 60, width: "100%" }}>
        <KText text="ইতিহাসে প্রথম" at={2} size={84} glow={`${N.amber}55`} />
        <div style={{ marginTop: -20 }}>
          <KText text="কোনো কোম্পানি ছয় ট্রিলিয়নের এত কাছে যায়নি" at={six - 6} size={46} color={N.amber} stagger={2} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 7: Vera Rubin (3D tray plate) */
const VeraRubin: React.FC<{ readonly chip: number; readonly name: number; readonly demand: number }> = ({ chip, name, demand }) => {
  const frame = useCurrentFrame();
  const nm = p01(frame, name - 2, name + 14);
  const sweep = interpolate(frame, [name, name + 28], [-30, 140], clamp);
  const dm = p01(frame, demand, demand + 10);
  return (
    <AbsoluteFill>
      <Plate id="tray" from={0.5} rate={1.1} drift={0.16} />
      <Atmos seed="p3g" bokeh={12} leak={0.4} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(3,4,5,0.7) 0%, transparent 40%)" }} />
      <div style={{ position: "absolute", left: 96, top: 70 }}>
        <Glass style={{ position: "relative", padding: "6px 30px 14px", opacity: p01(frame, chip - 4, chip + 8) }} sheenAt={chip}>
          <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 46, color: N.ink, lineHeight: 1.35 }}>
            নতুন চিপ <span style={{ fontFamily: numFont, color: N.greenHi, fontSize: 30, letterSpacing: 4, marginLeft: 12 }}>● NOW SHIPPING</span>
          </div>
        </Glass>
      </div>
      <Cam push={0.06} punch={[name]}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 260 }}>
          <div
            style={{
              opacity: nm,
              letterSpacing: `${36 - 20 * nm}px`,
              fontFamily: numFont,
              fontWeight: 900,
              fontSize: 160,
              backgroundImage: `linear-gradient(100deg, #e9ecef ${sweep - 18}%, #ffffff ${sweep - 4}%, ${N.greenHi} ${sweep}%, #e9ecef ${sweep + 18}%)`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: `drop-shadow(0 10px 40px rgba(0,0,0,0.95)) drop-shadow(0 0 40px ${N.green}66) blur(${(1 - nm) * 10}px)`,
              scale: `${1.3 - 0.3 * nm}`,
            }}
          >
            VERA RUBIN
          </div>
          <div style={{ opacity: p01(frame, name + 8, name + 20), fontFamily: headFont, fontWeight: 800, fontSize: 52, color: N.greenHi, letterSpacing: 4, marginTop: -10, textShadow: "0 4px 20px #000" }}>ভেরা রুবিন</div>
        </AbsoluteFill>
      </Cam>
      <div style={{ position: "absolute", right: 110, top: 620, opacity: dm, scale: `${1.4 - 0.4 * dm}`, rotate: "-4deg" }}>
        <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 60, color: "#fff", background: `linear-gradient(135deg, ${N.red}, #8a0f0f)`, borderRadius: 16, padding: "4px 30px 14px", lineHeight: 1.35, boxShadow: `0 0 50px ${N.red}88` }}>
          চাহিদা বিশাল ↑
        </div>
      </div>
      <HitFlash at={name} color={N.greenHi} />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 8: demand > supply */
const Demand: React.FC<{ readonly want: number; readonly made: number }> = ({ want, made }) => {
  const frame = useCurrentFrame();
  const dH = interpolate(frame, [0, want + 14], [80, 600], { ...clamp, easing: ease.in });
  const sH = interpolate(frame, [0, 20], [0, 150], { ...clamp, easing: ease.out });
  const over = dH > 470;
  const st = p01(frame, made, made + 7);
  const base = 640;
  const dc = over ? N.red : N.amber;
  return (
    <AbsoluteFill>
      <Plate id="dc" blur={12} dim={0.6} from={2} tint={over ? "#ff8080" : undefined} />
      <Atmos seed="p3h" color={over ? N.red : N.amber} leak={0.45} />
      <Cam push={0.1} drift={[-20, -10]} punch={[want, made]} shakeAt={[made]}>
        <AbsoluteFill style={{ perspective: 1600 }}>
          <Glass style={{ left: 120, top: 150, width: 1680, height: 700, transform: "rotateX(8deg)" }} accent={dc}>
            {/* factory + conveyor */}
            <svg viewBox="0 0 240 200" style={{ position: "absolute", left: 50, top: base - 200, width: 240, height: 200 }}>
              <defs>
                <linearGradient id="p3fac" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#3a444a" />
                  <stop offset="1" stopColor="#14191c" />
                </linearGradient>
              </defs>
              <path d="M10 200 L10 90 L70 120 L70 90 L130 120 L130 90 L190 120 L190 20 L215 20 L215 200 Z" fill="url(#p3fac)" stroke="rgba(255,255,255,0.3)" strokeWidth={3} />
              {[30, 90, 150].map((x) => (
                <rect key={x} x={x} y={150} width={26} height={26} rx={3} fill={N.amber} opacity={0.6 + 0.4 * Math.sin(frame / 5 + x)} />
              ))}
            </svg>
            <div style={{ position: "absolute", left: 50, width: 240, top: base + 12, textAlign: "center", fontFamily: headFont, fontWeight: 700, fontSize: 30, color: N.muted, lineHeight: 1.4 }}>কারখানা</div>
            <div style={{ position: "absolute", left: 290, top: base - 26, width: 560, height: 22, borderRadius: 11, background: "linear-gradient(180deg,#3a4248,#15191c)", boxShadow: "inset 0 2px 0 rgba(255,255,255,0.15)" }} />
            {Array.from({ length: 4 }, (_, i) => {
              const xx = ((frame * 4 + i * 140) % 560) + 290;
              return <div key={i} style={{ position: "absolute", left: xx, top: base - 70, width: 44, height: 44, borderRadius: 7, background: "linear-gradient(135deg,#59646b,#1c2226)", border: `2px solid ${N.greenHi}`, boxShadow: `0 0 16px ${N.green}` }} />;
            })}
            {/* supply bar */}
            <div style={{ position: "absolute", left: 880, top: base - sH, width: 240, height: sH, borderRadius: "16px 16px 4px 4px", background: `linear-gradient(180deg, ${N.greenHi}, #1e4d00)`, boxShadow: `0 0 40px ${N.green}88, inset 0 2px 0 rgba(255,255,255,0.5)` }} />
            <div style={{ position: "absolute", left: 850, width: 300, top: base + 12, textAlign: "center", fontFamily: headFont, fontWeight: 800, fontSize: 36, color: N.ink, lineHeight: 1.35 }}>বানানো যাচ্ছে</div>
            {/* demand bar */}
            <div style={{ position: "absolute", left: 1290, top: base - dH, width: 240, height: dH, borderRadius: "16px 16px 4px 4px", background: `linear-gradient(180deg, ${dc}, ${dc}33)`, boxShadow: `0 0 60px ${dc}aa, inset 0 2px 0 rgba(255,255,255,0.5)` }} />
            <div style={{ position: "absolute", left: 1260, width: 300, top: base + 12, textAlign: "center", fontFamily: headFont, fontWeight: 800, fontSize: 36, color: N.ink, lineHeight: 1.35 }}>চাওয়া হচ্ছে</div>
            <div style={{ position: "absolute", left: 830, width: 780, top: base - 470, borderTop: "3px dashed rgba(255,255,255,0.45)" }} />
            <div style={{ position: "absolute", left: 830, top: base - 510, fontFamily: numFont, fontWeight: 700, fontSize: 26, color: N.muted, letterSpacing: 3 }}>MAX CAPACITY</div>
          </Glass>
        </AbsoluteFill>
      </Cam>
      <div style={{ position: "absolute", left: 96, top: 46, width: 1200 }}>
        <KText text="চাহিদা > সরবরাহ" at={2} size={70} align="left" glow={`${N.red}55`} />
      </div>
      {frame >= made ? (
        <div style={{ position: "absolute", left: 300, top: 300, opacity: st, scale: `${2.2 - 1.2 * st}`, rotate: "-8deg", border: `9px solid ${N.red}`, color: N.red, borderRadius: 16, padding: "0 34px 14px", fontFamily: headFont, fontWeight: 800, fontSize: 96, lineHeight: 1.35, background: "rgba(40,0,0,0.45)", textShadow: `0 0 30px ${N.red}aa` }}>
          সাপ্লাই কম!
        </div>
      ) : null}
      <HitFlash at={made} color="#ff8080" />
      {frame >= made && frame < made + 6 ? <GlitchBars amount={1 - (frame - made) / 6} /> : null}
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- assembly */
export const P3Scene: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  const at = useAt(P3_ID);
  const f = (s: number) => Math.round(s * fps);

  const b2 = f(at("এক") - 0.15);
  const b3 = f(at("এর") - 0.1);
  const b4 = f(at("আর") - 0.2);
  const b5 = f(at("বাংলাদেশের") - 0.2);
  const b6 = f(at("ইতিহাসে") - 0.15);
  const b7 = f(at("এখন") - 0.2);
  const b8 = f(at("বলছে") - 0.3);

  const beats: Beat[] = [
    { at: 0, name: "revenue", node: <Revenue apr={f(at("এপ্রিল"))} three={f(at("তিন"))} nv={f(at("এনভিডিয়ার"))} land={f(at("৯৬"))} /> },
    { at: b2, trans: "whip", name: "doubled", node: <Doubled dbl={f(at("দ্বিগুণের")) - b2} /> },
    { at: b3, trans: "slideUp", name: "data center", node: <Donut all={f(at("পুরোটাই")) - b3} dc={f(at("ডেটা")) - b3} /> },
    { at: b4, trans: "zoom", name: "market value", node: <MarketValue share={f(at("শেয়ারবাজারে")) - b4} dam={f(at("দাম")) - b4} tri={f(at("ট্রিলিয়ন")) - b4} /> },
    { at: b5, trans: "whipL", name: "x11 bangladesh", node: <Times11 gdp={f(at("এক", 1)) - b5} eleven={f(at("এগারো")) - b5} /> },
    { at: b6, trans: "blur", name: "6T", node: <SixT close={f(at("কাছে")) - b6} six={f(at("ছয়")) - b6} /> },
    { at: b7, trans: "flash", name: "vera rubin", node: <VeraRubin chip={f(at("নতুন")) - b7} name={f(at("ভেরা")) - b7} demand={f(at("চাহিদা")) - b7} /> },
    { at: b8, trans: "glitch", name: "demand", node: <Demand want={f(at("চাওয়া")) - b8} made={f(at("বানানো")) - b8} /> },
  ];

  return (
    <AbsoluteFill style={{ background: N.bg }}>
      <Beats beats={beats} end={durationInFrames} />
    </AbsoluteFill>
  );
};
