
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TREE_CONFIG } from '../constants';

const vertexShader = `
  uniform float uTime;
  uniform float uDisperse;
  uniform float uBurst;
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aDist;
  attribute float aRandom;
  attribute vec3 aTargetPosition;
  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    vColor = aColor;
    
    // Interpolate between tree position and nebula position
    vec3 pos = mix(position, aTargetPosition, uDisperse);
    
    float t = uTime * 0.6 + aRandom * 15.0;
    
    // Controlled floating drift
    float drift = sin(t + aRandom) * 0.03;
    pos.x += drift * sin(aRandom * 12.0);
    pos.y += drift * cos(aRandom * 12.0);
    pos.z += drift * sin(aRandom * 8.0);

    // Subtle spiral rotation - reduces when dispersed
    float angle = uTime * (0.05 + aRandom * 0.02) + pos.y * 0.04 * (1.0 - uDisperse);
    float s = sin(angle);
    float c = cos(angle);
    float nx = pos.x * c - pos.z * s;
    float nz = pos.x * s + pos.z * c;
    pos.x = nx;
    pos.z = nz;

    // Breathing pulse + Burst effect
    float breathe = 1.0 + 0.01 * sin(uTime * 1.8 + aRandom * 10.0);
    float burstScale = 1.0 + uBurst * 0.05 * (1.0 - aDist);
    pos.xyz *= breathe * burstScale;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    // Sharp particle sizing
    float twinkle = 0.8 + 0.2 * sin(uTime * 5.0 + aRandom * 40.0);
    gl_PointSize = (aSize * 1.05) * (560.0 / -mvPosition.z) * twinkle * (1.0 + uBurst * 0.5);
    gl_Position = projectionMatrix * mvPosition;
    
    // Opacity logic
    float coreFade = smoothstep(0.0, 0.8, aDist);
    vOpacity = (0.3 + 0.7 * coreFade) * (0.6 + 0.4 * sin(uTime * 1.2 + aRandom * 4.0)) * (1.0 + uBurst);
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    float strength = pow(1.0 - dist * 2.0, 8.0);
    gl_FragColor = vec4(vColor, strength * vOpacity);
  }
`;

interface PinkTreeParticlesProps {
  isOpen?: boolean;
  burstTime?: number;
}

