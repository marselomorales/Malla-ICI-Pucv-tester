import { Utils } from '../core/utils.js';
import { Storage } from '../core/storage.js';
import { STORAGE_KEYS } from '../core/constants.js';

// Módulo de tema
const ThemeManager = {
  themes: {
    indigo: 'Índigo',
    emerald: 'Esmeralda',
    sunset: 'Atardecer',
    ocean: 'Océano',
    nocturnal: 'Nocturnal'
  },

  init() {
    this.root = document.documentElement;
    this.toggle = document.getElementById('theme-toggle');
    this.modeLabel = document.getElementById('theme-mode-label');
    this.dropdown = document.getElementById('theme-dropdown');
    this.dropdownToggle = document.getElementById('theme-dropdown-toggle');
    this.dropdownMenu = document.getElementById('theme-dropdown-menu');
    this.themeOptions = Utils.$$('.theme-option');
    this.currentThemeLabel = document.getElementById('theme-current');

    this.loadPreferences();
    this.applyTheme();
    this.setupEventListeners();
  },

  loadPreferences() {
    const storedMode = Storage.getItem(STORAGE_KEYS.tema);
    const storedTheme = Storage.getItem(STORAGE_KEYS.colorPreset);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    this.mode = storedMode || (prefersDark ? 'dark' : 'light');
    this.theme = this.themes[storedTheme] ? storedTheme : 'indigo';
  },

  savePreferences() {
    Storage.setItem(STORAGE_KEYS.tema, this.mode);
    Storage.setItem(STORAGE_KEYS.colorPreset, this.theme);
  },

  applyTheme() {
    const mode = this.mode === 'dark' ? 'dark' : 'light';
    this.root.dataset.mode = mode;
    this.root.dataset.theme = this.theme;

    this.toggle?.setAttribute('aria-checked', mode === 'dark' ? 'true' : 'false');
    if (this.modeLabel) {
      this.modeLabel.textContent = mode === 'dark' ? 'Modo oscuro' : 'Modo claro';
    }
    if (this.currentThemeLabel) {
      this.currentThemeLabel.textContent = this.themes[this.theme] || 'Tema';
    }

    this.updateThemeOptions();
  },

  setColorTheme(theme) {
    if (!this.themes[theme]) return;
    this.theme = theme;
    this.applyTheme();
    this.savePreferences();
  },

  toggleDarkMode() {
    this.mode = this.mode === 'dark' ? 'light' : 'dark';
    this.applyTheme();
    this.savePreferences();
  },

  updateThemeOptions() {
    this.themeOptions.forEach(option => {
      const isActive = option.dataset.theme === this.theme;
      option.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  },

  isDropdownOpen() {
    return this.dropdownToggle?.getAttribute('aria-expanded') === 'true';
  },

  setDropdownState(isOpen) {
    this.dropdownToggle?.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    if (isOpen) {
      this.focusActiveOption();
    }
  },

  focusActiveOption() {
    const activeOption = this.themeOptions.find(option => option.dataset.theme === this.theme);
    (activeOption || this.themeOptions[0])?.focus();
  },

  setupEventListeners() {
    this.toggle?.addEventListener('click', () => this.toggleDarkMode());
    this.toggle?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.toggleDarkMode();
      }
    });

    this.dropdownToggle?.addEventListener('click', () => {
      this.setDropdownState(!this.isDropdownOpen());
    });

    this.dropdownToggle?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.setDropdownState(!this.isDropdownOpen());
      }
      if (event.key === 'Escape') {
        this.setDropdownState(false);
      }
    });

    this.themeOptions.forEach(option => {
      option.addEventListener('click', () => {
        this.setColorTheme(option.dataset.theme);
        this.setDropdownState(false);
        this.dropdownToggle?.focus();
      });
      option.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          this.setColorTheme(option.dataset.theme);
          this.setDropdownState(false);
          this.dropdownToggle?.focus();
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          this.setDropdownState(false);
          this.dropdownToggle?.focus();
        }
      });
    });

    document.addEventListener('click', (event) => {
      if (this.isDropdownOpen() && !this.dropdown?.contains(event.target)) {
        this.setDropdownState(false);
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isDropdownOpen()) {
        this.setDropdownState(false);
        this.dropdownToggle?.focus();
      }
    });

    this.dropdown?.addEventListener('focusout', (event) => {
      if (this.isDropdownOpen() && !this.dropdown.contains(event.relatedTarget)) {
        this.setDropdownState(false);
      }
    });
  }
};

export { ThemeManager };
