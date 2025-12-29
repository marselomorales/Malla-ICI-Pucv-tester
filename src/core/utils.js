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

const { normalizeText, $, $$, cssVarPx, debounce } = Utils;

export { Utils, normalizeText, $, $$, cssVarPx, debounce };
