/**
 * ui.js — UI controls, sliders, presets, result panel updates
 * Dependencies: physics.js, i18n.js, canvas-animation.js
 */

const UI = (() => {
  // Current simulation parameters
  let _lambda_pm = 10.0;
  let _theta_deg = 90;
  let _speed     = 1;
  let _onParamChange = null;   // callback(lambda_pm, theta_deg)

  // ── Init ────────────────────────────────────────────────────────────────────
  function init(onParamChangeCb) {
    _onParamChange = onParamChangeCb;
    _initPresets();
    _initSliders();
    _initToggles();
    _initButtons();
  }

  // ── Presets ─────────────────────────────────────────────────────────────────
  function _initPresets() {
    const presetBtns = document.querySelectorAll('.preset-btn');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const key = btn.dataset.preset;
        const preset = Physics.PRESETS[key];
        if (preset && preset.lambda_pm !== null) {
          setLambda(preset.lambda_pm);
        }
        // Update description
        const descEl = document.getElementById('preset-desc');
        if (descEl) descEl.textContent = I18n.t(`desc_${key.replace('_', '_').replace('xray_medical','xray_m').replace('xray_hard','xray_h').replace('gamma_co60','gamma_co').replace('gamma_cs137','gamma_cs')}`);
      });
    });
  }

  // ── Sliders ──────────────────────────────────────────────────────────────────
  function _initSliders() {
    // λ₀ slider (log scale: 0.1 pm → 100 pm)
    const lambdaSlider = document.getElementById('slider-lambda');
    const lambdaDisplay = document.getElementById('val-lambda');

    lambdaSlider.addEventListener('input', () => {
      // Slider value 0→1000 → log map to 0.1pm→100pm
      const logMin = Math.log10(0.1), logMax = Math.log10(100);
      const logVal = logMin + (lambdaSlider.value / 1000) * (logMax - logMin);
      _lambda_pm = Math.pow(10, logVal);
      if (lambdaDisplay) lambdaDisplay.textContent = Physics.formatWavelength(_lambda_pm, 3);
      // Mark custom preset
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      document.querySelector('[data-preset="custom"]')?.classList.add('active');
      _fireChange();
    });

    // θ slider (0→180 directly)
    const thetaSlider = document.getElementById('slider-theta');
    const thetaDisplay = document.getElementById('val-theta');

    thetaSlider.addEventListener('input', () => {
      _theta_deg = parseInt(thetaSlider.value);
      if (thetaDisplay) thetaDisplay.textContent = `${_theta_deg}°`;
      _fireChange();
    });

    // Speed slider
    const speedSlider = document.getElementById('slider-speed');
    const speedDisplay = document.getElementById('val-speed');

    speedSlider.addEventListener('input', () => {
      _speed = parseFloat(speedSlider.value);
      if (speedDisplay) speedDisplay.textContent = `${_speed.toFixed(1)}×`;
      ComptonCanvas.setSpeed(_speed);
    });

    // Set initial display values
    setLambda(_lambda_pm);
    setTheta(_theta_deg);
  }

  function setLambda(pm) {
    _lambda_pm = Math.min(100, Math.max(0.1, pm));
    const lambdaSlider = document.getElementById('slider-lambda');
    const lambdaDisplay = document.getElementById('val-lambda');
    if (lambdaSlider) {
      const logMin = Math.log10(0.1), logMax = Math.log10(100);
      const sliderVal = ((Math.log10(_lambda_pm) - logMin) / (logMax - logMin)) * 1000;
      lambdaSlider.value = sliderVal;
    }
    if (lambdaDisplay) lambdaDisplay.textContent = Physics.formatWavelength(_lambda_pm, 3);
    _fireChange();
  }

  function setTheta(deg) {
    _theta_deg = Math.min(180, Math.max(0, deg));
    const thetaSlider = document.getElementById('slider-theta');
    const thetaDisplay = document.getElementById('val-theta');
    if (thetaSlider) thetaSlider.value = _theta_deg;
    if (thetaDisplay) thetaDisplay.textContent = `${_theta_deg}°`;
    _fireChange();
  }

  function _fireChange() {
    if (_onParamChange) _onParamChange(_lambda_pm, _theta_deg);
  }

  // ── Toggles ──────────────────────────────────────────────────────────────────
  function _initToggles() {
    _bindToggle('toggle-vectors', val => ComptonCanvas.setShowVectors(val), true);
    _bindToggle('toggle-waves',   val => ComptonCanvas.setShowWaves(val),   true);
    _bindToggle('toggle-angles',  val => ComptonCanvas.setShowAngles(val),  true);
  }

  function _bindToggle(id, cb, defaultVal) {
    const el = document.getElementById(id);
    if (!el) return;
    el.checked = defaultVal;
    el.addEventListener('change', () => cb(el.checked));
    cb(defaultVal);
  }

  // ── Buttons ──────────────────────────────────────────────────────────────────
  function _initButtons() {
    document.getElementById('btn-play')?.addEventListener('click', () => {
      ComptonCanvas.play();
      _setButtonStates('playing');
    });
    document.getElementById('btn-pause')?.addEventListener('click', () => {
      ComptonCanvas.pause();
      _setButtonStates('paused');
    });
    document.getElementById('btn-reset')?.addEventListener('click', () => {
      ComptonCanvas.reset();
      _setButtonStates('idle');
    });
    document.getElementById('btn-step')?.addEventListener('click', () => {
      ComptonCanvas.step();
      _setButtonStates('step');
    });
  }

  function _setButtonStates(mode) {
    const play  = document.getElementById('btn-play');
    const pause = document.getElementById('btn-pause');
    if (play)  play.classList.toggle('active',  mode === 'playing');
    if (pause) pause.classList.toggle('active', mode === 'paused');
  }

  // ── Results panel update ──────────────────────────────────────────────────────
  function updateResults(data) {
    if (!data) return;
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    set('res-lambda0',  Physics.formatWavelength(data.lambda0_pm));
    set('res-lambda1',  Physics.formatWavelength(data.lambda1_pm));
    set('res-delta',    Physics.formatWavelength(data.delta_lambda_pm));
    set('res-E0',       Physics.formatEnergy(data.E0_keV));
    set('res-E1',       Physics.formatEnergy(data.E1_keV));
    set('res-Te',       Physics.formatEnergy(data.Te_keV));
    set('res-phi',      `${data.phi_deg.toFixed(2)}°`);
    set('res-theta',    `${data.theta_deg.toFixed(1)}°`);

    // Energy distribution bar
    const barPhoton = document.getElementById('bar-photon');
    const barElec   = document.getElementById('bar-electron');
    const pct       = (data.energy_ratio * 100).toFixed(1);
    const ePct      = (100 - parseFloat(pct)).toFixed(1);
    if (barPhoton) { barPhoton.style.width = `${pct}%`; barPhoton.title = `${pct}%`; }
    if (barElec)   { barElec.style.width   = `${ePct}%`; barElec.title   = `${ePct}%`; }

    // Bar labels
    const lblPhoton = document.getElementById('bar-label-photon');
    const lblElec   = document.getElementById('bar-label-electron');
    if (lblPhoton) lblPhoton.textContent = `${pct}%`;
    if (lblElec)   lblElec.textContent   = `${ePct}%`;

    // Conservation badge
    const badge = document.getElementById('momentum-badge');
    if (badge) {
      badge.textContent  = data.momentum_conserved
        ? I18n.t('res_momentum_ok')
        : I18n.t('res_momentum_err');
      badge.className    = 'momentum-badge ' + (data.momentum_conserved ? 'ok' : 'err');
    }
  }

  function getLambda() { return _lambda_pm; }
  function getTheta()  { return _theta_deg; }

  return { init, updateResults, setLambda, setTheta, getLambda, getTheta };
})();
