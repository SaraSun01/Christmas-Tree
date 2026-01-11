
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RING_CONFIG, TREE_CONFIG } from '../constants';

interface BaseRingsProps {
  isOpen?: boolean;
}

export const BaseRings: React.FC<BaseRingsProps> = ({ isOpen = false }) => {
  const groupRef = useRef<THREE.Group>(null);
  const disperseFactor = useRef(0);
  
  const rings = useMemo(() => {
    const data = [];
    const baseRadius = TREE_CONFIG.BOTTOM_RADIUS;

    for (let i = 0; i < RING_CONFIG.RINGS; i++) {
      const radius = baseRadius * (1.0 + (i / (RING_CONFIG.RINGS - 1)) * (RING_CONFIG.RADIUS_MULTIPLIER - 1));
      const count = RING_CONFIG.PARTICLES_PER_RING;
      const pos = new Float32Array(count * 3);
      
      for (let j = 0; j < count; j++) {
        const angle = (j / count) * Math.PI * 2;
        const r = radius + (Math.random() - 0.5) * 0.2;
        pos[j * 3] = Math.cos(angle) * r;
        pos[j * 3 + 1] = (Math.random() - 0.5) * 0.05;
        pos[j * 3 + 2] = Math.sin(angle) * r;
      }
      data.push({ positions: pos, speed: 0.15 + 0.1 * (i + 1) });
    }
    return data;
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;

    const target = isOpen ? 1.0 : 0.0;
    disperseFactor.current += (target - disperseFactor.current) * 0.08;

    groupRef.current.children.forEach((child, i) => {
      const direction = i % 2 === 0 ? 1 : -1;
      const points = child as THREE.Points;
      const mat = points.material as THREE.PointsMaterial;
      
      // Expansion and rotation
      points.rotation.y = state.clock.elapsedTime * (0.2 + i * 0.1) * direction;
      points.scale.setScalar(1.0 + disperseFactor.current * 4.0);
      
      // Fade out as it expands
      mat.opacity = (0.4 + (i * 0.1)) * (1.0 - disperseFactor.current);
    });
  });

  return (
    <group ref={groupRef} position={[0, -TREE_CONFIG.HEIGHT / 2, 0]}>
      {rings.map((ring, idx) => (
        <points key={idx}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={ring.positions.length / 3} array={ring.positions} itemSize={3} />
          </bufferGeometry>
          <pointsMaterial
            size={0.04}
            color={RING_CONFIG.COLOR}
            transparent
            opacity={0.4 + (idx * 0.1)}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      ))}
    </group>
  );
};
