/**
 * P5 — SENSITIVE (184.6 → 254.6 s), STYLE v2: cold documentary grade, desk + prints, blue-tinted 3D plate.
 * Neutral and calm. No woman shown or named. Every allegation carries the amber "অভিযোগ — প্রমাণিত নয়".
 *  1 ৮ নভেম্বর, রবিবার           desk calendar flips to ৮, red ring
 *  2 জেনসেন … চিঠি লেখেন         grey Jensen print tossed on desk, envelope glass chip
 *  3 নিজেই স্বীকার করেন          stylised envelope opens (abstract lines), kinetic line
 *  4 স্ত্রীর প্রতি অবিশ্বস্ত         quote glass over the darkened, blue portrait
 *  5 অজুহাত নেই / দায় পুরোটাই তার  two quote glasses
 *  6 একই সময়ে এনভিডিয়া জানায়     3D data-centre plate (blue), statement glass
 *  7 গোয়েন্দা তৎপরতার লক্ষ্য … তদন্ত investigation folder on desk, magnifier, stamp
 *  8 মার্কিন সংবাদমাধ্যমের রিপোর্ট   generic blurred clippings on desk
 *  9 অভিযোগ ওঠে …                 amber label + schematic node "উল্লিখিত সম্পর্ক ?"
 * 10 চীনা গোয়েন্দাদের যোগ          second node + dashed "?" link
 * 11 মনে রাখবেন … প্রমাণিত নয়       amber stamp
 * 12 চীন অস্বীকার / বোর্ড / হুয়াং     balance: allegation pan vs fact glasses
 */
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Beats, Cam, Glass, KText, Marker, PhotoCard, p01, type Beat } from "../kit";
import { N, clamp, ease, headFont, numFont } from "../theme";
import { AllegLabel, COOL, Calendar, ColdDesk, ColdPlate, FactGlass, Stamp } from "../two/P5_common";
import type { Cue } from "../types";
import { useAt } from "../vo";

export const P5_ID = "P5";
export const P5_KEYWORDS = ["অবিশ্বস্ত", "অজুহাত", "তদন্ত", "অভিযোগ", "প্রমাণিত", "অস্বীকার"];

export const P5_CUES: Cue[] = [
  { sfx: "tick", word: "৮", volume: 0.8 },
  { sfx: "camera_shutter", word: "জেনসেন", offset: -0.15, volume: 0.6 },
  { sfx: "ui_click", word: "চিঠি", volume: 0.7 },
  { sfx: "heartbeat", word: "অবিশ্বস্ত", offset: -0.1, volume: 0.8 },
  { sfx: "whoosh", word: "একই", offset: -0.2, volume: 0.7 },
  { sfx: "impact_deep", word: "তদন্ত", volume: 0.7 },
  { sfx: "whoosh", word: "পেছনে", offset: -0.3, volume: 0.6 },
  { sfx: "alarm_soft", word: "অভিযোগ", volume: 0.5 },
  { sfx: "heartbeat", word: "যোগ", volume: 0.7 },
  { sfx: "impact", word: "প্রমাণিত", volume: 0.8 },
  { sfx: "ui_pop", word: "অস্বীকার" },
  { sfx: "ui_pop", word: "বোর্ড" },
  { sfx: "ui_pop", word: "হুয়াং", nth: 2 },
];

/* ---------------------------------------------------------------- 1 date */
const DateBeat: React.FC<{ readonly sunday: number }> = ({ sunday }) => (
  <AbsoluteFill>
    <ColdDesk seed="d1" spot={[50, 42]} />
    <Cam push={0.12} drift={[0, -10]} rot={-0.8} punch={[sunday]}>
      <AbsoluteFill style={{ perspective: 1500, justifyContent: "center", alignItems: "center", paddingBottom: 150 }}>
        <div style={{ transform: "rotateX(14deg) rotateZ(-4deg)" }}>
          <Calendar days={["৮"]} flips={[0]} weekday="রবিবার" weekdayAt={sunday} ring={sunday + 3} />
        </div>
      </AbsoluteFill>
    </Cam>
  </AbsoluteFill>
);

