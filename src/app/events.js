import { Utils } from '../core/utils.js';
import { NotificationManager } from '../ui/notifications.js';

// ACTUALIZADO: Configurar event listeners con nuevo selector
function setupEventListeners(app) {
  // NUEVO: Selector de semestre
  const semestreSelector = document.getElementById('select-semestre');
  if (semestreSelector) {
    semestreSelector.addEventListener('change', (e) => {
      app.guardarSemestreActual(e.target.value);
      NotificationManager.showToast(`Semestre actual actualizado a: ${e.target.value}°`, 'info');
    });
  }
  
  // Filtros de área
  Utils.$$('.area-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('active') && btn.dataset.area === app.state.areaSeleccionada) {
        btn.classList.remove('active');
        app.state.areaSeleccionada = 'none';
      } else {
        Utils.$$('.area-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        app.state.areaSeleccionada = btn.dataset.area;
      }
      app.render();
    });
  });
  
  // Búsqueda con debounce
  const searchInput = Utils.$('#search-input');
  const debouncedSearch = Utils.debounce((e) => {
    app.state.busqueda = e.target.value;
    app.render();
  }, 120);
  
  searchInput.addEventListener('input', debouncedSearch);
  
  // Toggle mostrar solo disponibles
  Utils.$('#toggle-disponibles').addEventListener('click', () => {
    app.state.mostrarSoloDisponibles = !app.state.mostrarSoloDisponibles;
    const boton = Utils.$('#toggle-disponibles');
    
    if (app.state.mostrarSoloDisponibles) {
      boton.classList.add('active');
      boton.innerHTML = '<ion-icon name="eye-off-outline"></ion-icon> Mostrar Todos';
    } else {
      boton.classList.remove('active');
      boton.innerHTML = '<ion-icon name="eye-outline"></ion-icon> Solo Disponibles';
    }
    
    app.render();
  });
  
  // Botón de reinicio
  Utils.$('#btn-reset').addEventListener('click', () => app.resetProgress());
  
  // Botón de exportación
  Utils.$('#export-data').addEventListener('click', () => app.exportData());
  
  // Botón de análisis de atraso
  Utils.$('#btn-analisis-atraso').addEventListener('click', () => {
    app.mostrarAnalisisAtraso();
  });

  // Botón para cerrar análisis
  Utils.$('#cerrar-analisis').addEventListener('click', () => {
    Utils.$('#atraso-container').style.display = 'none';
  });
}

export { setupEventListeners };