export const PinkTreeParticles: React.FC<PinkTreeParticlesProps> = ({ 
  isOpen = false, 
  burstTime = 0 
}) => {
  const meshRef = useRef<THREE.Points>(null);
  const disperseFactor = useRef(0);
  const burstFactor = useRef(0);
  const count = TREE_CONFIG.PARTICLE_COUNT;

  const { positions, colors, sizes, dists, randoms, targets } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const siz = new Float32Array(count);
    const dst = new Float32Array(count);
    const rnd = new Float32Array(count);
    const tar = new Float32Array(count * 3);

    const pinkCore = new THREE.Color('#FF2A6F');
    const pinkMain = new THREE.Color('#FF4B8B');
    const pinkPale = new THREE.Color('#FF86B6');
    const goldEdge = TREE_CONFIG.GOLD_GLOW;

    for (let i = 0; i < count; i++) {
      // 1. Structural Growth Logic
      const h = Math.random(); // Height factor (0 to 1)
      const isTrunk = Math.random() < 0.12; // 12% particles form the core trunk
      
      let tx, ty, tz, r;
      const maxRadiusAtH = TREE_CONFIG.BOTTOM_RADIUS * (1 - Math.pow(h, 1.15));

      if (isTrunk) {
        // Trunk: Central column
        const trunkThickness = 0.12 * (1 - h * 0.4);
        const trunkAngle = Math.random() * Math.PI * 2;
        const trunkR = Math.sqrt(Math.random()) * trunkThickness;
        tx = Math.cos(trunkAngle) * trunkR;
        ty = h * TREE_CONFIG.HEIGHT - TREE_CONFIG.HEIGHT / 2;
        tz = Math.sin(trunkAngle) * trunkR;
        r = trunkR;
      } else {
        // Symmetrical Branches: Use 12 paths for a full, balanced silhouette
        const numBranchPaths = 12; 
        const branchIndex = Math.floor(Math.random() * numBranchPaths);
        
        // Very low spiral twist to keep the silhouette symmetrical from left to right
        const spiralRotation = h * Math.PI * 0.2; 
        const baseAngle = (branchIndex * (Math.PI * 2 / numBranchPaths)) + spiralRotation;
        
        // Cluster particles along the branch line
        const branchLengthFactor = Math.pow(Math.random(), 0.7); 
        const branchRadius = branchLengthFactor * maxRadiusAtH;
        
        // Add a natural downward curve (droop) to the branches
        const droop = branchLengthFactor * 0.25; 
        
        // Jitter around the branch path
        const jitter = (1 - branchLengthFactor) * 0.3 + 0.1;
        const angleJitter = (Math.random() - 0.5) * jitter;
        const finalAngle = baseAngle + angleJitter;
        
        tx = Math.cos(finalAngle) * branchRadius;
        ty = (h * TREE_CONFIG.HEIGHT - TREE_CONFIG.HEIGHT / 2) - droop;
        tz = Math.sin(finalAngle) * branchRadius;
        r = branchRadius;
      }

      pos[i * 3] = tx;
      pos[i * 3 + 1] = ty;
      pos[i * 3 + 2] = tz;

      // 2. Nebula/Dispersion Targets
      const nebulaRadius = 15 + Math.random() * 25;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      tar[i * 3] = nebulaRadius * Math.sin(phi) * Math.cos(theta);
      tar[i * 3 + 1] = nebulaRadius * Math.sin(phi) * Math.sin(theta);
      tar[i * 3 + 2] = nebulaRadius * Math.cos(phi);

      // 3. Coloring & Attributes
      const distRatio = r / (maxRadiusAtH + 0.001);
      const color = new THREE.Color();
      
      if (isTrunk || distRatio < 0.1) {
        color.copy(pinkCore).lerp(pinkMain, distRatio / 0.1);
      } else if (distRatio < 0.8) {
        color.copy(pinkMain).lerp(pinkPale, (distRatio - 0.1) / 0.7);
      } else {
        color.copy(pinkPale).lerp(goldEdge, (distRatio - 0.8) / 0.2);
      }
      
      // Sparkle highlights
      if (Math.random() > 0.998) color.set('#FFFFFF');

      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
      
      siz[i] = isTrunk ? (0.5 + Math.random() * 0.4) : (0.8 + Math.random() * 0.8);
      dst[i] = distRatio;
      rnd[i] = Math.random();
    }
    return { positions: pos, colors: col, sizes: siz, dists: dst, randoms: rnd, targets: tar };
  }, [count]);

  const uniforms = useMemo(() => ({ 
    uTime: { value: 0 },
    uDisperse: { value: 0 },
    uBurst: { value: 0 }
  }), []);

  useFrame((state) => {
    if (meshRef.current) {
      const targetDisperse = isOpen ? 1.0 : 0.0;
      disperseFactor.current += (targetDisperse - disperseFactor.current) * 0.05;
      
      const now = Date.now();
      const timeSinceBurst = now - burstTime;
      if (timeSinceBurst < 1000) {
        burstFactor.current = 1.0 - (timeSinceBurst / 1000);
      } else {
        burstFactor.current = 0;
      }

      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = state.clock.elapsedTime;
      material.uniforms.uDisperse.value = disperseFactor.current;
      material.uniforms.uBurst.value = burstFactor.current;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aColor" count={count} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={count} array={sizes} itemSize={1} />
        <bufferAttribute attach="attributes-aDist" count={count} array={dists} itemSize={1} />
        <bufferAttribute attach="attributes-aRandom" count={count} array={randoms} itemSize={1} />
        <bufferAttribute attach="attributes-aTargetPosition" count={count} array={targets} itemSize={3} />
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
