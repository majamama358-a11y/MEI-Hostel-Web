// =====================================================
// MAHENDRA HOSTEL - SHARED UTILITIES & COMPONENTS
// =====================================================

// =====================================================
// TOAST SYSTEM
// =====================================================
const Toast = {
  container: null,

  init() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', duration = 3500) {
    if (!this.container) this.init();

    const icons = {
      success: `<svg viewBox="0 0 24 24" class="toast-icon"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
      error: `<svg viewBox="0 0 24 24" class="toast-icon"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
      warning: `<svg viewBox="0 0 24 24" class="toast-icon"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
      info: `<svg viewBox="0 0 24 24" class="toast-icon"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `${icons[type] || icons.info}<span>${message}</span>`;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 300);
    }, duration);

    return toast;
  },

  success: (msg, d) => Toast.show(msg, 'success', d),
  error: (msg, d) => Toast.show(msg, 'error', d),
  warning: (msg, d) => Toast.show(msg, 'warning', d),
  info: (msg, d) => Toast.show(msg, 'info', d)
};

// =====================================================
// DRAWER / NAV
// =====================================================
const Drawer = {
  drawer: null,
  overlay: null,
  isOpen: false,

  init() {
    this.drawer = document.getElementById('nav-drawer');
    this.overlay = document.getElementById('drawer-overlay');
    if (!this.drawer) return;

    // Close on overlay click
    this.overlay?.addEventListener('click', () => this.close());

    // Hamburger button
    document.getElementById('hamburger-btn')?.addEventListener('click', () => this.toggle());
    document.getElementById('drawer-close-btn')?.addEventListener('click', () => this.close());

    // Swipe to close
    this.initSwipe();
  },

  toggle() { this.isOpen ? this.close() : this.open(); },

  open() {
    this.isOpen = true;
    this.drawer?.classList.add('open');
    this.overlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  close() {
    this.isOpen = false;
    this.drawer?.classList.remove('open');
    this.overlay?.classList.remove('active');
    document.body.style.overflow = '';
  },

  initSwipe() {
    if (!this.drawer) return;
    let startX = 0;
    this.drawer.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
    }, { passive: true });

    this.drawer.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      if (dx < -60) this.close();
    }, { passive: true });
  }
};

// =====================================================
// MODAL SYSTEM
// =====================================================
const Modal = {
  open(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close(id);
    }, { once: true });
  },

  close(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
};

// =====================================================
// CONFIRM DIALOG
// =====================================================
const Confirm = {
  show({ title, message, icon = 'warning', confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, danger = false }) {
    const dlg = document.getElementById('confirm-dialog');
    if (!dlg) return;

    const iconColors = { warning: '#F59E0B', danger: '#EF4444', success: '#22C55E', info: '#32158F' };
    const iconColor = iconColors[icon] || iconColors.warning;

    const iconSVG = {
      warning: `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>`,
      danger: `<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>`,
      success: `<polyline points="20 6 9 17 4 12"></polyline>`,
      info: `<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>`
    };

    dlg.innerHTML = `
      <div class="confirm-box">
        <div class="confirm-icon" style="background:${iconColor}20">
          <svg viewBox="0 0 24 24" style="stroke:${iconColor}">
            ${iconSVG[icon] || iconSVG.warning}
          </svg>
        </div>
        <div class="confirm-title">${title}</div>
        <div class="confirm-message">${message}</div>
        <div class="confirm-actions">
          <button class="btn btn-secondary" id="confirm-cancel">${cancelText}</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="confirm-ok">${confirmText}</button>
        </div>
      </div>
    `;

    dlg.classList.add('active');

    document.getElementById('confirm-cancel').addEventListener('click', () => {
      dlg.classList.remove('active');
    });

    document.getElementById('confirm-ok').addEventListener('click', () => {
      dlg.classList.remove('active');
      onConfirm?.();
    });

    dlg.addEventListener('click', (e) => {
      if (e.target === dlg) dlg.classList.remove('active');
    }, { once: true });
  }
};

