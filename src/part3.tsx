/** Remotion entry for PART 3 only (1993 founding → "30 days from bankruptcy", 65.86–93.51 s). */
import { Composition, registerRoot } from "remotion";
import { NvidiaPart, type PartScene, partSpan } from "./nvidia/Part";
import { P2_CUES, P2_ID, P2_KEYWORDS, P2Scene } from "./nvidia/shots/P2";
import { FPS, H, W } from "./nvidia/theme";

const SCENES: PartScene[] = [{ id: P2_ID, Comp: P2Scene, keywords: P2_KEYWORDS, cues: P2_CUES }];
const RANGE: [number, number] = [65.86, 93.51]; // ends in the pause after "…তিরিশ দিন দূরে।"
const [a, b] = partSpan(SCENES, RANGE);
const Part3: React.FC = () => <NvidiaPart scenes={SCENES} range={RANGE} />;

registerRoot(() => (
  <Composition id="NvidiaPart3" component={Part3} durationInFrames={Math.round((b - a) * FPS)} fps={FPS} width={W} height={H} />
));
