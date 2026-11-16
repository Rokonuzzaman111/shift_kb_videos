/** Arctic atmosphere pieces: gradient sky dome, stars, aurora curtain, wind-blown snow. All driven by Remotion time. */
import { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { rng } from "./util";

const useTime = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return f / fps;
};

export const SkyDome: React.FC<{ readonly top: string; readonly mid: string; readonly bottom: string; readonly r?: number }> = ({
  top,
  mid,
  bottom,
  r = 1800,
}) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, bottom: { value: new THREE.Color() } },
        vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
        fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; varying vec3 vP;
          void main(){ float y = vP.y; vec3 c = y>0.0 ? mix(mid, top, pow(clamp(y*1.6,0.0,1.0),0.7)) : mix(mid, bottom, clamp(-y*4.0,0.0,1.0));
          gl_FragColor = vec4(c,1.0); }`,
      }),
    [],
  );
  mat.uniforms.top.value.set(top);
  mat.uniforms.mid.value.set(mid);
  mat.uniforms.bottom.value.set(bottom);
  return (
    <mesh material={mat} renderOrder={-10}>
      <sphereGeometry args={[r, 32, 16]} />
    </mesh>
  );
};

export const Stars: React.FC<{ readonly count?: number; readonly r?: number; readonly opacity?: number }> = ({
  count = 1400,
  r = 1600,
  opacity = 1,
}) => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const rand = rng(7);
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const u = rand() * Math.PI * 2;
      const v = 0.05 + rand() * 0.95;
      const y = v;
      const s = Math.sqrt(1 - y * y);
      p.set([Math.cos(u) * s * r, y * r, Math.sin(u) * s * r], i * 3);
    }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    return g;
  }, [count, r]);
  return (
    <points geometry={geo} renderOrder={-9}>
      <pointsMaterial color="#dff3ff" size={2.2} sizeAttenuation={false} transparent opacity={opacity} depthWrite={false} fog={false} />
    </points>
  );
};

/** Aurora curtain: an arc of vertical light bands. `strength` 0..1 fades it in. */
export const Aurora: React.FC<{
  readonly position?: [number, number, number];
  readonly radius?: number;
  readonly height?: number;
  readonly strength?: number;
}> = ({ position = [0, 120, -700], radius = 900, height = 260, strength = 1 }) => {
  const t = useTime();
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        fog: false,
        uniforms: { uT: { value: 0 }, uS: { value: 1 } },
        vertexShader: `uniform float uT; varying vec2 vUv;
          void main(){ vUv = uv; vec3 p = position;
            p.z += sin(uv.x*9.0 + uT*0.35)*40.0 + sin(uv.x*23.0 - uT*0.6)*12.0;
            p.y += sin(uv.x*14.0 + uT*0.5)*10.0*uv.y;
            gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.0);} `,
        fragmentShader: `uniform float uT; uniform float uS; varying vec2 vUv;
          float h(float x){ return fract(sin(x*91.7)*43758.5); }
          float n(float x){ float i=floor(x); float f=fract(x); f=f*f*(3.0-2.0*f); return mix(h(i),h(i+1.0),f); }
          void main(){
            float x = vUv.x*60.0;
            float bands = n(x + uT*0.8)*0.6 + n(x*2.7 - uT*1.3)*0.4;
            bands = pow(bands, 2.2);
            float base = smoothstep(0.0, 0.08, vUv.y) * pow(1.0 - vUv.y, 1.6);
            float edge = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);
            vec3 green = vec3(0.30, 1.0, 0.62);
            vec3 violet = vec3(0.55, 0.25, 0.85);
            vec3 c = mix(green, violet, smoothstep(0.35, 0.95, vUv.y));
            float a = bands * base * edge * uS * 1.25;
            gl_FragColor = vec4(c * a, a);
          }`,
      }),
    [],
  );
  mat.uniforms.uT.value = t;
  mat.uniforms.uS.value = strength;
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(1, 1, 160, 1);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i) + 0.5; // 0..1
      const v = p.getY(i) + 0.5;
      const ang = (u - 0.5) * 1.6;
      p.setXYZ(i, Math.sin(ang) * radius, v * height, -Math.cos(ang) * radius * 0.35);
    }
    g.computeBoundingSphere();
    return g;
  }, [radius, height]);
  return <mesh geometry={geo} material={mat} position={position} renderOrder={-8} />;
};

/** Wind-blown snow in a box around `center`. Positions are computed on the GPU from time (deterministic). */
export const Snow: React.FC<{
  readonly count?: number;
  readonly size?: [number, number, number];
  readonly center?: [number, number, number];
  readonly wind?: [number, number, number];
  readonly px?: number;
  readonly opacity?: number;
}> = ({ count = 2500, size = [60, 30, 60], center = [0, 10, 0], wind = [6, -2.5, 1], px = 3, opacity = 0.85 }) => {
  const t = useTime();
  const { geo, mat } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const rand = rng(31);
    const p = new Float32Array(count * 3);
    const s = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      p.set([rand(), rand(), rand()], i * 3);
      s[i] = 0.4 + rand() * 0.9;
    }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    g.setAttribute("aS", new THREE.BufferAttribute(s, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uT: { value: 0 },
        uBox: { value: new THREE.Vector3() },
        uC: { value: new THREE.Vector3() },
        uW: { value: new THREE.Vector3() },
        uPx: { value: 3 },
        uO: { value: 1 },
      },
      vertexShader: `uniform float uT; uniform vec3 uBox; uniform vec3 uC; uniform vec3 uW; uniform float uPx; attribute float aS; varying float vA;
        void main(){
          vec3 q = position*uBox + uW*uT*aS + vec3(sin(uT*1.3+position.y*40.0), 0.0, cos(uT*1.1+position.x*30.0))*0.6;
          q = mod(q, uBox) - uBox*0.5 + uC;
          vec4 mv = modelViewMatrix*vec4(q,1.0);
          gl_Position = projectionMatrix*mv;
          gl_PointSize = uPx * aS * (30.0 / max(1.0, -mv.z));
          gl_PointSize = clamp(gl_PointSize, 1.0, 14.0);
          vA = smoothstep(0.5, 4.0, -mv.z);
        }`,
      fragmentShader: `uniform float uO; varying float vA;
        void main(){ vec2 c = gl_PointCoord-0.5; float d = length(c); if(d>0.5) discard;
          float a = smoothstep(0.5, 0.0, d) * vA * uO; gl_FragColor = vec4(vec3(0.92,0.97,1.0), a); }`,
    });
    return { geo: g, mat: m };
  }, [count]);
  mat.uniforms.uT.value = t;
  mat.uniforms.uBox.value.set(...size);
  mat.uniforms.uC.value.set(...center);
  mat.uniforms.uW.value.set(...wind);
  mat.uniforms.uPx.value = px;
  mat.uniforms.uO.value = opacity;
  return <points geometry={geo} material={mat} frustumCulled={false} />;
};
