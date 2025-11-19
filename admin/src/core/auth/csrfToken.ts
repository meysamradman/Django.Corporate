/**
 * CSRF Token Management
 * 
 * Django sends CSRF token in two ways:
 * 1. Cookie: csrftoken (HttpOnly=False for JS access)
 * 2. Response header: X-CSRFToken (fallback)
 * 
 * Security Notes:
 * - Never store CSRF in localStorage (XSS vulnerable)
 * - Use sessionStorage only (cleared on tab close)
 * - Always validate token existence before API calls
 */

interface CSRFTokenStore {
  token: string | null;
  lastUpdated: number | null;
  isValid: () => boolean;
}

class CSRFTokenManager {
  private static instance: CSRFTokenManager;
  private store: CSRFTokenStore = {
    token: null,
    lastUpdated: null,
    isValid: function() {
      if (!this.token || !this.lastUpdated) return false;
      const now = Date.now();
      return (now - this.lastUpdated) < 3600000;
    }
  };

  private readonly CSRF_COOKIE_NAME = 'csrftoken';
  private readonly SESSION_STORAGE_KEY = '__csrf_token__';
  private readonly TOKEN_MAX_AGE = 3600000;

  private constructor() {
    this.cleanupOldStorage();
    this.loadFromStorage();
  }

  private cleanupOldStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const oldKey = 'admin_csrf_token';
      if (sessionStorage.getItem(oldKey)) {
        sessionStorage.removeItem(oldKey);
      }
      if (localStorage.getItem(oldKey)) {
        localStorage.removeItem(oldKey);
      }
    } catch (error) {
          }
  }

  public static getInstance(): CSRFTokenManager {
    if (!CSRFTokenManager.instance) {
      CSRFTokenManager.instance = new CSRFTokenManager();
    }
    return CSRFTokenManager.instance;
  }

  private getCookieToken(): string | null {
    if (typeof document === 'undefined') return null;

    try {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === this.CSRF_COOKIE_NAME) {
          return decodeURIComponent(value);
        }
      }
    } catch (error) {
      // Error reading cookie
    }
    return null;
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = sessionStorage.getItem(this.SESSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.token && parsed.lastUpdated) {
          this.store.token = parsed.token;
          this.store.lastUpdated = parsed.lastUpdated;
          
          if (!this.store.isValid()) {
            this.clear();
          }
        }
      }
    } catch (error) {
      this.clear();
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      if (this.store.token) {
        sessionStorage.setItem(
          this.SESSION_STORAGE_KEY,
          JSON.stringify({
            token: this.store.token,
            lastUpdated: this.store.lastUpdated
          })
        );
      } else {
        sessionStorage.removeItem(this.SESSION_STORAGE_KEY);
      }
    } catch (error) {
      // Error saving to storage
    }
  }

  public getToken(): string | null {
    if (this.store.isValid()) {
      return this.store.token;
    }

    this.loadFromStorage();
    if (this.store.isValid()) {
      return this.store.token;
    }

    const cookieToken = this.getCookieToken();
    if (cookieToken) {
      this.setToken(cookieToken);
      return cookieToken;
    }

    return null;
  }

  public setToken(token: string | null): void {
    if (token) {
      this.store.token = token;
      this.store.lastUpdated = Date.now();
      this.saveToStorage();
    } else {
      this.clear();
    }
  }

  public clear(): void {
    this.store.token = null;
    this.store.lastUpdated = null;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.SESSION_STORAGE_KEY);
    }
  }

  public async refresh(): Promise<string | null> {
    const cookieToken = this.getCookieToken();
    if (cookieToken) {
      this.setToken(cookieToken);
      return cookieToken;
    }
    return null;
  }

  public hasValidToken(): boolean {
    const token = this.getToken();
    return token !== null && token.length > 0;
  }
}

export const csrfManager = CSRFTokenManager.getInstance();

export const csrfTokenStore = {
  getToken: () => csrfManager.getToken(),
  setToken: (token: string | null) => csrfManager.setToken(token),
  clearToken: () => csrfManager.clear(),
  hasToken: () => csrfManager.hasValidToken(),
  refreshToken: () => csrfManager.refresh(),
  getStoredToken: () => csrfManager.getToken(),
};

