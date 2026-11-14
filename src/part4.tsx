/** Remotion entry for PART 4 only (three turns → ChatGPT rush, 93.51–118.87 s). */
import { Composition, registerRoot } from "remotion";
import { NvidiaPart, type PartScene, partSpan } from "./nvidia/Part";
import { P2_CUES, P2_ID, P2_KEYWORDS, P2Scene } from "./nvidia/shots/P2";
import { FPS, H, W } from "./nvidia/theme";

const SCENES: PartScene[] = [{ id: P2_ID, Comp: P2Scene, keywords: P2_KEYWORDS, cues: P2_CUES }];
const RANGE: [number, number] = [93.51, 118.87]; // ends in the pause after "…লাইনে দাঁড়াল।"
const [a, b] = partSpan(SCENES, RANGE);
const Part4: React.FC = () => <NvidiaPart scenes={SCENES} range={RANGE} />;

registerRoot(() => (
  <Composition id="NvidiaPart4" component={Part4} durationInFrames={Math.round((b - a) * FPS)} fps={FPS} width={W} height={H} />
));
