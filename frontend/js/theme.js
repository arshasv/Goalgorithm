

const ThemeManager = {
  DARK: 'dark', LIGHT: 'light', KEY: 'fifa-theme',
  init() {
    const saved = localStorage.getItem(this.KEY);
    const sys = window.matchMedia('(prefers-color-scheme: light)').matches ? this.LIGHT : this.DARK;
    this.apply(saved || this.DARK, false);
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.addEventListener('click', () => this.toggle());
    });
  },
  apply(theme, animate=true) {
    if (animate && typeof applyThemeTransition === 'function') applyThemeTransition();

    if (theme === this.LIGHT) document.documentElement.setAttribute('data-theme', 'light');
    else document.documentElement.removeAttribute('data-theme');

    localStorage.setItem(this.KEY, theme);
    document.querySelectorAll('.theme-toggle').forEach(b => {
      b.textContent = theme === this.LIGHT ? '🌙' : '☀️';
      b.title = theme === this.LIGHT ? 'Switch to Dark Mode' : 'Switch to Light Mode';
    });

    // Animate toggle button
    document.querySelectorAll('.theme-toggle').forEach(b => {
      b.style.transform = 'rotate(90deg) scale(0.8)';
      setTimeout(() => { b.style.transform = 'rotate(0deg) scale(1)'; }, 200);
    });

    document.dispatchEvent(new CustomEvent('themechange', {detail: theme}));
  },
  toggle() {
    this.apply(this.current() === this.DARK ? this.LIGHT : this.DARK);
  },
  current() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? this.LIGHT : this.DARK;
  }
};
