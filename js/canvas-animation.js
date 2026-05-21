/**
 * canvas-animation.js — Main Compton Effect simulation renderer
 *
 * States:
 *   IDLE       → Shows electron at rest with idle photon beam
 *   APPROACH   → Photon travels toward electron
 *   COLLISION  → Impact flash + short freeze
 *   SCATTER    → Scattered photon and recoil electron diverge
 *   DONE       → Final static result with labels
 *
 * Dependencies: physics.js, i18n.js
 */

const ComptonCanvas = (() => {
  // ── State machine ──────────────────────────────────────────────────────────
  const STATE = { IDLE: 0, APPROACH: 1, COLLISION: 2, SCATTER: 3, DONE: 4 };

  // ── Module state ───────────────────────────────────────────────────────────
  let canvas, ctx;
  let state       = STATE.IDLE;
  let animId      = null;
  let phase       = 0;          // wave phase (animation tick)
  let progress    = 0;          // 0→1 per sub-state
  let speedFactor = 1;
  let physicsData = null;       // current Physics.compute() result
  let showVectors = true;
  let showWaves   = true;
  let showAngles  = true;
  let stepMode    = false;
  let stepPending = false;

  // Layout geometry (set in resize)
  let W, H, CX, CY;

  // ── Colors ─────────────────────────────────────────────────────────────────
  const COL = {
    photon_in:  '#00f0ff',
    photon_out: '#9b59ff',   // shifts toward violet (longer λ)
    electron:   '#ffcc00',
    momentum:   '#ff00aa',
    angle_arc:  'rgba(255,255,255,0.35)',
    label:      '#e0e0e0',
    glow_in:    'rgba(0, 240, 255, 0.15)',
    glow_out:   'rgba(155, 89, 255, 0.15)',
    glow_e:     'rgba(255, 204, 0, 0.25)',
    collision:  '#ffffff',
  };

  // ── Public init ────────────────────────────────────────────────────────────
  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    drawIdleState();
  }

  function resize() {
    if (!canvas) return;
    W = canvas.offsetWidth  || 800;
    H = canvas.offsetHeight || 450;
    canvas.width  = W;
    canvas.height = H;
    CX = W / 2;
    CY = H / 2;
  }

  // ── Public controls ────────────────────────────────────────────────────────
  function setPhysicsData(data)   { physicsData = data; }
  function setSpeed(s)            { speedFactor = Math.max(0.25, Math.min(3, s)); }
  function setShowVectors(v)      { showVectors = v; }
  function setShowWaves(v)        { showWaves = v; }
  function setShowAngles(v)       { showAngles = v; }

  function play() {
    if (state === STATE.DONE) reset();
    stepMode = false;
    if (state === STATE.IDLE) {
      state = STATE.APPROACH;
      progress = 0;
    }
    cancelAnimationFrame(animId);
    loop();
  }

  function pause() {
    cancelAnimationFrame(animId);
    animId = null;
  }

  function reset() {
    cancelAnimationFrame(animId);
    animId = null;
    state = STATE.IDLE;
    progress = 0;
    phase = 0;
    drawIdleState();
  }

  function step() {
    stepMode = true;
    if (state === STATE.IDLE)   { state = STATE.APPROACH; progress = 0; }
    else if (state === STATE.APPROACH)  advanceState();
    else if (state === STATE.COLLISION) advanceState();
    else if (state === STATE.SCATTER)   advanceState();
    cancelAnimationFrame(animId);
    loop();          // Run one frame then pause automatically in step mode
  }

  // ── Main animation loop ────────────────────────────────────────────────────
  function loop() {
    tick();
    if (state !== STATE.DONE) {
      animId = requestAnimationFrame(loop);
    } else {
      drawDoneState();
    }
  }

  function tick() {
    const dt = 0.012 * speedFactor;
    ctx.clearRect(0, 0, W, H);
    phase += 0.08 * speedFactor;

    switch (state) {
      case STATE.IDLE:      drawIdleState(); break;
      case STATE.APPROACH:  drawApproach(dt); break;
      case STATE.COLLISION: drawCollision(dt); break;
      case STATE.SCATTER:   drawScatter(dt); break;
      case STATE.DONE:      drawDoneState(); break;
    }

    if (stepMode && state !== STATE.IDLE) pause();
  }

  function advanceState() {
    progress = 0;
    state++;
    if (state > STATE.DONE) state = STATE.DONE;
  }

  // ── Drawing: IDLE ──────────────────────────────────────────────────────────
  function drawIdleState() {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    // Electron at center
    drawElectronGlow(CX, CY, 0.5 + 0.3 * Math.sin(phase * 0.5));

    // Faint incoming photon wave on the left side
    if (physicsData) {
      const waveLen = wavelengthToPx(physicsData.lambda0_pm);
      drawWave(80, CX - 80, CY, waveLen, phase, COL.photon_in, 0.45);
    }

    // Idle label
    ctx.save();
    ctx.font = `14px 'Inter', sans-serif`;
    ctx.fillStyle = 'rgba(200,200,200,0.5)';
    ctx.textAlign = 'center';
    ctx.fillText(I18n.t('canvas_idle'), CX, H - 24);
    ctx.restore();
  }

  // ── Drawing: APPROACH ─────────────────────────────────────────────────────
  function drawApproach(dt) {
    progress = Math.min(1, progress + dt * 0.6);

    // Photon travels from left edge to just left of electron
    const startX = 40;
    const endX   = CX - 55;
    const currentX = startX + (endX - startX) * easeInOut(progress);
    const waveLen  = physicsData ? wavelengthToPx(physicsData.lambda0_pm) : 30;

    // Draw wave behind photon head
    drawWave(startX, currentX, CY, waveLen, phase, COL.photon_in, 0.85);

    // Photon head glow
    drawPhotonHead(currentX, CY, COL.photon_in);

    // Label
    drawLabel(I18n.t('canvas_photon_in'), startX + 60, CY - 30, COL.photon_in);

    // Electron waiting
    drawElectronGlow(CX, CY, 1);

    if (progress >= 1) advanceState();
  }

  // ── Drawing: COLLISION ────────────────────────────────────────────────────
  function drawCollision(dt) {
    progress = Math.min(1, progress + dt * 1.2);
    const flash = 1 - progress;

    // Expanding shockwave ring
    const r = 18 + progress * 90;
    ctx.beginPath();
    ctx.arc(CX, CY, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,255,255,${flash * 0.9})`;
    ctx.lineWidth = 3 - progress * 2.5;
    ctx.stroke();

    // Second ring (slightly delayed)
    if (progress > 0.2) {
      const r2 = 18 + (progress - 0.2) * 70;
      ctx.beginPath();
      ctx.arc(CX, CY, r2, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0,240,255,${(1 - progress) * 0.7})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Flash at center
    const flashGrd = ctx.createRadialGradient(CX, CY, 0, CX, CY, 55 * flash + 10);
    flashGrd.addColorStop(0, `rgba(255,255,255,${flash})`);
    flashGrd.addColorStop(0.4, `rgba(0,240,255,${flash * 0.6})`);
    flashGrd.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(CX, CY, 55 * flash + 10, 0, Math.PI * 2);
    ctx.fillStyle = flashGrd;
    ctx.fill();

    // Electron under flash
    drawElectronGlow(CX, CY, 1);

    if (progress >= 1) advanceState();
  }

  // ── Drawing: SCATTER ──────────────────────────────────────────────────────
  function drawScatter(dt) {
    progress = Math.min(1, progress + dt * 0.45);
    if (!physicsData) { advanceState(); return; }

    const { theta_deg, phi_deg, lambda0_pm, lambda1_pm } = physicsData;
    const theta_rad = (theta_deg * Math.PI) / 180;
    const phi_rad   = (phi_deg   * Math.PI) / 180;

    const travelDist = 220 * easeInOut(progress);

    // ── Scattered photon ───────────────────────────────────────────────────
    const pxEnd  = CX + travelDist * Math.cos(-theta_rad);
    const pyEnd  = CY + travelDist * Math.sin(-theta_rad);
    const waveOut = wavelengthToPx(lambda1_pm);
    const waveIn  = wavelengthToPx(lambda0_pm);

    // Keep a faded residue of incident beam (dissipating)
    const residueFade = Math.max(0, 1 - progress * 3);
    if (residueFade > 0) {
      drawWave(40, CX - 55, CY, waveIn, phase, COL.photon_in, residueFade * 0.4);
    }

    // Scattered photon color shifts between cyan and violet depending on Δλ
    const colorOut = interpolateColor(COL.photon_in, COL.photon_out,
      Math.min(1, (lambda1_pm - lambda0_pm) / 5));

    drawWave(CX, pxEnd, pyEnd, waveOut, phase, colorOut, 0.9, theta_rad * -1);
    drawPhotonHead(pxEnd, pyEnd, colorOut);
    drawLabel(I18n.t('canvas_photon_out'), pxEnd + 14, pyEnd - 14, colorOut);

    // ── Recoil electron ───────────────────────────────────────────────────
    const exEnd = CX + travelDist * 0.55 * Math.cos(phi_rad);
    const eyEnd = CY + travelDist * 0.55 * Math.sin(phi_rad);

    // Electron trail
    const steps = 12;
    for (let i = steps; i >= 1; i--) {
      const frac = (i / steps) * progress;
      const tx = CX + travelDist * 0.55 * easeInOut(frac) * Math.cos(phi_rad);
      const ty = CY + travelDist * 0.55 * easeInOut(frac) * Math.sin(phi_rad);
      ctx.beginPath();
      ctx.arc(tx, ty, 5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,204,0,${(i / steps) * 0.15})`;
      ctx.fill();
    }

    drawElectronGlow(exEnd, eyEnd, 1);
    drawLabel(I18n.t('canvas_e_recoil'), exEnd + 14, eyEnd + 18, COL.electron);

    // ── Momentum vectors ──────────────────────────────────────────────────
    if (showVectors && progress > 0.3) {
      const vAlpha = Math.min(1, (progress - 0.3) / 0.4);
      const vLen = 60;
      // Incident (faint, pointing right from origin)
      drawArrow(CX - 100, CY, CX - 100 + vLen, CY, COL.photon_in, `Momentum arrows`, vAlpha * 0.5, 'p₀');
      // Scattered photon momentum
      drawArrow(
        CX - 100, CY,
        CX - 100 + vLen * Math.cos(-theta_rad),
        CY + vLen * Math.sin(-theta_rad),
        colorOut, '', vAlpha, "p'γ"
      );
      // Electron momentum
      drawArrow(
        CX - 100, CY,
        CX - 100 + (vLen * 0.6) * Math.cos(phi_rad),
        CY + (vLen * 0.6) * Math.sin(phi_rad),
        COL.electron, '', vAlpha, 'pₑ'
      );
    }

    // ── Angle arcs ────────────────────────────────────────────────────────
    if (showAngles && progress > 0.5) {
      const aAlpha = Math.min(1, (progress - 0.5) / 0.4);
      drawAngleArc(CX, CY, 50, 0, -theta_rad, COL.angle_arc, aAlpha,
        I18n.t('canvas_theta_lbl'), theta_deg);
      if (phi_deg > 1) {
        drawAngleArc(CX, CY, 38, 0, phi_rad, 'rgba(255,204,0,0.4)', aAlpha,
          I18n.t('canvas_phi_lbl'), phi_deg);
      }
    }

    // ── Wave comparison ───────────────────────────────────────────────────
    if (showWaves && progress > 0.6) {
      const wAlpha = Math.min(1, (progress - 0.6) / 0.35);
      drawWaveComparison(wAlpha, lambda0_pm, lambda1_pm);
    }

    if (progress >= 1) advanceState();
  }

  // ── Drawing: DONE ─────────────────────────────────────────────────────────
  function drawDoneState() {
    // Just redraw scatter at progress=1
    const savedProgress = progress;
    progress = 1;
    ctx.clearRect(0, 0, W, H);
    drawScatter(0);
    progress = savedProgress;
  }

  // ── Drawing helpers ────────────────────────────────────────────────────────
  function drawElectronGlow(x, y, pulse) {
    const r = 14;
    // Outer glow
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r * 3.5);
    grd.addColorStop(0, `rgba(255,204,0,${0.35 * pulse})`);
    grd.addColorStop(0.5, `rgba(255,160,0,${0.12 * pulse})`);
    grd.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(x, y, r * 3.5, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    // Core sphere
    const sph = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
    sph.addColorStop(0, '#fff7d6');
    sph.addColorStop(0.5, COL.electron);
    sph.addColorStop(1,   '#996600');
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = sph;
    ctx.fill();

    // Label "e⁻"
    ctx.font = `bold 11px 'Inter', sans-serif`;
    ctx.fillStyle = '#1a1a1a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('e⁻', x, y);
    ctx.textBaseline = 'alphabetic';
  }

  function drawPhotonHead(x, y, color) {
    const grd = ctx.createRadialGradient(x, y, 0, x, y, 12);
    grd.addColorStop(0, color);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();
  }

  /**
   * Draw a sinusoidal wave from an origin point along a rotated axis.
   * For horizontal beams: fromX = left edge, toX = right edge, cy = y center, angleRad = 0
   * For angled beams (scattered photon): fromX/cy = origin, toX/toY = tip, angleRad = beam angle
   */
  function drawWave(fromX, toX, cy_or_toY, waveLen, ph, color, alpha, angleRad = 0) {
    let originX = fromX, originY = cy_or_toY;
    let tipX    = toX,   tipY    = cy_or_toY;
    const dist  = Math.sqrt((tipX - originX) ** 2 + (tipY - originY) ** 2);
    if (dist < 2) return;

    const amplitude = 10;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(originX, originY);
    ctx.rotate(angleRad);

    ctx.shadowColor = color;
    ctx.shadowBlur  = 14;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth   = 2;
    ctx.moveTo(0, amplitude * Math.sin(ph));
    const step = 2;
    for (let x = step; x <= dist; x += step) {
      const y = amplitude * Math.sin((x / waveLen) * Math.PI * 2 + ph);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function drawArrow(x1, y1, x2, y2, color, _label, alpha, caption) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const len   = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    if (len < 5) return;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.fillStyle   = color;
    ctx.lineWidth   = 1.5;
    ctx.shadowColor = color;
    ctx.shadowBlur  = 6;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Arrowhead
    const hw = 7, hl = 12;
    ctx.save();
    ctx.translate(x2, y2);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-hl, -hw / 2);
    ctx.lineTo(-hl,  hw / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Caption
    if (caption) {
      ctx.font = `12px 'Inter', sans-serif`;
      ctx.fillStyle = color;
      ctx.shadowBlur = 0;
      ctx.fillText(caption, x2 + 8, y2 + 4);
    }
    ctx.restore();
  }

  function drawAngleArc(cx, cy, r, startAngle, endAngle, color, alpha, label, degrees) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, endAngle, endAngle < startAngle);
    ctx.stroke();

    // Tick at both ends
    const midAngle = (startAngle + endAngle) / 2;
    const lx = cx + (r + 16) * Math.cos(midAngle);
    const ly = cy + (r + 16) * Math.sin(midAngle);
    ctx.font = `bold 13px 'Inter', sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(`${label} = ${Math.round(degrees)}°`, lx, ly);
    ctx.restore();
  }

  function drawLabel(text, x, y, color) {
    ctx.save();
    ctx.font = `13px 'Inter', sans-serif`;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur  = 6;
    ctx.textAlign   = 'left';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function drawWaveComparison(alpha, lambda0_pm, lambda1_pm) {
    const panelW = 200, panelH = 70;
    const px = W - panelW - 16;
    const py = H - panelH - 16;

    // Panel background
    ctx.save();
    ctx.globalAlpha = alpha * 0.88;
    ctx.fillStyle   = 'rgba(10,10,26,0.85)';
    ctx.strokeStyle = 'rgba(0,240,255,0.3)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.roundRect(px, py, panelW, panelH, 8);
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = alpha;

    const wl0 = Math.min(wavelengthToPx(lambda0_pm), 55);
    const wl1 = Math.min(wavelengthToPx(lambda1_pm), 55);
    const amp = 7;

    // Top wave: incident λ₀
    ctx.strokeStyle = COL.photon_in;
    ctx.lineWidth   = 1.5;
    ctx.shadowColor = COL.photon_in;
    ctx.shadowBlur  = 5;
    ctx.beginPath();
    for (let x = 0; x <= panelW - 20; x += 1) {
      const y = amp * Math.sin((x / wl0) * Math.PI * 2);
      x === 0 ? ctx.moveTo(px + 10 + x, py + 20 + y) : ctx.lineTo(px + 10 + x, py + 20 + y);
    }
    ctx.stroke();

    // Bottom wave: scattered λ'
    ctx.strokeStyle = COL.photon_out;
    ctx.shadowColor = COL.photon_out;
    ctx.beginPath();
    for (let x = 0; x <= panelW - 20; x += 1) {
      const y = amp * Math.sin((x / wl1) * Math.PI * 2);
      x === 0 ? ctx.moveTo(px + 10 + x, py + 50 + y) : ctx.lineTo(px + 10 + x, py + 50 + y);
    }
    ctx.stroke();

    // Labels
    ctx.shadowBlur  = 0;
    ctx.font        = '10px Inter, sans-serif';
    ctx.fillStyle   = COL.photon_in;
    ctx.textAlign   = 'right';
    ctx.fillText(I18n.t('canvas_wave_before'), px + panelW - 4, py + 16);
    ctx.fillStyle   = COL.photon_out;
    ctx.fillText(I18n.t('canvas_wave_after'), px + panelW - 4, py + 46);
    ctx.restore();
  }

  // ── Utilities ──────────────────────────────────────────────────────────────
  /**
   * Map wavelength (pm) to canvas pixels for wave drawing.
   * We normalize so that λ_c ≈ 2.43 pm → 20px, 50 pm → ~50px (capped)
   */
  function wavelengthToPx(lambda_pm) {
    return Math.min(80, Math.max(8, lambda_pm * 0.8));
  }

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  /**
   * Interpolate between two hex colors (#rrggbb) by factor t (0→1)
   */
  function interpolateColor(c1, c2, t) {
    const parse = hex => [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
    const [r1,g1,b1] = parse(c1);
    const [r2,g2,b2] = parse(c2);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
  }

  function getState() { return state; }
  function getStateName() {
    return Object.keys(STATE).find(k => STATE[k] === state) || 'UNKNOWN';
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  return {
    init,
    resize,
    play,
    pause,
    reset,
    step,
    setPhysicsData,
    setSpeed,
    setShowVectors,
    setShowWaves,
    setShowAngles,
    getState,
    getStateName,
    STATE,
  };
})();
