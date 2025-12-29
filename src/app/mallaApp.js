import { Utils } from '../core/utils.js';
import { STORAGE_KEYS } from '../core/constants.js';
import { Storage } from '../core/storage.js';
import { ThemeManager } from '../theme/themeManager.js';
import { NotificationManager } from '../ui/notifications.js';
import { CurriculumData } from '../data/curriculumData.js';
import { AtrasoAnalyzer } from '../analysis/atrasoAnalyzer.js';
import { initialState } from './state.js';
import { render as renderMalla } from './render.js';
import { setupEventListeners } from './events.js';
import { setupTouchTooltips } from '../ui/tooltips.js';
import { setupKeyboardNavigation } from '../ui/keyboard.js';

// Módulo principal de la aplicación ACTUALIZADO
const MallaApp = {
  // Estado de la aplicación
  state: {
    ...initialState,
    nombreToEl: new Map(),
    estadoAnterior: new Map()
  },
  
  // Inicialización
  init() {
    // Inicializar módulos
    ThemeManager.init();
    NotificationManager.init();
    CurriculumData.init();
    this.setupPersistence();
    this.loadApprovedCourses();
    this.loadSemestreActual();
    AtrasoAnalyzer.init({
      getSemestreActual: () => this.state.semestreActual,
      calcularCreditos: () => this.calcularCreditos(),
      isApproved: (nombre) => this.isApproved(nombre),
      estaDisponible: (nombre) => this.estaDisponible(nombre),
      prerequisitosDe: (nombre) => this.prerequisitosDe(nombre)
    });
    
    // Renderizar interfaz
    this.render();
    
    // Configurar event listeners
    setupEventListeners(this);
    
    // Configurar tooltips táctiles
    setupTouchTooltips();
    
    // Configurar navegación por teclado
    setupKeyboardNavigation();
  },
  
  // NUEVO: Cargar semestre actual
  loadSemestreActual() {
    const semestreGuardado = Storage.getItem(STORAGE_KEYS.semestreActual);
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
    Storage.setItem(STORAGE_KEYS.semestreActual, semestre);
    // Recalcular análisis si está visible
    if (document.getElementById('atraso-container').style.display !== 'none') {
      this.mostrarAnalisisAtraso();
    }
  },
  
  // Configuración de persistencia
  setupPersistence() {
    const firmaMalla = JSON.stringify(CurriculumData.cursosRaw.map(c => c.sigla).sort());
    const firmaGuardada = Storage.getItem(STORAGE_KEYS.firmaMalla);

    // Si la malla ha cambiado, limpiar datos guardados
    if (firmaGuardada && firmaGuardada !== firmaMalla) {
      Storage.removeItem(STORAGE_KEYS.ramosAprobados);
    }

    Storage.setItem(STORAGE_KEYS.firmaMalla, firmaMalla);
  },
  
  // Cargar cursos aprobados
  loadApprovedCourses() {
    this.state.aprobadasSiglas = JSON.parse(Storage.getItem(STORAGE_KEYS.ramosAprobados) || '[]');
    const setSiglasValidas = new Set(CurriculumData.cursosRaw.map(c => c.sigla));

    // Filtrar solo siglas válidas
    this.state.aprobadasSiglas = this.state.aprobadasSiglas.filter(s => setSiglasValidas.has(s));
    Storage.setItem(STORAGE_KEYS.ramosAprobados, JSON.stringify(this.state.aprobadasSiglas));
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
      Storage.setItem(STORAGE_KEYS.ramosAprobados, JSON.stringify(this.state.aprobadasSiglas));
      
      this.render();
      NotificationManager.showToast(`Has desaprobado ${ramoNombre} y sus dependencias`, 'info');
    } else {
      // Aprobar curso si está disponible
      if (this.estaDisponible(ramoNombre)) {
        if (!this.state.aprobadasSiglas.includes(sigla)) {
          this.state.aprobadasSiglas.push(sigla);
        }
        Storage.setItem(STORAGE_KEYS.ramosAprobados, JSON.stringify(this.state.aprobadasSiglas));
        
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
      Storage.removeItem(STORAGE_KEYS.ramosAprobados);
      Storage.removeItem(STORAGE_KEYS.semestreActual);
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
  
  // Renderizar la malla
  render() {
    renderMalla(this);
  }
};

export { MallaApp };
