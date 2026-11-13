/**
 * OWNER: 3D agent. Premium product-photography studio for the Nvidia hardware.
 *
 *   <Studio camera={{ pos: [0, 8, 22], target: [0, 1, 0], mm: 50, focus: 22 }} size={10}>
 *     <GpuChip glow={0.5} />
 *   </Studio>
 *
 * Units: product scenes are in centimetres (GpuChip ≈ 7 wide, GraphicsCard ≈ 30 long).
 * `size` = rough object size so lights / shadows / floor scale with it.
 * Lighting: studio HDRI (low) + softbox / strip Lightformers baked into the env (crisp reflections on
 * polished metal and the die), a shadow-casting key, cool rim, faint green kicker, contact shadow on a
 * dark seamless floor that fades into the background. NvFX adds bloom, optional DOF, AgX tone mapping.
 */
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { HDRI } from "../../kit/assets";
import { Lens, Stage } from "../../kit/Stage";
import { N } from "../theme";
import { type FXProps, NvFX } from "./FX";
import { radialFade } from "./tex";

RectAreaLightUniformsLib.init();

export type V3 = readonly [number, number, number];
/** Camera override shared by all Nvidia 3D components. `focus` = DOF focus distance (omit = sharp). */
export type Cam = {
  readonly pos: V3;
  readonly target: V3;
  readonly mm?: number;
  readonly roll?: number;
  readonly focus?: number;
  readonly range?: number;
};

export const lerp3 = (a: V3, b: V3, k: number): [number, number, number] => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
export const dist3 = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
/** Orbit helper: camera on a circle around `target` at `radius`, `height`, angle `a` (radians). */
export const orbit = (target: V3, radius: number, height: number, a: number): [number, number, number] => [
  target[0] + Math.sin(a) * radius,
  target[1] + height,
  target[2] + Math.cos(a) * radius,
];

/** Lights + env + floor only (no canvas): use inside your own <Stage>. */
export const StudioRig: React.FC<{
  readonly size?: number;
  /** HDRI + lightformer reflection strength */
  readonly env?: number;
  /** key/rim light multiplier */
  readonly light?: number;
  /** green kicker strength (0..1) */
  readonly accent?: number;
  readonly floor?: boolean;
  readonly floorY?: number;
  readonly floorColor?: string;
  /** rotate the HDRI/lightformer rig (radians) */
  readonly envRotation?: number;
}> = ({ size = 10, env = 1, light = 1, accent = 0.25, floor = true, floorY = 0, floorColor = "#050606", envRotation = 0 }) => {
  const s = size / 10;
  const fade = useMemo(() => radialFade(), []);
  return (
    <>
      <Environment
        files={HDRI.studio}
        environmentIntensity={0.18 * env}
        environmentRotation={[0, envRotation, 0]}
        resolution={512}
      >
        {/* big overhead softbox: the long clean highlight on polished parts */}
        <Lightformer form="rect" intensity={2.2} color="#ffffff" position={[-1.5, 6, -2.5]} rotation-x={Math.PI / 2} scale={[7, 1.6, 1]} />
        <Lightformer form="rect" intensity={0.35} color="#ffffff" position={[2, 6, 3]} rotation-x={Math.PI / 2} scale={[5, 2.5, 1]} />
        {/* side strips for edge highlights */}
        <Lightformer form="rect" intensity={2.4} color="#eef4ff" position={[-6, 1.5, 1]} rotation-y={Math.PI / 2} scale={[8, 0.6, 1]} />
        <Lightformer form="rect" intensity={2} color="#fff3e6" position={[6, 1.0, -1]} rotation-y={-Math.PI / 2} scale={[8, 0.5, 1]} />
        {/* back rim */}
        <Lightformer form="rect" intensity={2.5} color="#d8e6ff" position={[0, 4.2, -6]} scale={[10, 0.5, 1]} />
        {/* faint green accent bounce */}
        <Lightformer form="ring" intensity={1.4 * accent} color={N.green} position={[-4, -1, -4]} scale={2} target={[0, 0, 0]} />
      </Environment>
      {/* key: soft, top-left-front, casts the main shadow */}
      <directionalLight
        position={[-6 * s, 12 * s, 7 * s]}
        intensity={2.2 * light}
        color="#fff6ec"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-size}
        shadow-camera-right={size}
        shadow-camera-top={size}
        shadow-camera-bottom={-size}
        shadow-camera-near={0.1}
        shadow-camera-far={size * 5}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02 * s}
        shadow-radius={4}
      />
      {/* soft-box fill (area light gives broad specular shapes on metal) */}
      <rectAreaLight position={[7 * s, 5 * s, 6 * s]} width={8 * s} height={5 * s} intensity={1.6 * light} color="#e9f0ff" onUpdate={(l) => l.lookAt(0, 0, 0)} />
      {/* cool rim from behind */}
      <rectAreaLight position={[2 * s, 4 * s, -9 * s]} width={12 * s} height={2 * s} intensity={5 * light} color="#cfe0ff" onUpdate={(l) => l.lookAt(0, 0, 0)} />
      {/* green kicker low behind left */}
      <pointLight position={[-9 * s, 4 * s, -9 * s]} intensity={60 * accent * light * s * s} distance={0} decay={2} color={N.green} />
      {floor ? (
        <>
          <mesh rotation-x={-Math.PI / 2} position={[0, floorY - 0.002 * size, 0]} receiveShadow>
            <planeGeometry args={[size * 14, size * 14]} />
            <meshStandardMaterial color={floorColor} roughness={0.7} metalness={0} alphaMap={fade} transparent depthWrite={false} envMapIntensity={0.25} />
          </mesh>
          <ContactShadows position={[0, floorY + 0.001 * size, 0]} scale={size * 4} far={size * 1.2} blur={2.6} opacity={0.85} resolution={512} color="#000000" frames={Infinity} />
        </>
      ) : null}
    </>
  );
};

/**
 * Full studio shot: Stage (canvas) + camera + rig + post. Drop the product in as children.
 */
export const Studio: React.FC<{
  readonly camera: Cam;
  readonly children: React.ReactNode;
  readonly size?: number;
  readonly env?: number;
  readonly light?: number;
  readonly accent?: number;
  readonly floor?: boolean;
  readonly floorY?: number;
  readonly envRotation?: number;
  readonly background?: string;
  readonly fx?: Partial<FXProps>;
}> = ({ camera, children, size = 10, env, light, accent, floor, floorY, envRotation, background = N.bg, fx }) => (
  <Stage background={background}>
    <Lens position={camera.pos} target={camera.target} mm={camera.mm ?? 50} roll={camera.roll} near={size * 0.01} far={size * 60} />
    <fog attach="fog" args={[new THREE.Color(background), size * 4, size * 12]} />
    <StudioRig size={size} env={env} light={light} accent={accent} floor={floor} floorY={floorY} envRotation={envRotation} />
    {children}
    <NvFX focus={camera.focus} focusRange={camera.range ?? size * 0.6} {...fx} />
  </Stage>
);
