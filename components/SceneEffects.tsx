
import React from 'react';
import { OrbitControls } from '@react-three/drei';
import { Bloom, EffectComposer, Noise, Vignette, ToneMapping } from '@react-three/postprocessing';
import { TREE_CONFIG } from '../constants';
import * as THREE from 'three';

export const SceneEffects: React.FC = () => {
  // Initial camera position is [0, 8, 22].
  // Locked angle was approximately 1.22 radians. 
  // We expand this range to allow cinematic tilting.
  const minTilt = Math.PI * 0.25; // ~45 degrees (Looking down from above)
  const maxTilt = Math.PI * 0.65; // ~117 degrees (Looking up from below)

  return (
    <>
      <OrbitControls 
        // Mouse wheel scroll -> Zoom in / out
        enableZoom={true} 
        minDistance={10} 
        maxDistance={45}
        
        // Enabled vertical pitch for cinematic tilting. 
        // Allows the user to view the tree from majestic low angles or elegant high angles.
        minPolarAngle={minTilt}
        maxPolarAngle={maxTilt}
        enableRotate={true}
        
        enablePan={false}
        autoRotate={true}
        autoRotateSpeed={0.4} // Slightly slower for a more cinematic feel
        enableDamping={true}
        dampingFactor={0.05}
        makeDefault
      />
      
      <EffectComposer multisampling={4}>
        <Bloom 
          intensity={TREE_CONFIG.BLOOM_INTENSITY} 
          luminanceThreshold={0.75} 
          luminanceSmoothing={0.9} 
          mipmapBlur
        />
        <ToneMapping mode={THREE.ACESFilmicToneMapping} />
        <Noise opacity={0.015} />
        <Vignette eskil={false} offset={0.05} darkness={1.5} />
      </EffectComposer>
    </>
  );
};
