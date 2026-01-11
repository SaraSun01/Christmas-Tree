
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TREE_CONFIG, EXTRA_ORNAMENT_CONFIG } from '../constants';

interface ExtraOrnamentsProps {
  isOpen?: boolean;
}

type OrnamentType = 'BOX' | 'HAT' | 'RABBIT' | 'CAT' | 'RIBBON';

export const ExtraOrnaments: React.FC<ExtraOrnamentsProps> = ({ isOpen = false }) => {
  const groupRef = useRef<THREE.Group>(null);
  const disperseFactor = useRef(0);
  const count = EXTRA_ORNAMENT_CONFIG.TOTAL_COUNT;

  const ornamentData = useMemo(() => {
    const data = [];
    const types: OrnamentType[] = ['BOX', 'HAT', 'RABBIT', 'CAT', 'RIBBON'];
    
    for (let i = 0; i < count; i++) {
      // Adjusted bias from 1.5 to 1.2 to spread them more naturally up the tree
      const hNormalized = Math.pow(Math.random(), 1.2); 
      const h = hNormalized * TREE_CONFIG.HEIGHT * 0.9 - TREE_CONFIG.HEIGHT / 2 + 0.5;
      const maxRadius = TREE_CONFIG.BOTTOM_RADIUS * (1 - hNormalized * 1.05);
      const angle = Math.random() * Math.PI * 2;
      
      const placementR = maxRadius + 0.15;
      const treeX = Math.cos(angle) * placementR;
      const treeZ = Math.sin(angle) * placementR;
      const treeY = h;

      const nebulaRadius = 22 + Math.random() * 18;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const targetX = nebulaRadius * Math.sin(phi) * Math.cos(theta);
      const targetY = nebulaRadius * Math.sin(phi) * Math.sin(theta);
      const targetZ = nebulaRadius * Math.cos(phi);

      const type = types[i % types.length];
      const color = EXTRA_ORNAMENT_CONFIG.COLORS[Math.floor(Math.random() * EXTRA_ORNAMENT_CONFIG.COLORS.length)];
      
      const heightScale = (1.4 - hNormalized * 0.7); // Slightly less aggressive scaling
      const scale = EXTRA_ORNAMENT_CONFIG.BASE_SIZE * heightScale * (0.85 + Math.random() * 0.3);
      
      const rotationSpeed = (Math.random() - 0.5) * 0.6;
      const phase = Math.random() * Math.PI * 2;

      data.push({ treeX, treeY, treeZ, targetX, targetY, targetZ, type, color, scale, rotationSpeed, phase });
    }
    return data;
  }, [count]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    const target = isOpen ? 1.0 : 0.0;
    disperseFactor.current += (target - disperseFactor.current) * 0.06;

    groupRef.current.children.forEach((child, i) => {
      const data = ornamentData[i];
      if (!data) return;

      const x = THREE.MathUtils.lerp(data.treeX, data.targetX, disperseFactor.current);
      const y = THREE.MathUtils.lerp(data.treeY, data.targetY, disperseFactor.current);
      const z = THREE.MathUtils.lerp(data.treeZ, data.targetZ, disperseFactor.current);

      const float = Math.sin(time * 0.6 + data.phase) * 0.12;
      child.position.set(x, y + float, z);
      child.rotation.set(time * data.rotationSpeed, time * 0.4 + data.phase, 0);
      
      const s = data.scale;
      child.scale.set(s, s, s);

      child.traverse((node) => {
        if ((node as THREE.Mesh).isMesh) {
          const mesh = node as THREE.Mesh;
          const mat = mesh.material as THREE.MeshPhysicalMaterial;
          if (mat) {
            mat.emissiveIntensity = 0.3 + 0.4 * Math.sin(time * 2.5 + data.phase);
          }
        }
      });
    });
  });

  return (
    <group ref={groupRef}>
      {ornamentData.map((data, i) => (
        <DecorationComponent key={i} type={data.type} color={data.color} />
      ))}
    </group>
  );
};

const DecorationComponent: React.FC<{ type: OrnamentType; color: THREE.Color }> = ({ type, color }) => {
  const commonMatProps = {
    color: color,
    metalness: 0.6,
    roughness: 0.3,
    clearcoat: 0.5,
    emissive: color,
    emissiveIntensity: 0.4,
  };

  switch (type) {
    case 'BOX':
      return (
        <group>
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshPhysicalMaterial {...commonMatProps} />
          </mesh>
          <mesh position={[0, 0, 0]} scale={[1.05, 0.2, 1.05]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshPhysicalMaterial color="#FFFFFF" metalness={0.8} />
          </mesh>
          <mesh position={[0, 0, 0]} scale={[0.2, 1.05, 1.05]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshPhysicalMaterial color="#FFFFFF" metalness={0.8} />
          </mesh>
        </group>
      );
    case 'HAT':
      return (
        <group>
          <mesh position={[0, 0.4, 0]}>
            <coneGeometry args={[0.5, 1.2, 16]} />
            <meshPhysicalMaterial {...commonMatProps} color={new THREE.Color('#E74C3C')} />
          </mesh>
          <mesh position={[0, -0.2, 0]}>
            <torusGeometry args={[0.45, 0.1, 8, 24]} />
            <meshPhysicalMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[0, 1.05, 0]}>
            <sphereGeometry args={[0.15]} />
            <meshPhysicalMaterial color="#FFFFFF" />
          </mesh>
        </group>
      );
    case 'RABBIT':
      return (
        <group>
          <mesh>
            <capsuleGeometry args={[0.4, 0.6, 4, 12]} />
            <meshPhysicalMaterial {...commonMatProps} />
          </mesh>
          <mesh position={[0.15, 0.6, 0]} rotation={[0, 0, -0.2]}>
            <capsuleGeometry args={[0.08, 0.5, 4, 8]} />
            <meshPhysicalMaterial {...commonMatProps} />
          </mesh>
          <mesh position={[-0.15, 0.6, 0]} rotation={[0, 0, 0.2]}>
            <capsuleGeometry args={[0.08, 0.5, 4, 8]} />
            <meshPhysicalMaterial {...commonMatProps} />
          </mesh>
        </group>
      );
    case 'CAT':
      return (
        <group>
          <mesh position={[0, -0.1, 0]}>
            <sphereGeometry args={[0.45, 16, 16]} />
            <meshPhysicalMaterial {...commonMatProps} />
          </mesh>
          <mesh position={[0, 0.4, 0]}>
            <sphereGeometry args={[0.35, 16, 16]} />
            <meshPhysicalMaterial {...commonMatProps} />
          </mesh>
          <mesh position={[0.18, 0.65, 0]} rotation={[0, 0, -0.4]}>
            <coneGeometry args={[0.12, 0.25, 4]} />
            <meshPhysicalMaterial {...commonMatProps} />
          </mesh>
          <mesh position={[-0.18, 0.65, 0]} rotation={[0, 0, 0.4]}>
            <coneGeometry args={[0.12, 0.25, 4]} />
            <meshPhysicalMaterial {...commonMatProps} />
          </mesh>
        </group>
      );
    case 'RIBBON':
      return (
        <mesh>
          <torusGeometry args={[0.5, 0.12, 8, 24]} />
          <meshPhysicalMaterial {...commonMatProps} />
        </mesh>
      );
    default:
      return (
        <mesh>
          <sphereGeometry args={[0.5]} />
          <meshPhysicalMaterial {...commonMatProps} />
        </mesh>
      );
  }
};
