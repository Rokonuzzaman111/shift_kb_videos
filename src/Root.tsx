import { Composition, Folder } from "remotion";
import { CAFFEINE_DURATION, CAFFEINE_SHOTS, CaffeineAudio, CaffeineFull } from "./caffeine/Full";
import { FULL_DURATION, FullVideo, SHOTS } from "./FullVideo";
import { HERO_DURATION, HeroPreview } from "./HeroPreview";
import { DEMO_DURATION, RooppurDemo } from "./RooppurDemo";
import { FissionScene } from "./scenes/FissionScene";
import { PelletScene } from "./scenes/PelletScene";
import { PlantScene } from "./scenes/PlantScene";
import { FPS, HEIGHT, WIDTH } from "./theme";

// Shots are timed in seconds, so they follow whatever frame rate is set here.
const CINE_FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="CaffeineFull"
        component={CaffeineFull}
        durationInFrames={Math.round(CAFFEINE_DURATION * CINE_FPS)}
        fps={30}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="CaffeineAudio"
        component={CaffeineAudio}
        durationInFrames={Math.round(CAFFEINE_DURATION * CINE_FPS)}
        fps={CINE_FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Folder name="Caffeine-shots">
        {CAFFEINE_SHOTS.map((s) => (
          <Composition
            key={s.id}
            id={`C-${s.id.replace(/\s+/g, "-")}`}
            component={s.Comp}
            durationInFrames={Math.round(s.dur * CINE_FPS)}
            fps={CINE_FPS}
            width={WIDTH}
            height={HEIGHT}
          />
        ))}
      </Folder>
      <Composition
        id="RooppurFull"
        component={FullVideo}
        durationInFrames={Math.round(FULL_DURATION * CINE_FPS)}
        fps={CINE_FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Folder name="Shots">
        {SHOTS.map((s) => (
          <Composition
            key={s.id}
            id={s.id.replace(/\s+/g, "-")}
            component={s.Comp}
            durationInFrames={Math.round(s.dur * CINE_FPS)}
            fps={CINE_FPS}
            width={WIDTH}
            height={HEIGHT}
          />
        ))}
      </Folder>
      <Folder name="Old-demos">
        <Composition
          id="HeroPreview"
          component={HeroPreview}
          durationInFrames={Math.round(HERO_DURATION * CINE_FPS)}
          fps={CINE_FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition id="RooppurDemo" component={RooppurDemo} durationInFrames={DEMO_DURATION} fps={23.976} width={WIDTH} height={HEIGHT} />
        <Composition id="PelletScene" component={PelletScene} durationInFrames={200} fps={23.976} width={WIDTH} height={HEIGHT} />
        <Composition id="PlantScene" component={PlantScene} durationInFrames={200} fps={FPS} width={WIDTH} height={HEIGHT} />
        <Composition id="FissionScene" component={FissionScene} durationInFrames={216} fps={FPS} width={WIDTH} height={HEIGHT} />
      </Folder>
    </>
  );
};
