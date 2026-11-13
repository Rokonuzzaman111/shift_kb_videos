/**
 * OWNER: 3D agent. Product-render finishing pass for the Nvidia hardware shots.
 * Same pipeline/first-frame guard as kit/PostFX, plus anti-aliasing (composer MSAA) which
 * fine hardware detail (pads, fins, blade edges) needs to read as a real render.
 */
import { useThree } from "@react-three/fiber";
import { Bloom, ChromaticAberration, DepthOfField, EffectComposer, ToneMapping, Vignette } from "@react-three/postprocessing";
import { type EffectComposer as PPComposer, ToneMappingMode } from "postprocessing";
import { useEffect, useMemo, useRef } from "react";
import { useDelayRender } from "remotion";
import * as THREE from "three";

export type FXProps = {
  /** World-space focus distance. Omit = no DOF. */
  readonly focus?: number;
  readonly focusRange?: number;
  readonly bokeh?: number;
  readonly bloom?: number;
  readonly bloomThreshold?: number;
  readonly aberration?: number;
  readonly vignette?: number;
  /** composer MSAA samples (0 = off) */
  readonly msaa?: number;
};

const useComposerReady = (ref: React.RefObject<PPComposer | null>) => {
  const advance = useThree((s) => s.advance);
  const { delayRender, continueRender } = useDelayRender();
  useEffect(() => {
    const handle = delayRender("Waiting for Nvidia FX composer");
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

const RenderKick: React.FC = () => {
  const advance = useThree((s) => s.advance);
  useEffect(() => {
    advance(performance.now());
  });
  return null;
};

export const NvFX: React.FC<FXProps> = ({
  focus,
  focusRange = 1,
  bokeh = 3,
  bloom = 0.7,
  bloomThreshold = 0.8,
  aberration = 0.0005,
  vignette = 0.5,
  msaa = 4,
}) => {
  const composer = useRef<PPComposer | null>(null);
  useComposerReady(composer);
  const offset = useMemo(() => new THREE.Vector2(aberration, aberration * 0.6), [aberration]);
  const effects: React.ReactElement[] = [];
  if (focus !== undefined) {
    effects.push(<DepthOfField key="dof" worldFocusDistance={focus} worldFocusRange={focusRange} bokehScale={bokeh} />);
  }
  effects.push(
    <Bloom key="bloom" intensity={bloom} luminanceThreshold={bloomThreshold} luminanceSmoothing={0.25} mipmapBlur />,
    <ChromaticAberration key="ca" offset={offset} radialModulation modulationOffset={0.3} />,
    <Vignette key="vig" offset={0.3} darkness={vignette} />,
    <ToneMapping key="tm" mode={ToneMappingMode.ACES_FILMIC} />,
  );
  return (
    <>
      <RenderKick />
      <EffectComposer ref={composer} multisampling={msaa} frameBufferType={THREE.HalfFloatType}>
        {effects}
      </EffectComposer>
    </>
  );
};
