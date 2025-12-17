// ========= MODULARIZACIÓN: Separación de responsabilidades =========

// Módulo de utilidades MEJORADO
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
  },
  
  // NUEVO: Memoización simple
  memoize: (fn) => {
    const cache = new Map();
    return (...args) => {
      const key = JSON.stringify(args);
      if (cache.has(key)) return cache.get(key);
      const result = fn(...args);
      cache.set(key, result);
      return result;
    };
  },
  
  // NUEVO: Validar prerrequisitos circulares
  detectCircularDeps: (graph) => {
    const visited = new Set();
    const recStack = new Set();
    const cycles = [];
    
    function dfs(node, path) {
      if (recStack.has(node)) {
        cycles.push([...path, node]);
        return;
      }
      if (visited.has(node)) return;
      
      visited.add(node);
      recStack.add(node);
      path.push(node);
      
      (graph[node] || []).forEach(neighbor => {
        dfs(neighbor, [...path]);
      });
      
      recStack.delete(node);
      path.pop();
    }
    
    Object.keys(graph).forEach(node => dfs(node, []));
    return cycles;
  }
};

// Módulo de datos de la malla MEJORADO
const CurriculumData = {
  // Datos crudos (sin cambios)
  cursosRaw: [/* ... mismos datos ... */],
  
  // Estructuras de datos procesadas
  siglaToNombre: new Map(),
  nombreToSigla: new Map(), // NUEVO: Mapeo inverso
  ramos: {},
  creditosRamos: {},
  prereqsPorNombre: {},
  porSemestre: {},
  maxSemestre: 0,
  
  // NUEVO: Datos precalculados para análisis
  creditosAcumuladosIdeal: {}, // Créditos acumulados por semestre en malla ideal
  dependenciasDirectas: {}, // Dependencias directas por nombre
  dependenciasInversas: {}, // Dependencias inversas por nombre
  caminosCriticosCache: new Map(), // Cache de caminos críticos
  
  init() {
    this.processData();
    this.precomputeCriticalPaths();
  },
  
  processData() {
    // Validar datos antes de procesar
    this.validateData();
    
    // Inicializar estructuras
    this.siglaToNombre.clear();
    this.nombreToSigla.clear();
    this.ramos = {};
    this.creditosRamos = {};
    this.prereqsPorNombre = {};
    this.porSemestre = {};
    this.dependenciasDirectas = {};
    this.dependenciasInversas = {};
    
    // 1. Mapeos bidireccionales
    for (const c of this.cursosRaw) {
      // Validar créditos
      if (c.creditos === undefined || c.creditos === null) {
        console.warn(`Curso sin créditos: ${c.sigla} - ${c.nombre}`);
        c.creditos = 0;
      }
      
      this.siglaToNombre.set(c.sigla, c.nombre);
      this.nombreToSigla.set(c.nombre, c.sigla);
      this.ramos[c.nombre] = { 
        semestre: c.sem, 
        area: c.area, 
        sigla: c.sigla, 
        abre: [] 
      };
      this.creditosRamos[c.nombre] = c.creditos;
      this.prereqsPorNombre[c.nombre] = (c.prereqs || [])
        .map(sig => this.siglaToNombre.get(sig))
        .filter(Boolean);
    }
    
    // 2. Calcular créditos acumulados por semestre (ideal)
    this.calcularCreditosAcumulados();
    
    // 3. Procesar dependencias directas e inversas
    this.procesarDependencias();
    
    // 4. Organizar por semestre
    for (const [nombre, info] of Object.entries(this.ramos)) {
      if (!this.porSemestre[info.semestre]) {
        this.porSemestre[info.semestre] = [];
      }
      this.porSemestre[info.semestre].push(nombre);
    }
    
    // 5. Encontrar el semestre máximo
    this.maxSemestre = Math.max(...Object.values(this.ramos).map(r => r.semestre));
  },
  
  // NUEVO: Validar datos críticos
  validateData() {
    const issues = [];
    
    // 1. Verificar siglas únicas
    const siglas = new Set();
    this.cursosRaw.forEach(c => {
      if (siglas.has(c.sigla)) {
        issues.push(`Sigla duplicada: ${c.sigla}`);
      }
      siglas.add(c.sigla);
    });
    
    // 2. Verificar prerrequisitos existentes
    const todasSiglas = new Set(this.cursosRaw.map(c => c.sigla));
    this.cursosRaw.forEach(c => {
      (c.prereqs || []).forEach(p => {
        if (!todasSiglas.has(p)) {
          issues.push(`Prerrequisito inexistente: ${p} para ${c.sigla}`);
        }
      });
    });
    
    if (issues.length > 0) {
      console.warn('Problemas detectados en datos:', issues);
    }
  },
  
  // NUEVO: Calcular créditos acumulados por semestre
  calcularCreditosAcumulados() {
    this.creditosAcumuladosIdeal = {};
    let acumulado = 0;
    
    for (let sem = 1; sem <= 11; sem++) {
      const ramosSem = this.cursosRaw.filter(c => c.sem === sem);
      const creditosSem = ramosSem.reduce((sum, c) => sum + (c.creditos || 0), 0);
      acumulado += creditosSem;
      this.creditosAcumuladosIdeal[sem] = acumulado;
    }
  },
  
  // NUEVO: Procesar dependencias eficientemente
  procesarDependencias() {
    // Inicializar estructuras
    Object.keys(this.ramos).forEach(nombre => {
      this.dependenciasDirectas[nombre] = new Set();
      this.dependenciasInversas[nombre] = new Set();
    });
    
    // Llenar dependencias directas (qué cursos ABRE cada curso)
    for (const [nombre, lista] of Object.entries(this.prereqsPorNombre)) {
      for (const p of lista) {
        if (this.ramos[p]) {
          this.ramos[p].abre.push(nombre);
          this.dependenciasDirectas[p].add(nombre);
          this.dependenciasInversas[nombre].add(p);
        }
      }
    }
  },
  
  // NUEVO: Precalcular caminos críticos
  precomputeCriticalPaths() {
    this.caminosCriticosCache.clear();
    
    // Para cada ramo, calcular la profundidad máxima de dependencias
    for (const nombre of Object.keys(this.ramos)) {
      this.getCriticalPathLength(nombre);
    }
  },
  
  // NUEVO: Obtener longitud del camino crítico (memoizado)
  getCriticalPathLength: Utils.memoize(function(nombre) {
    const dependientes = this.dependenciasDirectas[nombre] || new Set();
    if (dependientes.size === 0) return 0;
    
    let maxDepth = 0;
    for (const dep of dependientes) {
      const depth = 1 + this.getCriticalPathLength(dep);
      if (depth > maxDepth) maxDepth = depth;
    }
    
    return maxDepth;
  }),
  
  // NUEVO: Obtener semestre ideal basado en créditos acumulados
  getSemestreIdeal(creditosAprobados) {
    for (let sem = 1; sem <= this.maxSemestre; sem++) {
      if (creditosAprobados <= this.creditosAcumuladosIdeal[sem]) {
        return sem;
      }
    }
    return this.maxSemestre;
  }
};

