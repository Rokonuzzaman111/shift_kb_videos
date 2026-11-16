/**
 * Photo pop-up (bible §6): a real photo as a framed print that springs in with a slight 3D tilt and parallax
 * (the print tilts one way while the photo inside drifts the other), glossy sheen sweep, teal "আসল ছবি" chip and a
 * small credit line under the print. Exits with a short lift + fade. Reused by Part 5.
 */
import { Img, interpolate, spring, staticFile, useVideoConfig } from "remotion";
import { bodyFont, headFont } from "../../theme";
import { P, pa } from "../palette";

export const PhotoCard: React.FC<{
  readonly src: string;
  /** section time (s), when it springs in, when its exit starts */
  readonly t: number;
  readonly inAt: number;
  readonly outAt: number;
  readonly credit: string;
  readonly chip?: string;
  /** print width (px) and centre (px) */
  readonly width?: number;
  readonly cx?: number;
  readonly cy?: number;
  /** image aspect w/h */
  readonly aspect?: number;
  /** tilt direction: 1 = right edge away from camera */
  readonly side?: 1 | -1;
}> = ({ src, t, inAt, outAt, credit, chip = "আসল ছবি", width = 900, cx = 540, cy = 860, aspect = 1.5, side = 1 }) => {
  const { fps } = useVideoConfig();
  if (t < inAt - 0.02 || t > outAt + 0.3) return null;
  const pop = spring({ frame: Math.round((t - inAt) * fps), fps, config: { damping: 12, stiffness: 150, mass: 0.75 } });
  const out = interpolate(t, [outAt, outAt + 0.22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const life = interpolate(t, [inAt, outAt + 0.22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const chipPop = spring({ frame: Math.round((t - inAt - 0.18) * fps), fps, config: { damping: 11, stiffness: 190, mass: 0.6 } });
  const imgW = width - 36;
  const imgH = imgW / aspect;
  const rotY = side * (-16 * (1 - pop) - 7 + 6 * life);
  const rotX = 9 * (1 - pop) + 3 - 2 * life;
  const rotZ = side * (-2.2 + 1.2 * life) * (0.4 + 0.6 * pop);
  const lift = (1 - pop) * 160 - out * 70;
  const sheen = interpolate(t, [inAt + 0.05, inAt + 0.9], [-0.6, 1.4], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: cx - width / 2,
        top: cy - (imgH + 36) / 2,
        width,
        perspective: 1700,
        opacity: Math.min(1, pop * 1.6) * (1 - out),
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          transform: `translateY(${lift}px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg) scale(${0.78 + 0.22 * pop - 0.04 * out})`,
          transformStyle: "preserve-3d",
          transformOrigin: "50% 60%",
        }}
      >
        {/* contact shadow */}
        <div
          style={{
            position: "absolute",
            inset: "18px -10px -34px -10px",
            background: pa(P.night, 0.75),
            filter: "blur(34px)",
            transform: "translateZ(-40px)",
            borderRadius: 18,
          }}
        />
        {/* the print */}
        <div
          style={{
            position: "relative",
            padding: 18,
            paddingBottom: 18,
            background: `linear-gradient(160deg, ${P.snow}, #cfd8e0)`,
            borderRadius: 6,
            boxShadow: `0 2px 0 ${pa("#ffffff", 0.6)} inset, 0 30px 70px ${pa(P.night, 0.6)}`,
          }}
        >
          <div style={{ position: "relative", width: imgW, height: imgH, overflow: "hidden", borderRadius: 2, background: P.night }}>
            <Img
              src={staticFile(src)}
              style={{
                position: "absolute",
                width: imgW * 1.14,
                height: imgH * 1.14,
                left: -imgW * 0.07 + side * (14 - 30 * life),
                top: -imgH * 0.07 + 10 - 16 * life,
                objectFit: "cover",
              }}
            />
            {/* cool grade so the photo sits in the reel */}
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${pa(P.steel, 0.12)}, ${pa(P.night, 0.18)})`, mixBlendMode: "multiply" }} />
            <div style={{ position: "absolute", inset: 0, boxShadow: `inset 0 0 0 1px ${pa(P.night, 0.35)}, inset 0 0 60px ${pa(P.night, 0.35)}` }} />
            {/* glossy sheen sweep */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(115deg, transparent ${(sheen - 0.25) * 100}%, ${pa("#ffffff", 0.22)} ${sheen * 100}%, transparent ${(sheen + 0.2) * 100}%)`,
              }}
            />
          </div>
        </div>
        {/* chip */}
        <div
          style={{
            position: "absolute",
            left: -14,
            top: -30,
            padding: "10px 22px 12px",
            borderRadius: 999,
            background: P.vaultTeal,
            color: P.night,
            fontFamily: headFont,
            fontWeight: 800,
            fontSize: 36,
            lineHeight: 1,
            transform: `translateZ(30px) scale(${0.5 + 0.5 * chipPop}) rotate(${-4 * (1 - chipPop)}deg)`,
            transformOrigin: "left center",
            opacity: Math.min(1, chipPop * 1.5),
            boxShadow: `0 10px 26px ${pa(P.night, 0.5)}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ width: 14, height: 14, borderRadius: 7, background: P.night, display: "inline-block" }} />
          {chip}
        </div>
        {/* credit */}
        <div
          style={{
            marginTop: 14,
            fontFamily: bodyFont,
            fontWeight: 500,
            fontSize: 21,
            letterSpacing: 0.2,
            color: pa(P.snow, 0.72),
            textAlign: "right",
            textShadow: `0 2px 8px ${pa(P.night, 0.9)}`,
          }}
        >
          {credit}
        </div>
      </div>
    </div>
  );
};