/* ---------------------------------------------------------------- 2 Jensen + letter */
const Envelope: React.FC<{ readonly size: number; readonly open?: number }> = ({ size, open = 0 }) => (
  <svg viewBox="0 0 100 70" width={size} height={size * 0.7} style={{ overflow: "visible" }}>
    <rect x={3} y={3} width={94} height={64} rx={6} fill="#e8e5dc" stroke="#9aa3a0" strokeWidth={1.5} />
    <path d="M3 67 L50 36 L97 67" fill="none" stroke="#b8b4a8" strokeWidth={1.5} />
    <g transform={`translate(0 3) scale(1 ${1 - 2 * open}) translate(0 -3)`}>
      <path d="M3 3 L50 40 L97 3 Z" fill="#d8d4c8" stroke="#9aa3a0" strokeWidth={1.5} strokeLinejoin="round" />
    </g>
  </svg>
);

const LetterBeat: React.FC<{ readonly letter: number }> = ({ letter }) => {
  const frame = useCurrentFrame();
  const env = p01(frame, letter - 4, letter + 10);
  return (
    <AbsoluteFill>
      <ColdDesk seed="d2" spot={[66, 40]} />
      <Cam push={0.1} drift={[-40, 0]} rot={0.6} punch={[letter]} origin="65% 45%">
        <PhotoCard src="nvidia/img/jensen_portrait.jpg" x={1080} y={110} w={560} h={680} at={0} rot={3} gray={0.85} pos="50% 25%" />
        <div style={{ position: "absolute", left: 110, top: 230, width: 860 }}>
          <KText text="জেনসেন হুয়াং" at={2} size={104} align="left" />
          <div style={{ fontFamily: headFont, fontWeight: 600, fontSize: 40, color: "#b9c4cf", opacity: p01(frame, 12, 24), marginTop: -6 }}>৮ নভেম্বর · রবিবার</div>
        </div>
        <div style={{ position: "absolute", left: 110, top: 520, width: 760, height: 150, opacity: env, translate: `0 ${(1 - env) * 40}px`, perspective: 1200 }}>
          <Glass accent={COOL} sheenAt={letter} style={{ inset: 0, transform: "rotateY(10deg)" }}>
            <div style={{ position: "absolute", left: 34, top: 30 }}>
              <Envelope size={120} />
            </div>
            <div style={{ position: "absolute", left: 190, top: 34, fontFamily: headFont, fontWeight: 800, fontSize: 58, color: N.ink, lineHeight: 1.35 }}>কর্মীদের কাছে চিঠি</div>
          </Glass>
        </div>
      </Cam>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 3 envelope opens */
const OpenBeat: React.FC<{ readonly admit: number }> = ({ admit }) => {
  const frame = useCurrentFrame();
  const open = p01(frame, 4, 20, ease.inOut);
  const rise = p01(frame, 16, 40);
  const lines = [0.92, 0.8, 0.86, 0.6, 0.9, 0.74, 0.82];
  return (
    <AbsoluteFill>
      <ColdDesk seed="d3" spot={[50, 55]} />
      <Cam push={0.14} drift={[0, -30]} punch={[admit]} origin="50% 60%">
        <AbsoluteFill style={{ perspective: 1600 }}>
          <div style={{ position: "absolute", left: 610, top: 300, width: 700, height: 560, transform: "rotateX(22deg) rotateZ(-3deg)" }}>
            {/* the paper: abstract grey lines only — never a readable letter */}
            <div style={{ position: "absolute", left: 70, top: 120 - 260 * rise, width: 560, height: 420, background: "linear-gradient(175deg,#f4f2ec,#dcd8cd)", borderRadius: 6, boxShadow: "0 20px 40px rgba(0,0,0,0.5)", padding: "50px 50px" }}>
              {lines.map((w, i) => (
                <div key={i} style={{ height: 14, width: `${w * 100}%`, background: "#a7aca8", borderRadius: 7, marginBottom: 22, opacity: 0.75 }} />
              ))}
            </div>
            <div style={{ position: "absolute", left: 0, top: 120, filter: "drop-shadow(0 40px 60px rgba(0,0,0,0.7))" }}>
              <Envelope size={700} open={open} />
            </div>
          </div>
        </AbsoluteFill>
      </Cam>
      <div style={{ position: "absolute", top: 90, width: "100%" }}>
        <KText text="নিজেই স্বীকার করেন" at={admit - 3} size={100} glow="rgba(127,166,201,0.45)" />
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 4 + 5 quotes */
const Quote: React.FC<{ readonly text: string; readonly at: number; readonly x: number; readonly y: number; readonly w: number; readonly size?: number; readonly dimmed?: number; readonly tilt?: number }> = ({
  text,
  at,
  x,
  y,
  w,
  size = 76,
  dimmed = 1,
  tilt = 0,
}) => {
  const frame = useCurrentFrame();
  const k = p01(frame, at - 4, at + 10);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: size * 2.1, opacity: k * dimmed, translate: `${(1 - k) * -60}px 0`, perspective: 1400 }}>
      <Glass accent={COOL} sheenAt={at} style={{ inset: 0, transform: `rotateY(${tilt}deg)`, borderLeft: `8px solid ${COOL}` }}>
        <div style={{ position: "absolute", left: 40, top: size * 0.22, display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontFamily: numFont, fontWeight: 900, fontSize: size * 1.2, color: COOL, lineHeight: 1 }}>“</span>
          <span style={{ fontFamily: headFont, fontWeight: 800, fontSize: size, color: N.ink, lineHeight: 1.35 }}>{text}</span>
          <span style={{ fontFamily: numFont, fontWeight: 900, fontSize: size * 1.2, color: COOL, lineHeight: 1 }}>”</span>
        </div>
      </Glass>
    </div>
  );
};

const PortraitBack: React.FC<{ readonly x?: number }> = ({ x = 0 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const z = interpolate(frame, [0, durationInFrames], [1.05, 1.16], clamp);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ left: 700 + x, scale: `${z}`, filter: "grayscale(1) brightness(0.45) contrast(1.1) blur(1.5px)" }}>
        <Img src={staticFile("nvidia/img/jensen_portrait.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 22%" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#2a4f8f", mixBlendMode: "multiply", opacity: 0.55 }} />
      <AbsoluteFill style={{ background: "linear-gradient(90deg, #06090d 0%, #06090dcc 45%, transparent 85%)" }} />
    </AbsoluteFill>
  );
};


const Quote1: React.FC<{ readonly a: number }> = ({ a }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#06090d" }}>
      <Cam push={0.1} drift={[30, 0]} punch={[a]}>
        <PortraitBack />
      </Cam>
      <ColdDeskOverlay />
      <div style={{ position: "absolute", left: 110, top: 150, opacity: p01(frame, 0, 12) }}>
        <div style={{ fontFamily: headFont, fontWeight: 700, fontSize: 40, color: "#b9c4cf", lineHeight: 1.35 }}>চিঠিতে তিনি লিখেছেন</div>
        <div style={{ height: 3, width: 380 * p01(frame, 4, 22), background: `linear-gradient(90deg, ${COOL}, transparent)`, marginTop: 8 }} />
      </div>
      <Quote text="স্ত্রীর প্রতি অবিশ্বস্ত ছিলেন" at={a} x={110} y={330} w={1180} size={84} tilt={8} />
    </AbsoluteFill>
  );
};

