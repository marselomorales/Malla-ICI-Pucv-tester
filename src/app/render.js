import { Utils } from '../core/utils.js';
import { CurriculumData } from '../data/curriculumData.js';

function syncBoxWidths() {
  Utils.$$('.ramo').forEach(el => {
    const w = Math.round(el.getBoundingClientRect().width);
    el.style.setProperty('--box-w', w + 'px');
  });
}

function highlightPrereqs(app, nombre, on) {
  const selfEl = app.state.nombreToEl.get(nombre);
  if (selfEl) selfEl.classList.toggle('is-self', on);
  
  for (const p of (CurriculumData.prereqsPorNombre[nombre] || [])) {
    app.state.nombreToEl.get(p)?.classList.toggle('is-prereq', on);
  }
}

function render(app) {
  const totalRamos = Object.keys(CurriculumData.ramos).length;
  const aprobadosList = app.aprobadosNombres();
  const { total: creditosTotal, completados: creditosAprobados, porcentaje } = app.calcularCreditos();
  
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
  app.state.nombreToEl.clear();
  
  // Renderizar cada semestre
  for (let sem = 1; sem <= CurriculumData.maxSemestre; sem++) {
    const ramosSem = (CurriculumData.porSemestre[sem] || [])
      .filter(ramo => {
        // Filtro por área
        if (app.state.areaSeleccionada !== 'all' && app.state.areaSeleccionada !== 'none') {
          if (CurriculumData.ramos[ramo].area !== app.state.areaSeleccionada) return false;
        }
        
        // Filtro por búsqueda
        if (app.state.busqueda) {
          const b = Utils.normalizeText(app.state.busqueda);
          const n = Utils.normalizeText(ramo);
          const s = Utils.normalizeText(CurriculumData.ramos[ramo].sigla || '');
          if (!n.includes(b) && !s.includes(b)) return false;
        }
        
        // Filtro por disponibilidad
        if (app.state.mostrarSoloDisponibles) {
          if (!app.isApproved(ramo) && !app.estaDisponible(ramo)) return false;
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
      
      const prere = app.prerequisitosDe(ramo);
      const desbloqueado = prere.every(p => app.isApproved(p));
      const estadoKey = `${sem}:${ramo}`;
      nuevoEstado.set(estadoKey, desbloqueado);
      
      // Tooltip mejorado
      const tooltipText = `📚 ${ramo}\n📋 ${info.sigla} | ${creditos} créditos\n🏷️ ${info.area.charAt(0).toUpperCase() + info.area.slice(1)}\n\n${app.isApproved(ramo) ? '✅ Aprobado\nToca para desmarcar' : app.estaDisponible(ramo) ? '🟡 Disponible\nToca para aprobar' : `🔒 Bloqueado\nRequiere: ${prere.filter(p => !app.isApproved(p)).join(', ') || 'Ninguno'}`}`;
      
      div.setAttribute('data-tooltip', tooltipText);
      
      // Aplicar clases según estado
      if (app.isApproved(ramo)) {
        div.classList.add('aprobado');
        div.onclick = () => app.toggleApproval(ramo);
        div.onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            app.toggleApproval(ramo);
          }
        };
      } else if (app.estaDisponible(ramo)) {
        div.classList.add('disponible');
        if (!app.state.estadoAnterior.get(estadoKey)) {
          div.classList.add('desbloqueado');
          void div.offsetWidth; // Forzar reflow
        }
        div.onclick = () => app.toggleApproval(ramo);
        div.onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            app.toggleApproval(ramo);
          }
        };
      } else {
        div.classList.add('bloqueado');
      }
      
      // Resaltado de prerrequisitos
      div.addEventListener('mouseenter', () => highlightPrereqs(app, ramo, true));
      div.addEventListener('mouseleave', () => highlightPrereqs(app, ramo, false));
      div.addEventListener('focus', () => highlightPrereqs(app, ramo, true));
      div.addEventListener('blur', () => highlightPrereqs(app, ramo, false));
      
      app.state.nombreToEl.set(ramo, div);
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
  
  app.state.estadoAnterior.clear();
  nuevoEstado.forEach((v, k) => app.state.estadoAnterior.set(k, v));
  
  requestAnimationFrame(() => syncBoxWidths());
}

export { render, syncBoxWidths, highlightPrereqs };
