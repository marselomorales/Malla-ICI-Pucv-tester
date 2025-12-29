// Configurar navegación por teclado
function setupKeyboardNavigation() {
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

export { setupKeyboardNavigation };