const ColdDeskOverlay: React.FC = () => <AbsoluteFill style={{ pointerEvents: "none", background: "radial-gradient(ellipse at 20% 50%, rgba(127,166,201,0.10), transparent 60%)" }} />;

const Quote23: React.FC<{ readonly b: number; readonly c: number }> = ({ b, c }) => (
  <AbsoluteFill style={{ background: "#06090d" }}>
    <Cam push={0.08} drift={[-30, -10]} punch={[c]}>
      <PortraitBack x={-120} />
    </Cam>
    <ColdDeskOverlay />
    <Quote text="এর কোনো অজুহাত নেই" at={b} x={110} y={190} w={1000} size={76} tilt={8} dimmed={1} />
    <Quote text="দায় পুরোটাই তার" at={c} x={190} y={430} w={880} size={76} tilt={8} />
  </AbsoluteFill>
);

/* ---------------------------------------------------------------- 6 statement over 3D plate */
const Statement: React.FC<{ readonly nv: number }> = ({ nv }) => {
  const frame = useCurrentFrame();
  const k = p01(frame, nv - 4, nv + 10);
  return (
    <AbsoluteFill>
      <ColdPlate from={1} blur={3} dim={0.35} seed="s6" />
      <Cam push={0.1} drift={[-20, -10]} punch={[nv]}>
        <div style={{ position: "absolute", left: 120, top: 130 }}>
          <KText text="একই সময়ে" at={2} size={60} color="#b9c4cf" align="left" />
        </div>
        <div style={{ position: "absolute", left: 120, top: 290, width: 1100, height: 260, opacity: k, scale: `${0.92 + 0.08 * k}`, perspective: 1400 }}>
          <Glass accent={COOL} sheenAt={nv} style={{ inset: 0, transform: "rotateY(12deg) rotateX(4deg)" }}>
            <div style={{ position: "absolute", left: 50, top: 40, fontFamily: numFont, fontWeight: 900, fontSize: 110, color: N.ink, letterSpacing: 8 }}>NVIDIA</div>
            <div style={{ position: "absolute", left: 56, top: 170, fontFamily: headFont, fontWeight: 700, fontSize: 48, color: "#b9c4cf", lineHeight: 1.3 }}>আনুষ্ঠানিক বিবৃতিতে জানায়…</div>
          </Glass>
        </div>
      </Cam>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 7 investigation */
const Investigation: React.FC<{ readonly target: number; readonly probe: number }> = ({ target, probe }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const mx = interpolate(frame, [0, durationInFrames], [0, 1], { ...clamp, easing: ease.inOut });
  const mgX = 900 + 300 * Math.sin(mx * Math.PI * 1.6);
  const mgY = 520 + 80 * Math.cos(mx * Math.PI * 1.2);
  const fold = p01(frame, 0, 16);
  return (
    <AbsoluteFill>
      <ColdDesk seed="d7" warm spot={[50, 55]} />
      <Cam push={0.12} drift={[0, -20]} rot={0.6} punch={[probe]} shakeAt={[probe]}>
        <AbsoluteFill style={{ perspective: 1600 }}>
          <div style={{ position: "absolute", left: 470, top: 300, width: 980, height: 520, transform: `rotateX(${30 - 10 * fold}deg) rotateZ(-3deg)`, opacity: fold }}>
            <div style={{ position: "absolute", left: 0, top: -46, width: 320, height: 60, borderRadius: "14px 14px 0 0", background: "linear-gradient(180deg,#c9a865,#a8884a)" }} />
            <div style={{ position: "absolute", inset: 0, borderRadius: 10, background: "linear-gradient(170deg,#d2b06c,#9c7e45)", boxShadow: "0 50px 90px rgba(0,0,0,0.75)" }}>
              <div style={{ position: "absolute", left: 50, top: 50, right: 50, height: 70, border: "3px solid rgba(60,40,10,0.6)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: numFont, fontWeight: 900, fontSize: 40, letterSpacing: 8, color: "#3a2a0c" }}>
                INDEPENDENT INVESTIGATION
              </div>
              {[180, 230, 280, 330, 380].map((y, i) => (
                <div key={y} style={{ position: "absolute", left: 60, top: y, height: 14, width: [700, 560, 780, 480, 620][i], background: "rgba(60,40,10,0.28)", borderRadius: 7 }} />
              ))}
            </div>
          </div>
          {/* magnifier */}
          <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, opacity: fold }}>
            <g transform={`translate(${mgX} ${mgY})`} style={{ filter: "drop-shadow(0 30px 30px rgba(0,0,0,0.6))" }}>
              <circle r={120} fill="rgba(200,225,245,0.12)" stroke="#2b2f33" strokeWidth={20} />
              <circle r={120} fill="none" stroke="#c8cdd2" strokeWidth={5} />
              <path d="M-70 -60 A90 90 0 0 1 20 -100" stroke="rgba(255,255,255,0.5)" strokeWidth={8} fill="none" strokeLinecap="round" />
              <line x1={90} y1={90} x2={200} y2={200} stroke="#2b2f33" strokeWidth={34} strokeLinecap="round" />
            </g>
          </svg>
        </AbsoluteFill>
        <Stamp at={probe} text="তদন্ত চলছে" color="#e8ecef" size={90} rot={-5} style={{ left: 700, top: 560 }} />
      </Cam>
      <div style={{ position: "absolute", top: 70, width: "100%" }}>
        <KText text="বিদেশি গোয়েন্দা তৎপরতার লক্ষ্য?" at={target} size={70} stagger={4} />
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 8 reports */
const Clip: React.FC<{ readonly x: number; readonly y: number; readonly rot: number; readonly at: number }> = ({ x, y, rot, at }) => {
  const frame = useCurrentFrame();
  const k = p01(frame, at, at + 14);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 420,
        height: 520,
        rotate: `${rot + (1 - k) * 12}deg`,
        translate: `${(1 - k) * 200}px ${(1 - k) * -140}px`,
        scale: `${1.2 - 0.2 * k}`,
        opacity: k,
        background: "linear-gradient(170deg,#ecebe6,#cfcdc5)",
        boxShadow: "0 30px 60px rgba(0,0,0,0.6)",
        padding: 30,
        filter: "blur(3px)",
      }}
    >
      <div style={{ height: 34, width: "75%", background: "#30353a", borderRadius: 4, marginBottom: 22 }} />
      <div style={{ height: 160, background: "linear-gradient(135deg,#8b9298,#5d646a)", marginBottom: 22 }} />
      {[0.95, 0.85, 0.9, 0.6, 0.8, 0.7].map((w, i) => (
        <div key={i} style={{ height: 12, width: `${w * 100}%`, background: "#7d8580", borderRadius: 6, marginBottom: 14 }} />
      ))}
    </div>
  );
};

const Reports: React.FC<{ readonly us: number }> = ({ us }) => {
  const frame = useCurrentFrame();
  const k = p01(frame, us - 4, us + 10);
  return (
    <AbsoluteFill>
      <ColdDesk seed="d8" spot={[50, 50]} />
      <Cam push={0.1} drift={[50, -10]} rot={-0.6}>
        <Clip x={300} y={250} rot={-7} at={0} />
        <Clip x={760} y={200} rot={3} at={8} />
        <Clip x={1220} y={260} rot={8} at={16} />
      </Cam>
      <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 90 }}>
        <div style={{ position: "relative", width: 1060, height: 120, opacity: k, scale: `${0.9 + 0.1 * k}` }}>
          <Glass accent={COOL} sheenAt={us} style={{ inset: 0 }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "center", alignItems: "center", fontFamily: headFont, fontWeight: 800, fontSize: 60, color: N.ink, paddingBottom: 8 }}>
              কিছু মার্কিন সংবাদমাধ্যমের রিপোর্ট
            </div>
          </Glass>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 9 + 10 allegation schematic */
