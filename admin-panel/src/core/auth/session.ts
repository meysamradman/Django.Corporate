const SESSION_COOKIE = 'sessionid';
const CSRF_COOKIE = 'csrftoken';

class CSRFTokenManager {
  private static instance: CSRFTokenManager;

  private constructor() {
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
        if (name === CSRF_COOKIE) {
          return decodeURIComponent(value);
        }
      }
    } catch (error) {
    }
    return null;
  }

  public getToken(): string | null {
    return this.getCookieToken();
  }

  public setToken(token: string | null): void {
    if (!token) this.clear();
  }

  public clear(): void {
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
  private redirecting = false;

  private constructor() {}

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  public hasSession(): boolean {
    if (typeof document === 'undefined') return false;

    const sessionId = this.getCookie(SESSION_COOKIE);
    const csrfToken = this.getCookie(CSRF_COOKIE);

    return Boolean(
      (sessionId && sessionId.length > 0) ||
      (csrfToken && csrfToken.length > 0)
    );
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
    }
    return null;
  }

  public clearSession(): void {
    this.deleteCookie(SESSION_COOKIE);
    this.deleteCookie(CSRF_COOKIE);
    csrfManager.clear();
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
      }
    });
  }

  public handleExpiredSession(): void {
    if (typeof window === 'undefined') return;

    if (this.redirecting) {
      return;
    }

    this.redirecting = true;
    
    this.clearSession();
    
    const currentPath = window.location.pathname;
    if (!currentPath.startsWith('/login')) {
      const returnTo = currentPath !== '/' 
        ? `?return_to=${encodeURIComponent(currentPath + window.location.search)}` 
        : '';
      
      window.location.replace(`/login${returnTo}`);
      return;
    }

    this.redirecting = false;
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

