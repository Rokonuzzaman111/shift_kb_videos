/** Shared pieces for the sensitive news part (P5 + P6), STYLE v2. OWNER: scene agent C. */
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Atmos, DocBg, Glass, Plate, p01 } from "../kit";
import { N, clamp, ease, headFont, numFont } from "../theme";

export const COOL = "#7fa6c9";

/** Cold documentary desk: textured backdrop + cool light leaks + bokeh. */
export const ColdDesk: React.FC<{ readonly spot?: [number, number]; readonly seed?: string; readonly warm?: boolean }> = ({ spot = [55, 38], seed = "p5", warm = false }) => (
  <AbsoluteFill>
    <DocBg tint={warm ? "#262018" : "#182230"} spot={spot} />
    <Atmos color={warm ? N.amber : COOL} color2="#2a4f8f" leak={0.4} bokeh={16} seed={seed} />
  </AbsoluteFill>
);

/** Cold blue-tinted 3D data-centre plate, pushed back for graphics. */
export const ColdPlate: React.FC<{ readonly from?: number; readonly blur?: number; readonly dim?: number; readonly seed?: string; readonly tint?: string }> = ({
  from = 0,
  blur = 10,
  dim = 0.55,
  seed = "cp",
  tint = "#7d9cc4",
}) => (
  <AbsoluteFill>
    <Plate id="dc" from={from} blur={blur} dim={dim} tint={tint} rate={0.7} />
    <Atmos color={COOL} color2="#2a4f8f" leak={0.35} bokeh={12} seed={seed} />
  </AbsoluteFill>
);

/** Paper desk calendar (tilted on the desk). `days` flip at `flips[i]` (local frames); red ring drawn at `ring`. */
export const Calendar: React.FC<{
  readonly days: readonly string[];
  readonly flips: readonly number[];
  readonly weekday: string;
  readonly weekdayAt: number;
  readonly ring: number;
}> = ({ days, flips, weekday, weekdayAt, ring }) => {
  const frame = useCurrentFrame();
  let idx = 0;
  flips.forEach((fl, i) => {
    if (frame >= fl) idx = i;
  });
  const fl = flips[idx];
  const flip = interpolate(frame, [fl, fl + 10], [-95, 0], { ...clamp, easing: ease.out });
  const wd = p01(frame, weekdayAt, weekdayAt + 10);
  const rg = p01(frame, ring, ring + 14, ease.inOut);
  const prev = idx > 0 ? days[idx - 1] : null;
  const prevOut = interpolate(frame, [fl, fl + 9], [0, 1], clamp);
  const Num: React.FC<{ readonly d: string }> = ({ d }) => <span style={{ fontFamily: headFont, fontWeight: 800, fontSize: 250, color: "#1a1d20", lineHeight: 1.3 }}>{d}</span>;
  return (
    <div style={{ width: 520, height: 580, position: "relative", perspective: 1400 }}>
      {[130, 390].map((x) => (
        <div key={x} style={{ position: "absolute", left: x - 12, top: -26, width: 24, height: 60, borderRadius: 12, background: "linear-gradient(90deg,#5a636b,#c8cdd2,#5a636b)", zIndex: 3, boxShadow: "0 4px 8px rgba(0,0,0,0.6)" }} />
      ))}
      <div style={{ position: "absolute", inset: 0, borderRadius: 18, background: "linear-gradient(170deg,#f3f1ea,#d9d6cc)", boxShadow: "0 50px 100px rgba(0,0,0,0.8), 0 10px 20px rgba(0,0,0,0.5)", overflow: "hidden" }}>
        <div style={{ height: 124, background: "linear-gradient(180deg,#d63a3a,#a51f24)", color: "#fff", fontFamily: headFont, fontWeight: 800, fontSize: 54, display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: 8 }}>
          নভেম্বর ২০২৬
        </div>
        {prev !== null && prevOut < 1 ? (
          <div style={{ position: "absolute", top: 124, left: 0, right: 0, bottom: 0, display: "flex", justifyContent: "center", alignItems: "center", transformOrigin: "50% 0%", rotate: `x ${prevOut * 100}deg`, opacity: 1 - prevOut, background: "#e6e3da" }}>
            <Num d={prev} />
          </div>
        ) : null}
        <div style={{ position: "absolute", top: 124, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", transformOrigin: "50% 0%", rotate: `x ${flip}deg` }}>
          <div style={{ position: "relative" }}>
            <Num d={days[idx]} />
            <svg viewBox="0 0 300 300" style={{ position: "absolute", left: "50%", top: "50%", width: 340, height: 340, translate: "-50% -48%", overflow: "visible" }}>
              <ellipse cx={150} cy={150} rx={140} ry={124} fill="none" stroke="#d01f1f" strokeWidth={11} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - rg} transform="rotate(-70 150 150)" opacity={0.9} />
            </svg>
          </div>
          <div style={{ marginTop: -36, fontFamily: headFont, fontWeight: 800, fontSize: 52, color: "#41474d", opacity: wd, translate: `0 ${(1 - wd) * 16}px`, lineHeight: 1.3 }}>{weekday}</div>
        </div>
      </div>
    </div>
  );
};

/** Amber allegation label — accompanies every allegation on screen. */
export const AllegLabel: React.FC<{ readonly p: number; readonly size?: number; readonly style?: React.CSSProperties }> = ({ p, size = 44, style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 16,
      opacity: p,
      scale: `${1.2 - 0.2 * p}`,
      fontFamily: headFont,
      fontWeight: 800,
      fontSize: size,
      lineHeight: 1.35,
      color: "#1a1200",
      background: `linear-gradient(180deg, #ffc74d, ${N.amber})`,
      borderRadius: 12,
      padding: "4px 26px 10px",
      boxShadow: `0 0 50px ${N.amber}55, 0 14px 34px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.5)`,
      ...style,
    }}
  >
    <span style={{ fontFamily: numFont, fontWeight: 900, fontSize: size * 0.85, marginTop: 4 }}>⚠</span>
    অভিযোগ — প্রমাণিত নয়
  </div>
);

