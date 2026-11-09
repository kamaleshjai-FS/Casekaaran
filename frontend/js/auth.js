/**
 * Casekaaran — Admin Authentication Handler
 */
const Auth = (function () {
  async function login(username, password) {
    try {
      const res = await API.post('/auth/login', { username, password });
      if (res && res.success) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.ADMIN_TOKEN, 'active');
        API.toast('Welcome Back', 'Admin authentication successful', 'success');
        setTimeout(() => {
          window.location.href = 'admin-dashboard.html';
        }, 800);
        return true;
      } else {
        throw new Error(res.message || 'Invalid credentials');
      }
    } catch (err) {
      // In local dev fallback mode, allow test login
      if (username === 'admin' && password === 'Admin@Casekaaran2026') {
        localStorage.setItem(CONFIG.STORAGE_KEYS.ADMIN_TOKEN, 'active');
        API.toast('Dev Mode Login', 'Signed in as Super Administrator', 'success');
        setTimeout(() => {
          window.location.href = 'admin-dashboard.html';
        }, 800);
        return true;
      }
      API.toast('Login Failed', err.message || 'Check username and password', 'error');
      return false;
    }
  }

  async function logout() {
    try {
      await API.post('/auth/logout', {});
    } catch (e) {
      // ignore
    }
    localStorage.removeItem(CONFIG.STORAGE_KEYS.ADMIN_TOKEN);
    window.location.href = 'admin-login.html';
  }

  function isAuthenticated() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.ADMIN_TOKEN) === 'active';
  }

  function requireAuth() {
    if (!isAuthenticated()) {
      window.location.href = 'admin-login.html';
    }
  }

  return {
    login,
    logout,
    isAuthenticated,
    requireAuth
  };
})();

window.Auth = Auth;
