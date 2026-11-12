import { useThree } from "@react-three/fiber";
import {
  Bloom,
  ChromaticAberration,
  DepthOfField,
  EffectComposer,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { type EffectComposer as PPComposer, ToneMappingMode } from "postprocessing";
import { useEffect, useMemo, useRef } from "react";
import { useDelayRender } from "remotion";
import * as THREE from "three";

type Props = {
  /** World-space distance from camera to the focus plane. Omit to disable DOF. */
  readonly focus?: number;
  /** Depth (world units) that stays sharp around the focus plane. */
  readonly focusRange?: number;
  readonly bokeh?: number;
  readonly bloom?: number;
  readonly bloomThreshold?: number;
  readonly aberration?: number;
  readonly vignette?: number;
};

/**
 * The composer is created in an effect and its EffectPass is attached a render later,
 * after Remotion has already advanced R3F for the frame, so the first captured frame of
 * every tab came out black. Hold the frame until the composer has its effect pass,
 * render once more, then release.
 * (Screen-space AO is not used: N8AO and SSAO both render black on Intel UHD + ANGLE.)
 */
const useComposerReady = (ref: React.RefObject<PPComposer | null>) => {
  const advance = useThree((s) => s.advance);
  const { delayRender, continueRender } = useDelayRender();
  useEffect(() => {
    const handle = delayRender("Waiting for post-processing composer");
    let raf = 0;
    let done = false;
    const tick = () => {
      const c = ref.current;
      if (c && c.passes.length >= 2) {
        advance(performance.now());
        done = true;
        continueRender(handle);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      if (!done) continueRender(handle);
    };
  }, [advance, delayRender, continueRender, ref]);
};

/** Re-render after every commit so changed effect props are reflected in the captured frame. */
const RenderKick: React.FC = () => {
  const advance = useThree((s) => s.advance);
  useEffect(() => {
    advance(performance.now());
  });
  return null;
};

/**
 * Camera-like finishing for every 3D shot: depth of field, highlight bloom,
 * ACES tone mapping, subtle lens fringing and vignette.
 * Nothing here animates on its own: all inputs come from Remotion's frame.
 * EffectComposer needs real effect elements as children (no empty fragments).
 */
export const PostFX: React.FC<Props> = ({
  focus,
  focusRange = 1,
  bokeh = 4,
  bloom = 0.6,
  bloomThreshold = 0.85,
  aberration = 0.0006,
  vignette = 0.45,
}) => {
  const composer = useRef<PPComposer | null>(null);
  useComposerReady(composer);
  const offset = useMemo(() => new THREE.Vector2(aberration, aberration * 0.6), [aberration]);

  const effects: React.ReactElement[] = [];
  if (focus !== undefined) {
    effects.push(<DepthOfField key="dof" worldFocusDistance={focus} worldFocusRange={focusRange} bokehScale={bokeh} />);
  }
  effects.push(
    <Bloom key="bloom" intensity={bloom} luminanceThreshold={bloomThreshold} luminanceSmoothing={0.2} mipmapBlur />,
    <ChromaticAberration key="ca" offset={offset} radialModulation modulationOffset={0.3} />,
    <Vignette key="vig" offset={0.3} darkness={vignette} />,
    <ToneMapping key="tm" mode={ToneMappingMode.ACES_FILMIC} />,
  );

  return (
    <>
      <RenderKick />
      <EffectComposer ref={composer} multisampling={0} frameBufferType={THREE.UnsignedByteType}>
        {effects}
      </EffectComposer>
    </>
  );
};