/** Fact card: frosted glass, green check, drops in from above. Positioned by the caller (relative). */
export const FactGlass: React.FC<{ readonly p: number; readonly title: string; readonly sub?: string; readonly subP?: number; readonly width?: number; readonly sheenAt?: number }> = ({
  p,
  title,
  sub,
  subP = 1,
  width = 760,
  sheenAt = 0,
}) => (
  <div style={{ position: "relative", width, height: sub ? 150 : 110, opacity: p, translate: `0 ${(1 - p) * -80}px`, scale: `${1.08 - 0.08 * p}` }}>
    <Glass accent={N.green} sheenAt={sheenAt} style={{ inset: 0, borderLeft: `10px solid ${N.green}` }}>
      <div style={{ position: "absolute", left: 26, top: sub ? 26 : 22, width: 64, height: 64, borderRadius: 32, background: `linear-gradient(135deg, ${N.greenHi}, ${N.green})`, color: "#081000", fontFamily: numFont, fontWeight: 900, fontSize: 40, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 30px ${N.green}88` }}>
        ✓
      </div>
      <div style={{ position: "absolute", left: 112, top: 12, right: 20 }}>
        <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 48, color: N.ink, lineHeight: 1.35 }}>{title}</div>
        {sub ? <div style={{ fontFamily: headFont, fontWeight: 600, fontSize: 30, color: "#b9c4c0", lineHeight: 1.4, opacity: subP }}>{sub}</div> : null}
      </div>
    </Glass>
  </div>
);

/** Rubber stamp that slams in at `at`. */
export const Stamp: React.FC<{ readonly at: number; readonly text: string; readonly color?: string; readonly size?: number; readonly rot?: number; readonly style?: React.CSSProperties }> = ({
  at,
  text,
  color = N.red,
  size = 96,
  rot = -6,
  style,
}) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const k = p01(frame, at, at + 7);
  return (
    <div
      style={{
        position: "absolute",
        opacity: k,
        scale: `${2 - k}`,
        rotate: `${rot}deg`,
        border: `8px solid ${color}`,
        color,
        fontFamily: headFont,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1.3,
        padding: "0 34px 12px",
        borderRadius: 14,
        background: "rgba(10,8,8,0.55)",
        textShadow: `0 0 26px ${color}88`,
        boxShadow: `0 0 40px ${color}33`,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {text}
    </div>
  );
};
