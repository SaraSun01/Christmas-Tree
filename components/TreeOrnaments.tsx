
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TREE_CONFIG, ORNAMENT_CONFIG } from '../constants';

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();

interface TreeOrnamentsProps {
  isOpen?: boolean;
}

export const TreeOrnaments: React.FC<TreeOrnamentsProps> = ({ isOpen = false }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const disperseFactor = useRef(0);
  const count = ORNAMENT_CONFIG.COUNT;

  const ornamentData = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      // Adjusted bias from 1.6 to 1.3 to spread ball ornaments better
      const hNormalized = Math.pow(Math.random(), 1.3); 
      
      const h = hNormalized * TREE_CONFIG.HEIGHT - TREE_CONFIG.HEIGHT / 2;
      const maxRadius = TREE_CONFIG.BOTTOM_RADIUS * (1 - hNormalized * 0.95);
      const angle = Math.random() * Math.PI * 2;
      
      const r = Math.sqrt(Math.random()) * maxRadius;
      const treeX = Math.cos(angle) * r;
      const treeZ = Math.sin(angle) * r;
      const treeY = h;

      const nebulaRadius = 20 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const targetX = nebulaRadius * Math.sin(phi) * Math.cos(theta);
      const targetY = nebulaRadius * Math.sin(phi) * Math.sin(theta);
      const targetZ = nebulaRadius * Math.cos(phi);
      
      const color = ORNAMENT_CONFIG.COLORS[Math.floor(Math.random() * ORNAMENT_CONFIG.COLORS.length)];
      
      const heightScaleFactor = (1.35 - hNormalized * 0.7);
      const scale = heightScaleFactor * (0.8 + Math.random() * 0.4);
      
      const phase = Math.random() * Math.PI * 2;
      
      data.push({ treeX, treeY, treeZ, targetX, targetY, targetZ, color, scale, phase });
    }
    return data;
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;

    const target = isOpen ? 1.0 : 0.0;
    disperseFactor.current += (target - disperseFactor.current) * 0.08;

    ornamentData.forEach((data, i) => {
      const x = THREE.MathUtils.lerp(data.treeX, data.targetX, disperseFactor.current);
      const y = THREE.MathUtils.lerp(data.treeY, data.targetY, disperseFactor.current);
      const z = THREE.MathUtils.lerp(data.treeZ, data.targetZ, disperseFactor.current);

      const floatOffset = Math.sin(time * 0.5 + data.phase) * 0.05;
      tempObject.position.set(x, y + floatOffset, z);
      tempObject.rotation.set(time * 0.2, time * 0.3 + data.phase, 0);
      
      const s = data.scale;
      tempObject.scale.set(s, s, s);
      
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
      
      tempColor.copy(data.color);
      tempColor.multiplyScalar(4.0);
      meshRef.current!.setColorAt(i, tempColor);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow>
      <sphereGeometry args={[ORNAMENT_CONFIG.SIZE, 24, 24]} />
      <meshPhysicalMaterial 
        metalness={0.9} 
        roughness={0.1} 
        clearcoat={1.0}
        envMapIntensity={2.0}
        emissive="#000000"
      />
    </instancedMesh>
  );
};
