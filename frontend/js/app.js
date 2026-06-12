/* GOALGORITHM Analytics — Enhanced Main App Controller */

// ===== ROUTER =====
const Router = {
  routes: {},
  current: null,
  register(name, fn) { this.routes[name] = fn; },
  async navigate(name, params={}) {
    const isAuth = Auth.requireAuth();
    if (!isAuth) return;

    const allowedRoutes = Router._getAllowedRoutes();
    if (!allowedRoutes.includes(name)) {
      name = Auth.isOrganizer() ? 'dashboard' : 'team-dashboard';
    }

    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === name);
    });
    const breadcrumb = document.getElementById('breadcrumb');
    if (breadcrumb) breadcrumb.textContent = name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ');
    const main = document.getElementById('page-content');
    if (!main) return;

    main.style.opacity = '0';
    main.style.transform = 'translateY(12px)';
    main.style.transition = `opacity 150ms, transform 150ms`;

    if (this.routes[name]) {
      this.current = name;
      await this.routes[name](params);
    } else {
      main.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><h2 class="empty-title">Page Not Found</h2><p class="empty-desc">The page you are looking for does not exist.</p></div>';
    }

    requestAnimationFrame(() => {
      main.style.opacity = '1';
      main.style.transform = 'translateY(0)';
    });

    history.pushState({page: name, params}, '', '#' + name);
  },
  _getAllowedRoutes() {
    if (Auth.isOrganizer()) {
      return ['dashboard', 'leaderboard', 'org-teams', 'matches', 'scoring', 'predictions', 'technical', 'presentation', 'analytics'];
    }
    return ['team-dashboard', 'matches', 'predictions', 'leaderboard'];
  },
  init() {
    if (!Auth.isAuthenticated()) {
      window.location.href = 'login.html';
      return;
    }
    const hash = location.hash.replace('#', '') || (Auth.isOrganizer() ? 'dashboard' : 'team-dashboard');
    window.addEventListener('popstate', e => {
      if (e.state) this.navigate(e.state.page, e.state.params || {});
    });
    this.navigate(hash);
  }
};

// ===== SIDEBAR =====
const Sidebar = {
  collapsed: false,
  init() {
    const toggle = document.getElementById('sidebar-toggle');
    if (toggle) toggle.addEventListener('click', () => this.toggleCollapse());
    document.querySelectorAll('.nav-item').forEach(el => {
      el.addEventListener('click', () => Router.navigate(el.dataset.page));
    });

    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.addEventListener('click', () => this.closeMobile());
    document.body.appendChild(overlay);
    this._overlay = overlay;
  },
  toggleCollapse() {
    if (window.innerWidth <= 768) {
      this.toggleMobile();
      return;
    }
    this.collapsed = !this.collapsed;
    document.querySelector('.sidebar')?.classList.toggle('collapsed', this.collapsed);
    document.querySelector('.main-content')?.classList.toggle('sidebar-collapsed', this.collapsed);
  },
  toggleMobile() {
    const sidebar = document.querySelector('.sidebar');
    sidebar?.classList.toggle('open');
    this._overlay?.classList.toggle('active');
  },
  closeMobile() {
    document.querySelector('.sidebar')?.classList.remove('open');
    this._overlay?.classList.remove('active');
  }
};

