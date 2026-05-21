# Simulador Interactivo del Efecto Compton

**URL del simulador:** [fer2008323232.pythonanywhere.com](https://fer2008323232.pythonanywhere.com)

**Repositorio:** [github.com/soferf/efectoCotton](https://github.com/soferf/efectoCotton)

## ¿Qué es?
Simulador interactivo del Efecto Compton para estudiantes universitarios de física e ingeniería. Incluye animación Canvas 2D, gráficas interactivas y manual de usuario completo.

## Tecnologías
- HTML5 + CSS3 + JavaScript vanilla
- Canvas 2D API (animación 60fps)
- Chart.js 4.4.0 (local, sin CDN)
- Flask (servidor PythonAnywhere)

## Ejecutar localmente
Abre directamente `index.html` en el navegador — no requiere servidor.

## Estructura
```
compton-simulator/
├── index.html          # Simulador principal
├── manual.html         # Manual de usuario (8 secciones)
├── app.py              # Servidor Flask (PythonAnywhere)
├── css/
│   ├── styles.css      # Tema dark/neon global
│   ├── simulator.css   # Layout y componentes del simulador
│   ├── manual.css      # Estilos del manual
│   └── animations.css  # Keyframes CSS
├── js/
│   ├── physics.js      # Motor de cálculos físicos
│   ├── canvas-animation.js  # Animación Canvas 2D
│   ├── charts.js       # 3 gráficas interactivas
│   ├── ui.js           # Controles y panel de resultados
│   ├── i18n.js         # Bilingüe ES/EN
│   ├── particles.js    # Sistema de partículas de fondo
│   └── simulator.js    # Orquestador principal
└── lib/
    └── chart.min.js    # Chart.js 4.4.0 (local)
```

## Fórmulas implementadas
- Δλ = λ_c(1 − cosθ) &nbsp;&nbsp; [Desplazamiento Compton]
- E' = E₀ / [1 + (E₀/m_ec²)(1 − cosθ)] &nbsp;&nbsp; [Energía fotón dispersado]
- cot φ = (1 + E₀/m_ec²)·tan(θ/2) &nbsp;&nbsp; [Ángulo de retroceso electrónico]
- p_e = √(T_e(T_e + 2m_ec²))/c &nbsp;&nbsp; [Momento relativista del electrón]
