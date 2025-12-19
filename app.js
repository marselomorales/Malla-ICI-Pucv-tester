// app.js: núcleo de la aplicación interactiva de malla curricular.
// ========= MODULARIZACIÓN: Separación de responsabilidades =========

// Constantes compartidas
const STORAGE_KEYS = {
  tema: 'modo',
  colorPreset: 'tema_color',
  atrasoConfig: 'config_atraso',
  semestreActual: 'semestre_actual',
  ramosAprobados: 'ramos_aprobados_siglas',
  firmaMalla: 'firma_malla'
};

// Módulo de utilidades
const Utils = {
  // Normalización de texto para búsquedas
  normalizeText: (str) => (str || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(),
  
  // Selectores DOM simplificados
  $: (sel) => document.querySelector(sel),
  $$: (sel) => Array.from(document.querySelectorAll(sel)),
  
  // Obtener variables CSS como píxeles
  cssVarPx: (name, fallback) => { 
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); 
    const n = parseFloat(v); 
    return Number.isFinite(n) ? n : fallback; 
  },
  
  // Debounce para optimizar búsquedas
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};

// Módulo de tema
const ThemeManager = {
  presets: {
    indigo: { label: 'Índigo', accent: '#4f46e5', accent2: '#22c55e', accentDark: '#3730a3', accentLight: '#e0e7ff' },
    emerald: { label: 'Esmeralda', accent: '#047857', accent2: '#10b981', accentDark: '#065f46', accentLight: '#d1fae5' },
    sunset: { label: 'Atardecer', accent: '#f97316', accent2: '#f59e0b', accentDark: '#c2410c', accentLight: '#ffedd5' },
    ocean: { label: 'Océano', accent: '#0ea5e9', accent2: '#14b8a6', accentDark: '#0369a1', accentLight: '#dbeafe' }
  },

  init() {
    this.toggle = document.getElementById('theme-toggle');
    this.modeLabel = document.getElementById('theme-mode-label');
    this.colorButtons = Utils.$$('.color-preset');
    this.body = document.body;
    const storedMode = localStorage.getItem(STORAGE_KEYS.tema);
    const storedColor = localStorage.getItem(STORAGE_KEYS.colorPreset);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.mode = storedMode || (prefersDark ? 'dark' : 'light');
    this.color = this.presets[storedColor] ? storedColor : 'indigo';
    this.applyTheme();
    this.setupEventListeners();
  },

  applyTheme() {
    const mode = this.mode === 'dark' ? 'dark' : 'light';
    const palette = this.presets[this.color] || this.presets.indigo;

    this.body.dataset.theme = mode;
    this.body.dataset.color = this.color;
    this.body.classList.toggle('active', mode === 'dark');
    this.toggle?.setAttribute('aria-checked', mode === 'dark' ? 'true' : 'false');
    document.documentElement.style.colorScheme = mode;

    // Aplicar paleta a variables CSS
    this.body.style.setProperty('--accent', palette.accent);
    this.body.style.setProperty('--accent-2', palette.accent2);
    this.body.style.setProperty('--accent-dark', palette.accentDark);
    this.body.style.setProperty('--accent-light', palette.accentLight);

    if (this.modeLabel) {
      this.modeLabel.textContent = mode === 'dark' ? 'Modo oscuro' : 'Modo claro';
    }
    this.updatePresetButtons();
  },

  swapTheme() {
    const isDark = this.body.classList.toggle('active');
    this.mode = isDark ? 'dark' : 'light';
    localStorage.setItem(STORAGE_KEYS.tema, this.mode);
    this.applyTheme();
  },

  setColorPreset(presetKey) {
    if (!this.presets[presetKey]) return;
    this.color = presetKey;
    localStorage.setItem(STORAGE_KEYS.colorPreset, presetKey);
    this.applyTheme();
  },

  updatePresetButtons() {
    this.colorButtons.forEach(btn => {
      const isActive = btn.dataset.colorPreset === this.color;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  },

  setupEventListeners() {
    this.toggle?.addEventListener('click', () => this.swapTheme());
    this.toggle?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.swapTheme();
      }
    });

    this.colorButtons.forEach(btn => {
      btn.addEventListener('click', () => this.setColorPreset(btn.dataset.colorPreset));
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.setColorPreset(btn.dataset.colorPreset);
        }
      });
    });
  }
};

