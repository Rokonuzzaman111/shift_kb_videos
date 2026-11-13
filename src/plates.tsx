/** Separate Remotion entry for 3D plate renders only (immune to in-progress scene code). */
import { Composition, registerRoot } from "remotion";
import { PLATES } from "./nvidia/three/plates";
import { FPS, H, W } from "./nvidia/theme";

const Root: React.FC = () => (
  <>
    {PLATES.map((s) => (
      <Composition key={s.id} id={`N3D-${s.id}`} component={s.Comp} durationInFrames={Math.round(s.dur * FPS)} fps={FPS} width={W} height={H} />
    ))}
  </>
);
registerRoot(Root);