const Node: React.FC<{ readonly x: number; readonly at: number; readonly title: string; readonly icon: React.ReactNode }> = ({ x, at, title, icon }) => {
  const frame = useCurrentFrame();
  const p = p01(frame, at - 4, at + 12);
  const pulse = 1 + 0.03 * Math.sin(frame / 7);
  return (
    <div style={{ position: "absolute", left: x - 240, top: 280, width: 480, opacity: p, scale: `${(0.8 + 0.2 * p) * pulse}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      <div style={{ width: 250, height: 250, borderRadius: 125, border: `4px dashed ${N.amber}`, background: "radial-gradient(circle, rgba(255,176,32,0.18), rgba(20,14,4,0.7))", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 60px ${N.amber}33` }}>
        {icon}
      </div>
      <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 50, color: N.ink, lineHeight: 1.35, textAlign: "center", textShadow: "0 4px 20px #000" }}>{title}</div>
    </div>
  );
};

const Shield: React.FC = () => (
  <svg viewBox="0 0 100 100" width={130} height={130}>
    <path d="M50 8 L86 22 V50 C86 72 70 86 50 94 C30 86 14 72 14 50 V22 Z" fill="rgba(255,176,32,0.12)" stroke={N.amber} strokeWidth={6} strokeLinejoin="round" />
    <circle cx={50} cy={48} r={12} fill="none" stroke={N.amber} strokeWidth={6} />
  </svg>
);
const QMark: React.FC = () => <span style={{ fontFamily: numFont, fontWeight: 900, fontSize: 120, color: N.amber, textShadow: `0 0 30px ${N.amber}88` }}>?</span>;

