/** Remotion entry for PART 1 only (hook, 0–26.7 s). Low-RAM: loads nothing but this part. */
import { Composition, registerRoot } from "remotion";
import { NvidiaPart, type PartScene, partSpan } from "./nvidia/Part";
import { H1_CUES, H1_ID, H1_KEYWORDS, H1Hook } from "./nvidia/shots/H1Hook";
import { FPS, H, W } from "./nvidia/theme";

const SCENES: PartScene[] = [{ id: H1_ID, Comp: H1Hook, keywords: H1_KEYWORDS, cues: H1_CUES }];
const [a, b] = partSpan(SCENES);
const Part1: React.FC = () => <NvidiaPart scenes={SCENES} />;

registerRoot(() => (
  <Composition id="NvidiaPart1" component={Part1} durationInFrames={Math.round((b - a) * FPS)} fps={FPS} width={W} height={H} />
));
