// ============================================================================
// CINEMATIC INTRO CONFIGURATION: "THE REVEAL — A WORLD THAT REVEALS ITSELF"
// Master 8.5s - 10.0s Timeline, Authored Variation Seeds & Color/Camera Scripts
// ============================================================================

export type QualityTier = 'ULTRA' | 'HIGH' | 'MEDIUM' | 'LOW' | 'FALLBACK';

export type VariationSeedId = 'SEED_ALPHA' | 'SEED_BETA' | 'SEED_GAMMA' | 'SEED_DELTA';

export interface VariationSeedConfig {
  id: VariationSeedId;
  name: string;
  weight: number; // Probability weight
  cameraOffset: { x: number; y: number; z: number; yaw: number; pitch: number };
  earlyRingReveal: boolean;
  deepMonolithsVisible: boolean;
  rarePulsarEffect: boolean;
  accentHue: 'gold' | 'violet_gold' | 'cyan_gold';
}

export const VARIATION_SEEDS: Record<VariationSeedId, VariationSeedConfig> = {
  SEED_ALPHA: {
    id: 'SEED_ALPHA',
    name: 'Primary Celestial (Classic)',
    weight: 0.45,
    cameraOffset: { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 },
    earlyRingReveal: false,
    deepMonolithsVisible: false,
    rarePulsarEffect: false,
    accentHue: 'gold',
  },
  SEED_BETA: {
    id: 'SEED_BETA',
    name: 'Observational Quadrant',
    weight: 0.30,
    cameraOffset: { x: -25, y: -15, z: -20, yaw: -0.04, pitch: 0.02 },
    earlyRingReveal: true,
    deepMonolithsVisible: false,
    rarePulsarEffect: false,
    accentHue: 'cyan_gold',
  },
  SEED_GAMMA: {
    id: 'SEED_GAMMA',
    name: 'Deep Monolith Depth',
    weight: 0.20,
    cameraOffset: { x: 35, y: 20, z: 40, yaw: 0.05, pitch: -0.03 },
    earlyRingReveal: false,
    deepMonolithsVisible: true,
    rarePulsarEffect: false,
    accentHue: 'violet_gold',
  },
  SEED_DELTA: {
    id: 'SEED_DELTA',
    name: 'Rare Harmonic Pulsar',
    weight: 0.05,
    cameraOffset: { x: 0, y: -30, z: -40, yaw: 0.02, pitch: 0.05 },
    earlyRingReveal: true,
    deepMonolithsVisible: true,
    rarePulsarEffect: true,
    accentHue: 'violet_gold',
  },
};

export const INTRO_TIMING = {
  // Master 10-Phase Timeline for standard first visit / replay (8.50s total)
  MASTER: {
    totalDuration: 8.50,
    void: { start: 0.00, duration: 0.90 },                // Phase 0: 0.00 → 0.90s
    presence: { start: 0.75, duration: 0.95 },            // Phase 1: 0.75 → 1.70s
    disturbance: { start: 1.50, duration: 1.10 },         // Phase 2: 1.50 → 2.60s
    discovery: { start: 2.40, duration: 1.10 },           // Phase 3: 2.40 → 3.50s
    scale: { start: 3.30, duration: 1.20 },               // Phase 4: 3.30 → 4.50s
    recognition: { start: 4.30, duration: 0.90 },         // Phase 5: 4.30 → 5.20s
    silence: { start: 5.15, duration: 0.60 },             // Phase 6: 5.15 → 5.75s
    secondaryDiscovery: { start: 5.60, duration: 0.75 },  // Phase 7: 5.60 → 6.35s
    cameraEntry: { start: 6.20, duration: 0.80 },         // Phase 8: 6.20 → 7.00s
    handover: { start: 6.80, duration: 0.90 },            // Phase 9: 6.80 → 7.70s
    arrival: { start: 7.60, duration: 0.90 },             // Phase 10: 7.60 → 8.50s
  },
  // Ultra-detail extended timeline (9.20s total)
  ULTRA: {
    totalDuration: 9.20,
    void: { start: 0.00, duration: 1.00 },
    presence: { start: 0.85, duration: 1.05 },
    disturbance: { start: 1.70, duration: 1.20 },
    discovery: { start: 2.70, duration: 1.20 },
    scale: { start: 3.70, duration: 1.30 },
    recognition: { start: 4.80, duration: 1.00 },
    silence: { start: 5.65, duration: 0.70 },
    secondaryDiscovery: { start: 6.20, duration: 0.85 },
    cameraEntry: { start: 6.90, duration: 0.85 },
    handover: { start: 7.55, duration: 0.95 },
    arrival: { start: 8.35, duration: 0.85 },
  },
  // Swift return visit timeline (1.50s total)
  RETURN_VISIT: {
    totalDuration: 1.50,
    void: { start: 0.00, duration: 0.15 },
    presence: { start: 0.15, duration: 0.25 },
    disturbance: { start: 0.35, duration: 0.25 },
    discovery: { start: 0.55, duration: 0.25 },
    scale: { start: 0.75, duration: 0.20 },
    recognition: { start: 0.90, duration: 0.15 },
    silence: { start: 1.00, duration: 0.10 },
    secondaryDiscovery: { start: 1.05, duration: 0.10 },
    cameraEntry: { start: 1.10, duration: 0.15 },
    handover: { start: 1.20, duration: 0.15 },
    arrival: { start: 1.30, duration: 0.20 },
  },
  // Reduced motion timeline (3.00s gentle optical breathing without camera travel)
  REDUCED_MOTION: {
    totalDuration: 3.00,
    void: { start: 0.00, duration: 0.40 },
    presence: { start: 0.40, duration: 0.50 },
    disturbance: { start: 0.85, duration: 0.50 },
    discovery: { start: 1.30, duration: 0.45 },
    scale: { start: 1.70, duration: 0.40 },
    recognition: { start: 2.05, duration: 0.35 },
    silence: { start: 2.35, duration: 0.20 },
    secondaryDiscovery: { start: 2.45, duration: 0.15 },
    cameraEntry: { start: 2.55, duration: 0.15 },
    handover: { start: 2.65, duration: 0.15 },
    arrival: { start: 2.75, duration: 0.25 },
  },
  skipTransitionDuration: 0.35,
  watchdogTimeoutMs: 11000,
  assetSoftTimeoutMs: 2000,
  assetHardTimeoutMs: 3000,
};

export const INTRO_PARTICLES: Record<QualityTier, { count: number; links: boolean; blur: boolean }> = {
  ULTRA: { count: 240, links: true, blur: true },
  HIGH: { count: 140, links: true, blur: true },
  MEDIUM: { count: 70, links: false, blur: false },
  LOW: { count: 30, links: false, blur: false },
  FALLBACK: { count: 0, links: false, blur: false },
};

export const INTRO_COLORS = {
  voidBg: '#030306',
  goldPrimary: 'rgba(229, 169, 60, ', // Gravitational Gold
  goldHex: '#E5A93C',
  violetSpectral: 'rgba(139, 92, 246, ', // Spectral support
  violetHex: '#8B5CF6',
  cyanSpectral: 'rgba(6, 182, 212, ', // Starlight cyan
  cyanHex: '#06B6D4',
  starlightWhite: 'rgba(244, 244, 245, ',
  whiteHex: '#F4F4F5',
  ambientHaze: 'rgba(22, 19, 32, 0.85)',
};