// ===== TOAST =====
const Toast = {
  show(msg, type='info', title='') {
    const icons = {success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️'};
    const container = document.getElementById('toast-container');
    if (!container) return;
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span>
      <div class="toast-body"><div class="toast-title">${title || type.charAt(0).toUpperCase() + type.slice(1)}</div><div class="toast-msg">${msg}</div></div>
      <button class="toast-close" onclick="this.closest('.toast').remove()">×</button>`;
    container.appendChild(t);
    const ms = type === 'error' ? 8000 : 5000;
    setTimeout(() => { if (t.parentNode) t.remove(); }, ms);
  },
  success: (m, t) => Toast.show(m, 'success', t),
  error: (m, t) => Toast.show(m, 'error', t),
  warning: (m, t) => Toast.show(m, 'warning', t),
  info: (m, t) => Toast.show(m, 'info', t),
};

// ===== MODAL =====
const Modal = {
  show(content, title='') {
    const existing = document.getElementById('app-modal');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.id = 'app-modal'; el.className = 'modal-overlay';
    el.innerHTML = `<div class="modal"><div class="modal-header"><h3 class="modal-title">${title}</h3><button class="modal-close" id="modal-close-btn">×</button></div><div class="modal-body">${content}</div></div>`;
    document.body.appendChild(el);
    el.querySelector('#modal-close-btn').addEventListener('click', () => this.hide());
    el.addEventListener('click', e => { if (e.target === el) this.hide(); });
    this._esc = e => { if (e.key === 'Escape') this.hide(); };
    document.addEventListener('keydown', this._esc);
    return el;
  },
  hide() {
    document.getElementById('app-modal')?.remove();
    if (this._esc) document.removeEventListener('keydown', this._esc);
  },
  confirm(msg, onConfirm, title='Confirm Action') {
    const m = this.show(`<p>${msg}</p><div class="modal-footer" style="margin-top:var(--space-lg)"><button class="btn btn-ghost" id="mc-cancel">Cancel</button><button class="btn btn-primary" id="mc-confirm">Confirm</button></div>`, title);
    m.querySelector('#mc-cancel').addEventListener('click', () => this.hide());
    m.querySelector('#mc-confirm').addEventListener('click', () => { this.hide(); onConfirm(); });
  }
};

// ===== UTILITY =====
const Utils = {
  fmt1: (n) => n == null ? '—' : Number(n).toFixed(1),
  fmt2: (n) => n == null ? '—' : Number(n).toFixed(2),
  fmtInt: (n) => n == null ? '—' : Math.round(n),
  scoreColor(val, max) {
    if (val === 0) return 'color:var(--color-status-error)';
    if (val === max) return 'color:var(--color-status-success)';
    return '';
  },
  gradeBadge(g) {
    const m = {A: '3×', B: '2×', C: '1×'};
    return `<span class="grade-badge grade-${(g || 'C').toLowerCase()}">Grade ${g || 'C'} — ${m[g] || '1×'}</span>`;
  },
  rankBadge(rank) {
    if (rank === 1) return `<div class="rank-badge rank-badge-1">🏆</div>`;
    if (rank === 2) return `<div class="rank-badge rank-badge-2">🥈</div>`;
    if (rank === 3) return `<div class="rank-badge rank-badge-3">🥉</div>`;
    return `<div class="rank-badge rank-badge-n">#${rank}</div>`;
  },
  statusBadge(status) {
    const map = {scheduled: 'status-scheduled', frozen: 'status-frozen', completed: 'status-completed', scored: 'status-scored'};
    return `<span class="badge ${map[status] || 'badge-info'}">${status || 'unknown'}</span>`;
  },
  skeleton(rows=3) {
    return Array(rows).fill(0).map(() => `<tr><td colspan="10"><div class="skeleton skeleton-text" style="width:${60 + Math.random() * 30}%"></div></td></tr>`).join('');
  },
  skeletonCards(n=4) {
    return Array(n).fill(0).map(() => `<div class="card"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text" style="margin-top:var(--space-md)"></div><div class="skeleton skeleton-card" style="margin-top:var(--space-md)"></div></div>`).join('');
  },
  staggerChildren(parentSelector) {
    const parent = document.querySelector(parentSelector);
    if (!parent) return;
    parent.classList.add('animate-stagger');
  },
  teamBadge(teamName, size=48) {
    const initials = teamName.substring(0, 2).toUpperCase();
    const colors = ['#2563EB', '#38BDF8', '#14B8A6', '#8B5CF6', '#F59E0B'];
    const idx = teamName.length % colors.length;
    return `<div class="team-badge" style="width:${size}px;height:${size}px;font-size:${size*0.4}px;background:${colors[idx]}20;border-color:${colors[idx]}40;color:${colors[idx]}">${initials}</div>`;
  },
  predictionPick(homeTeam, awayTeam, pick) {
    const labels = {home: homeTeam, away: awayTeam, draw: 'Draw'};
    const classes = {home: 'prediction-pick-home', away: 'prediction-pick-away', draw: 'prediction-pick-draw'};
    return `<span class="prediction-pick ${classes[pick] || 'prediction-pick-draw'}">${labels[pick] || '—'}</span>`;
  },
  capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
  },
  dateStr(d) {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}); }
    catch(e) { return d; }
  },
  timeStr(d) {
    if (!d) return '—';
    try { return new Date(d).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'}); }
    catch(e) { return d; }
  }
};

