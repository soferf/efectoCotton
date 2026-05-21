/**
 * particles.js — Quantum background particle system
 * Creates an animated canvas layer of glowing floating dots
 * behind the main simulation area.
 */

const Particles = (() => {
  let canvas, ctx, particles = [], animId;
  const COUNT = 80;

  const COLORS = [
    'rgba(0, 240, 255, ',   // cyan
    'rgba(180, 0, 255, ',   // violet
    'rgba(255, 204, 0, ',   // gold
    'rgba(255, 0, 170, ',   // magenta
  ];

  function createParticle(w, h) {
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 2 + 0.5,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      alpha: Math.random() * 0.5 + 0.1,
      alphaDir: Math.random() > 0.5 ? 1 : -1,
      alphaSpeed: Math.random() * 0.004 + 0.001,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
  }

  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    resize();
    particles = Array.from({ length: COUNT }, () =>
      createParticle(canvas.width, canvas.height)
    );
    window.addEventListener('resize', resize);
    loop();
  }

  function resize() {
    if (!canvas) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width  = rect.width  || window.innerWidth;
    canvas.height = rect.height || window.innerHeight;
  }

  function loop() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const W = canvas.width, H = canvas.height;

    particles.forEach(p => {
      // Move
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10;
      if (p.y > H + 10) p.y = -10;

      // Pulse alpha
      p.alpha += p.alphaSpeed * p.alphaDir;
      if (p.alpha > 0.6 || p.alpha < 0.05) p.alphaDir *= -1;

      // Draw glowing dot
      const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      grd.addColorStop(0, p.color + (p.alpha) + ')');
      grd.addColorStop(1, p.color + '0)');

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Solid core
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + (p.alpha * 0.9) + ')';
      ctx.fill();
    });

    animId = requestAnimationFrame(loop);
  }

  function destroy() {
    cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
  }

  return { init, destroy };
})();
