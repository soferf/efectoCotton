/**
 * i18n.js — Bilingual (ES/EN) internationalization module
 * Usage: t('key')  returns current language string
 *        I18n.setLanguage('en') or I18n.setLanguage('es')
 *        Add data-i18n="key" to any HTML element for auto-translation
 *        Add data-i18n-placeholder="key" for input placeholders
 */

const I18n = (() => {
  let _lang = localStorage.getItem('compton_lang') || 'es';

  const T = {
    es: {
      // ── Nav ────────────────────────────────────────────────────────────────
      nav_title:          'Efecto Compton — Simulador',
      nav_simulator:      'Simulador',
      nav_manual:         'Manual',
      nav_theory:         'Teoría',
      nav_lang_btn:       'EN',

      // ── Control panel ──────────────────────────────────────────────────────
      panel_controls:     'Panel de Control',
      preset_label:       'Fuente de Radiación',
      preset_xray_m:      'X-ray Médico',
      preset_xray_h:      'X-ray Duro',
      preset_gamma_co:    'Gamma Co-60',
      preset_gamma_cs:    'Gamma Cs-137',
      preset_custom:      'Personalizado',
      slider_lambda:      'Longitud de onda incidente λ₀',
      slider_theta:       'Ángulo de dispersión θ',
      slider_speed:       'Velocidad de animación',
      btn_play:           '▶ Simular',
      btn_pause:          '⏸ Pausar',
      btn_reset:          '⟳ Reiniciar',
      btn_step:           '⏭ Paso a paso',
      toggle_vectors:     'Vectores de momento',
      toggle_waves:       'Comparación de ondas',
      toggle_angles:      'Mostrar ángulos',

      // ── Results panel ──────────────────────────────────────────────────────
      panel_results:      'Resultados',
      res_lambda0:        'Longitud de onda incidente',
      res_lambda1:        'Longitud de onda dispersada',
      res_delta:          'Desplazamiento Compton Δλ',
      res_E0:             'Energía fotón incidente',
      res_E1:             'Energía fotón dispersado',
      res_Te:             'Energía cinética electrón',
      res_phi:            'Ángulo de retroceso e⁻',
      res_theta:          'Ángulo de dispersión fotón',
      res_conservation:   'Conservación de energía',
      res_momentum_ok:    '✓ Momento conservado',
      res_momentum_err:   '✗ Error numérico',
      energy_bar_photon:  'Fotón dispersado',
      energy_bar_electron:'Electrón',

      // ── Canvas labels ──────────────────────────────────────────────────────
      canvas_photon_in:   'Fotón incidente',
      canvas_photon_out:  'Fotón dispersado',
      canvas_electron:    'Electrón',
      canvas_e_recoil:    'e⁻ retroceso',
      canvas_theta_lbl:   'θ',
      canvas_phi_lbl:     'φ',
      canvas_wave_before: 'λ₀ (incidente)',
      canvas_wave_after:  "λ' (dispersado)",
      canvas_idle:        'Configura los parámetros y presiona ▶ Simular',

      // ── Charts ─────────────────────────────────────────────────────────────
      chart1_title:       'Desplazamiento Compton Δλ vs θ',
      chart1_y:           'Δλ (pm)',
      chart2_title:       "Energía fotón dispersado E'/E₀ vs θ",
      chart2_y:           "E'/E₀",
      chart3_title:       'Energía electrón T_e/E₀ vs θ',
      chart3_y:           'T_e/E₀',
      chart_x:            'Ángulo de dispersión θ (°)',
      chart_current:      'Ángulo actual',

      // ── Preset descriptions ────────────────────────────────────────────────
      desc_xray_m:   'Radiografías médicas · λ₀ = 50 pm · E₀ ≈ 24.8 keV',
      desc_xray_h:   'Cristalografía X · λ₀ = 10 pm · E₀ ≈ 124 keV',
      desc_gamma_co: 'Cobalto-60 (radioterapia) · λ₀ ≈ 1.06 pm · E₀ ≈ 1.17 MeV',
      desc_gamma_cs: 'Cesio-137 (dosimetría) · λ₀ ≈ 1.85 pm · E₀ ≈ 0.662 MeV',
      desc_custom:   'Ajusta la longitud de onda manualmente',

      // ── Footer ─────────────────────────────────────────────────────────────
      footer_credit:  'Simulador del Efecto Compton · Física Cuántica Moderna',
      footer_formula: 'Δλ = λ_c(1 − cosθ)   |   λ_c = 2.42631 pm',
    },

    en: {
      // ── Nav ────────────────────────────────────────────────────────────────
      nav_title:          'Compton Effect — Simulator',
      nav_simulator:      'Simulator',
      nav_manual:         'Manual',
      nav_theory:         'Theory',
      nav_lang_btn:       'ES',

      // ── Control panel ──────────────────────────────────────────────────────
      panel_controls:     'Control Panel',
      preset_label:       'Radiation Source',
      preset_xray_m:      'Medical X-ray',
      preset_xray_h:      'Hard X-ray',
      preset_gamma_co:    'Gamma Co-60',
      preset_gamma_cs:    'Gamma Cs-137',
      preset_custom:      'Custom',
      slider_lambda:      'Incident wavelength λ₀',
      slider_theta:       'Scattering angle θ',
      slider_speed:       'Animation speed',
      btn_play:           '▶ Simulate',
      btn_pause:          '⏸ Pause',
      btn_reset:          '⟳ Reset',
      btn_step:           '⏭ Step',
      toggle_vectors:     'Momentum vectors',
      toggle_waves:       'Wave comparison',
      toggle_angles:      'Show angles',

      // ── Results panel ──────────────────────────────────────────────────────
      panel_results:      'Results',
      res_lambda0:        'Incident wavelength',
      res_lambda1:        'Scattered wavelength',
      res_delta:          'Compton shift Δλ',
      res_E0:             'Incident photon energy',
      res_E1:             'Scattered photon energy',
      res_Te:             'Electron kinetic energy',
      res_phi:            'Electron recoil angle',
      res_theta:          'Photon scattering angle',
      res_conservation:   'Energy conservation',
      res_momentum_ok:    '✓ Momentum conserved',
      res_momentum_err:   '✗ Numerical error',
      energy_bar_photon:  'Scattered photon',
      energy_bar_electron:'Electron',

      // ── Canvas labels ──────────────────────────────────────────────────────
      canvas_photon_in:   'Incident photon',
      canvas_photon_out:  'Scattered photon',
      canvas_electron:    'Electron',
      canvas_e_recoil:    'e⁻ recoil',
      canvas_theta_lbl:   'θ',
      canvas_phi_lbl:     'φ',
      canvas_wave_before: 'λ₀ (incident)',
      canvas_wave_after:  "λ' (scattered)",
      canvas_idle:        'Set parameters and press ▶ Simulate',

      // ── Charts ─────────────────────────────────────────────────────────────
      chart1_title:       'Compton Shift Δλ vs θ',
      chart1_y:           'Δλ (pm)',
      chart2_title:       "Scattered photon energy E'/E₀ vs θ",
      chart2_y:           "E'/E₀",
      chart3_title:       'Electron energy T_e/E₀ vs θ',
      chart3_y:           'T_e/E₀',
      chart_x:            'Scattering angle θ (°)',
      chart_current:      'Current angle',

      // ── Preset descriptions ────────────────────────────────────────────────
      desc_xray_m:   'Medical radiography · λ₀ = 50 pm · E₀ ≈ 24.8 keV',
      desc_xray_h:   'X-ray crystallography · λ₀ = 10 pm · E₀ ≈ 124 keV',
      desc_gamma_co: 'Cobalt-60 (radiotherapy) · λ₀ ≈ 1.06 pm · E₀ ≈ 1.17 MeV',
      desc_gamma_cs: 'Cesium-137 (dosimetry) · λ₀ ≈ 1.85 pm · E₀ ≈ 0.662 MeV',
      desc_custom:   'Adjust the wavelength manually',

      // ── Footer ─────────────────────────────────────────────────────────────
      footer_credit:  'Compton Effect Simulator · Modern Quantum Physics',
      footer_formula: 'Δλ = λ_c(1 − cosθ)   |   λ_c = 2.42631 pm',
    },
  };

  function t(key) {
    return (T[_lang] && T[_lang][key]) || T['es'][key] || key;
  }

  function getLang() { return _lang; }

  function setLanguage(lang) {
    if (!T[lang]) return;
    _lang = lang;
    localStorage.setItem('compton_lang', lang);
    applyToDOM();
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
  }

  function toggleLanguage() {
    setLanguage(_lang === 'es' ? 'en' : 'es');
  }

  function applyToDOM() {
    // Text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });
    // HTML content (for elements with equations/HTML)
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      el.innerHTML = t(key);
    });
    // Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });
    // Title attribute
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      el.title = t(el.getAttribute('data-i18n-title'));
    });
    // Update html lang attribute
    document.documentElement.lang = _lang;
  }

  // Auto-apply on first load
  document.addEventListener('DOMContentLoaded', applyToDOM);

  return { t, getLang, setLanguage, toggleLanguage, applyToDOM };
})();
