import { STORAGE_KEYS } from '../core/constants.js';
import { Storage } from '../core/storage.js';
import { CurriculumData } from '../data/curriculumData.js';

// Módulo de análisis de atraso MEJORADO
const AtrasoAnalyzer = {
  // Configuración de carga académica esperada
  config: {
    creditosPorSemestreIdeal: 24, // Carga típica por semestre
    semestresTotales: 11, // Duración formal de la carrera
    margenAtraso: 6, // Créditos por debajo del ideal para considerar atraso
  },

  init(deps = {}) {
    this.deps = {
      getSemestreActual: () => 1,
      calcularCreditos: () => ({ completados: 0 }),
      isApproved: () => false,
      estaDisponible: () => false,
      prerequisitosDe: () => [],
      ...deps
    };
    const storedConfig = Storage.getItem(STORAGE_KEYS.atrasoConfig);
    const parsedConfig = storedConfig ? JSON.parse(storedConfig) : {};
    this.config = { ...this.config, ...parsedConfig };
  },

  // NUEVO: Obtener semestre actual del usuario
  getSemestreActual() {
    return this.deps.getSemestreActual() || 1;
  },

  // ACTUALIZADO: Calcular métricas de atraso CON semestre manual
  calcularMetricasAtraso() {
    const { completados: creditosAprobados } = this.deps.calcularCreditos();
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
      if (this.deps.isApproved(ramo)) {
        analisis.aprobados++;
      } else if (this.deps.estaDisponible(ramo)) {
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
          prerrequisitosFaltantes: this.deps.prerequisitosDe(ramo)
            .filter(p => !this.deps.isApproved(p))
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
      .filter(ramo => !this.deps.isApproved(ramo) && this.deps.estaDisponible(ramo));

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
      if (!this.deps.isApproved(nombre) && info.abre.length >= umbralImportancia) {
        const ramosBloqueados = info.abre.filter(abre => !this.deps.isApproved(abre));
        if (ramosBloqueados.length > 0) {
          criticos.push({
            nombre,
            sigla: info.sigla,
            semestre: info.semestre,
            ramosBloqueados: ramosBloqueados.length,
            disponible: this.deps.estaDisponible(nombre)
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
      !this.deps.isApproved(nombre)
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
        if (!this.deps.isApproved(dep) && !rutaNueva.includes(dep)) {
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
        .filter(ramo => this.deps.isApproved(ramo))
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

export { AtrasoAnalyzer };