// Módulo de notificaciones
const NotificationManager = {
  init() {
    this.toastContainer = document.getElementById('toast-container');
  },
  
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <ion-icon name="${type === 'success' ? 'checkmark-circle' : 'information-circle'}"></ion-icon>
      <span>${message}</span>
    `;
    
    this.toastContainer.appendChild(toast);
    
    // Remover después de 3 segundos
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(-20px)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  },
  
  createConfetti() {
    const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    
    for (let i = 0; i < 30; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.opacity = '1';
      document.body.appendChild(confetti);
      
      // Animación
      const animation = confetti.animate([
        { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
        { transform: `translateY(${window.innerHeight}px) rotate(${Math.random() * 360}deg)`, opacity: 0 }
      ], {
        duration: 1000 + Math.random() * 1000,
        easing: 'cubic-bezier(0.1, 0.8, 0.2, 1)'
      });
      
      animation.onfinish = () => {
        if (confetti.parentNode) {
          confetti.parentNode.removeChild(confetti);
        }
      };
    }
  }
};

// Módulo de datos de la malla
const CurriculumData = {
  cursosRaw: [
    // Semestre 1
    {sem:1, sigla:"MAT1001", nombre:"Fundamentos de Matemáticas para Ingeniería", creditos:6, area:"matematicas", prereqs:[]},
    {sem:1, sigla:"ICI1243", nombre:"Introducción a la Ingeniería Informática", creditos:4, area:"ingenieria", prereqs:[]},
    {sem:1, sigla:"ICI1241", nombre:"Fundamentos de Algoritmos", creditos:4, area:"programacion", prereqs:[]},
    {sem:1, sigla:"ICI1458", nombre:"Bienestar y Aprendizaje Universitario", creditos:2, area:"humanidades", prereqs:[]},
    
    // Semestre 2
    {sem:2, sigla:"MAT1002", nombre:"Cálculo Diferencial e Integral", creditos:6, area:"matematicas", prereqs:["MAT1001"]},
    {sem:2, sigla:"MAT1004", nombre:"Álgebra Lineal", creditos:4, area:"matematicas", prereqs:["MAT1001"]},
    {sem:2, sigla:"ICI1242", nombre:"Fundamentos de Programación", creditos:4, area:"programacion", prereqs:["ICI1241"]},
    {sem:2, sigla:"FIN100-14", nombre:"Desarrollo Integral y Comunicación para Ingeniería", creditos:3, area:"humanidades", prereqs:[]},
    {sem:2, sigla:"FF1", nombre:"Formación Fundamental", creditos:2, area:"fofus", prereqs:[]},
    
    // Semestre 3
    {sem:3, sigla:"FIS1002", nombre:"Física para Ingeniería", creditos:5, area:"fisica", prereqs:["MAT1001"]},
    {sem:3, sigla:"MAT1003", nombre:"Cálculo en Varias Variables", creditos:4, area:"matematicas", prereqs:["MAT1002"]},
    {sem:3, sigla:"ICI2145", nombre:"Análisis Inteligente de Datos", creditos:4, area:"programacion", prereqs:["MAT1002"]},
    {sem:3, sigla:"ICI2240", nombre:"Estructura de Datos", creditos:4, area:"programacion", prereqs:["ICI1242"]},
    {sem:3, sigla:"ICR010", nombre:"Antropología Cristiana", creditos:2, area:"fofus", prereqs:[]},
    {sem:3, sigla:"FF2", nombre:"Formación Fundamental 2", creditos:2, area:"fofus", prereqs:[]},
    
    // Semestre 4
    {sem:4, sigla:"FIS2120", nombre:"Física Electromagnetismo", creditos:3, area:"fisica", prereqs:["FIS1002"]},
    {sem:4, sigla:"ICI2141", nombre:"Métodos Numéricos", creditos:3, area:"matematicas", prereqs:["ICI1242"]},
    {sem:4, sigla:"ICI2242", nombre:"Análisis y Diseño de Algoritmos", creditos:4, area:"programacion", prereqs:[]},
    {sem:4, sigla:"ICI2241", nombre:"Programación Avanzada", creditos:4, area:"programacion", prereqs:["ICI2240"]},
    {sem:4, sigla:"ICR020", nombre:"Ética Cristiana", creditos:2, area:"fofus", prereqs:[]},
    {sem:4, sigla:"ING9001", nombre:"Inglés 1", creditos:2, area:"humanidades", prereqs:[]},
    
    // Semestre 5
    {sem:5, sigla:"FIS3149", nombre:"Física Moderna", creditos:3, area:"fisica", prereqs:["FIS2120"]},
    {sem:5, sigla:"ICI3245", nombre:"Autómatas y Compiladores", creditos:3, area:"programacion", prereqs:["ICI2241"]},
    {sem:5, sigla:"ICI3240", nombre:"Base de Datos", creditos:4, area:"programacion", prereqs:["ICI1242"]},
    {sem:5, sigla:"ICI3244", nombre:"Inteligencia Artificial", creditos:4, area:"programacion", prereqs:["ICI2242"]},
    {sem:5, sigla:"ICI3344", nombre:"Hardware y Sistemas Operativos", creditos:4, area:"ingenieria", prereqs:["ICI1242"]},
    {sem:5, sigla:"ING9002", nombre:"Inglés 2", creditos:2, area:"humanidades", prereqs:["ING9001"]},
    
    // Semestre 6
    {sem:6, sigla:"ICI3150", nombre:"Ciencia y Tecnología", creditos:3, area:"ingenieria", prereqs:[]},
    {sem:6, sigla:"ICI3170", nombre:"Estadística Computacional", creditos:4, area:"matematicas", prereqs:["MAT1003"]},
    {sem:6, sigla:"ICA4121", nombre:"Administración de Empresas", creditos:3, area:"ingenieria", prereqs:[]},
    {sem:6, sigla:"ICI3246", nombre:"Modelamiento de Software", creditos:4, area:"programacion", prereqs:["ICI3240"]},
    {sem:6, sigla:"ICI3343", nombre:"Redes de Computadores", creditos:4, area:"ingenieria", prereqs:["ICI3245"]},
    {sem:6, sigla:"ING9003", nombre:"Inglés 3", creditos:2, area:"humanidades", prereqs:["ING9002"]},
    
    // Semestre 7
    {sem:7, sigla:"ICI4150", nombre:"Robótica y Sistemas Autónomos", creditos:3, area:"ingenieria", prereqs:["ICI3343"]},
    {sem:7, sigla:"ICI4151", nombre:"Optimización", creditos:4, area:"matematicas", prereqs:[]},
    {sem:7, sigla:"ICI4244", nombre:"Ingeniería de Software", creditos:4, area:"ingenieria", prereqs:["ICI3246"]},
    {sem:7, sigla:"ICI4247", nombre:"Ingeniería Web y Móvil", creditos:4, area:"programacion", prereqs:["ICI3246"]},
    {sem:7, sigla:"ICI4344", nombre:"Computación Paralela y Distribuida", creditos:4, area:"ingenieria", prereqs:["ICI3343"]},
    {sem:7, sigla:"ING9004", nombre:"Inglés 4", creditos:2, area:"humanidades", prereqs:["ING9003"]},
    
    // Semestre 8
    {sem:8, sigla:"ICA4161", nombre:"Economía y Finanzas", creditos:3, area:"ingenieria", prereqs:["ICA4121"]},
    {sem:8, sigla:"ICI4248", nombre:"Ingeniería de Requerimientos", creditos:4, area:"programacion", prereqs:["ICI4247"]},
    {sem:8, sigla:"ICI4541", nombre:"Taller de Base de Datos", creditos:4, area:"programacion", prereqs:["ICI3240"]},
    {sem:8, sigla:"ICI4370", nombre:"Ciberseguridad", creditos:4, area:"ingenieria", prereqs:["ICI3343"]},
    {sem:8, sigla:"FF3", nombre:"Formación Fundamental 3", creditos:2, area:"fofus", prereqs:[]},
    {sem:8, sigla:"OPT1", nombre:"Optativo I", creditos:4, area:"optativos", prereqs:[]},
    
    // Semestre 9
    {sem:9, sigla:"ICI5441", nombre:"Administración de proyectos informáticos", creditos:3, area:"ingenieria", prereqs:[]},
    {sem:9, sigla:"ICI5545", nombre:"Taller Ingeniería de Software", creditos:4, area:"ingenieria", prereqs:["ICI4244"]},
    {sem:9, sigla:"ICI5442", nombre:"Tecnologías Emergentes", creditos:4, area:"ingenieria", prereqs:[]},
    {sem:9, sigla:"ICI5247", nombre:"Experiencia del Usuario", creditos:3, area:"ingenieria", prereqs:["ICI4248"]},
    {sem:9, sigla:"ICI5475", nombre:"Negocios, innovación y emprendimiento", creditos:3, area:"ingenieria", prereqs:[]},
    {sem:9, sigla:"OPT2", nombre:"Optativo II", creditos:4, area:"optativos", prereqs:[]},
    
    // Semestre 10
    {sem:10, sigla:"ICI5444", nombre:"Taller de Formulación de Proyectos Informáticos", creditos:4, area:"ingenieria", prereqs:["ICI5441"]},
    {sem:10, sigla:"ICI5541", nombre:"Seminario de Título", creditos:5, area:"ingenieria", prereqs:["ICA4161", "ICI4248", "ICI4541", "ICI4370", "ICI5441", "ICI5545", "ICI5442", "ICI5247", "ICI5475", "ICI4151", "ICI3170", "ICI3344", "ICI3244"]},
    {sem:10, sigla:"ICI5345", nombre:"Legislación, Ética y Tecnológica", creditos:3, area:"ingenieria", prereqs:[]},
    {sem:10, sigla:"ICI5476", nombre:"Taller de Liderazgo y Trabajo en Equipo", creditos:3, area:"ingenieria", prereqs:[]},
    {sem:10, sigla:"OPT3", nombre:"Optativo III", creditos:4, area:"optativos", prereqs:[]},
    
    // Semestre 11
    {sem:11, sigla:"ICI6541", nombre:"Proyecto de Título", creditos:12, area:"ingenieria", prereqs:["ICI5541"]},
    {sem:11, sigla:"OPT4", nombre:"Optativo IV", creditos:4, area:"optativos", prereqs:[]}
  ],
  
  // Estructuras de datos procesadas
  siglaToNombre: new Map(),
  ramos: {},
  creditosRamos: {},
  prereqsPorNombre: {},
  porSemestre: {},
  maxSemestre: 0,
  
  init() {
    this.processData();
  },
  
  processData() {
    // Mapeo de siglas a nombres
    this.siglaToNombre = new Map(this.cursosRaw.map(c => [c.sigla, c.nombre]));
    
    // Inicializar estructuras
    this.ramos = {};
    this.creditosRamos = {};
    this.prereqsPorNombre = {};
    this.porSemestre = {};
    
    // Procesar cada curso
    for (const c of this.cursosRaw) {
      this.ramos[c.nombre] = { 
        semestre: c.sem, 
        area: c.area, 
        sigla: c.sigla, 
        abre: [] 
      };
      this.creditosRamos[c.nombre] = c.creditos ?? 0;
      this.prereqsPorNombre[c.nombre] = (c.prereqs || [])
        .map(sig => this.siglaToNombre.get(sig))
        .filter(Boolean);
    }
    
    // Procesar dependencias inversas (qué cursos abre cada curso)
    for (const [nombre, lista] of Object.entries(this.prereqsPorNombre)) {
      for (const p of lista) {
        if (this.ramos[p]) {
          this.ramos[p].abre.push(nombre);
        }
      }
    }
    
    // Organizar por semestre
    for (const [nombre, info] of Object.entries(this.ramos)) {
      if (!this.porSemestre[info.semestre]) {
        this.porSemestre[info.semestre] = [];
      }
      this.porSemestre[info.semestre].push(nombre);
    }
    
    // Encontrar el semestre máximo
    this.maxSemestre = Math.max(...Object.values(this.ramos).map(r => r.semestre));
  }
};

// Módulo de análisis de atraso MEJORADO
const AtrasoAnalyzer = {
  // Configuración de carga académica esperada
  config: {
    creditosPorSemestreIdeal: 24, // Carga típica por semestre
    semestresTotales: 11, // Duración formal de la carrera
    margenAtraso: 6, // Créditos por debajo del ideal para considerar atraso
  },

  init() {
    this.config = { ...this.config, ...JSON.parse(localStorage.getItem(STORAGE_KEYS.atrasoConfig) || '{}') };
  },

  // NUEVO: Obtener semestre actual del usuario
  getSemestreActual() {
    return MallaApp.state.semestreActual || 1;
  },

  // ACTUALIZADO: Calcular métricas de atraso CON semestre manual
  calcularMetricasAtraso() {
    const { completados: creditosAprobados } = MallaApp.calcularCreditos();
    const semestreIdeal = Math.ceil(creditosAprobados / this.config.creditosPorSemestreIdeal);
    
    // NUEVO: Usar semestre indicado por el usuario
    const semestreReal = this.getSemestreActual();

    const atrasoSemestral = Math.max(0, semestreReal - semestreIdeal);
    const creditosEsperados = semestreReal * this.config.creditosPorSemestreIdeal;
    const deficitCreditos = Math.max(0, creditosEsperados - creditosAprobados);

    return {
      semestreIdeal,
      semestreReal,
      atrasoSemestral,
      deficitCreditos,
      enAtraso: atrasoSemestral > 0 || deficitCreditos > this.config.margenAtraso
    };
  },

  // NUEVO: Análisis de ramos del semestre actual
  analizarSemestreActual() {
    const semestreActual = this.getSemestreActual();
    const ramosSemestreActual = CurriculumData.porSemestre[semestreActual] || [];
    
    const analisis = {
      semestre: semestreActual,
      totalRamos: ramosSemestreActual.length,
      aprobados: 0,
      disponibles: 0,
      bloqueados: 0,
      ramosPendientes: []
    };

    ramosSemestreActual.forEach(ramo => {
      if (MallaApp.isApproved(ramo)) {
        analisis.aprobados++;
      } else if (MallaApp.estaDisponible(ramo)) {
        analisis.disponibles++;
        analisis.ramosPendientes.push({
          nombre: ramo,
          sigla: CurriculumData.ramos[ramo].sigla,
          creditos: CurriculumData.creditosRamos[ramo],
          disponible: true
        });
      } else {
        analisis.bloqueados++;
        analisis.ramosPendientes.push({
          nombre: ramo,
          sigla: CurriculumData.ramos[ramo].sigla,
          creditos: CurriculumData.creditosRamos[ramo],
          disponible: false,
          prerrequisitosFaltantes: MallaApp.prerequisitosDe(ramo)
            .filter(p => !MallaApp.isApproved(p))
        });
      }
    });

    return analisis;
  },

  // ACTUALIZADO: Generar recomendaciones MEJORADAS
  generarRecomendaciones() {
    const problemas = this.identificarProblemas();
    const recomendaciones = [];
    const semestreActual = this.getSemestreActual();
    const analisisSemestre = this.analizarSemestreActual();

    // NUEVO: Análisis específico del semestre actual
    if (analisisSemestre.aprobados === 0 && semestreActual > 1) {
      recomendaciones.push({
        tipo: 'semestre_sin_aprobados',
        titulo: '⚠️ Semestre actual sin progreso',
        acciones: [
          `No has aprobado ningún ramo del ${semestreActual}° semestre`,
          'Considera enfocarte en los ramos disponibles este semestre',
          'Revisa si necesitas ayuda académica'
        ],
        prioridad: 'alta'
      });
    }

    if (analisisSemestre.disponibles > 0) {
      recomendaciones.push({
        tipo: 'ramos_disponibles_semestre',
        titulo: `🎯 Ramos disponibles este semestre (${semestreActual}°)`,
        acciones: analisisSemestre.ramosPendientes
          .filter(r => r.disponible)
          .map(r => `${r.sigla} - ${r.nombre} (${r.creditos} créditos)`)
          .slice(0, 5),
        prioridad: 'media'
      });
    }

    // Recomendaciones existentes (pero mejoradas)
    if (problemas.some(p => p.prioridad === 'alta')) {
      recomendaciones.push({
        tipo: 'prioridad_alta',
        titulo: '🚨 Atención: Atraso Crítico Detectado',
        acciones: [
          `Vas ${this.calcularMetricasAtraso().atrasoSemestral} semestre(s) atrasado`,
          'Prioriza ramos críticos que desbloqueen múltiples opciones',
          'Considera tomar carga académica completa este semestre'
        ],
        prioridad: 'alta'
      });
    }

    // Análisis de ramos críticos (mejorado)
    const ramosCriticos = this.identificarRamosCriticos();
    if (ramosCriticos.length > 0) {
      recomendaciones.push({
        tipo: 'ramos_criticos',
        titulo: '📚 Ramos Críticos Pendientes',
        acciones: ramosCriticos.map(ramo => 
          `"${ramo.nombre}" (Sem ${ramo.semestre}) - Bloquea ${ramo.ramosBloqueados} ramos ${ramo.disponible ? '✅ DISPONIBLE' : '❌ BLOQUEADO'}`
        ),
        prioridad: ramosCriticos.some(r => r.disponible) ? 'alta' : 'media'
      });
    }

    // NUEVO: Planificación para próximo semestre
    if (semestreActual < CurriculumData.maxSemestre) {
      const ramosProximoSemestre = this.sugerirRamosProximoSemestre(semestreActual);
      if (ramosProximoSemestre.length > 0) {
        recomendaciones.push({
          tipo: 'planificacion_proximo_semestre',
          titulo: `📅 Planificación para ${semestreActual + 1}° Semestre`,
          acciones: ramosProximoSemestre,
          prioridad: 'media'
        });
      }
    }

    return recomendaciones.sort((a, b) => {
      const prioridades = { alta: 3, media: 2, baja: 1 };
      return prioridades[b.prioridad] - prioridades[a.prioridad];
    });
  },

  // ACTUALIZADO: Sugerir ramos MEJORADO
  sugerirRamosProximoSemestre(semestreActual) {
    const sugerencias = [];
    const proximoSemestre = semestreActual + 1;

    // Ramos del próximo semestre disponibles
    const ramosProximoSem = (CurriculumData.porSemestre[proximoSemestre] || [])
      .filter(ramo => !MallaApp.isApproved(ramo) && MallaApp.estaDisponible(ramo));

    // Priorizar por impacto
    const ramosCriticos = this.identificarRamosCriticos();
    const criticosDisponibles = ramosCriticos
      .filter(ramo => ramo.disponible && ramosProximoSem.includes(ramo.nombre))
      .slice(0, 2);

    criticosDisponibles.forEach(ramo => {
      sugerencias.push(`🟢 ${ramo.sigla} - CRÍTICO (bloquea ${ramo.ramosBloqueados} ramos)`);
    });

    // Ramos por créditos (mayor a menor)
    const ramosPorCreditos = ramosProximoSem
      .filter(ramo => !criticosDisponibles.some(c => c.nombre === ramo))
      .sort((a, b) => (CurriculumData.creditosRamos[b] || 0) - (CurriculumData.creditosRamos[a] || 0))
      .slice(0, 4 - criticosDisponibles.length);

    ramosPorCreditos.forEach(ramo => {
      const creditos = CurriculumData.creditosRamos[ramo] || 0;
      sugerencias.push(`🔵 ${CurriculumData.ramos[ramo].sigla} - ${creditos} créditos`);
    });

    return sugerencias;
  },

  // Identificar ramos que son prerrequisitos de muchos otros
  identificarRamosCriticos() {
    const criticos = [];
    const umbralImportancia = 3; // Número mínimo de ramos que dependen

    for (const [nombre, info] of Object.entries(CurriculumData.ramos)) {
      if (!MallaApp.isApproved(nombre) && info.abre.length >= umbralImportancia) {
        const ramosBloqueados = info.abre.filter(abre => !MallaApp.isApproved(abre));
        if (ramosBloqueados.length > 0) {
          criticos.push({
            nombre,
            sigla: info.sigla,
            semestre: info.semestre,
            ramosBloqueados: ramosBloqueados.length,
            disponible: MallaApp.estaDisponible(nombre)
          });
        }
      }
    }

    return criticos.sort((a, b) => b.ramosBloqueados - a.ramosBloqueados);
  },

  // Analizar secuencias de ramos bloqueados
  analizarSecuenciasBloqueadas() {
    const secuencias = [];
    const ramosPendientes = Object.keys(CurriculumData.ramos).filter(nombre => 
      !MallaApp.isApproved(nombre)
    );

    ramosPendientes.forEach(nombre => {
      const rutaMasLarga = this.encontrarRutaMasLarga(nombre);
      if (rutaMasLarga.length > 2) { // Secuencia de al menos 3 ramos
        secuencias.push({
          inicio: nombre,
          longitud: rutaMasLarga.length,
          ruta: rutaMasLarga
        });
      }
    });

    return secuencias.sort((a, b) => b.longitud - a.longitud).slice(0, 3);
  },

  // Encontrar la ruta de dependencias más larga
  encontrarRutaMasLarga(ramoInicio) {
    let rutaMasLarga = [];
    
    const dfs = (ramoActual, rutaActual) => {
      const rutaNueva = [...rutaActual, ramoActual];
      if (rutaNueva.length > rutaMasLarga.length) {
        rutaMasLarga = rutaNueva;
      }

      const dependientes = CurriculumData.ramos[ramoActual]?.abre || [];
      dependientes.forEach(dep => {
        if (!MallaApp.isApproved(dep) && !rutaNueva.includes(dep)) {
          dfs(dep, rutaNueva);
        }
      });
    };

    dfs(ramoInicio, []);
    return rutaMasLarga;
  },

  // Analizar distribución de carga por semestre
  analizarDistribucionCarga() {
    const creditosPorSemestre = {};
    
    for (let sem = 1; sem <= CurriculumData.maxSemestre; sem++) {
      const ramosSem = CurriculumData.porSemestre[sem] || [];
      creditosPorSemestre[sem] = ramosSem
        .filter(ramo => MallaApp.isApproved(ramo))
        .reduce((sum, ramo) => sum + (CurriculumData.creditosRamos[ramo] || 0), 0);
    }

    // Encontrar semestres con carga muy baja
    const semestresBajos = Object.entries(creditosPorSemestre)
      .filter(([sem, creditos]) => creditos < this.config.creditosPorSemestreIdeal * 0.6)
      .map(([sem]) => parseInt(sem));

    if (semestresBajos.length > 0) {
      return {
        tipo: 'carga_desbalanceada',
        mensaje: `Carga académica baja en ${semestresBajos.length} semestre(s)`,
        detalles: `Semestres con carga baja: ${semestresBajos.join(', ')}`,
        prioridad: 'baja'
      };
    }

    return null;
  },

  // Identificar problemas de atraso
  identificarProblemas() {
    const problemas = [];
    const { atrasoSemestral, deficitCreditos } = this.calcularMetricasAtraso();

    // Análisis de ramos críticos no aprobados
    const ramosCriticos = this.identificarRamosCriticos();
    if (ramosCriticos.length > 0) {
      problemas.push({
        tipo: 'ramos_criticos',
        mensaje: `Tienes ${ramosCriticos.length} ramo(s) crítico(s) pendiente(s)`,
        detalles: ramosCriticos,
        prioridad: 'alta'
      });
    }

    // Análisis de secuencias bloqueadas
    const secuenciasBloqueadas = this.analizarSecuenciasBloqueadas();
    if (secuenciasBloqueadas.length > 0) {
      problemas.push({
        tipo: 'secuencias_bloqueadas',
        mensaje: 'Secuencias académicas bloqueadas detectadas',
        detalles: secuenciasBloqueadas,
        prioridad: 'media'
      });
    }

    // Análisis de distribución de carga
    const distribucionProblema = this.analizarDistribucionCarga();
    if (distribucionProblema) {
      problemas.push(distribucionProblema);
    }

    // Análisis general de atraso
    if (atrasoSemestral > 0) {
      problemas.push({
        tipo: 'atraso_semestral',
        mensaje: `Vas ${atrasoSemestral} semestre(s) atrasado`,
        detalles: `Semestre ideal: ${this.calcularMetricasAtraso().semestreIdeal}, Actual: ${this.calcularMetricasAtraso().semestreReal}`,
        prioridad: atrasoSemestral > 1 ? 'alta' : 'media'
      });
    }

    if (deficitCreditos > this.config.margenAtraso) {
      problemas.push({
        tipo: 'deficit_creditos',
        mensaje: `Tienes un déficit de ${deficitCreditos} créditos`,
        detalles: `Considera aumentar tu carga académica este semestre`,
        prioridad: 'media'
      });
    }

    return problemas;
  }
};

// Módulo principal de la aplicación ACTUALIZADO
const MallaApp = {
  // Estado de la aplicación
  state: {
    aprobadasSiglas: [],
    areaSeleccionada: 'all',
    busqueda: '',
    mostrarSoloDisponibles: false,
    nombreToEl: new Map(),
    estadoAnterior: new Map(),
    // NUEVO: Semestre actual del usuario
    semestreActual: 1
  },
  
  // Inicialización
  init() {
    // Inicializar módulos
    ThemeManager.init();
    NotificationManager.init();
    CurriculumData.init();
    AtrasoAnalyzer.init();
    
    // Configurar persistencia
    this.setupPersistence();
    
    // Cargar datos aprobados
    this.loadApprovedCourses();
    
    // NUEVO: Cargar semestre actual guardado
    this.loadSemestreActual();
    
    // Renderizar interfaz
    this.render();
    
    // Configurar event listeners
    this.setupEventListeners();
    
    // Configurar tooltips táctiles
    this.setupTouchTooltips();
    
    // Configurar navegación por teclado
    this.setupKeyboardNavigation();
  },
  
  // NUEVO: Cargar semestre actual
  loadSemestreActual() {
    const semestreGuardado = localStorage.getItem(STORAGE_KEYS.semestreActual);
    if (semestreGuardado) {
      this.state.semestreActual = parseInt(semestreGuardado);
      // Actualizar el selector en la UI
      const selector = document.getElementById('select-semestre');
      if (selector) {
        selector.value = this.state.semestreActual;
      }
    }
  },
  
  // NUEVO: Guardar semestre actual
  guardarSemestreActual(semestre) {
    this.state.semestreActual = parseInt(semestre);
    localStorage.setItem(STORAGE_KEYS.semestreActual, semestre);
    // Recalcular análisis si está visible
    if (document.getElementById('atraso-container').style.display !== 'none') {
      this.mostrarAnalisisAtraso();
    }
  },
  
  // Configuración de persistencia
  setupPersistence() {
    const firmaMalla = JSON.stringify(CurriculumData.cursosRaw.map(c => c.sigla).sort());
    const firmaGuardada = localStorage.getItem(STORAGE_KEYS.firmaMalla);

    // Si la malla ha cambiado, limpiar datos guardados
    if (firmaGuardada && firmaGuardada !== firmaMalla) {
      localStorage.removeItem(STORAGE_KEYS.ramosAprobados);
    }

    localStorage.setItem(STORAGE_KEYS.firmaMalla, firmaMalla);
  },
  
  // Cargar cursos aprobados
  loadApprovedCourses() {
    this.state.aprobadasSiglas = JSON.parse(localStorage.getItem(STORAGE_KEYS.ramosAprobados) || '[]');
    const setSiglasValidas = new Set(CurriculumData.cursosRaw.map(c => c.sigla));

    // Filtrar solo siglas válidas
    this.state.aprobadasSiglas = this.state.aprobadasSiglas.filter(s => setSiglasValidas.has(s));
    localStorage.setItem(STORAGE_KEYS.ramosAprobados, JSON.stringify(this.state.aprobadasSiglas));
  },
  
  // Obtener nombres de cursos aprobados
  aprobadosNombres() {
    return this.state.aprobadasSiglas
      .map(s => CurriculumData.siglaToNombre.get(s))
      .filter(Boolean);
  },
  
  // Verificar si un curso está aprobado
  isApproved(nombre) {
    return new Set(this.aprobadosNombres()).has(nombre);
  },
  
  // Calcular créditos
  calcularCreditos() {
    let total = 0, completados = 0;
    for (const [nombre] of Object.entries(CurriculumData.ramos)) {
      const c = CurriculumData.creditosRamos[nombre] ?? 0; 
      total += c; 
      if (this.isApproved(nombre)) completados += c;
    }
    const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0;
    return { total, completados, porcentaje };
  },
  
  // Obtener prerrequisitos de un curso
  prerequisitosDe(nombre) {
    return [...(CurriculumData.prereqsPorNombre[nombre] || [])];
  },
  
  // Obtener todos los cursos que dependen de un curso
  obtenerTodosDependientes(nombre) {
    const out = new Set();
    const dfs = (n) => {
      for (const d of (CurriculumData.ramos[n]?.abre || [])) {
        if (!out.has(d)) {
          out.add(d);
          dfs(d);
        }
      }
    };
    dfs(nombre);
    return [...out];
  },
  
  // Verificar si un curso está disponible
  estaDisponible(nombre) {
    return this.prerequisitosDe(nombre).every(p => this.isApproved(p));
  },
  
  // Aprobar o desaprobar un curso
  toggleApproval(ramoNombre) {
    const sigla = CurriculumData.ramos[ramoNombre]?.sigla;
    if (!sigla) return;
    
    const isApproved = this.isApproved(ramoNombre);
    
    if (isApproved) {
      // Desaprobar curso y sus dependencias
      const dep = this.obtenerTodosDependientes(ramoNombre);
      const aEliminar = [ramoNombre, ...dep];
      
      // Animación de desaprobación
      Utils.$$('.ramo').forEach(el => {
        const n = el.querySelector('.ramo-nombre')?.textContent;
        if (n && aEliminar.includes(n)) el.classList.add('retirado');
      });

      const depSiglas = aEliminar.map(n => CurriculumData.ramos[n]?.sigla).filter(Boolean);
      this.state.aprobadasSiglas = this.state.aprobadasSiglas.filter(s => !depSiglas.includes(s));
      localStorage.setItem(STORAGE_KEYS.ramosAprobados, JSON.stringify(this.state.aprobadasSiglas));
      
      this.render();
      NotificationManager.showToast(`Has desaprobado ${ramoNombre} y sus dependencias`, 'info');
    } else {
      // Aprobar curso si está disponible
      if (this.estaDisponible(ramoNombre)) {
        if (!this.state.aprobadasSiglas.includes(sigla)) {
          this.state.aprobadasSiglas.push(sigla);
        }
        localStorage.setItem(STORAGE_KEYS.ramosAprobados, JSON.stringify(this.state.aprobadasSiglas));
        
        this.render();
        NotificationManager.showToast(`¡Felicidades! Has aprobado ${ramoNombre}`, 'success');
        NotificationManager.createConfetti();
      } else {
        NotificationManager.showToast('No puedes aprobar este ramo hasta completar sus prerrequisitos', 'info');
      }
    }
  },
  
  // Reiniciar progreso
  resetProgress() {
    if (confirm('¿Estás seguro de reiniciar todo el progreso?')) {
      localStorage.removeItem(STORAGE_KEYS.ramosAprobados);
      localStorage.removeItem(STORAGE_KEYS.semestreActual);
      this.state.aprobadasSiglas = [];
      this.state.semestreActual = 1;
      const selector = document.getElementById('select-semestre');
      if (selector) selector.value = '1';
      this.render();
      NotificationManager.showToast('Progreso reiniciado correctamente', 'info');
    }
  },
  
  // Exportar datos
  exportData() {
    const data = {
      aprobados: this.state.aprobadasSiglas,
      progreso: this.calcularCreditos(),
      semestreActual: this.state.semestreActual,
      fecha: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `progreso-malla-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    NotificationManager.showToast('Datos exportados correctamente', 'success');
  },
  
  // ACTUALIZADO: Mostrar análisis de atraso MEJORADO
  mostrarAnalisisAtraso() {
    const container = Utils.$('#atraso-container');
    const metricas = AtrasoAnalyzer.calcularMetricasAtraso();
    const recomendaciones = AtrasoAnalyzer.generarRecomendaciones();
    const analisisSemestre = AtrasoAnalyzer.analizarSemestreActual();

    // Actualizar métricas
    Utils.$('#metrica-atraso').textContent = metricas.atrasoSemestral;
    Utils.$('#metrica-atraso').className = `metrica-valor ${
      metricas.atrasoSemestral > 1 ? 'critico' : 
      metricas.atrasoSemestral > 0 ? 'advertencia' : 'normal'
    }`;

    Utils.$('#metrica-deficit').textContent = metricas.deficitCreditos;
    Utils.$('#metrica-deficit').className = `metrica-valor ${
      metricas.deficitCreditos > 12 ? 'critico' : 
      metricas.deficitCreditos > 6 ? 'advertencia' : 'normal'
    }`;

    const ramosCriticos = AtrasoAnalyzer.identificarRamosCriticos();
    Utils.$('#metrica-criticos').textContent = ramosCriticos.length;
    Utils.$('#metrica-criticos').className = `metrica-valor ${
      ramosCriticos.length > 3 ? 'critico' : 
      ramosCriticos.length > 1 ? 'advertencia' : 'normal'
    }`;

    // Mostrar recomendaciones
    const recomendacionesContainer = Utils.$('#recomendaciones-list');
    recomendacionesContainer.innerHTML = '';

    if (recomendaciones.length === 0) {
      recomendacionesContainer.innerHTML = `
        <div class="recomendacion-item normal">
          <div class="recomendacion-titulo">🎉 ¡Excelente progreso!</div>
          <div class="recomendacion-acciones">
            <p>Vas al día con tu plan de estudios. ¡Sigue así!</p>
            <p><strong>Semestre ${this.state.semestreActual}°:</strong> ${analisisSemestre.aprobados}/${analisisSemestre.totalRamos} ramos aprobados</p>
          </div>
        </div>
      `;
    } else {
      recomendaciones.forEach(rec => {
        const item = document.createElement('div');
        item.className = `recomendacion-item ${rec.prioridad === 'alta' ? 'alta' : rec.prioridad === 'media' ? 'media' : 'normal'}`;
        
        item.innerHTML = `
          <div class="recomendacion-titulo">${rec.titulo}</div>
          <div class="recomendacion-acciones">
            <ul>
              ${rec.acciones.map(acc => `<li>${acc}</li>`).join('')}
            </ul>
          </div>
        `;
        
        recomendacionesContainer.appendChild(item);
      });
    }

    container.style.display = 'block';
    
    // Scroll suave al panel
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },
  
  // Sincronizar anchos de tooltips
  syncBoxWidths() {
    Utils.$$('.ramo').forEach(el => {
      const w = Math.round(el.getBoundingClientRect().width);
      el.style.setProperty('--box-w', w + 'px');
    });
  },
  
  // Resaltar prerrequisitos
  highlightPrereqs(nombre, on) {
    const selfEl = this.state.nombreToEl.get(nombre);
    if (selfEl) selfEl.classList.toggle('is-self', on);
    
    for (const p of (CurriculumData.prereqsPorNombre[nombre] || [])) {
      this.state.nombreToEl.get(p)?.classList.toggle('is-prereq', on);
    }
  },
  
  // Renderizar la malla
  render() {
    const totalRamos = Object.keys(CurriculumData.ramos).length;
    const aprobadosList = this.aprobadosNombres();
    const { total: creditosTotal, completados: creditosAprobados, porcentaje } = this.calcularCreditos();
    
    // Actualizar estadísticas
    Utils.$('#total-ramos').textContent = totalRamos;
    Utils.$('#aprobados-ramos').textContent = aprobadosList.length;
    Utils.$('#creditos-total').textContent = `${creditosAprobados}/${creditosTotal}`;
    Utils.$('#porcentaje').textContent = `${porcentaje}%`;
    Utils.$('#barraProgreso').style.width = porcentaje + '%';
    Utils.$('#textoProgreso').textContent = porcentaje + '%';
    
    const frag = document.createDocumentFragment();
    let semestresRenderizados = 0;
    const nuevoEstado = new Map();
    this.state.nombreToEl.clear();
    
    // Renderizar cada semestre
    for (let sem = 1; sem <= CurriculumData.maxSemestre; sem++) {
      const ramosSem = (CurriculumData.porSemestre[sem] || [])
        .filter(ramo => {
          // Filtro por área
          if (this.state.areaSeleccionada !== 'all' && this.state.areaSeleccionada !== 'none') {
            if (CurriculumData.ramos[ramo].area !== this.state.areaSeleccionada) return false;
          }
          
          // Filtro por búsqueda
          if (this.state.busqueda) {
            const b = Utils.normalizeText(this.state.busqueda);
            const n = Utils.normalizeText(ramo);
            const s = Utils.normalizeText(CurriculumData.ramos[ramo].sigla || '');
            if (!n.includes(b) && !s.includes(b)) return false;
          }
          
          // Filtro por disponibilidad
          if (this.state.mostrarSoloDisponibles) {
            if (!this.isApproved(ramo) && !this.estaDisponible(ramo)) return false;
          }
          
          return true;
        });
      
      if (!ramosSem.length) continue;
      
      const cont = document.createElement('div');
      cont.className = 'semestre';
      
      const title = document.createElement('h3');
      title.textContent = `${sem}° Semestre`;
      cont.appendChild(title);
      
      const innerFrag = document.createDocumentFragment();
      
      ramosSem.forEach(ramo => {
        const info = CurriculumData.ramos[ramo];
        const div = document.createElement('div');
        div.className = 'ramo';
        div.dataset.area = info.area;
        div.dataset.creditos = CurriculumData.creditosRamos[ramo] ?? '';
        div.setAttribute('role', 'listitem');
        div.tabIndex = 0;
        
        const contenido = document.createElement('div');
        const nombreEl = document.createElement('div');
        nombreEl.className = 'ramo-nombre';
        nombreEl.textContent = ramo;
        contenido.appendChild(nombreEl);
        
        const detalles = document.createElement('div');
        detalles.className = 'ramo-detalles';
        const siglaEl = document.createElement('span');
        siglaEl.className = 'ramo-sigla';
        siglaEl.textContent = info.sigla || 'SIGLA';
        const creditos = CurriculumData.creditosRamos[ramo];
        const creditosEl = document.createElement('span');
        creditosEl.className = 'ramo-creditos';
        creditosEl.textContent = `${creditos} créditos`;
        detalles.appendChild(siglaEl);
        detalles.appendChild(creditosEl);
        contenido.appendChild(detalles);
        div.appendChild(contenido);
        
        const prere = this.prerequisitosDe(ramo);
        const desbloqueado = prere.every(p => this.isApproved(p));
        const estadoKey = `${sem}:${ramo}`;
        nuevoEstado.set(estadoKey, desbloqueado);
        
        // Tooltip mejorado
        const tooltipText = `📚 ${ramo}\n📋 ${info.sigla} | ${creditos} créditos\n🏷️ ${info.area.charAt(0).toUpperCase() + info.area.slice(1)}\n\n${this.isApproved(ramo) ? '✅ Aprobado\nToca para desmarcar' : this.estaDisponible(ramo) ? '🟡 Disponible\nToca para aprobar' : `🔒 Bloqueado\nRequiere: ${prere.filter(p => !this.isApproved(p)).join(', ') || 'Ninguno'}`}`;
        
        div.setAttribute('data-tooltip', tooltipText);
        
        // Aplicar clases según estado
        if (this.isApproved(ramo)) {
          div.classList.add('aprobado');
          div.onclick = () => this.toggleApproval(ramo);
          div.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              this.toggleApproval(ramo);
            }
          };
        } else if (this.estaDisponible(ramo)) {
          div.classList.add('disponible');
          if (!this.state.estadoAnterior.get(estadoKey)) {
            div.classList.add('desbloqueado');
            void div.offsetWidth; // Forzar reflow
          }
          div.onclick = () => this.toggleApproval(ramo);
          div.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              this.toggleApproval(ramo);
            }
          };
        } else {
          div.classList.add('bloqueado');
        }
        
        // Resaltado de prerrequisitos
        div.addEventListener('mouseenter', () => this.highlightPrereqs(ramo, true));
        div.addEventListener('mouseleave', () => this.highlightPrereqs(ramo, false));
        div.addEventListener('focus', () => this.highlightPrereqs(ramo, true));
        div.addEventListener('blur', () => this.highlightPrereqs(ramo, false));
        
        this.state.nombreToEl.set(ramo, div);
        innerFrag.appendChild(div);
      });
      
      cont.appendChild(innerFrag);
      frag.appendChild(cont);
      semestresRenderizados++;
    }
    
    // Actualizar DOM
    const malla = Utils.$('#malla');
    malla.innerHTML = '';
    malla.appendChild(frag);
    
    // Mostrar mensaje si no hay resultados
    if (semestresRenderizados === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'no-results';
      noResults.innerHTML = `<ion-icon name="search-outline" style="font-size: 32px; margin-bottom: 8px;"></ion-icon><br>No se encontraron ramos que coincidan con la búsqueda`;
      malla.appendChild(noResults);
    }
    
    this.state.estadoAnterior.clear();
    nuevoEstado.forEach((v, k) => this.state.estadoAnterior.set(k, v));
    
    requestAnimationFrame(() => this.syncBoxWidths());
  },
  
  // Configurar tooltips táctiles
  setupTouchTooltips() {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouch) return;
    
    const tip = Utils.$('#touch-tip');
    const CONFIG = {
      tipMinW: 140,
      tipMaxW: null,
      tapMs: 140,
      moveHoverThrottleMs: 400,
      tipLongPress: false
    };
    
    let pressTimer = null;
    let pressTarget = null;
    let startX = 0, startY = 0;
    const MOVE_TOL = 12;
    const LONG_MS = 500;
    
    function showTipFor(target) {
      const txt = target.getAttribute('data-tooltip');
      if (!txt) return;
      
      const boxW = target.getBoundingClientRect().width;
      const maxFromCss = Utils.cssVarPx('--tip-max-w', 420);
      const maxPx = (CONFIG.tipMaxW ?? maxFromCss) || 420;
      const vwClamp = Math.max(0, window.innerWidth - 24);
      let w = Math.min(boxW, maxPx, vwClamp);
      w = Math.max(CONFIG.tipMinW, w);
      
      tip.style.width = Math.round(w) + 'px';
      tip.textContent = txt;
      tip.style.display = 'block';
      positionTip(target);
      
      clearTimeout(tip._hideT);
      tip._hideT = setTimeout(hideTip, 2500);
    }
    
    function hideTip() {
      tip.style.display = 'none';
      tip.textContent = '';
      tip.style.width = 'auto';
    }
    
    function positionTip(target) {
      const rect = target.getBoundingClientRect();
      const tipRect = tip.getBoundingClientRect();
      let x = rect.left + rect.width/2;
      let y = rect.top - 8;
      
      if (rect.top - tipRect.height - 16 < 0) {
        y = rect.bottom + tipRect.height/2 + 8;
        tip.style.transform = 'translate(-50%, -8px)';
      } else {
        tip.style.transform = 'translate(-50%, -8px)';
      }
      
      tip.style.left = x + 'px';
      tip.style.top = y + 'px';
    }
    
    function clearPress() {
      clearTimeout(pressTimer);
      pressTimer = null;
      pressTarget = null;
    }
    
    function onTouchStart(e) {
      const t = e.target.closest('.ramo');
      if (!t) return;
      
      pressTarget = t;
      const touch = e.changedTouches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      
      clearPress();
      
      if (CONFIG.tipLongPress) {
        pressTimer = setTimeout(() => {
          showTipFor(t);
        }, LONG_MS);
      }
    }
    
    function onTouchMove(e) {
      if (!pressTimer) return;
      
      const touch = e.changedTouches[0];
      if (Math.abs(touch.clientX - startX) > MOVE_TOL || Math.abs(touch.clientY - startY) > MOVE_TOL) {
        clearPress();
      }
    }
    
    function onTouchEnd() {
      clearPress();
    }
    
    function onScrollOrOutsideTouch() {
      hideTip();
    }
    
    document.addEventListener('touchstart', onTouchStart, {passive: true});
    document.addEventListener('touchmove', onTouchMove, {passive: true});
    document.addEventListener('touchend', onTouchEnd, {passive: true});
    document.addEventListener('scroll', onScrollOrOutsideTouch, true);
  },
  
  // ACTUALIZADO: Configurar event listeners con nuevo selector
  setupEventListeners() {
    // NUEVO: Selector de semestre
    const semestreSelector = document.getElementById('select-semestre');
    if (semestreSelector) {
      semestreSelector.addEventListener('change', (e) => {
        this.guardarSemestreActual(e.target.value);
        NotificationManager.showToast(`Semestre actual actualizado a: ${e.target.value}°`, 'info');
      });
    }
    
    // Filtros de área
    Utils.$$('.area-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('active') && btn.dataset.area === this.state.areaSeleccionada) {
          btn.classList.remove('active');
          this.state.areaSeleccionada = 'none';
        } else {
          Utils.$$('.area-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.state.areaSeleccionada = btn.dataset.area;
        }
        this.render();
      });
    });
    
    // Búsqueda con debounce
    const searchInput = Utils.$('#search-input');
    const debouncedSearch = Utils.debounce((e) => {
      this.state.busqueda = e.target.value;
      this.render();
    }, 120);
    
    searchInput.addEventListener('input', debouncedSearch);
    
    // Toggle mostrar solo disponibles
    Utils.$('#toggle-disponibles').addEventListener('click', () => {
      this.state.mostrarSoloDisponibles = !this.state.mostrarSoloDisponibles;
      const boton = Utils.$('#toggle-disponibles');
      
      if (this.state.mostrarSoloDisponibles) {
        boton.classList.add('active');
        boton.innerHTML = '<ion-icon name="eye-off-outline"></ion-icon> Mostrar Todos';
      } else {
        boton.classList.remove('active');
        boton.innerHTML = '<ion-icon name="eye-outline"></ion-icon> Solo Disponibles';
      }
      
      this.render();
    });
    
    // Botón de reinicio
    Utils.$('#btn-reset').addEventListener('click', () => this.resetProgress());
    
    // Botón de exportación
    Utils.$('#export-data').addEventListener('click', () => this.exportData());
    
    // Botón de análisis de atraso
    Utils.$('#btn-analisis-atraso').addEventListener('click', () => {
      this.mostrarAnalisisAtraso();
    });

    // Botón para cerrar análisis
    Utils.$('#cerrar-analisis').addEventListener('click', () => {
      Utils.$('#atraso-container').style.display = 'none';
    });
  },
  
  // Configurar navegación por teclado
  setupKeyboardNavigation() {
    const isVisible = (el) => !!(el.offsetParent);
    const $ramos = () => Array.from(document.querySelectorAll('.ramo')).filter(isVisible);
    
    const center = (el) => {
      const r = el.getBoundingClientRect();
      return {x: r.left + r.width/2, y: r.top + r.height/2};
    };
    
    function pickInDirection(from, dir) {
      const origin = center(from);
      const candidates = $ramos().filter(el => !el.classList.contains('bloqueado') && el !== from);
      if (!candidates.length) return null;
      
      const weight = (dx, dy) => {
        if (dir === 'ArrowRight' && dx > 0) return dx*dx + (dy*dy)*0.7;
        if (dir === 'ArrowLeft'  && dx < 0) return dx*dx + (dy*dy)*0.7;
        if (dir === 'ArrowDown'  && dy > 0) return (dy*dy) + (dx*dx)*0.7;
        if (dir === 'ArrowUp'    && dy < 0) return (dy*dy) + (dx*dx)*0.7;
        return Infinity;
      };
      
      let best = null, bestScore = Infinity;
      for (const el of candidates) {
        const c = center(el);
        const dx = c.x - origin.x, dy = c.y - origin.y;
        const score = weight(dx, dy);
        if (score < bestScore) {
          bestScore = score;
          best = el;
        }
      }
      return isFinite(bestScore) ? best : null;
    }
    
    document.addEventListener('focusin', (ev) => {
      const el = ev.target;
      if (!(el instanceof HTMLElement)) return;
      if (!el.classList?.contains('ramo')) return;
      if (!el.classList.contains('bloqueado')) return;
      
      const next = pickInDirection(el, 'ArrowRight') ||
                  pickInDirection(el, 'ArrowDown') ||
                  pickInDirection(el, 'ArrowLeft') ||
                  pickInDirection(el, 'ArrowUp');
      
      if (next) {
        setTimeout(() => next.focus(), 0);
      }
    });
    
    document.addEventListener('keydown', (ev) => {
      const { key } = ev;
      const active = document.activeElement;
      const dentroDeRamo = active?.classList?.contains('ramo');
      
      if ((key === 'Enter' || key === ' ') && dentroDeRamo) {
        ev.preventDefault();
        active.click?.();
        return;
      }
      
      if (!['ArrowRight','ArrowLeft','ArrowUp','ArrowDown'].includes(key)) return;
      
      if (!dentroDeRamo) {
        const primero = $ramos().find(el => !el.classList.contains('bloqueado'));
        if (primero) {
          primero.focus();
          ev.preventDefault();
        }
        return;
      }
      
      const next = pickInDirection(active, key);
      if (next) {
        next.focus();
        ev.preventDefault();
      }
    });
  }
};

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  MallaApp.init();
});
