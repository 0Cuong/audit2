import { useEffect, useRef } from 'react';
import { usePersonalization } from '../../contexts/PersonalizationContext';

interface WorldParticle {
  x: number;
  y: number;
  z: number; // 3D depth layer (0 to 1)
  baseX: number;
  baseY: number;
  baseZ: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  baseAlpha: number;
  orbitAngle: number;
  orbitRadius: number;
  orbitSpeed: number;
  color: string;
}

export default function CinematicWorldEngine() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { background, appearance } = usePersonalization();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Virtual Camera & Spatial Pointer Coordinates
    const camera = {
      x: width * 0.5,
      y: height * 0.45,
      targetX: width * 0.5,
      targetY: height * 0.45,
      scrollProgress: 0,
      targetScrollProgress: 0,
      zoom: 1,
      pitch: 0,
      yaw: 0,
    };

    const pointer = {
      x: width * 0.5,
      y: height * 0.45,
      targetX: width * 0.5,
      targetY: height * 0.45,
      active: false,
      influenceRadius: 200,
    };

    // Responsive, sparse particle density
    const particleCount = width < 768 ? 40 : 85;
    const particles: WorldParticle[] = [];

    const colorPalette = [
      'rgba(229, 169, 60, ',   // Gravitational Gold (Primary Anchor)
      'rgba(229, 169, 60, ',
      'rgba(229, 169, 60, ',
      'rgba(139, 92, 246, ',   // Hyper Violet (Spectral Support)
      'rgba(6, 182, 212, ',    // Cyber Cyan (Spectral Support)
      'rgba(244, 244, 245, ',  // Starlight White
    ];

    const centerX = width * 0.5;
    const centerY = height * 0.45;

    // Initialize 3D Depth Particle Field
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const depth = Math.random(); // 0 (far) to 1 (near)
      const dist = 50 + Math.pow(Math.random(), 1.4) * (Math.max(width, height) * 0.55);

      const px = centerX + Math.cos(angle) * dist;
      const py = centerY + Math.sin(angle) * dist * 0.6;
      const baseAlpha = 0.12 + Math.random() * 0.45;

      particles.push({
        x: px,
        y: py,
        z: depth,
        baseX: px,
        baseY: py,
        baseZ: depth,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        size: 0.75 + depth * 1.5,
        alpha: baseAlpha,
        baseAlpha,
        orbitAngle: angle,
        orbitRadius: dist,
        orbitSpeed: (0.00025 + Math.random() * 0.0005) * (Math.random() > 0.5 ? 1 : -1),
        color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
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

    // Pointer influence (User as Camera)
    const handleMouseMove = (e: MouseEvent) => {
      pointer.targetX = e.clientX;
      pointer.targetY = e.clientY;
      pointer.active = true;

      // Virtual Camera Pitch & Yaw mapping
      camera.targetX = width * 0.5 + (e.clientX - width * 0.5) * 0.04;
      camera.targetY = height * 0.45 + (e.clientY - height * 0.45) * 0.04;
    };

    const handleMouseLeave = () => {
      pointer.active = false;
      camera.targetX = width * 0.5;
      camera.targetY = height * 0.45;
    };

    // Scroll as 4D Time & Camera Depth
    const handleScroll = () => {
      const maxScroll = Math.max(document.body.scrollHeight - window.innerHeight, 1);
      camera.targetScrollProgress = window.scrollY / maxScroll;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    handleScroll();

    let time = 0;

    const render = () => {
      // If Cinematic Intro is actively rendering in foreground, pause background drawing to eliminate GPU competition
      if (typeof window !== 'undefined' && window.__CUONGISME_INTRO_ACTIVE) {
        if (!prefersReducedMotion) {
          animationFrameId = requestAnimationFrame(render);
        }
        return;
      }

      time += 0.006;

      // Smooth camera and pointer inertia
      camera.x += (camera.targetX - camera.x) * 0.04;
      camera.y += (camera.targetY - camera.y) * 0.04;
      camera.scrollProgress += (camera.targetScrollProgress - camera.scrollProgress) * 0.06;

      pointer.x += (pointer.targetX - pointer.x) * 0.06;
      pointer.y += (pointer.targetY - pointer.y) * 0.06;

      ctx.clearRect(0, 0, width, height);

      const focalX = camera.x;
      const focalY = camera.y + camera.scrollProgress * 20;

      // 1. Central Subtle Gravitational Lens & Horizon Falloff (Restrained Obsidian Void)
      const accretionRadius = Math.min(width, height) * (0.35 + camera.scrollProgress * 0.08);
      const lensGrad = ctx.createRadialGradient(
        focalX,
        focalY,
        accretionRadius * 0.05,
        focalX,
        focalY,
        accretionRadius
      );

      lensGrad.addColorStop(0, 'rgba(3, 3, 6, 0.96)'); // Void Horizon
      lensGrad.addColorStop(0.28, 'rgba(229, 169, 60, 0.035)'); // Gravitational Gold Rim
      lensGrad.addColorStop(0.65, 'rgba(139, 92, 246, 0.015)'); // Subtle Violet Dispersion
      lensGrad.addColorStop(1, 'rgba(3, 3, 6, 0)');

      ctx.fillStyle = lensGrad;
      ctx.beginPath();
      ctx.arc(focalX, focalY, accretionRadius, 0, Math.PI * 2);
      ctx.fill();

      // 2. Faint Gravitational Accretion Plane Line
      ctx.save();
      ctx.translate(focalX, focalY);
      ctx.rotate(-0.15 + camera.scrollProgress * 0.1);
      ctx.beginPath();
      ctx.ellipse(0, 0, accretionRadius * 0.82, accretionRadius * 0.2, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(229, 169, 60, 0.03)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // 3. Render 3D Spatial Particles with Scroll-Linked Depth Parallax
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          p.orbitAngle += p.orbitSpeed;

          // Scroll depth push (4D Time: forward in Z)
          const depthOffset = camera.scrollProgress * (p.z * 60);
          const targetX = focalX + Math.cos(p.orbitAngle) * (p.orbitRadius + depthOffset);
          const targetY = focalY + Math.sin(p.orbitAngle) * (p.orbitRadius * 0.55 + depthOffset * 0.5);

          p.x += (targetX - p.x) * 0.02 + p.vx;
          p.y += (targetY - p.y) * 0.02 + p.vy;

          // Subtle pointer gravitational attraction
          if (pointer.active) {
            const dx = pointer.x - p.x;
            const dy = pointer.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < pointer.influenceRadius && dist > 12) {
              const force = (1 - dist / pointer.influenceRadius) * 0.3 * (0.5 + p.z * 0.5);
              p.x += (dx / dist) * force;
              p.y += (dy / dist) * force;
              p.alpha = Math.min(p.baseAlpha * 1.6, 0.85);
            } else {
              p.alpha += (p.baseAlpha - p.alpha) * 0.02;
            }
          }
        }

        // Draw physical particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha})`;
        ctx.fill();

        // Atmospheric halo on near particles
        if (p.z > 0.75) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${p.alpha * 0.15})`;
          ctx.fill();
        }
      }

      // 4. Sparse Atmospheric Resonance Links
      for (let i = 0; i < particles.length; i += 2) {
        for (let j = i + 1; j < particles.length; j += 3) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < 100 * 100) {
            const lineAlpha = (1 - Math.sqrt(distSq) / 100) * 0.04 * ((p1.z + p2.z) * 0.5);
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
      window.removeEventListener('scroll', handleScroll);
    };
  }, [appearance, background]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#030306]">
      {/* Precision Deep Cosmic Gradient Floor */}
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background: `
            radial-gradient(ellipse 90% 70% at 50% 20%, rgba(22, 19, 32, 0.75) 0%, rgba(3, 3, 6, 0.98) 75%),
            radial-gradient(circle at 12% 85%, rgba(139, 92, 246, 0.025) 0%, transparent 50%),
            radial-gradient(circle at 88% 85%, rgba(229, 169, 60, 0.035) 0%, transparent 50%)
          `,
        }}
      />

      {/* 3D World Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block opacity-95"
      />

      {/* Cinematic Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 35%, rgba(3, 3, 6, 0.8) 100%)',
        }}
      />
    </div>
  );
}
