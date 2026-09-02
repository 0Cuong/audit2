// ============================================================================
// INTRO SIGNAL EMITTER
// The Source: Escalating gravitational pulses, environmental dust displacement & persistent light
// ============================================================================

export interface SignalWave {
  radius: number;
  maxRadius: number;
  speed: number;
  alpha: number;
  lineWidth: number;
  color: string;
  isPulsar?: boolean;
}

export class IntroSignalEmitter {
  public x = 0;
  public y = 0;
  public energy = 0; // 0 to 1
  public pulsePhase = 0;
  public coreSize = 2;
  public coreAlpha = 0;
  private waves: SignalWave[] = [];
  private lastWaveTime = 0;

  public init(centerX: number, centerY: number): void {
    this.x = centerX;
    this.y = centerY;
    this.energy = 0;
    this.pulsePhase = 0;
    this.coreAlpha = 0;
    this.waves = [];
    this.lastWaveTime = 0;
  }

  public resize(centerX: number, centerY: number): void {
    this.x = centerX;
    this.y = centerY;
  }

  public update(
    time: number,
    dt: number,
    _progress: number,
    state: string,
    isPulsarSeed: boolean,
    sourceLight: { x: number; y: number; z: number; intensity: number; scale: number }
  ): void {
    const timeScale = dt * 60;
    this.pulsePhase += 0.035 * timeScale;

    // Apply continuous source light coordinates and intensity
    this.coreAlpha = sourceLight.intensity;
    this.coreSize = (2 + this.energy * 2.5) * sourceLight.scale;

    if (state === 'PRESENCE' || state === 'DISTURBANCE') {
      this.energy = Math.min(1, this.energy + 0.015 * timeScale);

      // Escalating pulse frequency
      const waveInterval = state === 'DISTURBANCE' ? 0.65 : 0.95;
      if (time - this.lastWaveTime > waveInterval && this.waves.length < 5) {
        this.lastWaveTime = time;
        this.waves.push({
          radius: 3,
          maxRadius: Math.max(window.innerWidth, window.innerHeight) * 0.75,
          speed: 2.2 + this.energy * 3.0,
          alpha: 0.75,
          lineWidth: 1.0,
          color: 'rgba(229, 169, 60, ',
        });

        // Rare Seed Pulsar effect
        if (isPulsarSeed && state === 'DISTURBANCE') {
          this.waves.push({
            radius: 5,
            maxRadius: Math.max(window.innerWidth, window.innerHeight) * 0.9,
            speed: 4.5,
            alpha: 0.55,
            lineWidth: 0.75,
            color: 'rgba(139, 92, 246, ',
            isPulsar: true,
          });
        }
      }
    }

    // Update expanding spatial waves
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const w = this.waves[i];
      w.radius += w.speed * timeScale;
      const lifeRatio = w.radius / w.maxRadius;
      w.alpha = Math.max(0, 0.75 * Math.pow(1 - lifeRatio, 1.8));

      if (w.radius >= w.maxRadius || w.alpha <= 0.005) {
        this.waves.splice(i, 1);
      }
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    sourceLightPos: { x: number; y: number }
  ): void {
    if (this.coreAlpha <= 0 && this.waves.length === 0) return;

    const renderX = this.x + sourceLightPos.x - camX * 0.3;
    const renderY = this.y + sourceLightPos.y - camY * 0.3;

    // 1. Expanding Gravitational Wavefronts
    for (let i = 0; i < this.waves.length; i++) {
      const w = this.waves[i];
      ctx.beginPath();
      ctx.arc(this.x, this.y, w.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `${w.color}${w.alpha.toFixed(3)})`;
      ctx.lineWidth = w.lineWidth;
      ctx.stroke();

      if (w.isPulsar) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, w.radius * 0.95, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(6, 182, 212, ${(w.alpha * 0.4).toFixed(3)})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    // 2. The Source Core & Atmosphere (Never completely extinguished)
    if (this.coreAlpha > 0.01) {
      const glowRadius = this.coreSize * 10;
      const grad = ctx.createRadialGradient(renderX, renderY, 0, renderX, renderY, glowRadius);
      grad.addColorStop(0, `rgba(255, 255, 255, ${this.coreAlpha.toFixed(3)})`);
      grad.addColorStop(0.18, `rgba(229, 169, 60, ${(this.coreAlpha * 0.85).toFixed(3)})`);
      grad.addColorStop(0.55, `rgba(139, 92, 246, ${(this.coreAlpha * 0.2).toFixed(3)})`);
      grad.addColorStop(1, 'rgba(3, 3, 6, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(renderX, renderY, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // Sharp pinpoint white center
      ctx.beginPath();
      ctx.arc(renderX, renderY, Math.max(1, this.coreSize * 0.4), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${this.coreAlpha.toFixed(3)})`;
      ctx.fill();
    }
  }
}
