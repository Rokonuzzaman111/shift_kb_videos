/** Remotion entry for PART 2 only (CPU vs GPU, 27.75–67.56 s). Low-RAM: loads nothing but this part. */
import { Composition, registerRoot } from "remotion";
import { NvidiaPart, type PartScene, partSpan } from "./nvidia/Part";
import { P1_CUES, P1_ID, P1_KEYWORDS, P1Scene } from "./nvidia/shots/P1";
import { FPS, H, W } from "./nvidia/theme";

const SCENES: PartScene[] = [{ id: P1_ID, Comp: P1Scene, keywords: P1_KEYWORDS, cues: P1_CUES }];
const [a, b] = partSpan(SCENES);
const Part2: React.FC = () => <NvidiaPart scenes={SCENES} />;

registerRoot(() => (
  <Composition id="NvidiaPart2" component={Part2} durationInFrames={Math.round((b - a) * FPS)} fps={FPS} width={W} height={H} />
));
