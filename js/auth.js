// =====================================================
// MAHENDRA HOSTEL - AUTH UTILITIES (Role-Based)
// Supports: student, admin, owner
// =====================================================

/**
 * Validate register number format (e.g., 125UCS071)
 * @param {string} regNum
 * @returns {boolean}
 */
function validateRegisterNumber(regNum) {
  return /^\d{2,4}[A-Z]{2,4}\d{3,4}$/i.test(regNum.trim());
}

/**
 * Validate password strength
 * @param {string} password
 * @returns {{ valid: boolean, score: number, messages: string[] }}
 */
function validatePassword(password) {
  const messages = [];
  let score = 0;

  if (password.length >= 6) score++;
  else messages.push('At least 6 characters required');

  if (/\d/.test(password)) score++;
  else messages.push('At least one number required');

  if (/[a-zA-Z]/.test(password)) score++;
  else messages.push('At least one letter required');

  if (/[^A-Za-z0-9]/.test(password) || password.length >= 9) score++;

  return {
    valid: score >= 2 && password.length >= 6,
    score,
    messages
  };
}

/**
 * Check if user session is valid
 * @returns {{ valid: boolean, user: object|null }}
 */
function checkSession() {
  const user = getSessionUser();
  if (user && user.uid) {
    return { valid: true, user };
  }
  return { valid: false, user: null };
}

/**
 * Clear all auth sessions and redirect to login
 */
function clearSessionAndRedirect() {
  clearSession();
  window.location.replace('login.html');
}

/**
 * Save "Remember Me" credentials (username only, not password)
 * @param {string} username
 * @param {boolean} remember
 */
function saveRememberMe(username, remember) {
  if (remember) {
    localStorage.setItem('mei_remember_me', username);
  } else {
    localStorage.removeItem('mei_remember_me');
  }
}

/**
 * Get saved "Remember Me" username
 * @returns {string|null}
 */
function getRememberedUsername() {
  return localStorage.getItem('mei_remember_me');
}

/**
 * Get the correct redirect URL based on user role
 * @param {string} role
 * @returns {string}
 */
function getRoleRedirectURL(role) {
  switch (role) {
    case 'owner': return 'owner-panel.html';
    case 'admin': return 'admin-panel.html';
    case 'student': return 'dashboard.html';
    default: return 'login.html';
  }
}

/**
 * Require a specific role to access a page. Redirects if wrong role.
 * @param {string|string[]} allowedRoles - single role or array of roles
 * @returns {object|null} - user data if authorized
 */
function requireRole(allowedRoles) {
  const session = checkSession();
  if (!session.valid) {
    window.location.replace('login.html');
    return null;
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  if (!roles.includes(session.user.role)) {
    // Redirect to their correct panel
    window.location.replace(getRoleRedirectURL(session.user.role));
    return null;
  }

  return session.user;
}

// =====================================================
// AUTO-FILL REMEMBERED USERNAME ON LOGIN PAGE
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
  const usernameInput = document.getElementById('login-username');
  if (usernameInput) {
    const remembered = getRememberedUsername();
    if (remembered) {
      usernameInput.value = remembered;
      const passInput = document.getElementById('login-password');
      if (passInput) setTimeout(() => passInput.focus(), 300);
    }
  }
});
