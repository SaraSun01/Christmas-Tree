
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SNOW_CONFIG } from '../constants';

export const SnowParticles: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = SNOW_CONFIG.COUNT;

  const { positions, speeds, opacities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    const opa = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * SNOW_CONFIG.AREA_SIZE;
      pos[i * 3 + 1] = Math.random() * SNOW_CONFIG.AREA_SIZE - SNOW_CONFIG.AREA_SIZE / 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * SNOW_CONFIG.AREA_SIZE;
      
      spd[i] = SNOW_CONFIG.SPEED_MIN + Math.random() * (SNOW_CONFIG.SPEED_MAX - SNOW_CONFIG.SPEED_MIN);
      opa[i] = 0.2 + Math.random() * 0.8;
    }
    return { positions: pos, speeds: spd, opacities: opa };
  }, [count]);

  useFrame(() => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    
    for (let i = 0; i < count; i++) {
      let y = posAttr.getY(i);
      y -= speeds[i];
      
      // Reset if off bottom
      if (y < -SNOW_CONFIG.AREA_SIZE / 2) {
        y = SNOW_CONFIG.AREA_SIZE / 2;
      }
      
      posAttr.setY(i, y);
      
      // Horizontal drift
      let x = posAttr.getX(i);
      x += Math.sin(Date.now() * 0.001 + i) * 0.005;
      posAttr.setX(i, x);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color="#ffffff"
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};