// =====================================================
// =====================================================
// AUTH STATE MANAGEMENT (Role-Based)
// =====================================================
const Auth = {
  currentUser: null,
  currentUserData: null,

  init(requiredRole) {
    // 1. Check local session first
    const sessionUser = typeof getSessionUser === 'function' ? getSessionUser() : null;
    const fallbackUser = !sessionUser ? sessionStorage.getItem('mei_auth_session') : null;
    const user = sessionUser || (fallbackUser ? JSON.parse(fallbackUser) : null);

    if (user && user.uid) {
      this.currentUser = { uid: user.uid };
      this.currentUserData = user;
      this.checkRole(requiredRole);
      return;
    }

    // 2. Check Firebase Auth if available
    if (typeof firebase !== 'undefined' && typeof auth !== 'undefined' && auth) {
      auth.onAuthStateChanged(async (fbUser) => {
        if (fbUser) {
          this.currentUser = fbUser;
          await this.loadUserData(fbUser.uid);
          this.checkRole(requiredRole);
        } else {
          window.location.href = 'login.html';
        }
      });
      return;
    }

    // No valid user session found
    window.location.href = 'login.html';
  },

  async loadUserData(uid) {
    try {
      if (typeof DB !== 'undefined' && DB.user) {
        const snap = await DB.user(uid).once('value');
        this.currentUserData = snap.val();
      } else if (typeof getUserByUID === 'function') {
        this.currentUserData = getUserByUID(uid);
      }
    } catch (e) {
      console.error('Error loading user data:', e);
    }
  },

  checkRole(requiredRole) {
    if (!this.currentUserData) return;
    const userRole = this.currentUserData.role;

    // If requiredRole specified, enforce it
    if (requiredRole) {
      const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (!allowedRoles.includes(userRole)) {
        if (userRole === 'owner') {
          window.location.href = 'owner-panel.html';
        } else if (userRole === 'admin') {
          window.location.href = 'admin-panel.html';
        } else {
          window.location.href = 'dashboard.html';
        }
      }
    }
  },

  getUserData() { return this.currentUserData; },
  getUID() { return this.currentUser?.uid; },

  logout() {
    if (typeof clearSession === 'function') {
      clearSession();
    } else {
      sessionStorage.removeItem('mei_auth_session');
      sessionStorage.removeItem('mei_demo_user');
      localStorage.removeItem('mei_auth_token');
    }

    if (typeof firebase !== 'undefined' && typeof auth !== 'undefined' && auth) {
      auth.signOut().finally(() => {
        window.location.href = 'login.html';
      });
    } else {
      window.location.href = 'login.html';
    }
  }
};

// =====================================================
// PAGE LOADER
// =====================================================
const PageLoader = {
  show() {
    const loader = document.getElementById('page-loader');
    if (loader) loader.classList.remove('hidden');
  },
  hide() {
    const loader = document.getElementById('page-loader');
    if (loader) {
      setTimeout(() => loader.classList.add('hidden'), 50);
    }
  }
};

// =====================================================
// DATE/TIME UTILITIES
// =====================================================
const DateUtil = {
  now() { return new Date(); },

  format(date, style = 'date') {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d)) return '';

    if (style === 'date') {
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    }
    if (style === 'time') {
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    if (style === 'datetime') {
      return `${this.format(d, 'date')} ${this.format(d, 'time')}`;
    }
    if (style === 'full') {
      return d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
    }
    return d.toLocaleString();
  },

  formatForInput(date) {
    const d = date instanceof Date ? date : new Date(date || Date.now());
    return d.toISOString().split('T')[0];
  },

  today() { return this.format(new Date(), 'date'); },
  todayInput() { return this.formatForInput(new Date()); }
};

// =====================================================
// GENERATE UNIQUE ID
// =====================================================
function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

// =====================================================
// REQUEST TYPE MAPPING
// =====================================================
const REQUEST_TYPES = [
  'Holiday',
  'Leave',
  'Semester Holiday',
  'Interview',
  'Symposium',
  'IPTL/Gate',
  'Industrial Visit',
  'Sports',
  'Outing',
  'Other'
];

// =====================================================
// INITIALIZE SHARED COMPONENTS
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
  Toast.init();
  Drawer.init();

  // Set active drawer item based on current page
  const currentPage = window.location.pathname.split('/').pop();
  document.querySelectorAll('.drawer-item[data-page]').forEach(item => {
    if (item.dataset.page === currentPage) {
      item.classList.add('active');
    }
  });

  // Page enter animation
  const pageContent = document.querySelector('.page-content');
  if (pageContent) {
    pageContent.classList.add('page-enter');
  }
});

// =====================================================
// SVG ICON HELPER
// =====================================================
const Icon = {
  home: `<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
  request: `<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`,
  food: `<svg viewBox="0 0 24 24"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>`,
  attendance: `<svg viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>`,
  profile: `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
  clock: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
  emergency: `<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
  parcel: `<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
  password: `<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
  logout: `<svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`,
  menu: `<svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`,
  back: `<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>`,
  search: `<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
  plus: `<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
  check: `<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  x: `<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  building: `<svg viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><rect x="9" y="7" width="2" height="3"></rect><rect x="13" y="7" width="2" height="3"></rect><rect x="9" y="13" width="2" height="3"></rect><rect x="13" y="13" width="2" height="3"></rect><path d="M10 22v-3h4v3"></path></svg>`,
  user: `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
  phone: `<svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.51 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`,
  qr: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><rect x="14" y="14" width="3" height="3"></rect><line x1="17" y1="17" x2="21" y2="17"></line><line x1="17" y1="21" x2="21" y2="21"></line><line x1="21" y1="17" x2="21" y2="21"></line></svg>`,
  wifi: `<svg viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>`
};