const AllegA: React.FC<{ readonly rel: number }> = ({ rel }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <ColdDesk seed="d9" warm spot={[50, 45]} />
      <Cam push={0.1} drift={[-20, -10]} punch={[0, rel]}>
        <Node x={960} at={rel} title="উল্লিখিত সম্পর্ক" icon={<QMark />} />
      </Cam>
      <div style={{ position: "absolute", top: 80, width: "100%", textAlign: "center" }}>
        <AllegLabel p={p01(frame, 0, 10)} size={54} />
      </div>
      <div style={{ position: "absolute", top: 770, width: "100%", textAlign: "center", opacity: p01(frame, 8, 20) * 0.9, fontFamily: headFont, fontWeight: 600, fontSize: 32, color: "#b9c4cf", lineHeight: 1.35 }}>
        সূত্র: কিছু মার্কিন সংবাদমাধ্যমের রিপোর্ট
      </div>
    </AbsoluteFill>
  );
};

const AllegB: React.FC<{ readonly cn: number; readonly link: number }> = ({ cn, link }) => {
  const frame = useCurrentFrame();
  const qm = p01(frame, link + 6, link + 18);
  return (
    <AbsoluteFill>
      <ColdDesk seed="d10" warm spot={[50, 45]} />
      <Cam push={0.12} drift={[0, -20]} punch={[link]}>
        <Node x={500} at={0} title="উল্লিখিত সম্পর্ক" icon={<QMark />} />
        <Node x={1420} at={cn} title="চীনা গোয়েন্দা" icon={<Shield />} />
        <Marker d="M640 405 C 800 360, 1120 450, 1280 405" at={link - 4} len={18} color={N.amber} width={8} />
        <div style={{ position: "absolute", left: 960 - 200, top: 300, width: 400, textAlign: "center", opacity: qm, translate: `0 ${(1 - qm) * 20}px` }}>
          <span style={{ fontFamily: headFont, fontWeight: 800, fontSize: 48, color: N.amber, lineHeight: 1.35, background: "rgba(8,6,2,0.85)", padding: "2px 20px 10px", borderRadius: 12, border: `2px solid ${N.amber}66` }}>যোগ থাকতে পারে?</span>
        </div>
      </Cam>
      <div style={{ position: "absolute", top: 80, width: "100%", textAlign: "center" }}>
        <AllegLabel p={1} size={54} />
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 11 remember: not proven */
const NotProven: React.FC<{ readonly proof: number }> = ({ proof }) => (
  <AbsoluteFill>
    <ColdPlate from={5} blur={14} dim={0.6} seed="s11" />
    <Cam push={0.1} punch={[0, proof]} shakeAt={[proof]}>
      <div style={{ position: "absolute", top: 170, width: "100%" }}>
        <KText text="মনে রাখবেন" at={0} size={110} />
      </div>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingTop: 220 }}>
        <Stamp at={proof} text="অভিযোগ — প্রমাণিত নয়" color={N.amber} size={92} rot={-4} style={{ position: "relative" }} />
      </AbsoluteFill>
    </Cam>
  </AbsoluteFill>
);

