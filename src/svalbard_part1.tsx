/** Remotion entry for Svalbard PART 1 only (low-RAM: bundles nothing but this part). */
import { Composition, registerRoot } from "remotion";
import { P1_DURATION, SvalbardPart1 } from "./svalbard/Part1";
import { FPS, H, W } from "./svalbard/theme";

registerRoot(() => (
  <Composition id="SvalbardPart1" component={SvalbardPart1} durationInFrames={Math.round(P1_DURATION * FPS)} fps={FPS} width={W} height={H} />
));
