/** Svalbard reel — PART 2 (why it exists), ~27 s. Cuts in word gaps; every headline pop has its own SFX. */
import { NV, PartPlayer, SV, partDuration, type Cue, type Shot } from "./PartPlayer";
import { P1_DURATION } from "./Part1";
import { P2A, P2B, P2C, P2D, P2E, P2F, P2G, P2H, P2I } from "./shots/P2Shots";
import { VO, at } from "./vo";

const words = VO.p2;
const w = (word: string, n = 0) => at("p2", word, n);
export const P2_DURATION = partDuration(words);

const CUTS = [0, w("আসলে") - 0.15, w("বিভিন্ন") - 0.25, w("ধান") - 0.2, w("কোনো") - 0.25, w("কোনোটা") - 0.15, w("আবার") - 0.15, w("কিন্তু") - 0.25, w("আর", 1) - 0.25, P2_DURATION];
const SHOTS: Shot[] = [
  { id: "A-clock", Comp: P2A },
  { id: "B-backup", Comp: P2B },
  { id: "C-map", Comp: P2C },
  { id: "D-jars", Comp: P2D },
  { id: "E-drought", Comp: P2E },
  { id: "F-disease", Comp: P2F },
  { id: "G-yield", Comp: P2G },
  { id: "H-threats", Comp: P2H },
  { id: "I-dna", Comp: P2I },
];
const KEYWORDS = ["২০০৮", "ব্যাকআপ", "জিন-ব্যাংকে", "ধান", "গম", "ভুট্টাসহ", "খরা", "রোগ", "ফলন", "যুদ্ধ", "বন্যা", "আগুন", "ধ্বংস", "জিনগত", "চিরতরে"];

const CUES: Cue[] = [
  { t: 0.05, src: NV("tick"), vol: 0.35 },
  { t: 0.5, src: NV("tick"), vol: 0.3 },
  { t: 0.9, src: NV("tick"), vol: 0.3 },
  { t: w("চালু") - 0.05, src: NV("ui_pop"), vol: 0.6 },
  { t: w("সালে"), src: NV("impact"), vol: 0.45 },
  { t: CUTS[1] - 0.1, src: NV("whoosh"), vol: 0.6 },
  { t: CUTS[1] + 0.1, src: NV("data_stream"), vol: 0.35 },
  { t: w("ব্যাকআপ"), src: SV("door"), vol: 0.5 },
  { t: w("ব্যাকআপ") - 0.05, src: NV("ui_pop"), vol: 0.6 },
  { t: CUTS[2] - 0.1, src: NV("whoosh_big"), vol: 0.6 },
  { t: w("গবেষণা") - 0.1, src: NV("ui_pop"), vol: 0.6 },
  { t: w("জিন-ব্যাংকে") + 0.1, src: NV("tick"), vol: 0.5 },
  { t: CUTS[3] - 0.1, src: NV("whoosh"), vol: 0.55 },
  { t: w("ধান"), src: NV("ui_click"), vol: 0.6 },
  { t: w("গম"), src: NV("ui_click"), vol: 0.6 },
  { t: w("ভুট্টাসহ"), src: NV("ui_click"), vol: 0.6 },
  { t: w("হাজারো") - 0.05, src: NV("ui_pop"), vol: 0.6 },
  { t: CUTS[4] - 0.1, src: NV("whoosh"), vol: 0.6 },
  { t: w("খরা") - 0.1, src: NV("ui_pop"), vol: 0.6 },
  { t: CUTS[5] - 0.1, src: NV("whoosh"), vol: 0.6 },
  { t: w("রোগ") - 0.1, src: NV("ui_pop"), vol: 0.6 },
  { t: w("ঠেকায়") - 0.15, src: NV("power_on"), vol: 0.55 },
  { t: CUTS[6] - 0.1, src: NV("whoosh"), vol: 0.6 },
  { t: CUTS[6], src: SV("wind"), vol: 0.45 },
  { t: w("কঠিন") - 0.1, src: NV("ui_pop"), vol: 0.6 },
  { t: w("ভালো") - 0.1, src: NV("shimmer"), vol: 0.5 },
  { t: CUTS[7] - 0.15, src: NV("reverse_swell"), vol: 0.5 },
  { t: w("যুদ্ধ"), src: NV("impact_deep"), vol: 0.8 },
  { t: w("বন্যা"), src: NV("drop_down"), vol: 0.6 },
  { t: w("আগুন"), src: NV("hit_glitch"), vol: 0.5 },
  { t: w("যান্ত্রিক"), src: NV("power_down"), vol: 0.6 },
  { t: w("ধ্বংস") - 0.05, src: NV("bass_drop"), vol: 0.6 },
  { t: CUTS[8] - 0.1, src: NV("whoosh"), vol: 0.5 },
  { t: w("হারালে"), src: NV("hit_glitch"), vol: 0.45 },
  { t: w("জিনগত") - 0.05, src: NV("ui_pop"), vol: 0.5 },
  { t: w("চিরতরে"), src: NV("power_down"), vol: 0.5 },
];

export const SvalbardPart2: React.FC = () => (
  <PartPlayer words={words} shots={SHOTS} cuts={CUTS} keywords={KEYWORDS} cues={CUES} vo="svalbard/vo/p2.wav" musicFrom={P1_DURATION} />
);
