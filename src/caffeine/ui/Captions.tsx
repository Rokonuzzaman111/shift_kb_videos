/**
 * OWNER: motion2d agent.
 * Word-synced captions in the caption zone (y 1280–1560). Rendered by the assembler inside each
 * shot's VO Sequence, so frame 0 = VO start. Keywords get the same amber marker sweep as Title.
 *  - pages of max 3 words (and max ~18 letters so a page stays on one or two lines)
 *  - active word: amber + small lift; spoken words: ink; upcoming words: dimmed
 *  - keyword: dark text on an amber marker that sweeps in on the spoken word
 * Generous line-height and no overflow clipping so Bangla vowel signs / conjuncts never get cut.
 */
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Word } from "../../ui";
import { K, ZONE, headFont } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const outExpo = Easing.bezier(0.16, 1, 0.3, 1);

const MAX_WORDS = 3;
const MAX_CHARS = 18;
const FONT = 84;

const paginate = (words: Word[]) => {
  const pages: Word[][] = [];
  words.forEach((w, i) => {
    const cur = pages[pages.length - 1];
    const gap = i > 0 ? w.startMs - words[i - 1].endMs : 0;
    const chars = cur ? cur.reduce((a, x) => a + x.text.length, 0) + w.text.length : 0;
    if (!cur || cur.length >= MAX_WORDS || gap > 350 || chars > MAX_CHARS) pages.push([w]);
    else cur.push(w);
  });
  return pages;
};

const clean = (s: string) => s.replace(/[,.;:!?।"“”]/g, "");

export const Captions: React.FC<{ readonly words: Word[]; readonly keywords?: string[] }> = ({ words, keywords = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const pages = paginate(words);
  const keys = new Set(keywords.map(clean));

  const idx = pages.findIndex((p, i) => {
    const end = pages[i + 1] ? pages[i + 1][0].startMs - 60 : p[p.length - 1].endMs + 600;
    return ms >= p[0].startMs - 80 && ms < end;
  });
  if (idx === -1) return null;
  const page = pages[idx];
  const startMs = page[0].startMs - 80;
  const endMs = pages[idx + 1] ? pages[idx + 1][0].startMs - 60 : page[page.length - 1].endMs + 600;
  const enter = interpolate(ms, [startMs, startMs + 200], [0, 1], { ...clamp, easing: outExpo });
  // only fade out when there is a real pause before the next page (otherwise hard swap reads cleaner)
  const pauseAfter = !pages[idx + 1] || pages[idx + 1][0].startMs - page[page.length - 1].endMs > 350;
  const exit = pauseAfter ? interpolate(ms, [endMs - 160, endMs], [0, 1], clamp) : 0;

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
            alignItems: "center",
            gap: "0px 22px",
            maxWidth: 920,
            opacity: enter * (1 - exit),
            translate: `0px ${(1 - enter) * 22}px`,
            scale: 0.96 + 0.04 * enter,
          }}
        >
          {page.map((w, i) => {
            const spoken = ms >= w.startMs - 40;
            const active = spoken && ms < w.endMs + 100;
            const isKey = keys.has(clean(w.text));
            const pop = interpolate(ms, [w.startMs - 40, w.startMs + 110], [0, 1], { ...clamp, easing: outExpo });
            const sweep = interpolate(ms, [w.startMs - 40, w.startMs + 200], [0, 1], { ...clamp, easing: outExpo });
            const color = isKey && spoken ? "#1b0f06" : active ? K.amber : spoken ? K.ink : "rgba(247,241,232,0.5)";
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
                  padding: isKey ? "0 20px 4px" : "0 2px 4px",
                  color,
                  translate: `0px ${active ? -6 * pop : 0}px`,
                  scale: active ? 0.94 + 0.08 * pop : 1,
                  WebkitTextStroke: isKey && spoken ? "0px transparent" : "10px rgba(8,5,3,0.82)",
                  paintOrder: "stroke fill",
                  textShadow: isKey && spoken ? "none" : "0 6px 26px rgba(0,0,0,0.6)",
                }}
              >
                {isKey ? (
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: "14%",
                      bottom: "8%",
                      borderRadius: 20,
                      background: `linear-gradient(180deg, #ffc768, ${K.amber})`,
                      boxShadow: `0 8px 28px rgba(0,0,0,0.45), 0 0 30px ${K.amber}55`,
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
