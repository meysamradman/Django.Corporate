const SESSION_COOKIE = 'sessionid';
const CSRF_COOKIE = 'csrftoken';
const CSRF_STORAGE_KEY = '__csrf_token__';
const TOKEN_MAX_AGE = 3600000;

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
      const isNotExpired = (now - this.lastUpdated) < TOKEN_MAX_AGE;
      
      if (typeof window !== 'undefined') {
        const currentSession = CSRFTokenManager.getSessionFromCookie();
        if (this.sessionKey && currentSession !== this.sessionKey) {
          return false;
        }
      }
      
      return isNotExpired;
    }
  };

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
      // Silent
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
        if (name === SESSION_COOKIE) {
          return decodeURIComponent(value);
        }
      }
    } catch (error) {
      // Silent
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
        if (name === CSRF_COOKIE) {
          return decodeURIComponent(value);
        }
      }
    } catch (error) {
      // Silent
    }
    return null;
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = sessionStorage.getItem(CSRF_STORAGE_KEY);
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
          CSRF_STORAGE_KEY,
          JSON.stringify({
            token: this.store.token,
            lastUpdated: this.store.lastUpdated,
            sessionKey: this.store.sessionKey
          })
        );
      } else {
        sessionStorage.removeItem(CSRF_STORAGE_KEY);
      }
    } catch (error) {
      // Silent
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
      sessionStorage.removeItem(CSRF_STORAGE_KEY);
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

class SessionManager {
  private static instance: SessionManager;

  private constructor() {}

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  public hasSession(): boolean {
    if (typeof document === 'undefined') return false;
    
    const csrfToken = this.getCookie(CSRF_COOKIE);
    if (!csrfToken || csrfToken.length === 0) {
      return false;
    }
    
    return true;
  }

  public getCurrentSessionId(): string | null {
    return this.getCookie(SESSION_COOKIE);
  }

  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    
    try {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const trimmed = cookie.trim();
        if (!trimmed) continue;
        const [key, ...valueParts] = trimmed.split('=');
        if (key === name && valueParts.length > 0) {
          return decodeURIComponent(valueParts.join('='));
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[SessionManager] getCookie error:', error);
      }
    }
    return null;
  }

  public clearSession(): void {
    this.deleteCookie(SESSION_COOKIE);
    this.deleteCookie(CSRF_COOKIE);
    csrfManager.clear();

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.clear();
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('[SessionManager] Storage clear failed:', error);
        }
      }
    }
  }

  private deleteCookie(name: string): void {
    if (typeof document === 'undefined') return;

    const hostname = window.location.hostname;
    const domainParts = hostname.split('.');
    const domain = domainParts.length > 1 ? `.${domainParts.slice(-2).join('.')}` : hostname;

    const configs = [
      `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC;`,
      `${name}=; Max-Age=0;`,
      `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`,
      `${name}=; Max-Age=0; path=/;`,
      `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${hostname};`,
      `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`,
    ];

    configs.forEach(config => {
      try {
        document.cookie = config;
      } catch (error) {
        // Silent fail
      }
    });
  }

  public handleExpiredSession(): void {
    if (typeof window === 'undefined') return;
    
    this.clearSession();
    
    const currentPath = window.location.pathname;
    if (!currentPath.startsWith('/login')) {
      const returnTo = currentPath !== '/' 
        ? `?return_to=${encodeURIComponent(currentPath + window.location.search)}` 
        : '';
      
      window.location.replace(`/login${returnTo}`);
    }
  }
}

export const csrfManager = CSRFTokenManager.getInstance();
export const sessionManager = SessionManager.getInstance();

export function getCsrfHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const csrfToken = csrfManager.getToken();

  if (csrfToken) {
    headers['X-CSRFToken'] = csrfToken;
  }

  return headers;
}

