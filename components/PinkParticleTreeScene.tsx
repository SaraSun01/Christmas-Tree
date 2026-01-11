
import React from 'react';
import { PinkTreeParticles } from './PinkTreeParticles';
import { SnowParticles } from './SnowParticles';
import { BaseRings } from './BaseRings';
import { TopHeart } from './TopHeart';
import { TreeOrnaments } from './TreeOrnaments';
import { ExtraOrnaments } from './ExtraOrnaments';
import { SceneEffects } from './SceneEffects';
import { WishManager } from './WishManager';
import { Stars, Environment } from '@react-three/drei';

interface PinkParticleTreeSceneProps {
  isOpen?: boolean;
  activeWishes?: number[];
  burstTime?: number;
}

export const PinkParticleTreeScene: React.FC<PinkParticleTreeSceneProps> = ({ 
  isOpen = false, 
  activeWishes = [], 
  burstTime = 0 
}) => {
  return (
    <>
      <color attach="background" args={['#000000']} />
      
      <ambientLight intensity={0.2} />
      <pointLight position={[5, 5, 5]} intensity={1.5} color="#FFFFFF" />
      <pointLight position={[-5, 2, -5]} intensity={1.0} color="#FFD700" />
      <pointLight position={[0, 5, 0]} intensity={0.8} color="#FF6B90" />
      
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />
      
      <Environment preset="night" />
      
      <group>
        <PinkTreeParticles isOpen={isOpen} burstTime={burstTime} />
        <TreeOrnaments isOpen={isOpen} />
        <ExtraOrnaments isOpen={isOpen} />
        <BaseRings isOpen={isOpen} />
        <TopHeart isOpen={isOpen} />
      </group>

      <WishManager wishes={activeWishes} />
      
      <SnowParticles />
      
      <SceneEffects />
    </>
  );
};