// ===== SCORE COUNTER ANIMATION =====
function animateValue(el, start, end, duration=600, decimals=1) {
  if (!el) return;
  const range = end - start;
  const startTime = performance.now();
  const fmt = (v) => decimals === 0 ? Math.round(v).toString() : v.toFixed(decimals);
  function update(now) {
    const p = Math.min((now - startTime) / duration, 1);
    const eased = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
    el.textContent = fmt(start + range * eased);
    if (p < 1) requestAnimationFrame(update);
    else el.textContent = fmt(end);
  }
  requestAnimationFrame(update);
}

// ===== SCROLL ANIMATIONS =====
const ScrollAnim = {
  observer: null,
  init() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-visible');
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          this.observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  },
  observe(el) {
    if (!el || this._reducedMotion()) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    this.observer.observe(el);
  },
  observeAll(parent) {
    if (!parent || this._reducedMotion()) return;
    parent.querySelectorAll('.anim-on-scroll').forEach(el => this.observe(el));
  },
  _reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
};

// ===== ANIMATED COUNTERS =====
function animateCounters(container) {
  if (!container) return;
  container.querySelectorAll('[data-count-to]').forEach(el => {
    const end = parseFloat(el.dataset.countTo);
    const start = parseFloat(el.dataset.countFrom) || 0;
    const dur = parseInt(el.dataset.countDur) || 600;
    const dec = parseInt(el.dataset.countDec) || 1;
    if (!isNaN(end)) animateValue(el, start, end, dur, dec);
  });
}

// ===== THEME TRANSITION HELPER =====
function applyThemeTransition() {
  document.body.classList.add('theme-transitioning');
  clearTimeout(window._themeTr);
  window._themeTr = setTimeout(() => {
    document.body.classList.remove('theme-transitioning');
  }, 600);
}

// ===== ROLE-BASED UI SETUP =====
function setupRoleUI() {
  const isOrg = Auth.isOrganizer();
  const isTL = Auth.isTeamLeader();

  document.querySelectorAll('#org-nav-section, #org-nav-matches, #org-nav-eval, #org-nav-intel').forEach(el => {
    if (el) el.style.display = isOrg ? '' : 'none';
  });
  document.querySelectorAll('#tl-nav-section, #tl-nav-matches, #tl-nav-stats').forEach(el => {
    if (el) el.style.display = isTL ? '' : 'none';
  });

  const badge = document.getElementById('role-badge');
  if (badge) {
    const role = Auth.getRole();
    if (role === 'ORGANIZER' || role === 'ADMIN') {
      badge.textContent = 'Organiser';
      badge.style.background = 'var(--color-primary)';
      badge.style.color = '#ffffff';
      badge.style.borderColor = 'rgba(255, 255, 255, 0.25)';
      badge.style.display = '';
    } else if (role === 'TEAM_LEADER') {
      badge.textContent = 'Team Leader';
      badge.style.background = 'var(--color-accent)';
      badge.style.color = '#020617';
      badge.style.borderColor = 'rgba(2, 6, 23, 0.15)';
      badge.style.display = '';
    } else {
      badge.style.display = 'none';
      badge.textContent = '';
    }
  }

  const brandLink = document.getElementById('navbar-brand-link');
  if (brandLink) {
    brandLink.onclick = (e) => {
      e.preventDefault();
      Router.navigate(isOrg ? 'dashboard' : 'team-dashboard');
    };
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();

  if (!Auth.isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }

  setupRoleUI();
  Sidebar.init();
  ScrollAnim.init();
  Router.init();
});
