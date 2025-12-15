interface CSRFTokenStore {
  token: string | null;
  lastUpdated: number | null;
  sessionKey: string | null;
  isValid: () => boolean;
}

class CSRFTokenManager {
  private static instance: CSRFTokenManager;
  private store: CSRFTokenStore = {
    token: null,
    lastUpdated: null,
    sessionKey: null,
    isValid: function() {
      if (!this.token || !this.lastUpdated) return false;
      const now = Date.now();
      const isNotExpired = (now - this.lastUpdated) < 3600000;
      
      if (typeof window !== 'undefined') {
        const currentSession = CSRFTokenManager.getSessionFromCookie();
        if (this.sessionKey && currentSession !== this.sessionKey) {
          return false;
        }
      }
      
      return isNotExpired;
    }
  };

  private readonly CSRF_COOKIE_NAME = 'csrftoken';
  private readonly SESSION_COOKIE_NAME = 'sessionid';
  private readonly SESSION_STORAGE_KEY = '__csrf_token__';
  private readonly TOKEN_MAX_AGE = 3600000;

  private constructor() {
    this.cleanupOldStorage();
    this.loadFromStorage();
    this.syncWithSession();
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

  private static getSessionFromCookie(): string | null {
    if (typeof document === 'undefined') return null;

    try {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'sessionid') {
          return decodeURIComponent(value);
        }
      }
    } catch (error) {
    }
    return null;
  }

  private syncWithSession(): void {
    if (typeof window === 'undefined') return;

    const currentSession = CSRFTokenManager.getSessionFromCookie();
    
    if (!currentSession) {
      this.clear();
      return;
    }

    if (this.store.sessionKey && this.store.sessionKey !== currentSession) {
      this.clear();
    }

    this.store.sessionKey = currentSession;
    this.saveToStorage();
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
    }
    return null;
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = sessionStorage.getItem(this.SESSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.token && parsed.lastUpdated && parsed.sessionKey) {
          this.store.token = parsed.token;
          this.store.lastUpdated = parsed.lastUpdated;
          this.store.sessionKey = parsed.sessionKey;
          
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
      if (this.store.token && this.store.sessionKey) {
        sessionStorage.setItem(
          this.SESSION_STORAGE_KEY,
          JSON.stringify({
            token: this.store.token,
            lastUpdated: this.store.lastUpdated,
            sessionKey: this.store.sessionKey
          })
        );
      } else {
        sessionStorage.removeItem(this.SESSION_STORAGE_KEY);
      }
    } catch (error) {
    }
  }

  public getToken(): string | null {
    this.syncWithSession();

    if (this.store.isValid()) {
      return this.store.token;
    }

    this.loadFromStorage();
    if (this.store.isValid()) {
      return this.store.token;
    }

    const cookieToken = this.getCookieToken();
    const sessionId = CSRFTokenManager.getSessionFromCookie();
    
    if (cookieToken && sessionId) {
      this.store.token = cookieToken;
      this.store.lastUpdated = Date.now();
      this.store.sessionKey = sessionId;
      this.saveToStorage();
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
    this.store.sessionKey = null;
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