// Módulo de análisis de atraso MEJORADO CON CÁLCULOS REALES
const AtrasoAnalyzer = {
  // Configuración con valores realistas
  config: {
    creditosPorSemestrePromedio: 22, // Promedio real de la malla
    semestresTotales: 11,
    margenAtraso: 6,
    umbralImportanciaBase: 2,
  },

  // NUEVO: Sistema de caché
  cache: {
    metricas: null,
    recomendaciones: null,
    ramosCriticos: null,
    timestamp: 0,
    TTL: 2000 // 2 segundos
  },

  init() {
    this.config = { ...this.config, ...JSON.parse(localStorage.getItem('config_atraso') || '{}') };
    this.invalidateCache();
  },

  // NUEVO: Invalidar caché cuando cambian datos
  invalidateCache() {
    this.cache = {
      metricas: null,
      recomendaciones: null,
      ramosCriticos: null,
      timestamp: 0,
      TTL: 2000
    };
  },

  // NUEVO: Obtener con caché
  getCached(key, computeFn) {
    const now = Date.now();
    if (this.cache[key] && now - this.cache.timestamp < this.cache.TTL) {
      return this.cache[key];
    }
    this.cache[key] = computeFn();
    this.cache.timestamp = now;
    return this.cache[key];
  },

  getSemestreActual() {
    return MallaApp.state.semestreActual || 1;
  },

  // CORREGIDO: Cálculo de semestre ideal REALISTA
  calcularMetricasAtraso() {
    return this.getCached('metricas', () => {
      const { completados: creditosAprobados } = MallaApp.calcularCreditos();
      const semestreReal = this.getSemestreActual();
      
      // CORRECCIÓN: Usar créditos acumulados reales de la malla
      const semestreIdeal = CurriculumData.getSemestreIdeal(creditosAprobados);
      
      // Calcular créditos esperados para el semestre actual (ideal)
      const creditosEsperadosIdeal = CurriculumData.creditosAcumuladosIdeal[semestreIdeal] || 0;
      const creditosEsperadosActual = CurriculumData.creditosAcumuladosIdeal[semestreReal] || 0;
      
      const atrasoSemestral = Math.max(0, semestreReal - semestreIdeal);
      const deficitCreditos = Math.max(0, creditosEsperadosActual - creditosAprobados);
      
      // Umbral dinámico basado en semestre
      const margenAdaptativo = Math.max(6, semestreReal * 2);
      
      return {
        semestreIdeal,
        semestreReal,
        atrasoSemestral,
        deficitCreditos,
        creditosAprobados,
        creditosEsperadosIdeal,
        creditosEsperadosActual,
        enAtraso: atrasoSemestral > 0 || deficitCreditos > margenAdaptativo,
        margenAdaptativo
      };
    });
  },

  // NUEVO: Análisis de carga semestral real
  analizarCargaSemestral() {
    const cargaPorSemestre = {};
    let maxCarga = 0;
    let minCarga = Infinity;
    
    for (let sem = 1; sem <= CurriculumData.maxSemestre; sem++) {
      const ramosSem = CurriculumData.porSemestre[sem] || [];
      const creditosSem = ramosSem.reduce((sum, ramo) => {
        return sum + (CurriculumData.creditosRamos[ramo] || 0);
      }, 0);
      
      cargaPorSemestre[sem] = {
        creditos: creditosSem,
        ramos: ramosSem.length,
        aprobados: ramosSem.filter(r => MallaApp.isApproved(r)).length,
        pendientes: ramosSem.filter(r => !MallaApp.isApproved(r)).length
      };
      
      if (creditosSem > maxCarga) maxCarga = creditosSem;
      if (creditosSem < minCarga) minCarga = creditosSem;
    }
    
    return { cargaPorSemestre, maxCarga, minCarga };
  },

  // CORREGIDO: Análisis de semestre actual mejorado
  analizarSemestreActual() {
    const semestreActual = this.getSemestreActual();
    const ramosSemestreActual = CurriculumData.porSemestre[semestreActual] || [];
    
    const analisis = {
      semestre: semestreActual,
      totalRamos: ramosSemestreActual.length,
      creditosTotales: 0,
      aprobados: 0,
      creditosAprobados: 0,
      disponibles: 0,
      bloqueados: 0,
      ramosPendientes: []
    };

    ramosSemestreActual.forEach(ramo => {
      const creditos = CurriculumData.creditosRamos[ramo] || 0;
      analisis.creditosTotales += creditos;
      
      if (MallaApp.isApproved(ramo)) {
        analisis.aprobados++;
        analisis.creditosAprobados += creditos;
      } else if (MallaApp.estaDisponible(ramo)) {
        analisis.disponibles++;
        analisis.ramosPendientes.push({
          nombre: ramo,
          sigla: CurriculumData.ramos[ramo].sigla,
          creditos: creditos,
          disponible: true,
          critico: this.esRamoCritico(ramo)
        });
      } else {
        analisis.bloqueados++;
        const prereqsFaltantes = MallaApp.prerequisitosDe(ramo)
          .filter(p => !MallaApp.isApproved(p));
        
        analisis.ramosPendientes.push({
          nombre: ramo,
          sigla: CurriculumData.ramos[ramo].sigla,
          creditos: creditos,
          disponible: false,
          prerrequisitosFaltantes: prereqsFaltantes,
          critico: this.esRamoCritico(ramo)
        });
      }
    });

    // Calcular porcentajes
    analisis.porcentajeAprobados = analisis.totalRamos > 0 ? 
      Math.round((analisis.aprobados / analisis.totalRamos) * 100) : 0;
    analisis.porcentajeCreditos = analisis.creditosTotales > 0 ?
      Math.round((analisis.creditosAprobados / analisis.creditosTotales) * 100) : 0;

    return analisis;
  },

  // NUEVO: Identificar ramos críticos con umbral adaptativo
  identificarRamosCriticos() {
    return this.getCached('ramosCriticos', () => {
      const totalRamosPendientes = Object.keys(CurriculumData.ramos)
        .filter(nombre => !MallaApp.isApproved(nombre)).length;
      
      // Umbral adaptativo: 10% de los ramos pendientes, mínimo 2
      const umbralAdaptativo = Math.max(
        this.config.umbralImportanciaBase,
        Math.ceil(totalRamosPendientes * 0.1)
      );
      
      const criticos = [];
      
      for (const [nombre, info] of Object.entries(CurriculumData.ramos)) {
        if (MallaApp.isApproved(nombre)) continue;
        
        const dependientes = this.obtenerDependientesEfectivos(nombre);
        const importancia = dependientes.length;
        
        if (importancia >= umbralAdaptativo) {
          const disponible = MallaApp.estaDisponible(nombre);
          const longitudCamino = CurriculumData.getCriticalPathLength(nombre);
          
          criticos.push({
            nombre,
            sigla: info.sigla,
            semestre: info.semestre,
            importancia,
            ramosBloqueados: dependientes.length,
            disponible,
            longitudCamino,
            impacto: importancia * (longitudCamino + 1),
            creditos: CurriculumData.creditosRamos[nombre] || 0
          });
        }
      }
      
      // Ordenar por impacto (importancia × profundidad)
      return criticos.sort((a, b) => b.impacto - a.impacto);
    });
  },

  // NUEVO: Obtener dependientes efectivos (no aprobados)
  obtenerDependientesEfectivos(ramoInicio) {
    const visitados = new Set();
    const pendientes = [ramoInicio];
    const dependientesEfectivos = [];
    
    while (pendientes.length > 0) {
      const actual = pendientes.pop();
      
      for (const dependiente of (CurriculumData.dependenciasDirectas[actual] || [])) {
        if (visitados.has(dependiente)) continue;
        visitados.add(dependiente);
        
        // Solo considerar dependientes no aprobados
        if (!MallaApp.isApproved(dependiente)) {
          dependientesEfectivos.push(dependiente);
          pendientes.push(dependiente);
        }
      }
    }
    
    return dependientesEfectivos;
  },

  // NUEVO: Verificar si un ramo es crítico
  esRamoCritico(nombre) {
    const criticos = this.identificarRamosCriticos();
    return criticos.some(c => c.nombre === nombre);
  },

  // NUEVO: Análisis de secuencias bloqueadas (optimizado)
  analizarSecuenciasBloqueadas() {
    const secuencias = [];
    const visitados = new Set();
    
    for (const nombre of Object.keys(CurriculumData.ramos)) {
      if (MallaApp.isApproved(nombre) || visitados.has(nombre)) continue;
      
      const secuencia = this.encontrarSecuenciaBloqueada(nombre);
      if (secuencia.length >= 2) {
        secuencias.push({
          inicio: secuencia[0],
          longitud: secuencia.length,
          ruta: secuencia,
          criticidad: secuencia.length * 2
        });
        secuencia.forEach(r => visitados.add(r));
      }
    }
    
    return secuencias.sort((a, b) => b.criticidad - a.criticidad);
  },

  // NUEVO: Encontrar secuencia bloqueada (iterativo, más eficiente)
  encontrarSecuenciaBloqueada(ramoInicio) {
    const secuencia = [];
    const pila = [{ ramo: ramoInicio, nivel: 0 }];
    const niveles = new Map();
    
    while (pila.length > 0) {
      const { ramo, nivel } = pila.pop();
      
      if (secuencia.includes(ramo)) continue;
      secuencia.push(ramo);
      niveles.set(ramo, nivel);
      
      // Obtener dependientes no aprobados
      const dependientes = Array.from(CurriculumData.dependenciasDirectas[ramo] || [])
        .filter(dep => !MallaApp.isApproved(dep));
      
      for (const dep of dependientes) {
        pila.push({ ramo: dep, nivel: nivel + 1 });
      }
    }
    
    return secuencia;
  },

  // CORREGIDO: Generar recomendaciones más precisas
  generarRecomendaciones() {
    return this.getCached('recomendaciones', () => {
      const metricas = this.calcularMetricasAtraso();
      const analisisSemestre = this.analizarSemestreActual();
      const ramosCriticos = this.identificarRamosCriticos();
      const secuenciasBloqueadas = this.analizarSecuenciasBloqueadas();
      const cargaSemestral = this.analizarCargaSemestral();
      
      const recomendaciones = [];
      
      // 1. ANÁLISIS DE SEMESTRE ACTUAL
      if (analisisSemestre.aprobados === 0 && metricas.semestreReal > 1) {
        recomendaciones.push({
          tipo: 'semestre_sin_progreso',
          titulo: '⚠️ Semestre actual sin progreso',
          acciones: [
            `No has aprobado ningún ramo del ${metricas.semestreReal}° semestre`,
            `Créditos esperados: ${analisisSemestre.creditosTotales}`,
            `Considera enfocarte en ${analisisSemestre.disponibles} ramo(s) disponible(s)`,
            analisisSemestre.disponibles > 0 ? 
              `Prioriza: ${analisisSemestre.ramosPendientes.filter(r => r.disponible).slice(0, 3).map(r => r.sigla).join(', ')}` :
              'Revisa prerrequisitos de ramos bloqueados'
          ],
          prioridad: 'alta'
        });
      }
      
      // 2. ATRASO SEMESTRAL
      if (metricas.atrasoSemestral > 0) {
        const nivel = metricas.atrasoSemestral > 1 ? 'alta' : 'media';
        recomendaciones.push({
          tipo: 'atraso_semestral',
          titulo: `📅 Atraso de ${metricas.atrasoSemestral} semestre(s)`,
          acciones: [
            `Semestre ideal: ${metricas.semestreIdeal}° (por créditos)`,
            `Semestre actual: ${metricas.semestreReal}°`,
            `Déficit: ${metricas.deficitCreditos} créditos`,
            metricas.atrasoSemestral > 1 ? 
              'Considera aumentar carga académica este semestre' :
              'Intenta aprobar al menos 1-2 ramos adicionales'
          ],
          prioridad: nivel
        });
      }
      
      // 3. RAMOS CRÍTICOS DISPONIBLES
      const criticosDisponibles = ramosCriticos.filter(r => r.disponible);
      if (criticosDisponibles.length > 0) {
        recomendaciones.push({
          tipo: 'criticos_disponibles',
          titulo: `🎯 ${criticosDisponibles.length} ramo(s) crítico(s) disponible(s)`,
          acciones: criticosDisponibles.slice(0, 3).map(c => 
            `${c.sigla} - Sem ${c.semestre} (bloquea ${c.ramosBloqueados} ramos, ${c.creditos} créditos)`
          ),
          prioridad: 'alta'
        });
      }
      
      // 4. PLANIFICACIÓN PRÓXIMO SEMESTRE
      if (metricas.semestreReal < CurriculumData.maxSemestre) {
        const planificacion = this.generarPlanificacionProximoSemestre(metricas.semestreReal);
        if (planificacion.length > 0) {
          recomendaciones.push({
            tipo: 'planificacion_futura',
            titulo: `📋 Planificación para ${metricas.semestreReal + 1}° Semestre`,
            acciones: planificacion,
            prioridad: 'media'
          });
        }
      }
      
      // 5. BALANCE DE CARGA
      const { cargaPorSemestre } = cargaSemestral;
      const cargas = Object.values(cargaPorSemestre).map(c => c.creditos);
      const cargaPromedio = cargas.reduce((a, b) => a + b, 0) / cargas.length;
      const cargaActual = cargaPorSemestre[metricas.semestreReal]?.creditos || 0;
      
      if (cargaActual > cargaPromedio * 1.5) {
        recomendaciones.push({
          tipo: 'carga_alta',
          titulo: '⚖️ Carga académica alta este semestre',
          acciones: [
            `Carga actual: ${cargaActual} créditos`,
            `Promedio: ${Math.round(cargaPromedio)} créditos`,
            'Considera distribuir mejor tu carga académica'
          ],
          prioridad: 'media'
        });
      }
      
      return recomendaciones;
    });
  },

  // NUEVO: Generar planificación realista para próximo semestre
  generarPlanificacionProximoSemestre(semestreActual) {
    const proximoSemestre = semestreActual + 1;
    const ramosProximoSem = CurriculumData.porSemestre[proximoSemestre] || [];
    
    const disponibles = ramosProximoSem
      .filter(ramo => !MallaApp.isApproved(ramo) && MallaApp.estaDisponible(ramo))
      .map(ramo => ({
        nombre: ramo,
        sigla: CurriculumData.ramos[ramo].sigla,
        creditos: CurriculumData.creditosRamos[ramo] || 0,
        critico: this.esRamoCritico(ramo),
        longitudCamino: CurriculumData.getCriticalPathLength(ramo)
      }));
    
    // Ordenar por: 1. Críticos, 2. Más créditos, 3. Mayor longitud de camino
    disponibles.sort((a, b) => {
      if (a.critico !== b.critico) return b.critico - a.critico;
      if (a.creditos !== b.creditos) return b.creditos - a.creditos;
      return b.longitudCamino - a.longitudCamino;
    });
    
    const sugerencias = [];
    const maxSugerencias = 4;
    let creditosTotales = 0;
    const maxCreditos = 24; // Carga máxima recomendada
    
    for (const ramo of disponibles) {
      if (sugerencias.length >= maxSugerencias) break;
      if (creditosTotales + ramo.creditos > maxCreditos) continue;
      
      const icono = ramo.critico ? '🟢' : '🔵';
      const tipo = ramo.critico ? 'CRÍTICO' : 'Recomendado';
      sugerencias.push(`${icono} ${ramo.sigla} - ${ramo.creditos} créditos (${tipo})`);
      creditosTotales += ramo.creditos;
    }
    
    if (sugerencias.length === 0 && ramosProximoSem.length > 0) {
      sugerencias.push('⚠️ Necesitas aprobar prerrequisitos primero');
    }
    
    return sugerencias;
  },

  // NUEVO: Análisis de progreso por área
  analizarProgresoPorArea() {
    const areas = {};
    
    for (const [nombre, info] of Object.entries(CurriculumData.ramos)) {
      const area = info.area;
      if (!areas[area]) {
        areas[area] = {
          totalRamos: 0,
          aprobados: 0,
          totalCreditos: 0,
          creditosAprobados: 0,
          ramos: []
        };
      }
      
      const creditos = CurriculumData.creditosRamos[nombre] || 0;
      areas[area].totalRamos++;
      areas[area].totalCreditos += creditos;
      
      if (MallaApp.isApproved(nombre)) {
        areas[area].aprobados++;
        areas[area].creditosAprobados += creditos;
      }
      
      areas[area].ramos.push({
        nombre,
        sigla: info.sigla,
        aprobado: MallaApp.isApproved(nombre),
        creditos
      });
    }
    
    // Calcular porcentajes
    for (const area in areas) {
      areas[area].porcentajeRamos = areas[area].totalRamos > 0 ?
        Math.round((areas[area].aprobados / areas[area].totalRamos) * 100) : 0;
      areas[area].porcentajeCreditos = areas[area].totalCreditos > 0 ?
        Math.round((areas[area].creditosAprobados / areas[area].totalCreditos) * 100) : 0;
    }
    
    return areas;
  }
};

