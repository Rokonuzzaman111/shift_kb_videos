/**
 * Voiceover timing contract shared by every shot.
 *  - Each shot plays exactly one VO key; the assembler starts that VO at shot time VO_LEAD.
 *  - Shot duration = VO_LEAD + VO length + VO_TAIL (use shotDuration(key)).
 *  - Time a beat to a spoken word with wordAt(key, "word") (shot seconds, VO_LEAD included).
 */
import lengths from "../vo-lengths.json";
import hook from "../../public/vo/hook.json";
import pellet from "../../public/vo/pellet.json";
import fission from "../../public/vo/fission.json";
import reactor from "../../public/vo/reactor.json";
import chain from "../../public/vo/chain.json";
import myth from "../../public/vo/myth.json";
import control from "../../public/vo/control.json";
import scram from "../../public/vo/scram.json";
import loop from "../../public/vo/loop.json";
import pressure from "../../public/vo/pressure.json";
import sg from "../../public/vo/sg.json";
import turbine from "../../public/vo/turbine.json";
import generator from "../../public/vo/generator.json";
import dynamo from "../../public/vo/dynamo.json";
import city from "../../public/vo/city.json";
import cooling from "../../public/vo/cooling.json";
import condenser from "../../public/vo/condenser.json";
import safety from "../../public/vo/safety.json";
import catcher from "../../public/vo/catcher.json";
import ending from "../../public/vo/ending.json";
import type { Word } from "../ui";

export const VO_LEAD = 0.4;
export const VO_TAIL = 0.5;

export const VO_WORDS = {
  hook,
  pellet,
  fission,
  reactor,
  chain,
  myth,
  control,
  scram,
  loop,
  pressure,
  sg,
  turbine,
  generator,
  dynamo,
  city,
  cooling,
  condenser,
  safety,
  catcher,
  ending,
} satisfies Record<string, Word[]>;

export type VoKey = keyof typeof VO_WORDS;

export const voLength = (key: VoKey) => (lengths as Record<string, number>)[key];

export const shotDuration = (key: VoKey, extra = 0) => +(VO_LEAD + voLength(key) + VO_TAIL + extra).toFixed(2);

/** Shot-time (s) when the n-th occurrence (0-based) of `word` starts being spoken. */
export const wordAt = (key: VoKey, word: string, nth = 0) => {
  const hits = VO_WORDS[key].filter((w) => w.text === word || w.text.startsWith(word));
  const w = hits[Math.min(nth, hits.length - 1)];
  if (!w) throw new Error(`wordAt: "${word}" not in VO "${key}"`);
  return VO_LEAD + w.startMs / 1000;
};
