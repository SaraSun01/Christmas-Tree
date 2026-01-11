
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TREE_CONFIG } from '../constants';

const vertexShader = `
  uniform float uTime;
  uniform float uDisperse;
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aIsRim;
  attribute vec3 aTargetPosition;
  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    vColor = aColor;
    
    // Lerp from base position (in heart geometry) to nebula target
    vec3 pos = mix(position, aTargetPosition, uDisperse);
    
    // Heartbeat pulse: Scale oscillation 0.95 -> 1.05
    float pulse = 1.0 + 0.05 * sin(uTime * 2.5);
    pos *= mix(pulse, 1.0, uDisperse);

    // Subtle energy vibration
    pos.x += sin(uTime * 10.0 + position.y) * 0.005;
    pos.z += cos(uTime * 10.0 + position.x) * 0.005;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    // Size attenuation
    float sizeFactor = aIsRim > 0.5 ? 1.4 : 1.0;
    float twinkle = 0.8 + 0.2 * sin(uTime * 4.0 + position.x * 10.0);
    
    gl_PointSize = aSize * sizeFactor * (350.0 / -mvPosition.z) * twinkle;
    gl_Position = projectionMatrix * mvPosition;
    
    vOpacity = 1.0;
  }
`;

const fragmentShader = `
  varying vec3 vColor;

  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    
    // Soft glow falloff
    float strength = pow(1.0 - dist * 2.0, 2.5);
    gl_FragColor = vec4(vColor, strength);
  }
`;

interface TopHeartProps {
  isOpen?: boolean;
}

export const TopHeart: React.FC<TopHeartProps> = ({ isOpen = false }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const disperseFactor = useRef(0);
  const count = 8000;

  const { positions, colors, sizes, isRim, targets } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const siz = new Float32Array(count);
    const rim = new Float32Array(count);
    const tar = new Float32Array(count * 3);

    const warmPink = new THREE.Color('#DF0041');
    const softPink = new THREE.Color('#FF9FB5');
    const goldSparkle = new THREE.Color('#FFCB96');
    const haloWhite = new THREE.Color('#FFE8F0');

    for (let i = 0; i < count; i++) {
      const t = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()); 
      const xBase = 16 * Math.pow(Math.sin(t), 3);
      const yBase = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      const scale = 0.045;
      const zOffset = (Math.random() - 0.5) * 4.0 * (1.0 - r); 

      pos[i * 3] = xBase * r * scale;
      pos[i * 3 + 1] = yBase * r * scale;
      pos[i * 3 + 2] = zOffset * scale;

      // Nebula targets for heart particles
      const nebulaRadius = 25 + Math.random() * 15;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      tar[i * 3] = nebulaRadius * Math.sin(phi) * Math.cos(theta);
      tar[i * 3 + 1] = nebulaRadius * Math.sin(phi) * Math.sin(theta);
      tar[i * 3 + 2] = nebulaRadius * Math.cos(phi);

      const isRimParticle = r > 0.92;
      rim[i] = isRimParticle ? 1.0 : 0.0;
      const particleColor = new THREE.Color();
      const rand = Math.random();

      if (isRimParticle) {
        particleColor.copy(warmPink).lerp(haloWhite, 0.4);
      } else if (r < 0.3) {
        particleColor.copy(warmPink);
      } else {
        if (rand < 0.7) {
          particleColor.copy(warmPink);
        } else if (rand < 0.9) {
          particleColor.copy(softPink);
        } else {
          particleColor.copy(goldSparkle);
        }
      }

      col[i * 3] = particleColor.r;
      col[i * 3 + 1] = particleColor.g;
      col[i * 3 + 2] = particleColor.b;
      siz[i] = Math.random() * 0.5 + 0.3;
    }
    return { positions: pos, colors: col, sizes: siz, isRim: rim, targets: tar };
  }, [count]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uDisperse: { value: 0 },
  }), []);

  useFrame((state) => {
    if (pointsRef.current) {
      const target = isOpen ? 1.0 : 0.0;
      disperseFactor.current += (target - disperseFactor.current) * 0.08;
      
      const material = pointsRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = state.clock.elapsedTime;
      material.uniforms.uDisperse.value = disperseFactor.current;
      
      // Stay anchored at top with slight vertical float
      const baseY = TREE_CONFIG.HEIGHT / 2 + 0.8;
      pointsRef.current.position.y = baseY + Math.sin(state.clock.elapsedTime * 1.5) * 0.1 * (1.0 - disperseFactor.current);
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.8 * (1.0 - disperseFactor.current);
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aColor" count={colors.length / 3} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={sizes.length} array={sizes} itemSize={1} />
        <bufferAttribute attach="attributes-aIsRim" count={isRim.length} array={isRim} itemSize={1} />
        <bufferAttribute attach="attributes-aTargetPosition" count={targets.length / 3} array={targets} itemSize={3} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};