// Módulo principal de la aplicación MEJORADO
const MallaApp = {
  state: {
    aprobadasSiglas: new Set(), // NUEVO: Usar Set para O(1)
    areaSeleccionada: 'all',
    busqueda: '',
    mostrarSoloDisponibles: false,
    nombreToEl: new Map(),
    estadoAnterior: new Map(),
    semestreActual: 1,
    cacheCreditos: null, // NUEVO: Cache para créditos
    cacheDisponibilidad: new Map() // NUEVO: Cache para disponibilidad
  },
  
  init() {
    // Inicializar módulos
    ThemeManager.init();
    NotificationManager.init();
    CurriculumData.init();
    AtrasoAnalyzer.init();
    
    // Configurar persistencia
    this.setupPersistence();
    
    // Cargar datos
    this.loadApprovedCourses();
    this.loadSemestreActual();
    
    // Renderizar
    this.render();
    
    // Configurar eventos
    this.setupEventListeners();
    this.setupTouchTooltips();
    this.setupKeyboardNavigation();
    
    // NUEVO: Inicializar cache
    this.invalidateCaches();
  },
  
  // NUEVO: Invalidar caches
  invalidateCaches() {
    this.state.cacheCreditos = null;
    this.state.cacheDisponibilidad.clear();
    AtrasoAnalyzer.invalidateCache();
  },
  
  loadSemestreActual() {
    const semestreGuardado = localStorage.getItem('semestre_actual');
    if (semestreGuardado) {
      this.state.semestreActual = parseInt(semestreGuardado);
      const selector = document.getElementById('select-semestre');
      if (selector) selector.value = this.state.semestreActual;
    }
  },
  
  guardarSemestreActual(semestre) {
    this.state.semestreActual = parseInt(semestre);
    localStorage.setItem('semestre_actual', semestre);
    this.invalidateCaches();
    
    if (document.getElementById('atraso-container').style.display !== 'none') {
      this.mostrarAnalisisAtraso();
    }
  },
  
  setupPersistence() {
    const firmaMalla = JSON.stringify(CurriculumData.cursosRaw.map(c => c.sigla).sort());
    const firmaGuardada = localStorage.getItem('firma_malla');
    
    if (firmaGuardada && firmaGuardada !== firmaMalla) {
      localStorage.removeItem('ramos_aprobados_siglas');
      localStorage.removeItem('semestre_actual');
    }
    
    localStorage.setItem('firma_malla', firmaMalla);
  },
  
  loadApprovedCourses() {
    try {
      const aprobadas = JSON.parse(localStorage.getItem('ramos_aprobados_siglas') || '[]');
      const setSiglasValidas = new Set(CurriculumData.cursosRaw.map(c => c.sigla));
      
      this.state.aprobadasSiglas = new Set(
        aprobadas.filter(s => setSiglasValidas.has(s))
      );
      
      this.saveApprovedCourses();
    } catch (e) {
      console.error('Error cargando cursos aprobados:', e);
      this.state.aprobadasSiglas = new Set();
    }
  },
  
  saveApprovedCourses() {
    localStorage.setItem('ramos_aprobados_siglas', 
      JSON.stringify(Array.from(this.state.aprobadasSiglas))
    );
  },
  
  aprobadosNombres() {
    return Array.from(this.state.aprobadasSiglas)
      .map(s => CurriculumData.siglaToNombre.get(s))
      .filter(Boolean);
  },
  
  isApproved(nombre) {
    const sigla = CurriculumData.nombreToSigla.get(nombre);
    return this.state.aprobadasSiglas.has(sigla);
  },
  
  // NUEVO: Calcular créditos con cache
  calcularCreditos() {
    if (this.state.cacheCreditos) return this.state.cacheCreditos;
    
    let total = 0, completados = 0;
    for (const [nombre, creditos] of Object.entries(CurriculumData.creditosRamos)) {
      total += creditos; 
      if (this.isApproved(nombre)) completados += creditos;
    }
    
    const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0;
    this.state.cacheCreditos = { total, completados, porcentaje };
    return this.state.cacheCreditos;
  },
  
  prerequisitosDe(nombre) {
    return [...(CurriculumData.prereqsPorNombre[nombre] || [])];
  },
  
  // NUEVO: Obtener dependientes con cache
  obtenerTodosDependientes(nombre) {
    const cacheKey = `deps:${nombre}`;
    if (this.state.cacheDisponibilidad.has(cacheKey)) {
      return this.state.cacheDisponibilidad.get(cacheKey);
    }
    
    const visitados = new Set();
    const pila = [nombre];
    const dependientes = [];
    
    while (pila.length > 0) {
      const actual = pila.pop();
      const hijos = CurriculumData.dependenciasDirectas[actual] || new Set();
      
      for (const hijo of hijos) {
        if (!visitados.has(hijo)) {
          visitados.add(hijo);
          dependientes.push(hijo);
          pila.push(hijo);
        }
      }
    }
    
    this.state.cacheDisponibilidad.set(cacheKey, dependientes);
    return dependientes;
  },
  
  // NUEVO: Verificar disponibilidad con cache
  estaDisponible(nombre) {
    const cacheKey = `disp:${nombre}`;
    if (this.state.cacheDisponibilidad.has(cacheKey)) {
      return this.state.cacheDisponibilidad.get(cacheKey);
    }
    
    const disponible = this.prerequisitosDe(nombre)
      .every(p => this.isApproved(p));
    
    this.state.cacheDisponibilidad.set(cacheKey, disponible);
    return disponible;
  },
  
  toggleApproval(ramoNombre) {
    const sigla = CurriculumData.ramos[ramoNombre]?.sigla;
    if (!sigla) return;
    
    const isApproved = this.isApproved(ramoNombre);
    
    if (isApproved) {
      // Desaprobar curso y sus dependencias
      const dep = this.obtenerTodosDependientes(ramoNombre);
      const aEliminar = [ramoNombre, ...dep];
      
      // Eliminar siglas correspondientes
      aEliminar.forEach(nombre => {
        const s = CurriculumData.nombreToSigla.get(nombre);
        if (s) this.state.aprobadasSiglas.delete(s);
      });
      
      this.saveApprovedCourses();
      this.invalidateCaches();
      this.render();
      
      NotificationManager.showToast(
        `Has desaprobado ${ramoNombre} y ${dep.length} dependencia(s)`, 
        'info'
      );
    } else {
      // Aprobar curso si está disponible
      if (this.estaDisponible(ramoNombre)) {
        this.state.aprobadasSiglas.add(sigla);
        this.saveApprovedCourses();
        this.invalidateCaches();
        this.render();
        
        NotificationManager.showToast(`¡Felicidades! Has aprobado ${ramoNombre}`, 'success');
        NotificationManager.createConfetti();
      } else {
        NotificationManager.showToast('Completa los prerrequisitos primero', 'info');
      }
    }
  },
  
  resetProgress() {
    if (confirm('¿Estás seguro de reiniciar todo el progreso?')) {
      localStorage.removeItem('ramos_aprobados_siglas');
      localStorage.removeItem('semestre_actual');
      this.state.aprobadasSiglas.clear();
      this.state.semestreActual = 1;
      this.invalidateCaches();
      
      const selector = document.getElementById('select-semestre');
      if (selector) selector.value = '1';
      
      this.render();
      NotificationManager.showToast('Progreso reiniciado', 'info');
    }
  },
  
  exportData() {
    const data = {
      aprobados: Array.from(this.state.aprobadasSiglas),
      progreso: this.calcularCreditos(),
      semestreActual: this.state.semestreActual,
      analisis: AtrasoAnalyzer.calcularMetricasAtraso(),
      fecha: new Date().toISOString(),
      version: '2.0'
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
    
    NotificationManager.showToast('Datos exportados', 'success');
  },
  
  // NUEVO: Mostrar análisis mejorado con estadísticas
  mostrarAnalisisAtraso() {
    const container = Utils.$('#atraso-container');
    const metricas = AtrasoAnalyzer.calcularMetricasAtraso();
    const recomendaciones = AtrasoAnalyzer.generarRecomendaciones();
    const analisisSemestre = AtrasoAnalyzer.analizarSemestreActual();
    const progresoAreas = AtrasoAnalyzer.analizarProgresoPorArea();
    
    // Actualizar métricas principales
    const metricaAtraso = Utils.$('#metrica-atraso');
    metricaAtraso.textContent = metricas.atrasoSemestral;
    metricaAtraso.className = `metrica-valor ${
      metricas.atrasoSemestral > 1 ? 'critico' : 
      metricas.atrasoSemestral > 0 ? 'advertencia' : 'normal'
    }`;

    const metricaDeficit = Utils.$('#metrica-deficit');
    metricaDeficit.textContent = metricas.deficitCreditos;
    metricaDeficit.className = `metrica-valor ${
      metricas.deficitCreditos > 15 ? 'critico' : 
      metricas.deficitCreditos > 8 ? 'advertencia' : 'normal'
    }`;

    const ramosCriticos = AtrasoAnalyzer.identificarRamosCriticos();
    const metricaCriticos = Utils.$('#metrica-criticos');
    metricaCriticos.textContent = ramosCriticos.length;
    metricaCriticos.className = `metrica-valor ${
      ramosCriticos.length > 4 ? 'critico' : 
      ramosCriticos.length > 2 ? 'advertencia' : 'normal'
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
            <p><strong>Semestre ${metricas.semestreReal}°:</strong> 
              ${analisisSemestre.aprobados}/${analisisSemestre.totalRamos} ramos (${analisisSemestre.porcentajeAprobados}%)</p>
            <p><strong>Créditos:</strong> 
              ${analisisSemestre.creditosAprobados}/${analisisSemestre.creditosTotales} (${analisisSemestre.porcentajeCreditos}%)</p>
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
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },
  
  syncBoxWidths() {
    // Throttle para mejor rendimiento
    if (this._syncBoxWidthsTimeout) clearTimeout(this._syncBoxWidthsTimeout);
    this._syncBoxWidthsTimeout = setTimeout(() => {
      Utils.$$('.ramo').forEach(el => {
        const w = Math.round(el.getBoundingClientRect().width);
        el.style.setProperty('--box-w', w + 'px');
      });
    }, 100);
  },
  
  highlightPrereqs(nombre, on) {
    const selfEl = this.state.nombreToEl.get(nombre);
    if (selfEl) selfEl.classList.toggle('is-self', on);
    
    for (const p of (CurriculumData.prereqsPorNombre[nombre] || [])) {
      this.state.nombreToEl.get(p)?.classList.toggle('is-prereq', on);
    }
  },
  
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
    
    // Renderizar semestres
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
        
        // NUEVO: Añadir indicador de ramo crítico
        const esCritico = AtrasoAnalyzer.esRamoCritico(ramo);
        if (esCritico) {
          div.classList.add('critico');
          div.setAttribute('data-critico', 'true');
        }
        
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
        
        // Tooltip mejorado con info crítica
        const tooltipLines = [
          `📚 ${ramo}`,
          `📋 ${info.sigla} | ${creditos} créditos`,
          `🏷️ ${info.area.charAt(0).toUpperCase() + info.area.slice(1)}`,
          esCritico ? '⚠️ RAMO CRÍTICO' : '',
          '',
          this.isApproved(ramo) ? 
            '✅ Aprobado\nToca para desmarcar' : 
          this.estaDisponible(ramo) ? 
            '🟡 Disponible\nToca para aprobar' : 
            `🔒 Bloqueado\nRequiere: ${prere.filter(p => !this.isApproved(p)).join(', ') || 'Ninguno'}`
        ].filter(line => line.trim() !== '');
        
        div.setAttribute('data-tooltip', tooltipLines.join('\n'));
        
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
            void div.offsetWidth;
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
      noResults.innerHTML = `
        <ion-icon name="search-outline" style="font-size: 32px; margin-bottom: 8px;"></ion-icon>
        <br>
        No se encontraron ramos que coincidan con la búsqueda
      `;
      malla.appendChild(noResults);
    }
    
    this.state.estadoAnterior.clear();
    nuevoEstado.forEach((v, k) => this.state.estadoAnterior.set(k, v));
    
    requestAnimationFrame(() => this.syncBoxWidths());
  },
  
  setupEventListeners() {
    // Selector de semestre
    const semestreSelector = document.getElementById('select-semestre');
    if (semestreSelector) {
      semestreSelector.addEventListener('change', (e) => {
        this.guardarSemestreActual(e.target.value);
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

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
  MallaApp.init();
});