/**
 * physics.js — Compton Effect Physics Engine
 * All calculations are exact relativistic formulas.
 * Units: wavelength in pm (picometers), energy in keV, angles in degrees.
 */

const Physics = (() => {
  // ── Physical Constants ──────────────────────────────────────────────────────
  const h       = 6.62607015e-34;   // Planck's constant (J·s)
  const c       = 2.99792458e8;     // Speed of light (m/s)
  const m_e     = 9.10938370e-31;   // Electron rest mass (kg)
  const eV      = 1.602176634e-19;  // 1 eV in Joules
  const keV     = eV * 1e3;        // 1 keV in Joules

  // Compton wavelength: λ_c = h / (m_e · c)
  const LAMBDA_C_PM = (h / (m_e * c)) * 1e12; // ≈ 2.42631 pm

  // Electron rest energy: m_e·c² in keV
  const M_E_C2_KEV  = (m_e * c * c) / keV;   // ≈ 511 keV

  // ── Preset Radiation Sources ────────────────────────────────────────────────
  const PRESETS = {
    xray_medical:  { lambda_pm: 50.0,   label_es: 'X-ray médico',     label_en: 'Medical X-ray'    },
    xray_hard:     { lambda_pm: 10.0,   label_es: 'X-ray duro',       label_en: 'Hard X-ray'       },
    gamma_co60:    { lambda_pm: 1.0627, label_es: 'Gamma Co-60',      label_en: 'Gamma Co-60'      },
    gamma_cs137:   { lambda_pm: 1.8536, label_es: 'Gamma Cs-137',     label_en: 'Gamma Cs-137'     },
    custom:        { lambda_pm: null,   label_es: 'Personalizado',    label_en: 'Custom'           },
  };

  // ── Core Calculation ────────────────────────────────────────────────────────
  /**
   * Compute all Compton scattering observables.
   * @param {number} lambda0_pm  — Incident wavelength (pm)
   * @param {number} theta_deg   — Photon scattering angle (0°–180°)
   * @returns {Object} Full result set
   */
  function compute(lambda0_pm, theta_deg) {
    const theta_rad = (theta_deg * Math.PI) / 180;
    const cos_theta = Math.cos(theta_rad);
    const sin_theta = Math.sin(theta_rad);
    const tan_half  = Math.tan(theta_rad / 2);

    // 1. Compton wavelength shift  Δλ = λ_c (1 − cosθ)
    const delta_lambda_pm = LAMBDA_C_PM * (1 - cos_theta);

    // 2. Scattered photon wavelength  λ' = λ₀ + Δλ
    const lambda1_pm = lambda0_pm + delta_lambda_pm;

    // 3. Incident photon energy  E₀ = hc / λ₀   (in keV)
    const E0_keV = (h * c) / (lambda0_pm * 1e-12) / keV;

    // 4. Scattered photon energy  E' = E₀ / [1 + (E₀/m_e c²)(1 − cosθ)]
    const E1_keV = E0_keV / (1 + (E0_keV / M_E_C2_KEV) * (1 - cos_theta));

    // 5. Electron recoil kinetic energy  T_e = E₀ − E'
    const Te_keV = E0_keV - E1_keV;

    // 6. Electron recoil angle  cot φ = (1 + E₀/m_e c²) tan(θ/2)
    //    Special cases: θ=0 → φ=90°, θ=180° → φ=0°
    let phi_deg;
    if (theta_deg === 0) {
      phi_deg = 90;
    } else if (theta_deg === 180) {
      phi_deg = 0;
    } else {
      const cot_phi = (1 + E0_keV / M_E_C2_KEV) * tan_half;
      phi_deg = (Math.atan(1 / cot_phi) * 180) / Math.PI;
    }

    // 7. Momentum magnitudes (in keV/c for verification)
    const p0_keVc  = E0_keV;                    // |p₀| = E₀/c
    const p1_keVc  = E1_keV;                    // |p'| = E'/c
    const pe_keVc  = Math.sqrt(Te_keV * (Te_keV + 2 * M_E_C2_KEV)); // relativistic

    // 8. Momentum conservation check (x and y components)
    const phi_rad  = (phi_deg * Math.PI) / 180;
    const px_in    = p0_keVc;
    const px_out   = p1_keVc * cos_theta + pe_keVc * Math.cos(phi_rad);
    const py_out   = p1_keVc * sin_theta - pe_keVc * Math.sin(phi_rad);
    const momentum_conserved = Math.abs(px_in - px_out) < 0.01 && Math.abs(py_out) < 0.01;

    // 9. Wavelength ratio and energy ratio
    const lambda_ratio = lambda0_pm / lambda1_pm; // E'/E₀ equivalent
    const energy_ratio = E1_keV / E0_keV;

    return {
      lambda0_pm,
      lambda1_pm,
      delta_lambda_pm,
      theta_deg,
      phi_deg,
      E0_keV,
      E1_keV,
      Te_keV,
      p0_keVc,
      p1_keVc,
      pe_keVc,
      momentum_conserved,
      energy_ratio,
      LAMBDA_C_PM,
      M_E_C2_KEV,
    };
  }

  /**
   * Generate curve data for Δλ vs θ (0° to 180°, step 1°)
   */
  function curveDeltalambda() {
    const angles = [], vals = [];
    for (let t = 0; t <= 180; t++) {
      angles.push(t);
      vals.push(LAMBDA_C_PM * (1 - Math.cos((t * Math.PI) / 180)));
    }
    return { angles, vals };
  }

  /**
   * Generate curve data for E'/E₀ vs θ at a given E₀
   */
  function curveEnergyRatio(E0_keV) {
    const angles = [], vals = [];
    for (let t = 0; t <= 180; t++) {
      const cos_t = Math.cos((t * Math.PI) / 180);
      const ratio = 1 / (1 + (E0_keV / M_E_C2_KEV) * (1 - cos_t));
      angles.push(t);
      vals.push(ratio);
    }
    return { angles, vals };
  }

  /**
   * Generate curve data for T_e/E₀ vs θ at a given E₀
   */
  function curveElectronEnergy(E0_keV) {
    const angles = [], vals = [];
    for (let t = 0; t <= 180; t++) {
      const cos_t = Math.cos((t * Math.PI) / 180);
      const ratio_E1 = 1 / (1 + (E0_keV / M_E_C2_KEV) * (1 - cos_t));
      angles.push(t);
      vals.push(1 - ratio_E1);
    }
    return { angles, vals };
  }

  /**
   * Format a keV value with appropriate units (eV / keV / MeV)
   */
  function formatEnergy(keV_val, decimals = 3) {
    if (keV_val < 1) return `${(keV_val * 1000).toFixed(decimals)} eV`;
    if (keV_val < 1000) return `${keV_val.toFixed(decimals)} keV`;
    return `${(keV_val / 1000).toFixed(decimals)} MeV`;
  }

  /**
   * Format wavelength with appropriate units (pm / nm / Å)
   */
  function formatWavelength(pm_val, decimals = 4) {
    if (pm_val < 100) return `${pm_val.toFixed(decimals)} pm`;
    if (pm_val < 1e5) return `${(pm_val / 1000).toFixed(decimals)} nm`;
    return `${(pm_val / 100).toFixed(decimals)} Å`;
  }

  // Public API
  return {
    LAMBDA_C_PM,
    M_E_C2_KEV,
    PRESETS,
    compute,
    curveDeltalambda,
    curveEnergyRatio,
    curveElectronEnergy,
    formatEnergy,
    formatWavelength,
  };
})();
