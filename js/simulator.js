/**
 * simulator.js — Main orchestrator
 * Connects Physics ↔ Canvas ↔ UI ↔ Charts ↔ I18n
 * Entry point: Simulator.init() called on DOMContentLoaded
 */

const Simulator = (() => {
  let _data = null;   // last Physics.compute() result

  function init() {
    // 1. Particles background
    const particleCanvas = document.getElementById('particle-canvas');
    if (particleCanvas) Particles.init(particleCanvas);

    // 2. Main canvas
    const mainCanvas = document.getElementById('main-canvas');
    if (mainCanvas) ComptonCanvas.init(mainCanvas);

    // 3. UI controls — fires _onParamChange on every slider/preset change
    UI.init(_onParamChange);

    // 4. Charts (after Chart.js lib is loaded)
    Charts.init();

    // 5. Language toggle button
    document.getElementById('lang-btn')?.addEventListener('click', () => {
      I18n.toggleLanguage();
    });

    // 6. Re-apply translations on lang change
    document.addEventListener('langchange', () => {
      I18n.applyToDOM();
      Charts.rebuildLabels();
      _refreshResultLabels();
    });

    // 7. Smooth scroll for anchor nav links
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', e => {
        const target = document.querySelector(link.getAttribute('href'));
        if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
      });
    });

    // 8. Fire initial calculation with defaults
    _onParamChange(UI.getLambda(), UI.getTheta());

    // 9. Handle canvas resize
    window.addEventListener('resize', () => ComptonCanvas.resize());

    // 10. Reset canvas state when sliders change mid-animation
    document.getElementById('slider-theta')?.addEventListener('input', _softReset);
    document.getElementById('slider-lambda')?.addEventListener('input', _softReset);
  }

  /**
   * Called whenever λ₀ or θ changes.
   * Computes physics, updates UI, feeds canvas + charts.
   */
  function _onParamChange(lambda_pm, theta_deg) {
    _data = Physics.compute(lambda_pm, theta_deg);
    ComptonCanvas.setPhysicsData(_data);
    UI.updateResults(_data);
    Charts.update(theta_deg, _data.E0_keV);
  }

  /**
   * If animation is playing/done and user changes a param,
   * do a soft reset so the new params take effect.
   */
  function _softReset() {
    const s = ComptonCanvas.getState();
    if (s === ComptonCanvas.STATE.DONE ||
        s === ComptonCanvas.STATE.SCATTER ||
        s === ComptonCanvas.STATE.COLLISION) {
      ComptonCanvas.reset();
    }
  }

  function _refreshResultLabels() {
    if (_data) UI.updateResults(_data);
  }

  return { init };
})();

// ── Bootstrap ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', Simulator.init);