/* ---------------------------------------------------------------- 12 the balance */
const Balance: React.FC<{ readonly china: number; readonly board?: number; readonly boardSub?: number; readonly huang?: number; readonly all?: boolean }> = ({
  china,
  board = 1e9,
  boardSub = 1e9,
  huang = 1e9,
  all = false,
}) => {
  const frame = useCurrentFrame();
  const c1 = all ? 1 : p01(frame, china - 3, china + 10);
  const c2 = all ? 1 : p01(frame, board - 3, board + 10);
  const c3 = p01(frame, huang - 3, huang + 10);
  const sub = all ? 1 : p01(frame, boardSub, boardSub + 12);
  const tilt = interpolate(c1 + c2 + c3, [0, 3], [-5, 8], clamp);
  const rad = (tilt * Math.PI) / 180;
  return (
    <AbsoluteFill>
      <ColdDesk seed={all ? "d12c" : "d12"} spot={[50, 40]} />
      <Cam push={0.08} drift={[0, -10]} punch={[china, board, huang]}>
        <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
          <defs>
            <linearGradient id="p5metal" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#5a636b" />
              <stop offset="0.5" stopColor="#c8cdd2" />
              <stop offset="1" stopColor="#5a636b" />
            </linearGradient>
          </defs>
          <rect x={948} y={230} width={24} height={600} fill="url(#p5metal)" />
          <path d="M840 850 L1080 850 L1030 818 L890 818 Z" fill="url(#p5metal)" />
          <g transform={`rotate(${tilt} 960 230)`}>
            <rect x={280} y={222} width={1360} height={16} rx={8} fill="url(#p5metal)" />
            <circle cx={960} cy={230} r={24} fill="#d8dde2" />
          </g>
        </svg>
        <div style={{ position: "absolute", left: 110, top: 300 - Math.sin(rad) * 680, width: 600, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 76, color: N.amber, lineHeight: 1.3, textShadow: `0 0 30px ${N.amber}55` }}>অভিযোগ</div>
          <AllegLabel p={1} size={38} />
        </div>
        <div style={{ position: "absolute", left: 1010, top: 270 + Math.sin(rad) * 680 - 40, display: "flex", flexDirection: "column", gap: 16 }}>
          <FactGlass p={c1} title="চীন অস্বীকার করেছে" sheenAt={china} width={800} />
          <FactGlass p={c2} title="বোর্ড: কোনো প্রমাণ নেই" sub="গোপন তথ্য বা মার্কিন নিরাপত্তা ঝুঁকিতে পড়েনি" subP={sub} sheenAt={board} width={800} />
          <FactGlass p={c3} title="হুয়াং-ও অস্বীকার করেছেন" sheenAt={huang} width={800} />
        </div>
      </Cam>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- assembly */
export const P5Scene: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  const at = useAt(P5_ID);
  const f = (s: number) => Math.round(s * fps);
  const w = (word: string, nth = 0) => f(at(word, nth));

  const b2 = f(at("জেনসেন") - 0.2);
  const b3 = f(at("সেখানে") - 0.2);
  const b4 = f(at("অবিশ্বস্ত") - 0.35);
  const b5 = f(at("অজুহাত") - 0.3);
  const b6 = f(at("একই") - 0.2);
  const b7 = f(at("বিদেশি") - 0.4);
  const b8 = f(at("পেছনে") - 0.3);
  const b9 = f(at("অভিযোগ") - 0.15);
  const b10 = f(at("চীনা") - 0.25);
  const b11 = f(at("মনে") - 0.2);
  const b12 = f(at("চীন", 1) - 0.3);
  const b13 = f(at("বোর্ড") - 0.3);
  const b14 = f(at("হুয়াং", 2) - 0.3);

  const beats: Beat[] = [
    { at: 0, name: "date", node: <DateBeat sunday={w("রবিবার")} /> },
    { at: b2, trans: "whip", name: "jensen letter", node: <LetterBeat letter={w("চিঠি") - b2} /> },
    { at: b3, trans: "zoom", name: "envelope", node: <OpenBeat admit={w("স্বীকার") - b3} /> },
    { at: b4, trans: "blur", name: "quote 1", node: <Quote1 a={w("অবিশ্বস্ত") - b4} /> },
    { at: b5, trans: "slideUp", name: "quote 2+3", node: <Quote23 b={w("অজুহাত") - b5} c={w("দায়") - b5} /> },
    { at: b6, trans: "whip", name: "statement 3D", node: <Statement nv={w("এনভিডিয়া") - b6} /> },
    { at: b7, trans: "zoom", name: "investigation", node: <Investigation target={w("বিদেশি") - b7} probe={w("তদন্ত") - b7} /> },
    { at: b8, trans: "whipL", name: "reports", node: <Reports us={w("মার্কিন") - b8} /> },
    { at: b9, trans: "blur", name: "allegation A", node: <AllegA rel={w("নারীর") - b9} /> },
    { at: b10, trans: "whip", name: "allegation B", node: <AllegB cn={w("চীনা") - b10} link={w("যোগ") - b10} /> },
    { at: b11, trans: "zoom", name: "not proven", node: <NotProven proof={w("প্রমাণিত") - b11} /> },
    { at: b12, trans: "slideUp", name: "china denies", node: <Balance china={w("চীন", 1) - b12} /> },
    { at: b13, trans: "whipL", name: "board", node: <Balance china={-100} board={w("বোর্ড") - b13} boardSub={w("গোপন") - b13} /> },
    { at: b14, trans: "zoom", name: "huang denies", node: <Balance china={-100} board={-100} huang={w("হুয়াং", 2) - b14} all /> },
  ];

  return (
    <AbsoluteFill style={{ background: N.bg }}>
      <Beats beats={beats} end={durationInFrames} />
    </AbsoluteFill>
  );
};
