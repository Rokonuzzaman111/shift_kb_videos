/** Remotion Studio entry for the Svalbard reel only (low RAM: no other projects bundled). */
import { Composition, registerRoot } from "remotion";
import { P1_DURATION, SvalbardPart1 } from "./svalbard/Part1";
import { P2_DURATION, SvalbardPart2 } from "./svalbard/Part2";
import { FPS, H, W } from "./svalbard/theme";

registerRoot(() => (
  <>
    <Composition id="SvalbardPart1" component={SvalbardPart1} durationInFrames={Math.round(P1_DURATION * FPS)} fps={FPS} width={360} height={680} />
    <Composition id="SvalbardPart2" component={SvalbardPart2} durationInFrames={Math.round(P2_DURATION * FPS)} fps={FPS} width={W} height={H} />
  </>
));
