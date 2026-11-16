/**
 * Word-synced vertical captions (part time: frame 0 = part start). Pages ≤3 words / ≤20 letters, broken at pauses.
 * Active word = ice cyan with a lift; keywords sweep in on an aurora-green marker.
 */
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { S, ZONE, clamp, ease, headFont, type Word } from "../theme";

const MAX_WORDS = 3;
const MAX_CHARS = 20;
const FONT = 82;
const clean = (s: string) => s.replace(/[,.;:!?।"“”‘’]/g, "");

const paginate = (words: Word[]) => {
  const pages: Word[][] = [];
  words.forEach((w, i) => {
    const cur = pages[pages.length - 1];
    const prev = words[i - 1];
    const gap = prev ? w.startMs - prev.endMs : 0;
    const chars = cur ? cur.reduce((a, x) => a + x.text.length, 0) + w.text.length : 0;
    const newLine = prev && prev.line !== w.line;
    if (!cur || cur.length >= MAX_WORDS || gap > 260 || chars > MAX_CHARS || newLine || /[,।?]$/.test(prev?.text ?? "")) pages.push([w]);
    else cur.push(w);
  });
  return pages;
};

export type CaptionColors = { active: string; ink: string; pending: string; marker: string; markerInk: string };
const LEGACY: CaptionColors = { active: S.cyan, ink: S.ink, pending: "rgba(242,248,252,0.55)", marker: S.aurora, markerInk: "#03140c" };

export const Captions: React.FC<{ readonly words: Word[]; readonly keywords?: string[]; readonly colors?: CaptionColors }> = ({
  words,
  keywords = [],
  colors = LEGACY,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const pages = paginate(words);
  const keys = keywords.map(clean);
  const isKey = (t: string) => keys.some((k) => clean(t).startsWith(k));

  const idx = pages.findIndex((p, i) => {
    const end = pages[i + 1] ? pages[i + 1][0].startMs - 50 : p[p.length - 1].endMs + 600;
    return ms >= p[0].startMs - 80 && ms < end;
  });
  if (idx === -1) return null;
  const page = pages[idx];
  const startMs = page[0].startMs - 80;
  const enter = interpolate(ms, [startMs, startMs + 180], [0, 1], { ...clamp, easing: ease.out });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: ZONE.side,
          right: ZONE.side,
          top: ZONE.captionTop,
          height: ZONE.captionBottom - ZONE.captionTop,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "0px 18px",
            opacity: enter,
            translate: `0px ${(1 - enter) * 22}px`,
            scale: 0.94 + enter * 0.06,
          }}
        >
          {page.map((w, i) => {
            const spoken = ms >= w.startMs - 40;
            const active = spoken && ms < w.endMs + 80;
            const key = isKey(w.text);
            const pop = interpolate(ms, [w.startMs - 40, w.startMs + 120], [0, 1], { ...clamp, easing: ease.out });
            const sweep = interpolate(ms, [w.startMs - 40, w.startMs + 220], [0, 1], { ...clamp, easing: ease.out });
            const color = key && spoken ? colors.markerInk : active ? colors.active : spoken ? colors.ink : colors.pending;
            return (
              <span
                key={`${idx}-${i}`}
                style={{
                  position: "relative",
                  display: "inline-block",
                  fontFamily: headFont,
                  fontWeight: 800,
                  fontSize: FONT,
                  lineHeight: 1.5,
                  padding: key ? "0 16px 4px" : "0 2px 4px",
                  color,
                  translate: `0px ${active ? -6 * pop : 0}px`,
                  scale: active ? 0.95 + 0.08 * pop : 1,
                  WebkitTextStroke: key && spoken ? "0px transparent" : "10px rgba(0,0,0,0.85)",
                  paintOrder: "stroke fill",
                  textShadow: key && spoken ? "none" : "0 6px 22px rgba(0,0,0,0.75)",
                }}
              >
                {key ? (
                  <span
                    style={{
                      position: "absolute",
                      inset: "14% 0 8% 0",
                      borderRadius: 14,
                      background: colors.marker,
                      boxShadow: `0 8px 26px rgba(0,0,0,0.5), 0 0 30px ${colors.marker}55`,
                      transformOrigin: "left center",
                      scale: `${sweep} 1`,
                      opacity: spoken ? 1 : 0,
                    }}
                  />
                ) : null}
                <span style={{ position: "relative" }}>{w.text}</span>
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
