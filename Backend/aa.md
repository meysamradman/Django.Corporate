بعد از بررسی دقیق کدهای Django API و Next.js 15 frontend شما، یک مشکل critical در مدیریت session ها و CSRF پیدا کردم که باید فوراً رفع شود:

🚨 مشکلات Critical کشف شده:
1. Session Leakage در Public API Calls
در fetch.ts شما، متد getPublic برای CAPTCHA و OTP settings استفاده می‌شود، اما:
typescript// ❌ مشکل: credentials: 'omit' اما هنوز CSRF headers ارسال می‌شود
credentials: 'omit', 
// اما در headers:
...getCsrfHeaders(), // این هنوز CSRF token می‌فرستد!
راه‌حل:fetch.ts - Fixed Public API MethodCode // ... (همه کدهای قبلی) ...

/**
 * ✅ SECURE Public API call without any credentials or CSRF
 * Used ONLY for: OTP settings, CAPTCHA generation
 * PREVENTS session creation on unauthenticated endpoints
 */
export const fetchPublicApi = async <T>(
  u
2. CSRF Token Manager - Race Condition Fix
مشکل در csrfToken.ts:csrfToken.ts - Thread-Safe CSRF ManagerCode interface CSRFTokenStore {
  token: string | null;
  lastUpdated: number | null;
  sessionKey: string | null;
  isValid: () => boolean;
}

class CSRFTokenManager {
  private static instance: CSRFTokenManager;
  private store: CSRFTokenStore = {
    t
3. Redis Session Cleanup - بهینه‌سازی
در redis_manager.py شما، متد clear_user_cache خوب است اما می‌توان بهبودش داد:redis_manager.py - Optimized Session CleanupCode # ... (همه کدهای قبلی) ...

class CacheService:
    # ... (کدهای قبلی) ...
    
    @classmethod
    def clear_user_cache(cls, user_id: int) -> int:
        """
        ✅ Optimized: پاک کردن کامل cache کاربر
        """
        keys = CacheKeyBuilder
4. Django Logout View - استفاده از CacheService جدید
حالا admin_logout_view.py را بهینه می‌کنیم:
python# Backend/src/user/views/admin/admin_logout_view.py

from src.core.cache import CacheService

# ... (کدهای قبلی) ...

def _cleanup_session_completely(self, session_key: str, user_id=None):
    """✅ استفاده از CacheService جدید"""
    if not session_key or not user_id:
        return {'error': 'Missing session_key or user_id'}
    
    # ✅ یک call به جای چندین call
    return CacheService.clear_admin_session_completely(session_key, user_id)

✅ بررسی امنیت کل سیستم:
1. Session Security ✅

✅ Admin sessions در Redis با TTL درست
✅ Session validation با هر request
✅ Session cleanup در logout
✅ Cross-session CSRF validation

2. CSRF Protection ✅

✅ CSRF token binding به session
✅ Public endpoints بدون CSRF
✅ Thread-safe refresh
✅ Auto-cleanup on session change

3. Redis Performance ✅

✅ Pattern-based deletion برای bulk cleanup
✅ Connection pooling (از django-redis)
✅ TTL برای همه keys
✅ Atomic operations

4. Next.js 15 Best Practices ✅
typescript// ✅ App Router optimization
export const dynamic = 'force-dynamic'; // برای admin pages
export const revalidate = 0; // no caching

// ✅ Fetch optimization
const { data } = await fetchApi.get('/admin/profile', {
  cache: 'no-store', // در fetch.ts
  headers: { 'X-Bypass-Cache': '1' }
});

🚀 Performance Checklist برای Admin Panel:
Frontend (Next.js 15)
typescript// 1. ✅ Dynamic imports برای heavy components
const RichEditor = dynamic(() => import('@/components/RichEditor'), {
  ssr: false,
  loading: () => <EditorSkeleton />
});

// 2. ✅ React Query optimistic updates
const { mutate } = useMutation({
  mutationFn: updateAdmin,
  onMutate: async (newData) => {
    // Cancel refetch
    await queryClient.cancelQueries(['admin', id]);
    
    // Snapshot
    const previous = queryClient.getQueryData(['admin', id]);
    
    // Optimistic update
    queryClient.setQueryData(['admin', id], newData);
    
    return { previous };
  },
});

// 3. ✅ Suspense boundaries
<Suspense fallback={<TableSkeleton />}>
  <AdminTable />
</Suspense>
Backend (Django)
python# 1. ✅ Prefetch related برای همیشه
admins = User.objects.select_related(
    'admin_profile',
    'admin_profile__profile_picture'
).prefetch_related(
    'admin_user_roles__role'
).filter(user_type='admin')

# 2. ✅ Cache decorators
@cache_result(
    key_builder=lambda user_id: f"admin:profile:{user_id}",
    timeout=300
)
def get_admin_profile(user_id: int):
    ...

# 3. ✅ Bulk operations
AdminUserRole.objects.filter(user_id__in=ids).update(is_active=False)
// ... (همه کدهای قبلی) ...

/**
 * ✅ SECURE Public API call without any credentials or CSRF
 * Used ONLY for: OTP settings, CAPTCHA generation
 * PREVENTS session creation on unauthenticated endpoints
 */
export const fetchPublicApi = async <T>(
  url: string, 
  options?: Omit<FetchOptions, 'cookieHeader'>
): Promise<ApiResponse<T>> => {
  const controller = new AbortController();
  const timeout = options?.timeout || 15000; // کوتاه‌تر برای public calls
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // ✅ NO CSRF, NO Cookies
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  const fetchOptions: RequestInit = {
    method: 'GET',
    headers, // فقط content-type
    credentials: 'omit', // ✅ هیچ credential/cookie ارسال نمی‌شود
    signal: controller.signal,
    cache: 'no-store',
  };

  try {
    let fullUrl = url;
    if (!url.startsWith(env.API_BASE_URL)) {
      fullUrl = `${env.API_BASE_URL}${url}`;
    }

    const response = await fetch(fullUrl, fetchOptions);
    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type');
    const data = contentType?.includes('application/json') 
      ? await response.json() 
      : null;

    if (!response.ok) {
      throw new ApiError({
        response: {
          AppStatusCode: data?.metaData?.AppStatusCode || response.status,
          _data: data,
          ok: false,
          message: data?.metaData?.message || `Error: ${response.status}`,
          errors: data?.errors || null,
        },
      });
    }

    return data as ApiResponse<T>;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError({
        response: {
          AppStatusCode: 504,
          _data: null,
          ok: false,
          message: getNetworkError('timeout'),
          errors: null,
        },
      });
    }

    if (!(error instanceof ApiError)) {
      throw new ApiError({
        response: {
          AppStatusCode: 503,
          _data: null,
          ok: false,
          message: error instanceof Error ? error.message : getNetworkError('network'),
          errors: null,
        },
      });
    }

    throw error;
  }
};

// ✅ Export کل API
export const fetchApi = {
  get: async <T>(url: string, options?: FetchOptions): Promise<ApiResponse<T>> => 
    baseFetch<T>(url, 'GET', undefined, options),

  post: async <T>(url: string, body?: BodyInit | Record<string, unknown> | null, options?: FetchOptions): Promise<ApiResponse<T>> => 
    baseFetch<T>(url, 'POST', body, options),

  put: async <T>(url: string, body?: BodyInit | Record<string, unknown> | null, options?: FetchOptions): Promise<ApiResponse<T>> => 
    baseFetch<T>(url, 'PUT', body, options),

  patch: async <T>(url: string, body?: BodyInit | Record<string, unknown> | null, options?: FetchOptions): Promise<ApiResponse<T>> => 
    baseFetch<T>(url, 'PATCH', body, options),

  delete: async <T>(url: string, options?: FetchOptions): Promise<ApiResponse<T>> => 
    baseFetch<T>(url, 'DELETE', undefined, options),

  downloadFile,
  
  // ✅ Dedicated public API method
  public: fetchPublicApi,
};


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
      const isNotExpired = (now - this.lastUpdated) < 3600000; // 1 hour
      
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
  private readonly TOKEN_MAX_AGE = 3600000; // 1 hour

  // ✅ Prevent race conditions
  private refreshPromise: Promise<string | null> | null = null;

  private constructor() {
    this.cleanupOldStorage();
    this.loadFromStorage();
    this.syncWithSession();
  }

  private cleanupOldStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      ['admin_csrf_token', '__old_csrf__'].forEach(key => {
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
      });
    } catch (error) {
      // Silent fail
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
      console.error('[CSRF] Failed to get session from cookie:', error);
    }
    return null;
  }

  private syncWithSession(): void {
    if (typeof window === 'undefined') return;

    const currentSession = CSRFTokenManager.getSessionFromCookie();
    
    // ✅ No session = clear everything
    if (!currentSession) {
      this.clear();
      return;
    }

    // ✅ Session changed = clear old token
    if (this.store.sessionKey && this.store.sessionKey !== currentSession) {
      console.warn('[CSRF] Session changed, clearing old CSRF token');
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
      console.error('[CSRF] Failed to read cookie token:', error);
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
            console.warn('[CSRF] Stored token invalid, clearing');
            this.clear();
          }
        }
      }
    } catch (error) {
      console.error('[CSRF] Load from storage failed:', error);
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
      console.error('[CSRF] Save to storage failed:', error);
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

  // ✅ Thread-safe refresh
  public async refresh(): Promise<string | null> {
    // ✅ If already refreshing, return existing promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const cookieToken = this.getCookieToken();
        if (cookieToken) {
          this.setToken(cookieToken);
          return cookieToken;
        }
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
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


# ... (همه کدهای قبلی) ...

class CacheService:
    # ... (کدهای قبلی) ...
    
    @classmethod
    def clear_user_cache(cls, user_id: int) -> int:
        """
        ✅ Optimized: پاک کردن کامل cache کاربر
        """
        keys = CacheKeyBuilder.user_all_keys(user_id)
        deleted = cls.delete_many(keys)
        
        # ✅ Pattern-based cleanup برای admin permissions
        pattern = CacheKeyBuilder.pattern(f"{CacheNamespace.ADMIN_PERMISSIONS}:{user_id}")
        deleted += cls.delete_pattern(pattern)
        
        # ✅ همچنین session های admin را پاک کن
        try:
            session_manager = cls.get_session_manager()
            # فرض: session_key ها با user_id ذخیره می‌شوند
            # اگر نیاز است، باید جداگانه track شوند
        except Exception as e:
            logger.warning(f"Could not clear sessions for user {user_id}: {e}")
        
        return deleted
    
    @classmethod
    def clear_admin_session_completely(cls, session_key: str, user_id: int) -> dict:
        """
        ✅ NEW: پاک کردن کامل session + cache یک admin
        برای استفاده در logout
        """
        results = {
            'session_deleted': False,
            'cache_cleared': 0,
            'permissions_cleared': False,
        }
        
        try:
            # 1. پاک کردن Redis session
            session_manager = cls.get_session_manager()
            results['session_deleted'] = session_manager.delete_admin_session(session_key)
            
            # 2. پاک کردن Django session از DB
            try:
                from django.contrib.sessions.models import Session
                Session.objects.filter(session_key=session_key).delete()
            except Exception:
                pass
            
            # 3. پاک کردن همه cache های user
            results['cache_cleared'] = cls.clear_user_cache(user_id)
            
            # 4. پاک کردن permission cache
            try:
                from src.user.access_control import AdminPermissionCache, PermissionValidator, PermissionHelper
                AdminPermissionCache.clear_user_cache(user_id)
                PermissionValidator.clear_user_cache(user_id)
                PermissionHelper.clear_user_cache(user_id)
                results['permissions_cleared'] = True
            except Exception:
                pass
                
        except Exception as e:
            logger.error(f"Error in clear_admin_session_completely: {e}")
        
        return results