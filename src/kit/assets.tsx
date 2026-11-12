import { Environment, useTexture } from "@react-three/drei";
import { useMemo } from "react";
import { staticFile } from "remotion";
import * as THREE from "three";

export const HDRI = {
  dusk: staticFile("assets/hdri/kloppenheim_06_puresky_2k.hdr"),
  studio: staticFile("assets/hdri/studio_small_09_2k.hdr"),
};

type TexName = "concrete_wall_008" | "metal_plate" | "rock_boulder_dry";

/**
 * Loads a Poly Haven PBR set (albedo, GL normal, roughness, ARM) with tiling.
 * Suspends until loaded; ThreeCanvas holds the render via delayRender meanwhile.
 */
export const usePBR = (name: TexName, repeat: [number, number] = [1, 1]) => {
  const base = `assets/tex/${name}/${name}`;
  const maps = useTexture({
    map: staticFile(`${base}_diff_2k.jpg`),
    normalMap: staticFile(`${base}_nor_gl_2k.jpg`),
    roughnessMap: staticFile(`${base}_rough_2k.jpg`),
    aoMap: staticFile(`${base}_arm_2k.jpg`),
  });
  return useMemo(() => {
    const out: Record<string, THREE.Texture> = {};
    for (const [k, tex] of Object.entries(maps)) {
      const t = tex.clone();
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(...repeat);
      t.anisotropy = 8;
      t.colorSpace = k === "map" ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      t.needsUpdate = true;
      out[k] = t;
    }
    return out as { map: THREE.Texture; normalMap: THREE.Texture; roughnessMap: THREE.Texture; aoMap: THREE.Texture };
  }, [maps, repeat[0], repeat[1]]); // eslint-disable-line react-hooks/exhaustive-deps
};

/** Real-photo HDRI lighting. `background` shows the sky itself (exteriors). */
export const Lighting: React.FC<{
  readonly hdri: string;
  readonly intensity?: number;
  readonly background?: boolean;
  readonly blur?: number;
  readonly rotation?: number;
}> = ({ hdri, intensity = 1, background = false, blur = 0, rotation = 0 }) => (
  <Environment
    files={hdri}
    background={background}
    backgroundBlurriness={blur}
    environmentIntensity={intensity}
    backgroundIntensity={intensity}
    environmentRotation={[0, rotation, 0]}
    backgroundRotation={[0, rotation, 0]}
  />
);
