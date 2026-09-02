import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  baseAlpha: number;
  orbitRadius: number;
  orbitAngle: number;
  orbitSpeed: number;
  color: string;
}

export default function GravitationalCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Mouse coordinates with smoothing
    const mouse = {
      x: width * 0.5,
      y: height * 0.4,
      targetX: width * 0.5,
      targetY: height * 0.4,
      radius: 180,
      active: false,
    };

    // Responsive particle count (sparse, intentional)
    const particleCount = width < 768 ? 32 : 68;
    const particles: Particle[] = [];

    // Colors: Obsidian, Gravitational Gold, Hyper Violet, Cosmic Cyan
    const colors = [
      'rgba(229, 169, 60, ', // Gravitational Gold (dominant)
      'rgba(229, 169, 60, ',
      'rgba(229, 169, 60, ',
      'rgba(139, 92, 246, ', // Hyper Violet (spectral supporting)
      'rgba(6, 182, 212, ',  // Cyber Cyan (tertiary)
      'rgba(240, 246, 252, ', // Starlight
    ];

    const centerX = width * 0.5;
    const centerY = height * 0.45;

    // Initialize particles in subtle orbital / gravitational field
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 60 + Math.pow(Math.random(), 1.5) * (Math.max(width, height) * 0.5);
      const px = centerX + Math.cos(angle) * dist;
      const py = centerY + Math.sin(angle) * dist * 0.6;

      const baseAlpha = 0.15 + Math.random() * 0.45;
      particles.push({
        x: px,
        y: py,
        baseX: px,
        baseY: py,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        size: 0.8 + Math.random() * 1.6,
        alpha: baseAlpha,
        baseAlpha,
        orbitRadius: dist,
        orbitAngle: angle,
        orbitSpeed: (0.0003 + Math.random() * 0.0006) * (Math.random() > 0.5 ? 1 : -1),
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    // Render loop
    let time = 0;

    const render = () => {
      time += 0.008;

      // Mouse smoothing
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      const focalX = width * 0.5;
      const focalY = height * 0.42;

      // 1. Central Subtle Gravitational Lens / Accretion Glow (Subdued, physically inspired)
      const accretionRadius = Math.min(width, height) * 0.35;
      const lensGrad = ctx.createRadialGradient(
        focalX,
        focalY,
        accretionRadius * 0.05,
        focalX,
        focalY,
        accretionRadius
      );
      lensGrad.addColorStop(0, 'rgba(3, 3, 6, 0.95)'); // Void Core
      lensGrad.addColorStop(0.25, 'rgba(229, 169, 60, 0.04)'); // Gold horizon
      lensGrad.addColorStop(0.65, 'rgba(139, 92, 246, 0.02)'); // Violet dispersion
      lensGrad.addColorStop(1, 'rgba(3, 3, 6, 0)');

      ctx.fillStyle = lensGrad;
      ctx.beginPath();
      ctx.arc(focalX, focalY, accretionRadius, 0, Math.PI * 2);
      ctx.fill();

      // 2. Faint Gravitational Elliptical Ring (Accretion plane)
      ctx.save();
      ctx.translate(focalX, focalY);
      ctx.rotate(-0.2);
      ctx.beginPath();
      ctx.ellipse(0, 0, accretionRadius * 0.85, accretionRadius * 0.22, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(229, 169, 60, 0.04)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Inner faint ring
      ctx.beginPath();
      ctx.ellipse(0, 0, accretionRadius * 0.55, accretionRadius * 0.14, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.03)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // 3. Render Particles with Gravitational Drift and Gentle Cursor Attraction
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          // Slow orbital motion
          p.orbitAngle += p.orbitSpeed;
          const targetX = focalX + Math.cos(p.orbitAngle) * p.orbitRadius;
          const targetY = focalY + Math.sin(p.orbitAngle) * p.orbitRadius * 0.55;

          p.x += (targetX - p.x) * 0.02 + p.vx;
          p.y += (targetY - p.y) * 0.02 + p.vy;

          // Subtle cursor gravitational deflection (damped, no chaotic pull)
          if (mouse.active) {
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < mouse.radius && dist > 10) {
              const force = (1 - dist / mouse.radius) * 0.35;
              p.x += (dx / dist) * force;
              p.y += (dy / dist) * force;
              p.alpha = Math.min(p.baseAlpha * 1.5, 0.85);
            } else {
              p.alpha += (p.baseAlpha - p.alpha) * 0.02;
            }
          }
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha})`;
        ctx.fill();

        // Subtle soft glow on selected larger particles
        if (p.size > 1.4) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${p.alpha * 0.18})`;
          ctx.fill();
        }
      }

      // Draw faint connections between nearby cosmic particles (sparse, restrained)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < 110 * 110) {
            const lineAlpha = (1 - Math.sqrt(distSq) / 110) * 0.06;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(229, 169, 60, ${lineAlpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#030306]">
      {/* Precision Deep Cosmic Gradient Background */}
      <div 
        className="absolute inset-0 opacity-80"
        style={{
          background: `
            radial-gradient(ellipse 90% 70% at 50% 25%, rgba(20, 18, 30, 0.7) 0%, rgba(3, 3, 6, 0.95) 75%),
            radial-gradient(circle at 15% 85%, rgba(139, 92, 246, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 85% 85%, rgba(229, 169, 60, 0.04) 0%, transparent 50%)
          `
        }}
      />
      
      {/* High-Performance Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block opacity-90"
      />

      {/* Subtle Optical Vignette to anchor depth */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(3, 3, 6, 0.75) 100%)'
        }}
      />
    </div>
  );
}
