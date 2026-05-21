/**
 * charts.js — Interactive Chart.js graphs for Compton simulation
 * Three charts: Δλ vs θ | E'/E₀ vs θ | T_e/E₀ vs θ
 * All three share the same x-axis (θ 0°–180°) and show a marker at current θ.
 * Clicking on any chart sets the θ slider to that angle.
 * Dependencies: chart.min.js (lib/), physics.js, ui.js, i18n.js
 */

const Charts = (() => {
  let chart1, chart2, chart3;
  let _currentTheta = 90;
  let _currentE0    = 124;   // keV, updated on param change

  const CYAN    = 'rgba(0, 240, 255, 0.85)';
  const VIOLET  = 'rgba(155, 89, 255, 0.85)';
  const GOLD    = 'rgba(255, 204, 0, 0.85)';
  const MAGENTA = 'rgba(255, 0, 170, 0.85)';

  const GRID_COLOR  = 'rgba(255,255,255,0.07)';
  const TICK_COLOR  = 'rgba(200,200,200,0.6)';
  const FONT_FAMILY = "'Inter', sans-serif";

  // Shared plugin: vertical marker line at current θ
  const markerPlugin = {
    id: 'verticalMarker',
    afterDraw(chart) {
      const { ctx, chartArea: { top, bottom }, scales: { x } } = chart;
      if (!x) return;
      const xPos = x.getPixelForValue(_currentTheta);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(xPos, top);
      ctx.lineTo(xPos, bottom);
      ctx.strokeStyle = 'rgba(255, 0, 170, 0.9)';
      ctx.lineWidth   = 2;
      ctx.setLineDash([5, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      // Dot at intersection
      ctx.beginPath();
      ctx.arc(xPos, (top + bottom) / 2, 4, 0, Math.PI * 2);
      ctx.fillStyle = MAGENTA;
      ctx.fill();
      ctx.restore();
    }
  };

  // Shared base options
  function baseOptions(yLabel) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 300 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: {
            color: TICK_COLOR,
            font: { family: FONT_FAMILY, size: 11 },
          }
        },
        tooltip: {
          backgroundColor: 'rgba(10,10,26,0.95)',
          titleColor: '#00f0ff',
          bodyColor: '#e0e0e0',
          borderColor: 'rgba(0,240,255,0.3)',
          borderWidth: 1,
          titleFont: { family: FONT_FAMILY },
          bodyFont:  { family: FONT_FAMILY },
          callbacks: {
            title: items => `θ = ${items[0].label}°`,
            label: item  => ` ${item.dataset.label}: ${parseFloat(item.raw).toFixed(4)}`,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: TICK_COLOR,
            font: { family: FONT_FAMILY, size: 10 },
            maxTicksLimit: 13,
            callback: val => `${val}°`,
          },
          grid: { color: GRID_COLOR },
          title: {
            display: true,
            text: I18n.t('chart_x'),
            color: TICK_COLOR,
            font: { family: FONT_FAMILY, size: 11 },
          },
        },
        y: {
          ticks: { color: TICK_COLOR, font: { family: FONT_FAMILY, size: 10 } },
          grid:  { color: GRID_COLOR },
          title: {
            display: true,
            text: yLabel,
            color: TICK_COLOR,
            font: { family: FONT_FAMILY, size: 11 },
          },
        },
      },
      onClick(event, elements, chart) {
        if (!elements.length) return;
        const theta = parseInt(chart.data.labels[elements[0].index]);
        UI.setTheta(theta);
      },
    };
  }

  function init() {
    const { angles, vals } = Physics.curveDeltalambda();
    const { vals: vE1 }    = Physics.curveEnergyRatio(_currentE0);
    const { vals: vTe }    = Physics.curveElectronEnergy(_currentE0);
    const labels           = angles.map(a => String(a));

    // ── Chart 1: Δλ vs θ ────────────────────────────────────────────────────
    const c1 = document.getElementById('chart1');
    if (c1) {
      chart1 = new Chart(c1, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Δλ (pm)',
            data: vals,
            borderColor: CYAN,
            backgroundColor: 'rgba(0,240,255,0.08)',
            borderWidth: 2,
            pointRadius: 0,
            fill: true,
            tension: 0.4,
          }],
        },
        options: baseOptions('Δλ (pm)'),
        plugins: [markerPlugin],
      });
    }

    // ── Chart 2: E'/E₀ vs θ ─────────────────────────────────────────────────
    const c2 = document.getElementById('chart2');
    if (c2) {
      chart2 = new Chart(c2, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: "E'/E₀",
            data: vE1,
            borderColor: VIOLET,
            backgroundColor: 'rgba(155,89,255,0.08)',
            borderWidth: 2,
            pointRadius: 0,
            fill: true,
            tension: 0.3,
          }],
        },
        options: baseOptions("E'/E₀"),
        plugins: [markerPlugin],
      });
    }

    // ── Chart 3: T_e/E₀ vs θ ────────────────────────────────────────────────
    const c3 = document.getElementById('chart3');
    if (c3) {
      chart3 = new Chart(c3, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'T_e/E₀',
            data: vTe,
            borderColor: GOLD,
            backgroundColor: 'rgba(255,204,0,0.08)',
            borderWidth: 2,
            pointRadius: 0,
            fill: true,
            tension: 0.3,
          }],
        },
        options: baseOptions('T_e/E₀'),
        plugins: [markerPlugin],
      });
    }
  }

  /**
   * Update the marker and energy-dependent curves when params change.
   */
  function update(theta_deg, E0_keV) {
    _currentTheta = theta_deg;
    _currentE0    = E0_keV;

    if (chart2 || chart3) {
      const { vals: vE1 } = Physics.curveEnergyRatio(E0_keV);
      const { vals: vTe } = Physics.curveElectronEnergy(E0_keV);
      if (chart2) { chart2.data.datasets[0].data = vE1; chart2.update('none'); }
      if (chart3) { chart3.data.datasets[0].data = vTe; chart3.update('none'); }
    }

    if (chart1) chart1.update('none');
    if (chart2) chart2.update('none');
    if (chart3) chart3.update('none');
  }

  /**
   * Rebuild chart axis labels after language change.
   */
  function rebuildLabels() {
    [chart1, chart2, chart3].forEach((ch, i) => {
      if (!ch) return;
      ch.options.scales.x.title.text = I18n.t('chart_x');
      const yLabels = ['Δλ (pm)', "E'/E₀", 'T_e/E₀'];
      ch.options.scales.y.title.text = yLabels[i];
      ch.update('none');
    });
  }

  return { init, update, rebuildLabels };
})();
