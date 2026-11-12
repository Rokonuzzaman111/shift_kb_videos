import { useThree } from "@react-three/fiber";
import { useLayoutEffect } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { gradientTexture } from "./textures";

type Props = {
  readonly mode: "studio" | "sky";
  readonly background?: string;
  readonly skyStops?: [number, string][];
  readonly envIntensity?: number;
  readonly exposure?: number;
};

/**
 * Image-based lighting + tone mapping. "studio" uses a procedural softbox room,
 * "sky" builds the environment from the sky gradient so water/metal reflect the sky.
 */
export const Env: React.FC<Props> = ({
  mode,
  background = "#05070d",
  skyStops = [
    [0, "#1c2b4d"],
    [1, "#f0a35e"],
  ],
  envIntensity = 1,
  exposure = 1,
}) => {
  const { gl, scene } = useThree();
  const stopsKey = JSON.stringify(skyStops);

  useLayoutEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = exposure;
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;

    const pm = new THREE.PMREMGenerator(gl);
    let envScene: THREE.Scene;
    let bg: THREE.Texture | null = null;
    if (mode === "studio") {
      envScene = new RoomEnvironment();
      scene.background = new THREE.Color(background);
    } else {
      bg = gradientTexture(JSON.parse(stopsKey));
      envScene = new THREE.Scene();
      envScene.add(
        new THREE.Mesh(
          new THREE.SphereGeometry(100, 32, 16),
          new THREE.MeshBasicMaterial({ map: bg, side: THREE.BackSide }),
        ),
      );
      scene.background = bg;
    }
    const env = pm.fromScene(envScene, 0.02).texture;
    scene.environment = env;
    scene.environmentIntensity = envIntensity;
    return () => {
      env.dispose();
      pm.dispose();
      bg?.dispose();
    };
  }, [gl, scene, mode, background, stopsKey, envIntensity, exposure]);

  return null;
};

/** Sets camera position/target every frame (Remotion-driven, no useFrame). */
export const CameraRig: React.FC<{
  readonly position: [number, number, number];
  readonly target: [number, number, number];
  readonly fov?: number;
}> = ({ position, target, fov }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(...position);
    if (fov) camera.fov = fov;
    camera.lookAt(...target);
    camera.updateProjectionMatrix();
  });
  return null;
};
