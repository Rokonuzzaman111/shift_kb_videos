/**
 * Golden wheat field that withers to ash. `wither` 0 = lush, 1 = dead & grey, `blow` 0..1 = heads torn off by wind.
 * Instanced stalks + heads, transforms recomputed per frame from Remotion time (deterministic wind).
 */
import { useLayoutEffect, useMemo, useRef } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { canvasTex, grain, rng } from "./util";

const N = 5200;
const FIELD = { x: 34, z0: -60, z1: 6 };

export const WheatField: React.FC<{ readonly wither: number; readonly blow: number }> = ({ wither, blow }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const stalks = useRef<THREE.InstancedMesh>(null);
  const heads = useRef<THREE.InstancedMesh>(null);

  const data = useMemo(() => {
    const r = rng(5);
    return Array.from({ length: N }, () => {
      const x = (r() - 0.5) * FIELD.x * 2;
      const z = FIELD.z0 + r() * (FIELD.z1 - FIELD.z0);
      return { x, z, h: 0.85 + r() * 0.35, lean: (r() - 0.5) * 0.18, ph: r() * 6.28, yaw: r() * 6.28, c: r(), fly: r() };
    });
  }, []);

  const geos = useMemo(() => {
    const s = new THREE.CylinderGeometry(0.008, 0.014, 1, 3, 1);
    s.translate(0, 0.5, 0);
    const h = new THREE.SphereGeometry(1, 6, 4);
    h.scale(0.028, 0.11, 0.028);
    return { s, h };
  }, []);

  useLayoutEffect(() => {
    const ms = stalks.current;
    const mh = heads.current;
    if (!ms || !mh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const sc = new THREE.Vector3();
    const pos = new THREE.Vector3();
    const gold = new THREE.Color();
    const dead = new THREE.Color("#5b554c");
    const first = !ms.instanceColor;
    for (let i = 0; i < N; i++) {
      const d = data[i];
      const gust = Math.sin(t * 1.9 + d.x * 0.25 + d.z * 0.18) * 0.5 + Math.sin(t * 3.7 + d.ph) * 0.18;
      const droop = wither * (0.5 + d.c * 0.5);
      const bend = d.lean + gust * (0.16 + wither * 0.12) + droop * 0.9;
      const hh = d.h * (1 - wither * 0.28);
      e.set(bend, d.yaw, gust * 0.06);
      q.setFromEuler(e);
      sc.set(1, hh, 1);
      pos.set(d.x, 0, d.z);
      m.compose(pos, q, sc);
      ms.setMatrixAt(i, m);
      // head at the tip, tilted further
      const tip = new THREE.Vector3(0, hh, 0).applyQuaternion(q).add(pos);
      const k = Math.max(0, Math.min(1, (blow - d.fly * 0.6) / 0.4));
      tip.x += k * k * (6 + d.c * 6);
      tip.y += k * (1.5 + d.ph * 0.2) - k * k * 0.5;
      tip.z += k * (2 - d.c * 3);
      e.set(bend * 1.4 + k * 4, d.yaw, k * 3);
      q.setFromEuler(e);
      const hs = (1 - k) * (1 - wither * 0.35);
      sc.set(hs, hs, hs);
      m.compose(tip, q, sc);
      mh.setMatrixAt(i, m);
      gold.setHSL(0.11 + d.c * 0.025, 0.72 - d.c * 0.15, 0.48 + d.c * 0.12).lerp(dead, wither);
      ms.setColorAt(i, gold);
      mh.setColorAt(i, gold.offsetHSL(0, 0.05, 0.06));
    }
    ms.instanceMatrix.needsUpdate = true;
    mh.instanceMatrix.needsUpdate = true;
    if (ms.instanceColor) ms.instanceColor.needsUpdate = true;
    if (mh.instanceColor) mh.instanceColor.needsUpdate = true;
    if (first) {
      (ms.material as THREE.Material).needsUpdate = true;
      (mh.material as THREE.Material).needsUpdate = true;
    }
  });

  const soil = useMemo(
    () =>
      canvasTex(512, 512, (g) => {
        grain(g, 512, 512, [92, 70, 48], 40, 4);
      }, [14, 14]),
    [],
  );
  const cracks = useMemo(
    () =>
      canvasTex(1024, 1024, (g) => {
        g.clearRect(0, 0, 1024, 1024);
        const r = rng(9);
        g.strokeStyle = "rgba(20,12,6,0.95)";
        for (let k = 0; k < 90; k++) {
          let x = r() * 1024;
          let y = r() * 1024;
          g.lineWidth = 1 + r() * 3;
          g.beginPath();
          g.moveTo(x, y);
          for (let s = 0; s < 8; s++) {
            x += (r() - 0.5) * 90;
            y += (r() - 0.5) * 90;
            g.lineTo(x, y);
          }
          g.stroke();
        }
      }, [6, 6]),
    [],
  );

  return (
    <group>
      <instancedMesh ref={stalks} args={[geos.s, undefined, N]} castShadow frustumCulled={false}>
        <meshStandardMaterial roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[geos.h, undefined, N]} castShadow frustumCulled={false}>
        <meshStandardMaterial roughness={0.55} />
      </instancedMesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial map={soil} color={new THREE.Color("#8a6a45").lerp(new THREE.Color("#7a6f63"), wither)} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[300, 300]} />
        <meshBasicMaterial map={cracks} transparent opacity={wither * 0.85} depthWrite={false} />
      </mesh>
    </group>
  );
};

/** Ash/dust flakes torn away by the wind once the field dies. */
export const Ash: React.FC<{ readonly amount: number }> = ({ amount }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const r = rng(77);
    const n = 1600;
    const p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) p.set([(r() - 0.5) * 40, r() * 3, -r() * 30], i * 3);
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    g.userData.base = p.slice();
    return g;
  }, []);
  const p = geo.attributes.position as THREE.BufferAttribute;
  const base = geo.userData.base as Float32Array;
  for (let i = 0; i < p.count; i++) {
    const s = 0.6 + ((i * 37) % 100) / 100;
    p.setXYZ(i, base[i * 3] + t * 5 * s, base[i * 3 + 1] + Math.sin(t * 2 + i) * 0.3 + t * 0.8 * s, base[i * 3 + 2]);
  }
  p.needsUpdate = true;
  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial color="#9a9088" size={0.06} transparent opacity={amount * 0.9} depthWrite={false} />
    </points>
  );
};
