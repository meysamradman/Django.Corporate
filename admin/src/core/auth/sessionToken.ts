let storedCsrfToken: string | null = null;

const CSRF_TOKEN_KEY = 'admin_csrf_token';

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    // Try sessionStorage first (persists across page reloads)
    const sessionToken = sessionStorage.getItem(CSRF_TOKEN_KEY);
    if (sessionToken) return sessionToken;
    
    // Fallback to localStorage
    const localToken = localStorage.getItem(CSRF_TOKEN_KEY);
    if (localToken) return localToken;
    
    return null;
  } catch (error) {
    console.warn('Error reading CSRF token from storage:', error);
    return null;
  }
}

// Store token in persistent storage
function setStoredToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  
  try {
    if (token) {
      sessionStorage.setItem(CSRF_TOKEN_KEY, token);
      // Also store in localStorage as backup
      localStorage.setItem(CSRF_TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(CSRF_TOKEN_KEY);
      localStorage.removeItem(CSRF_TOKEN_KEY);
    }
  } catch (error) {
    console.warn('Error storing CSRF token:', error);
  }
}

// Initialize token from storage on module load
if (typeof window !== 'undefined') {
  storedCsrfToken = getStoredToken();
}

export const csrfTokenStore = {

  setToken: (token: string | null) => {
    storedCsrfToken = token;
    setStoredToken(token);
  },

  getToken: (): string | null => {
    return storedCsrfToken;
  },

  getStoredToken: (): string | null => {
    const token = getStoredToken();
    if (token && token !== storedCsrfToken) {
      storedCsrfToken = token;
    }
    return token;
  },

  clearToken: () => {
    storedCsrfToken = null;
    setStoredToken(null);
  },

  hasToken: (): boolean => {
    return storedCsrfToken !== null && storedCsrfToken.length > 0;
  },

  refreshToken: (): string | null => {
    return csrfTokenStore.getStoredToken();
  }
};