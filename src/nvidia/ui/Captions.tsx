/**
 * Word-synced captions for the 16:9 Nvidia video (global timeline: frame 0 = video start).
 * Pages of ≤5 words / ≤34 letters, broken at pauses. Active word lifts in green; keywords get a green marker.
 */
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { N, ZONE, clamp, ease, headFont } from "../theme";
import type { Word } from "../types";

const MAX_WORDS = 5;
const MAX_CHARS = 34;
const FONT = 58;

const clean = (s: string) => s.replace(/[,.;:!?।"“”‘’]/g, "");

const paginate = (words: Word[]) => {
  const pages: Word[][] = [];
  words.forEach((w, i) => {
    const cur = pages[pages.length - 1];
    const prev = words[i - 1];
    const gap = prev ? w.startMs - prev.endMs : 0;
    const chars = cur ? cur.reduce((a, x) => a + x.text.length + 1, 0) + w.text.length : 0;
    const sentenceEnd = prev && /[।?!]$/.test(prev.text);
    if (!cur || cur.length >= MAX_WORDS || gap > 300 || chars > MAX_CHARS || sentenceEnd) pages.push([w]);
    else cur.push(w);
  });
  return pages;
};

export const Captions: React.FC<{ readonly words: Word[]; readonly keywords?: string[] }> = ({ words, keywords = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const pages = paginate(words);
  const keys = keywords.map(clean);
  const isKey = (t: string) => keys.some((k) => clean(t).startsWith(k));

  const idx = pages.findIndex((p, i) => {
    const end = pages[i + 1] ? Math.min(pages[i + 1][0].startMs - 40, p[p.length - 1].endMs + 700) : p[p.length - 1].endMs + 700;
    return ms >= p[0].startMs - 90 && ms < end;
  });
  if (idx === -1) return null;
  const page = pages[idx];
  const startMs = page[0].startMs - 90;
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
            gap: "0px 16px",
            opacity: enter,
            translate: `0px ${(1 - enter) * 16}px`,
          }}
        >
          {page.map((w, i) => {
            const spoken = ms >= w.startMs - 40;
            const active = spoken && ms < w.endMs + 80;
            const key = isKey(w.text);
            const pop = interpolate(ms, [w.startMs - 40, w.startMs + 120], [0, 1], { ...clamp, easing: ease.out });
            const sweep = interpolate(ms, [w.startMs - 40, w.startMs + 220], [0, 1], { ...clamp, easing: ease.out });
            const color = key && spoken ? "#0a0f02" : active ? N.greenHi : spoken ? N.ink : "rgba(244,246,242,0.55)";
            return (
              <span
                key={`${idx}-${i}`}
                style={{
                  position: "relative",
                  display: "inline-block",
                  fontFamily: headFont,
                  fontWeight: 800,
                  fontSize: FONT,
                  lineHeight: 1.45,
                  padding: key ? "0 14px 2px" : "0 2px 2px",
                  color,
                  translate: `0px ${active ? -4 * pop : 0}px`,
                  scale: active ? 0.95 + 0.07 * pop : 1,
                  WebkitTextStroke: key && spoken ? "0px transparent" : "8px rgba(0,0,0,0.85)",
                  paintOrder: "stroke fill",
                  textShadow: key && spoken ? "none" : "0 4px 18px rgba(0,0,0,0.7)",
                }}
              >
                {key ? (
                  <span
                    style={{
                      position: "absolute",
                      inset: "12% 0 6% 0",
                      borderRadius: 12,
                      background: `linear-gradient(180deg, ${N.greenHi}, ${N.green})`,
                      boxShadow: `0 6px 22px rgba(0,0,0,0.5), 0 0 26px ${N.green}66`,
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
