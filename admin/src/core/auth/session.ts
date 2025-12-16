/**
 * 🔥 Session & CSRF Token Manager - همه چیز در یک فایل
 * - Session management (logout, clearSession, hasSession)
 * - CSRF token management (get, set, clear, refresh)
 * - Complete cleanup
 */

// ============================================
// Constants
// ============================================
const SESSION_COOKIE = 'sessionid';
const CSRF_COOKIE = 'csrftoken';
const STORAGE_KEY = 'admin-ui-storage';
const CSRF_STORAGE_KEY = '__csrf_token__';
const TOKEN_MAX_AGE = 3600000;

// ============================================
// CSRF Token Manager
// ============================================
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

// ============================================
// Session Manager
// ============================================
class SessionManager {
  private static instance: SessionManager;
  private isCheckingSession = false;
  private lastSessionId: string | null = null;
  private checkInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // ❌ Monitoring غیرفعال - فقط به 401 response تکیه می‌کنیم
    // Session expiry فقط با API call چک می‌شه
  }

  /**
   * ✅ Monitor تغییر session ID - فقط چک می‌کند cookie، API call نمی‌زند
   */
  private startSessionIdMonitoring(): void {
    // هر 3 ثانیه یکبار چک کن (خیلی سبک - فقط cookie read)
    this.checkInterval = setInterval(() => {
      // ✅ Skip در صفحه login
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/login')) {
        return;
      }
      
      const currentSessionId = this.getCurrentSessionId();
      
      // اگر session ID تغییر کرده و قبلی وجود داشت
      if (this.lastSessionId && currentSessionId && this.lastSessionId !== currentSessionId) {
        console.log('[SessionManager] ❌ Session ID changed - expired session detected');
        console.log(`[SessionManager] Old: ${this.lastSessionId.substring(0, 20)}...`);
        console.log(`[SessionManager] New: ${currentSessionId.substring(0, 20)}...`);
        this.handleExpiredSession();
        this.stopSessionIdMonitoring();
        return;
      }
      
      // ✅ اگر session ID پاک شده اما قبلی وجود داشت - redirect
      if (this.lastSessionId && !currentSessionId) {
        console.log('[SessionManager] ❌ Session ID deleted - expired session detected');
        this.handleExpiredSession();
        this.stopSessionIdMonitoring();
        return;
      }
      
      // Update last session ID
      if (currentSessionId) {
        this.lastSessionId = currentSessionId;
      }
    }, 3000); // هر 3 ثانیه - سریع‌تر برای detect کردن سریع expiry
  }

  /**
   * ✅ Stop monitoring
   */
  private stopSessionIdMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * ✅ آیا session cookie وجود دارد؟
   */
  public hasSession(): boolean {
    if (typeof document === 'undefined') return false;
    return this.getCookie(SESSION_COOKIE) !== null;
  }

  /**
   * ✅ دریافت session ID فعلی
   */
  public getCurrentSessionId(): string | null {
    return this.getCookie(SESSION_COOKIE);
  }

  /**
   * ✅ چک کردن تغییر session ID (یعنی session منقضی شده و جدید ساخته شده)
   */
  public checkSessionChanged(): boolean {
    const currentSessionId = this.getCurrentSessionId();
    if (this.lastSessionId && currentSessionId && this.lastSessionId !== currentSessionId) {
      // Session ID تغییر کرده - یعنی session قبلی منقضی شده
      return true;
    }
    if (this.lastSessionId === null && currentSessionId) {
      // اولین بار session را set می‌کنیم
      this.lastSessionId = currentSessionId;
    }
    return false;
  }

  /**
   * ✅ Update last session ID
   */
  public updateSessionId(): void {
    this.lastSessionId = this.getCurrentSessionId();
  }

  /**
   * ✅ Reset session tracking (برای login)
   */
  public resetSessionTracking(): void {
    this.lastSessionId = this.getCurrentSessionId();
    // Monitoring غیرفعال است
  }

  /**
   * ✅ Clear session tracking (برای logout)
   */
  public clearSessionTracking(): void {
    this.lastSessionId = null;
    // Monitoring غیرفعال است
  }

  /**
   * ✅ دریافت cookie
   */
  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split('=');
      if (key === name) {
        return decodeURIComponent(value);
      }
    }
    return null;
  }

  /**
   * ✅ بررسی validity از backend
   */
  public async validateSession(): Promise<boolean> {
    if (!this.hasSession()) return false;
    
    if (this.isCheckingSession) return true;
    
    this.isCheckingSession = true;
    
    try {
      const { env } = await import('@/core/config/environment');
      const response = await fetch(`${env.API_BASE_URL}/admin/session/check/`, {
        method: 'HEAD',
        credentials: 'include',
        cache: 'no-store',
      });

      return response.ok;
    } catch (error) {
      console.error('[SessionManager] Validation failed:', error);
      return false;
    } finally {
      this.isCheckingSession = false;
    }
  }

  /**
   * ✅ پاک کردن کامل session
   */
  public clearSession(): void {
    // 0. Clear tracking
    this.clearSessionTracking();
    
    // 1. حذف cookies - چند بار برای اطمینان
    this.deleteCookie(SESSION_COOKIE);
    this.deleteCookie(CSRF_COOKIE);
    
    // دوباره حذف کن برای اطمینان
    setTimeout(() => {
      this.deleteCookie(SESSION_COOKIE);
      this.deleteCookie(CSRF_COOKIE);
    }, 100);

    // 2. حذف CSRF token از storage
    csrfManager.clear();

    // 3. حذف storage - همه چیز را پاک کن
    if (typeof window !== 'undefined') {
      try {
        // حذف admin-ui-storage
        localStorage.removeItem(STORAGE_KEY);
        
        // حذف همه localStorage
        localStorage.clear();
        
        // حذف همه sessionStorage
        sessionStorage.clear();
        
        // یک بار دیگر برای اطمینان
        setTimeout(() => {
          try {
            localStorage.clear();
            sessionStorage.clear();
            this.deleteCookie(SESSION_COOKIE);
            this.deleteCookie(CSRF_COOKIE);
          } catch (e) {
            // Silent
          }
        }, 50);
      } catch (error) {
        console.error('[SessionManager] Storage clear failed:', error);
      }
    }

    console.log('[SessionManager] ✅ Session cleared');
  }

  /**
   * ✅ حذف cookie - همه حالات را پوشش می‌دهد
   */
  private deleteCookie(name: string): void {
    if (typeof document === 'undefined') return;

    const hostname = window.location.hostname;
    const domainParts = hostname.split('.');
    const domain = domainParts.length > 1 ? `.${domainParts.slice(-2).join('.')}` : hostname;

    // همه حالات ممکن برای حذف cookie
    const configs = [
      // بدون domain و path
      `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC;`,
      `${name}=; Max-Age=0;`,
      // با path=/ بدون domain
      `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`,
      `${name}=; Max-Age=0; path=/;`,
      `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax;`,
      `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None;`,
      // با domain
      `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${hostname};`,
      `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`,
      `${name}=; Max-Age=0; path=/; domain=${hostname};`,
      `${name}=; Max-Age=0; path=/; domain=${domain};`,
      // بدون path با domain
      `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${hostname};`,
      `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${domain};`,
    ];

    // حذف با همه configs
    configs.forEach(config => {
      try {
        document.cookie = config;
      } catch (error) {
        // Silent fail
      }
    });

    // همچنین از document.cookie حذف کن
    try {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(`${name}=`)) {
          // Cookie پیدا شد - حذف کن
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      }
    } catch (error) {
      // Silent fail
    }
  }

  /**
   * ✅ Handle expired session - فقط وقتی 401 می‌آید صدا زده می‌شود
   */
  public handleExpiredSession(): void {
    console.log('[SessionManager] ❌ Handling expired session - clearing everything');
    
    this.clearSession();
    
    if (typeof window !== 'undefined') {
      // ✅ پاک کردن قطعی cookies - چند بار برای اطمینان
      for (let i = 0; i < 3; i++) {
        this.deleteCookie(SESSION_COOKIE);
        this.deleteCookie(CSRF_COOKIE);
      }
      
      // پاک کردن کل storage
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.error('[SessionManager] Storage clear failed:', e);
      }
      
      // Redirect به login
      const currentPath = window.location.pathname + window.location.search;
      const returnTo = currentPath !== '/' && !currentPath.startsWith('/login') 
        ? `?return_to=${encodeURIComponent(currentPath)}` 
        : '';
      
      console.log('[SessionManager] ➡️ Redirecting to /login');
      
      // ✅ Hard redirect با window.location.replace برای پاک کردن history
      window.location.replace(`/login${returnTo}`);
    }
  }


  /**
   * ✅ Logout کامل
   */
  public async logout(): Promise<void> {
    try {
      const { env } = await import('@/core/config/environment');
      await fetch(`${env.API_BASE_URL}/admin/logout/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('[SessionManager] Logout API failed:', error);
    } finally {
      this.clearSession();
      
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }
}

// ============================================
// Exports
// ============================================
export const csrfManager = CSRFTokenManager.getInstance();
export const sessionManager = SessionManager.getInstance();

export const csrfTokenStore = {
  getToken: () => csrfManager.getToken(),
  setToken: (token: string | null) => csrfManager.setToken(token),
  clearToken: () => csrfManager.clear(),
  hasToken: () => csrfManager.hasValidToken(),
  refreshToken: () => csrfManager.refresh(),
  getStoredToken: () => csrfManager.getToken(),
};

/**
 * ✅ دریافت CSRF headers برای API requests
 */
export function getCsrfHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const csrfToken = csrfTokenStore.getToken();

  if (csrfToken) {
    headers['X-CSRFToken'] = csrfToken;
  }

  return headers;
}

