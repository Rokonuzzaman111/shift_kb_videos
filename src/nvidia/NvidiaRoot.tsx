/**
 * All Nvidia compositions (OWNER: lead). Registered from src/Root.tsx.
 * Agents add test comps through their own lab arrays — never edit src/Root.tsx directly.
 */
import { Composition, Folder } from "remotion";
import { NV_DURATION, NvidiaFull } from "./Full";
import { THREE_LAB } from "./three/lab";
import { PLATES } from "./three/plates";
import { FPS, H, W } from "./theme";

export const NvidiaCompositions: React.FC = () => (
  <Folder name="Nvidia">
    <Composition id="NvidiaFull" component={NvidiaFull} durationInFrames={Math.round(NV_DURATION * FPS)} fps={FPS} width={W} height={H} />
    <Folder name="Nvidia-3D-lab">
      {[...THREE_LAB, ...PLATES].map((s) => (
        <Composition key={s.id} id={`N3D-${s.id}`} component={s.Comp} durationInFrames={Math.round(s.dur * FPS)} fps={FPS} width={W} height={H} />
      ))}
    </Folder>
  </Folder>
);
