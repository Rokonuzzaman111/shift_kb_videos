/** OWNER: 3D agent. Tiny instancing helper: one draw call for many transforms (+ optional colours). */
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export type Xf = {
  readonly p: readonly [number, number, number];
  readonly r?: readonly [number, number, number];
  readonly s?: readonly [number, number, number] | number;
};

export const Inst: React.FC<{
  readonly geometry: THREE.BufferGeometry;
  readonly material: THREE.Material;
  readonly items: readonly Xf[];
  readonly colors?: readonly THREE.Color[];
  readonly castShadow?: boolean;
  readonly receiveShadow?: boolean;
}> = ({ geometry, material, items, colors, castShadow = false, receiveShadow = false }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(), p: new THREE.Vector3(), s: new THREE.Vector3() }), []);
  useLayoutEffect(() => {
    const im = ref.current;
    if (!im) return;
    items.forEach((it, i) => {
      tmp.p.set(it.p[0], it.p[1], it.p[2]);
      tmp.e.set(it.r?.[0] ?? 0, it.r?.[1] ?? 0, it.r?.[2] ?? 0);
      tmp.q.setFromEuler(tmp.e);
      const s = it.s ?? 1;
      if (typeof s === "number") tmp.s.set(s, s, s);
      else tmp.s.set(s[0], s[1], s[2]);
      tmp.m.compose(tmp.p, tmp.q, tmp.s);
      im.setMatrixAt(i, tmp.m);
      if (colors) im.setColorAt(i, colors[i]);
    });
    im.count = items.length;
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.computeBoundingSphere();
  });
  return <instancedMesh ref={ref} args={[geometry, material, Math.max(1, items.length)]} castShadow={castShadow} receiveShadow={receiveShadow} frustumCulled={false} />;
};
