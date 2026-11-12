/**
 * OWNER: props3d. Classic twin-bell alarm clock. Origin = centre of the dial; faces +z.
 * Face radius 0.6 (≈12 cm at 1 unit = 10 cm); feet touch y = -0.82 * scale.
 *  - hours: 0..24+ (2.0 = 2:00, 22.5 = 10:30). Minute hand follows the fraction.
 *  - t: seconds hand ticks once per second from t.
 */
import { useMemo } from "react";
import * as THREE from "three";
import { dialTexture } from "./tex";

export const CLOCK_FACE_R = 0.6;
export const CLOCK_FOOT_Y = -0.82;

const chrome = { color: "#e9e6e1", metalness: 1, roughness: 0.14 } as const;

const Hand: React.FC<{ angle: number; len: number; w: number; z: number; color: string; tail?: number }> = ({ angle, len, w, z, color, tail = 0.08 }) => (
  <group rotation={[0, 0, angle]} position={[0, 0, z]}>
    <mesh position={[0, (len - tail) / 2, 0]} castShadow>
      <boxGeometry args={[w, len + tail, 0.012]} />
      <meshStandardMaterial color={color} roughness={0.35} metalness={0.4} />
    </mesh>
  </group>
);

export const AlarmClock: React.FC<{
  readonly hours: number;
  readonly t: number;
  readonly position?: readonly [number, number, number];
  readonly rotationY?: number;
  readonly scale?: number;
  readonly body?: string;
}> = ({ hours, t, position = [0, 0, 0], rotationY = 0, scale = 1, body = "#7a1915" }) => {
  const dial = useMemo(dialTexture, []);
  const h12 = ((hours % 12) + 12) % 12;
  const hourA = -(h12 / 12) * Math.PI * 2;
  const minA = -(h12 % 1) * Math.PI * 2;
  const secA = -((Math.floor(t) % 60) / 60) * Math.PI * 2;
  const R = CLOCK_FACE_R;
  const bellAng = 0.62;
  return (
    <group position={position as [number, number, number]} rotation={[0, rotationY, 0]} scale={scale}>
      {/* body */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[R + 0.06, R + 0.06, 0.34, 64]} />
        <meshPhysicalMaterial color={body} roughness={0.3} metalness={0.2} clearcoat={1} clearcoatRoughness={0.08} />
      </mesh>
      {/* back cap */}
      <mesh position={[0, 0, -0.19]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[R - 0.05, R + 0.04, 0.05, 48]} />
        <meshStandardMaterial {...chrome} />
      </mesh>
      {/* dial */}
      <mesh position={[0, 0, 0.171]}>
        <circleGeometry args={[R - 0.01, 64]} />
        <meshStandardMaterial map={dial} roughness={0.55} />
      </mesh>
      {/* bezel */}
      <mesh position={[0, 0, 0.18]}>
        <torusGeometry args={[R + 0.02, 0.045, 16, 72]} />
        <meshStandardMaterial {...chrome} />
      </mesh>
      <Hand angle={hourA} len={0.33} w={0.05} z={0.185} color="#15110f" />
      <Hand angle={minA} len={0.5} w={0.032} z={0.195} color="#15110f" />
      <Hand angle={secA} len={0.52} w={0.012} z={0.205} color="#c42a1e" tail={0.12} />
      <mesh position={[0, 0, 0.21]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.03, 20]} />
        <meshStandardMaterial {...chrome} />
      </mesh>
      {/* domed glass */}
      <mesh position={[0, 0, 0.12]} scale={[1, 1, 0.22]}>
        <sphereGeometry args={[R + 0.01, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.1} roughness={0.02} metalness={0} clearcoat={1} envMapIntensity={2.5} depthWrite={false} />
      </mesh>
      {/* bells */}
      {[-1, 1].map((s) => (
        <group key={s} position={[Math.sin(bellAng) * s * (R + 0.12), Math.cos(bellAng) * (R + 0.12), -0.02]} rotation={[0, 0, -s * bellAng]}>
          <mesh castShadow>
            <sphereGeometry args={[0.3, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial {...chrome} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.3, 0]}>
            <sphereGeometry args={[0.04, 12, 8]} />
            <meshStandardMaterial {...chrome} />
          </mesh>
        </group>
      ))}
      {/* hammer + handle */}
      <mesh position={[0, R + 0.2, -0.02]}>
        <cylinderGeometry args={[0.015, 0.015, 0.22, 8]} />
        <meshStandardMaterial {...chrome} />
      </mesh>
      <mesh position={[0, R + 0.31, -0.02]}>
        <sphereGeometry args={[0.045, 12, 8]} />
        <meshStandardMaterial {...chrome} />
      </mesh>
      <mesh position={[0, R + 0.02, -0.08]}>
        <torusGeometry args={[0.3, 0.022, 10, 40, Math.PI]} />
        <meshStandardMaterial {...chrome} />
      </mesh>
      {/* legs */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 0.44, -0.62, -0.02]} rotation={[0, 0, s * 0.35]}>
            <cylinderGeometry args={[0.028, 0.035, 0.36, 10]} />
            <meshStandardMaterial {...chrome} />
          </mesh>
          <mesh position={[s * 0.5, CLOCK_FOOT_Y + 0.05, -0.02]} castShadow>
            <sphereGeometry args={[0.06, 14, 10]} />
            <meshStandardMaterial {...chrome} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
