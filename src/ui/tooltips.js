import { Utils } from '../core/utils.js';

// Configurar tooltips táctiles
function setupTouchTooltips() {
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
}

export { setupTouchTooltips };
