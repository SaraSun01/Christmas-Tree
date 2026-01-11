
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TREE_CONFIG, WISH_CONFIG } from '../constants';

interface WishBallProps {
  id: number;
}

const vertexShader = `
  uniform float uT;
  uniform vec3 uP0;
  uniform vec3 uP1;
  uniform vec3 uP2;
  uniform float uTime;
  
  attribute float aOffset; // How much this particle lags behind the head
  attribute float aScatter;
  
  varying float vOpacity;
  varying vec3 vColor;

  vec3 bezier(float t, vec3 p0, vec3 p1, vec3 p2) {
    float invT = 1.0 - t;
    return invT * invT * p0 + 2.0 * invT * t * p1 + t * t * p2;
  }

  void main() {
    // Each particle has a lag (aOffset). The head is at uT, the tail trails back.
    float t = clamp(uT - aOffset * 0.25, 0.0, 1.0);
    
    vec3 pos = bezier(t, uP0, uP1, uP2);
    
    // Add some "shooting star" jitter and width to the tail
    float noise = sin(uTime * 20.0 + aOffset * 100.0) * aScatter * 0.15;
    pos.x += noise;
    pos.y += noise;
    pos.z += noise;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    // Size decays along the tail
    float size = (1.5 - aOffset) * 0.4;
    // Glow pulse for the head
    if (aOffset < 0.02) size *= (1.2 + 0.3 * sin(uTime * 15.0));
    
    gl_PointSize = size * (400.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
    
    // Color: White at the head, pink/coral in the tail
    vec3 headColor = vec3(1.0, 1.0, 1.0);
    vec3 tailColor = vec3(1.0, 0.16, 0.44); // Warm Pink
    vColor = mix(headColor, tailColor, smoothstep(0.0, 0.3, aOffset));
    
    // Fade out at the very end of the trail and based on overall life
    vOpacity = (1.0 - aOffset) * smoothstep(0.0, 0.05, t) * (1.0 - smoothstep(0.95, 1.0, uT));
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    
    // Soft gaussian-like falloff for glowy particles
    float strength = pow(1.0 - dist * 2.0, 2.0);
    gl_FragColor = vec4(vColor, strength * vOpacity);
  }
`;

const WishBall: React.FC<WishBallProps> = ({ id }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const startTime = useMemo(() => Date.now(), []);
  
  const controlPoints = useMemo(() => {
    // Start at the bottom center of the tree, slightly forward to be visible
    const p0 = new THREE.Vector3(0, -TREE_CONFIG.HEIGHT / 2, 2);
    // Control point for an elegant side arc
    const p1 = new THREE.Vector3(6, 0, 4);
    // End at the tree top (TopHeart position)
    const p2 = new THREE.Vector3(0, TREE_CONFIG.HEIGHT / 2 + 1, 0);
    return { p0, p1, p2 };
  }, []);

  const particleCount = 400; // More particles for a smoother long tail
  const { offsets, scatters } = useMemo(() => {
    const off = new Float32Array(particleCount);
    const sca = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      // Linear distribution for trail lag
      off[i] = i / particleCount; 
      sca[i] = (Math.random() - 0.5) * 2.0;
    }
    return { offsets: off, scatters: sca };
  }, []);

  const uniforms = useMemo(() => ({
    uT: { value: 0 },
    uP0: { value: controlPoints.p0 },
    uP1: { value: controlPoints.p1 },
    uP2: { value: controlPoints.p2 },
    uTime: { value: 0 }
  }), [controlPoints]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const elapsed = (Date.now() - startTime) / 1000;
    const t = Math.min(elapsed / WISH_CONFIG.FLY_DURATION, 1.0);
    
    // Cubic easing for a natural acceleration/deceleration feel
    const easedT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    
    const mat = pointsRef.current.material as THREE.ShaderMaterial;
    mat.uniforms.uT.value = easedT;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        {/* We don't need initial positions as they are computed in the shader */}
        <bufferAttribute 
          attach="attributes-position" 
          count={particleCount} 
          array={new Float32Array(particleCount * 3)} 
          itemSize={3} 
        />
        <bufferAttribute 
          attach="attributes-aOffset" 
          count={particleCount} 
          array={offsets} 
          itemSize={1} 
        />
        <bufferAttribute 
          attach="attributes-aScatter" 
          count={particleCount} 
          array={scatters} 
          itemSize={1} 
        />
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

export const WishManager: React.FC<{ wishes: number[] }> = ({ wishes }) => {
  return (
    <>
      {wishes.map(id => (
        <WishBall key={id} id={id} />
      ))}
    </>
  );
};
