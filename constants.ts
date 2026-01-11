
import { Color } from 'three';

export const TREE_CONFIG = {
  PARTICLE_COUNT: 28000, 
  HEIGHT: 12,
  BOTTOM_RADIUS: 4,
  
  WARM_ENERGY_PINK: new Color('#FF2D78'),
  CORAL_HIGHLIGHT: new Color('#FF6B90'),
  GOLD_GLOW: new Color('#FFD700'),
  
  BLOOM_INTENSITY: 0.7,
};

export const ORNAMENT_CONFIG = {
  COUNT: 70,
  SIZE: 0.18,
  COLORS: [
    new Color('#FFD700'), // Gold
    new Color('#FF1493'), // Vivid Pink
    new Color('#FFFFFF'), // Silver/White
    new Color('#E74C3C'), // Red
  ],
};

export const EXTRA_ORNAMENT_CONFIG = {
  TOTAL_COUNT: 40, // Decreased from 60 to reduce clutter
  BASE_SIZE: 0.25,
  COLORS: [
    new Color('#FF2D78'), // Pink
    new Color('#9B59B6'), // Purple
    new Color('#FFD700'), // Gold
    new Color('#ECF0F1'), // Silver/White
    new Color('#E74C3C'), // Red
  ]
};

export const SNOW_CONFIG = {
  COUNT: 5000, // Significantly increased from 1800 for "heavy snow" effect
  SPEED_MIN: 0.015,
  SPEED_MAX: 0.06,
  AREA_SIZE: 70, // Slightly larger area for dense coverage
};

export const RING_CONFIG = {
  RINGS: 3,
  PARTICLES_PER_RING: 1200,
  RADIUS_MULTIPLIER: 1.5,
  COLOR: new Color('#FFD700'),
};

export const WISH_CONFIG = {
  FLY_DURATION: 2.0,
  CORE_COLOR: '#FF2A6F',
  HIGHLIGHT_COLOR: '#FF4B8B',
  EDGE_COLOR: '#FFFFFF',
};
