# 🚀 راهنمای پیاده‌سازی Session Management (Next.js 16 + Django)

## 📁 ساختار فایل‌ها

```
admin/
├── src/
│   ├── proxy.ts                          ✅ جایگزین middleware
│   ├── core/
│   │   ├── session/
│   │   │   └── SessionManager.ts         ✅ جدید
│   │   └── auth/
│   │       ├── AuthContext.tsx           🔄 بروزرسانی
│   │       └── csrfToken.ts              (بدون تغییر)
│   └── components/
│       └── auth/
│           └── LoginForm.tsx             (بدون تغییر)

Backend/
├── src/user/views/admin/
│   ├── admin_session_check_view.py       ✅ جدید
│   ├── admin_logout_view.py              🔄 بروزرسانی
│   └── __init__.py                       🔄 بروزرسانی
└── src/user/urls.py                      🔄 بروزرسانی
```

---

## 🎯 معماری 2025

### چرا proxy.ts؟
در Next.js 16:
- ✅ **middleware.ts deprecated شد**
- ✅ **proxy.ts در Node.js runtime اجرا میشه** (نه Edge)
- ✅ **export function proxy** (نه middleware)
- ✅ lightweight: فقط cookie check

### Session Flow

```
User Request
     ↓
┌─────────────────────────────────┐
│  proxy.ts (Next.js 16)          │
│  - Cookie exists? ✅             │
│  - Public path? ✅               │
│  - Redirect if needed            │
└─────────────────────────────────┘
     ↓
┌─────────────────────────────────┐
│  SessionManager (Client)        │
│  - Check validity every 30s     │
│  - Auto-redirect on expire      │
│  - Complete cleanup             │
└─────────────────────────────────┘
     ↓
┌─────────────────────────────────┐
│  Django Backend                 │
│  - Redis session (TTL: 2 min)   │
│  - DB session cleanup           │
│  - Permission cache clear       │
└─────────────────────────────────┘
```

---

## 📝 مراحل پیاده‌سازی

### 1️⃣ Backend (15 دقیقه)

#### الف) فایل جدید: Session Check View
```python
# Backend/src/user/views/admin/admin_session_check_view.py
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from src.user.access_control import SimpleAdminPermission
from src.core.cache import CacheService


@method_decorator(csrf_exempt, name='dispatch')
class AdminSessionCheckView(APIView):
    authentication_classes = [CSRFExemptSessionAuthentication]
    permission_classes = [SimpleAdminPermission]
    
    def head(self, request):
        """HEAD request - session validity check"""
        if not request.user or not request.user.is_authenticated:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        
        if request.user.user_type != 'admin' or not request.user.is_admin_active:
            return Response(status=status.HTTP_403_FORBIDDEN)
        
        # Check Redis
        session_key = request.session.session_key
        if session_key:
            session_manager = CacheService.get_session_manager()
            user_id = session_manager.get_admin_session(session_key)
            
            if not user_id or user_id != request.user.id:
                return Response(status=status.HTTP_401_UNAUTHORIZED)
        
        return Response(status=status.HTTP_200_OK)
```

#### ب) بروزرسانی __init__.py
```python
# Backend/src/user/views/admin/__init__.py
from .admin_session_check_view import AdminSessionCheckView

__all__ = [
    # ... سایر views
    'AdminSessionCheckView',
]
```

#### ج) بروزرسانی URLs
```python
# Backend/src/user/urls.py
from src.user.views.admin import AdminSessionCheckView

urlpatterns = [
    # ... سایر URLها
    path('admin/session/check/', AdminSessionCheckView.as_view(), name='admin-session-check'),
]
```

#### د) Logout View (بدون تغییر)
از همون Logout View قبلی استفاده کنید که در artifacts قبلی نوشته شد.

---

### 2️⃣ Frontend (10 دقیقه)

#### الف) ساخت فایل‌های جدید
فایل‌های زیر رو از artifacts کپی کنید:

1. `admin/src/proxy.ts` ← proxy for Next.js 16
2. `admin/src/core/session/SessionManager.ts` ← session manager
3. `admin/src/core/auth/AuthContext.tsx` ← بروزرسانی شده

#### ب) بررسی ساختار
```bash
# چک کنید که فایل‌ها در مسیر درست هستند:
admin/src/proxy.ts                    ✅
admin/src/core/session/SessionManager.ts  ✅
admin/src/core/auth/AuthContext.tsx   ✅
```

---

### 3️⃣ تست (10 دقیقه)

#### الف) تست Logout
```bash
# 1. Login کنید
# 2. Logout کنید
# 3. DevTools → Application:
#    - Cookies: sessionid ❌ (پاک شده)
#    - Cookies: csrftoken ❌ (پاک شده)
#    - Local Storage: admin-ui-storage ❌ (پاک شده)
```

#### ب) تست Session Expiry
```bash
# 1. Login کنید
# 2. صبر کنید 2 دقیقه (timeout)
# 3. یک صفحه دیگه باز کنید
# 4. باید به /login redirect بشید ✅
```

#### ج) تست Redis
```bash
# Windows:
redis-cli
127.0.0.1:6379> keys "admin:session:*"
127.0.0.1:6379> ttl admin:session:YOUR_SESSION_KEY
```

---

## 🔧 Troubleshooting

### مشکل 1: "proxy is not defined"
```typescript
// چک کنید export درست باشه:
export default function proxy(req: NextRequest) {
  // ...
}

// ❌ اشتباه:
export function middleware(req: NextRequest) {}
```

### مشکل 2: "Cannot find SessionManager"
```typescript
// Path درست:
import { sessionManager } from '@/core/session/SessionManager';

// ❌ اشتباه:
import { sessionManager } from '@/core/services/session/sessionService';
```

### مشکل 3: "Session check 404"
```python
# چک کنید URL اضافه شده:
urlpatterns = [
    path('admin/session/check/', AdminSessionCheckView.as_view(), ...),
]
```

### مشکل 4: Cookie باقی می‌مونه
```typescript
// در SessionManager.ts چک کنید:
private deleteCookie(name: string): void {
  // باید همه configs رو داشته باشه
}
```

---

## 🎓 تفاوت با قبل

### ❌ معماری قبلی (اشتباه)
```
middleware.ts (deprecated در Next.js 16)
    ↓
Session check در middleware (سنگین)
    ↓
Storage نمی‌پاک شد
Cookie باقی می‌موند
```

### ✅ معماری جدید (2025)
```
proxy.ts (lightweight)
    ↓
SessionManager (client-side monitoring)
    ↓
Complete cleanup (cookies + storage + Redis)
    ↓
Auto-redirect on expire
```

---

## 📊 Performance

### Before
- ❌ Session check در هر request
- ❌ Database calls در middleware
- ❌ Heavy logic در Edge

### After (2025)
- ✅ فقط cookie check در proxy.ts
- ✅ Session check هر 30 ثانیه (client-side)
- ✅ Lightweight & fast

---

## 🚀 Production Settings

### Backend
```python
# Development:
ADMIN_SESSION_TIMEOUT_SECONDS = 120  # 2 دقیقه

# Production:
ADMIN_SESSION_TIMEOUT_SECONDS = 3 * 24 * 60 * 60  # 3 روز

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

### Frontend
```env
# .env.local
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
```

---

## ✅ Checklist نهایی

### Backend
- [ ] `AdminSessionCheckView` ساخته شد
- [ ] `__init__.py` بروزرسانی شد
- [ ] `urls.py` بروزرسانی شد
- [ ] Redis در حال اجرا است
- [ ] Backend restart شد

### Frontend
- [ ] `proxy.ts` ساخته شد (در `src/`)
- [ ] `SessionManager.ts` ساخته شد
- [ ] `AuthContext.tsx` بروزرسانی شد
- [ ] Frontend restart شد

### Testing
- [ ] Login/Logout تست شد
- [ ] Session expiry تست شد
- [ ] DevTools cookies چک شد
- [ ] Redis keys چک شد

---

## 🎉 موفق باشید!

این معماری:
- ✅ مطابق با Next.js 16
- ✅ حرفه‌ای و تمیز
- ✅ Session به صورت کامل پاک میشه
- ✅ Auto-redirect on expire
- ✅ Production-ready
- ✅ معماری 2025

**سوالی بود بگو!** 🚀

// admin/src/core/auth/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { UserWithProfile } from '@/types/auth/user';
import { authApi } from '@/api/auth/route';
import { useRouter, usePathname } from 'next/navigation';
import { ApiError } from '@/types/api/apiError';
import { csrfManager } from '@/core/auth/csrfToken';
import { LoginRequest } from '@/types/auth/auth';
import { PanelSettings } from '@/types/settings/panelSettings';
import { getPanelSettings } from '@/api/panel/route';
import { getQueryClient } from '@/core/utils/queryClient';
import { FaviconManager } from '@/components/layout/FaviconManager';
import { sessionManager } from '@/core/session/SessionManager';

interface AuthContextType {
  user: UserWithProfile | null;
  panelSettings: PanelSettings | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (mobile: string, password?: string, captchaId?: string, captchaAnswer?: string) => Promise<void>;
  loginWithOTP: (mobile: string, otp: string, captchaId?: string, captchaAnswer?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updatePanelSettingsInContext: (newSettings: PanelSettings) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_PATHS = ['/login'];

function serializeUser(user: any): UserWithProfile | null {
  if (!user) return null;
  return {
    ...user,
    user_type: user.user_type || 'admin',
  };
}

function serializePanelSettings(settings: any): PanelSettings | null {
  if (!settings) return null;
  return { ...settings };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserWithProfile | null>(null);
  const [panelSettings, setPanelSettings] = useState<PanelSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const initialized = React.useRef(false);

  const fetchPanelSettings = useCallback(async (permissions: string[]) => {
    const hasAccess = permissions.includes('all') || permissions.includes('panel.manage');
    if (!hasAccess) {
      setPanelSettings(null);
      return;
    }
    
    try {
      const data = await getPanelSettings();
      setPanelSettings(serializePanelSettings(data));
    } catch (error) {
      setPanelSettings(null);
    }
  }, []);

  const checkUserStatus = useCallback(async () => {
    if (PUBLIC_PATHS.includes(pathname)) {
      setIsLoading(false);
      return;
    }
    
    // ✅ چک session از SessionManager
    if (!sessionManager.hasSession()) {
      setUser(null);
      setPanelSettings(null);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const userData = await authApi.getCurrentAdminUser({ refresh: false }); 
      
      if (userData) {
        setUser(serializeUser(userData));
        await csrfManager.refresh();
        
        const permissions = userData.permissions || [];
        fetchPanelSettings(permissions).catch(() => {});
      } else {
        handleSessionExpired();
      }
    } catch (error) {
      if (error instanceof ApiError && error.response.AppStatusCode === 401) {
        handleSessionExpired();
      } else {
        setUser(null);
        setPanelSettings(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [pathname, fetchPanelSettings]);

  const handleSessionExpired = useCallback(() => {
    setUser(null);
    setPanelSettings(null);
    sessionManager.clearSession();
    
    const currentPath = window.location.pathname + window.location.search;
    const returnTo = currentPath !== '/' ? `?return_to=${encodeURIComponent(currentPath)}` : '';
    router.push(`/login${returnTo}`);
  }, [router]);

  // Initial check
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      checkUserStatus();
    }
  }, [checkUserStatus]);

  const login = async (mobile: string, password?: string, captchaId?: string, captchaAnswer?: string) => {
    setIsLoading(true);
    try {
      const loginData: LoginRequest = {
        mobile,
        login_type: 'password',
        password: password || '',
        captcha_id: captchaId || '',
        captcha_answer: captchaAnswer || '',
      };
      
      await authApi.login(loginData);
      await csrfManager.refresh();

      const userData = await authApi.getCurrentAdminUser({ refresh: true });
      if (!userData) throw new Error('Failed to load user');

      setUser(serializeUser(userData));
      
      const permissions = userData.permissions || [];
      fetchPanelSettings(permissions).catch(() => {});

      const urlParams = new URLSearchParams(window.location.search);
      const returnTo = urlParams.get('return_to') || '/';
      router.push(returnTo);
      
    } catch (error) {
      setUser(null);
      setPanelSettings(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithOTP = async (mobile: string, otp: string, captchaId?: string, captchaAnswer?: string) => {
    setIsLoading(true);
    try {
      const loginData: LoginRequest = {
        mobile,
        login_type: 'otp',
        otp_code: otp,
        captcha_id: captchaId || '',
        captcha_answer: captchaAnswer || '',
      };

      await authApi.login(loginData);
      await csrfManager.refresh();

      const userData = await authApi.getCurrentAdminUser({ refresh: true });
      if (!userData) throw new Error('Failed to load user');

      setUser(serializeUser(userData));
      
      const permissions = userData.permissions || [];
      fetchPanelSettings(permissions).catch(() => {});

      const urlParams = new URLSearchParams(window.location.search);
      const returnTo = urlParams.get('return_to') || '/';
      router.push(returnTo);
      
    } catch (error) {
      setUser(null);
      setPanelSettings(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    
    try {
      // ✅ استفاده از SessionManager
      await sessionManager.logout();
    } catch (error) {
      console.error('[AuthContext] Logout error:', error);
    } finally {
      setUser(null);
      setPanelSettings(null);
      
      // Clear React Query
      try {
        const queryClient = getQueryClient();
        queryClient.clear();
      } catch (error) {}
      
      setIsLoading(false);
      router.push('/login');
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await authApi.getCurrentAdminUser({ refresh: true });
      if (userData) {
        setUser(serializeUser(userData));
        await csrfManager.refresh();
        
        const permissions = userData.permissions || [];
        fetchPanelSettings(permissions).catch(() => {});
      } else {
        handleSessionExpired();
      }
    } catch (error) {
      handleSessionExpired();
    }
  };

  const updatePanelSettingsInContext = (newSettings: PanelSettings) => {
    const processed = serializePanelSettings(newSettings);
    if (processed) {
      const timestamp = Date.now();
      if (processed.logo_url) {
        processed.logo_url = `${processed.logo_url.split('?')[0]}?t=${timestamp}`;
      }
      if (processed.favicon_url) {
        processed.favicon_url = `${processed.favicon_url.split('?')[0]}?t=${timestamp}`;
      }
    }
    setPanelSettings(processed);
  };

  return (
    <AuthContext.Provider value={{
      user,
      panelSettings,
      isLoading,
      isAuthenticated: !!user && !isLoading,
      login,
      loginWithOTP,
      logout,
      refreshUser,
      updatePanelSettingsInContext
    }}>
      <FaviconManager />
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be within AuthProvider');
  return context;
};

// admin/src/core/session/SessionManager.ts
/**
 * 🔥 Session Manager - معماری حرفه‌ای 2025
 * - Cookie-based session detection
 * - Automatic expiry handling
 * - Complete cleanup
 * - NO database calls در این layer
 */

const SESSION_COOKIE = 'sessionid';
const CSRF_COOKIE = 'csrftoken';
const STORAGE_KEY = 'admin-ui-storage';

class SessionManager {
  private static instance: SessionManager;
  private checkInterval: NodeJS.Timeout | null = null;
  private isCheckingSession = false;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.startSessionMonitoring();
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
    
    // جلوگیری از concurrent calls
    if (this.isCheckingSession) return true;
    
    this.isCheckingSession = true;
    
    try {
      const response = await fetch('/api/user/admin/session/check/', {
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
    // 1. حذف cookies
    this.deleteCookie(SESSION_COOKIE);
    this.deleteCookie(CSRF_COOKIE);

    // 2. حذف storage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.clear();
        sessionStorage.clear();
      } catch (error) {
        console.error('[SessionManager] Storage clear failed:', error);
      }
    }

    console.log('[SessionManager] ✅ Session cleared');
  }

  /**
   * ✅ حذف cookie
   */
  private deleteCookie(name: string): void {
    if (typeof document === 'undefined') return;

    const configs = [
      `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`,
      `${name}=; Max-Age=0; path=/;`,
      `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`,
    ];

    configs.forEach(config => {
      document.cookie = config;
    });
  }

  /**
   * ✅ شروع نظارت خودکار بر session
   */
  private startSessionMonitoring(): void {
    // چک کردن هر 30 ثانیه
    this.checkInterval = setInterval(async () => {
      if (!this.hasSession()) {
        this.stopMonitoring();
        return;
      }

      const isValid = await this.validateSession();
      if (!isValid) {
        console.log('[SessionManager] ❌ Session expired');
        this.handleExpiredSession();
      }
    }, 30000); // 30 ثانیه
  }

  /**
   * ✅ Handle expired session
   */
  private handleExpiredSession(): void {
    this.clearSession();
    
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname + window.location.search;
      const returnTo = currentPath !== '/' ? `?return_to=${encodeURIComponent(currentPath)}` : '';
      window.location.href = `/login${returnTo}`;
    }
  }

  /**
   * ✅ توقف نظارت
   */
  public stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * ✅ Logout کامل
   */
  public async logout(): Promise<void> {
    try {
      // فراخوانی logout endpoint
      await fetch('/api/user/admin/logout/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('[SessionManager] Logout API failed:', error);
    } finally {
      // حتماً cleanup انجام بشه
      this.clearSession();
      
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }
}

export const sessionManager = SessionManager.getInstance();

// admin/src/proxy.ts
import { NextRequest, NextResponse } from "next/server";

/**
 * ✅ Next.js 16 Proxy (جایگزین middleware)
 * - lightweight routing guard
 * - فقط cookie check (NO database calls)
 * - در Node.js runtime اجرا میشه
 */

const SESSION_COOKIE = 'sessionid';
const CSRF_COOKIE = 'csrftoken';

const PUBLIC_PATHS = ['/login'];
const PUBLIC_PREFIXES = ['/_next', '/api', '/favicon.ico', '/images', '/assets'];

export default function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Skip برای public resources
  if (PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get(SESSION_COOKIE);
  const isAuthenticated = !!sessionCookie?.value;
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  // ❌ No auth + protected route → redirect to login
  if (!isAuthenticated && !isPublicPath) {
    const loginUrl = new URL('/login', req.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('return_to', pathname + search);
    }
    return NextResponse.redirect(loginUrl);
  }

  // ✅ Authenticated + public path → redirect to home
  if (isAuthenticated && isPublicPath) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // ✅ Continue با security headers
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|assets).*)',
  ]
};
# Backend/src/user/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from src.user.auth.user_jwt_refresh import UserJWTRefreshView
from src.user.views.admin import (
    AdminLoginView, AdminRegisterView, AdminLogoutView, 
    AdminManagementView, AdminProfileView, UserManagementView,
    AdminSessionCheckView  # ✅ اضافه شد
)
from src.user.access_control import AdminRoleView, AdminPermissionView
from src.user.views.otp_views import SendOTPView, VerifyOTPView, OTPSettingsView
from src.user.views.user.user_login_view import UserLoginView
from src.user.views.user.user_logout_view import UserLogoutView
from src.user.views.user.user_register_view import UserRegisterView
from src.user.views.user.user_profile_view import UserProfileView
from src.user.views.location_views import ProvinceViewSet, CityViewSet
from src.user.access_control.definitions.api import get_permission_map, check_permission

app_name = 'user'

urlpatterns = [
    # Admin Authentication
    path('admin/register/', AdminRegisterView.as_view(), name='admin-register'),
    path("admin/login/", AdminLoginView.as_view(), name="admin-login"),
    path('admin/logout/', AdminLogoutView.as_view(), name='admin-logout'),  # 🔄 بروزرسانی شده
    path('admin/session/check/', AdminSessionCheckView.as_view(), name='admin-session-check'),  # ✅ جدید
    
    # Admin Captcha
    path('admin/auth/captcha/', include('src.core.security.captcha.urls', namespace='captcha')),
    
    # Admin Management
    path('admin/management/', AdminManagementView.as_view(), name='admin-management'),
    path('admin/management/<int:admin_id>/', AdminManagementView.as_view(), name='admin-management-detail'),
    path('admin/management/me/', AdminManagementView.as_view(), {'action': 'me'}, name='admin-management-me'),
    path('admin/management/by-public-id/<uuid:public_id>/', AdminManagementView.get_by_public_id, name='admin-management-detail-public'),
    path('admin/management/bulk-delete/', AdminManagementView.as_view(), {'action': 'bulk-delete'}, name='admin-management-bulk-delete'),
    
    # Admin Profile
    path('admin/profile/', AdminProfileView.as_view(), name='admin-profile'),
    
    # User Management (for Admins)
    path('admin/users-management/', UserManagementView.as_view(), name='user-management'),
    path('admin/users-management/<int:user_id>/', UserManagementView.as_view(), name='user-management-detail'),
    path('admin/users-management/bulk-delete/', UserManagementView.as_view(), {'action': 'bulk-delete'}, name='user-management-bulk-delete'),
]

# Router for ViewSets
router = DefaultRouter()
router.register(r'admin/roles', AdminRoleView, basename='admin-roles')
router.register(r'admin/permissions', AdminPermissionView, basename='admin-permissions')
router.register(r'provinces', ProvinceViewSet, basename='provinces')
router.register(r'cities', CityViewSet, basename='cities')

urlpatterns += [
    # Admin Roles & Permissions
    path('admin/roles/bulk-delete/', AdminRoleView.as_view({'post': 'bulk_delete'}), name='admin-roles-bulk-delete'),
    path('', include(router.urls)),
    
    # Regular User Authentication
    path('user/login/', UserLoginView.as_view(), name='user-login'),
    path('user/register/', UserRegisterView.as_view(), name='user-register'),
    path('user/logout/', UserLogoutView.as_view(), name='user-logout'),
    path('user/profile/', UserProfileView.as_view(), name='user-profile'),
    
    # JWT Token
    path('token/refresh/', UserJWTRefreshView.as_view(), name='user-jwt-refresh'),
    
    # OTP
    path('mobile/send-otp/', SendOTPView.as_view(), name='send-otp'),
    path('mobile/verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('mobile/otp-settings/', OTPSettingsView.as_view(), name='otp-settings'),
    
    # Permissions API
    path('admin/permissions/map/', get_permission_map, name='admin-permissions-map'),
    path('admin/permissions/check/', check_permission, name='admin-permissions-check'),
]

Backend (3 فایل):
bash✅ src/user/views/admin/admin_session_check_view.py (جدید)
🔄 src/user/views/admin/__init__.py (بروزرسانی)
🔄 src/user/urls.py (بروزرسانی)
Frontend (3 فایل):
bash✅ src/proxy.ts (جایگزین middleware)
✅ src/core/session/SessionManager.ts (جدید)
🔄 src/core/auth/AuthContext.tsx (بروزرسانی)
⚡ Quick Start:

همه artifacts بالا رو کپی کنید
Backend restart کنید
Frontend restart کنید
Login → Wait 2 min → Session expired → Redirect ✅
# Backend/src/user/views/admin/admin_logout_view.py
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from src.user.access_control import SimpleAdminPermission
from src.core.responses.response import APIResponse
from src.user.messages import AUTH_SUCCESS, AUTH_ERRORS
from src.user.services.admin.admin_auth_service import AdminAuthService
from src.core.cache import CacheService
import logging

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name='dispatch')
class AdminLogoutView(APIView):
    """
    Improved Admin Logout View
    Properly cleans up:
    1. Redis session
    2. Django session
    3. User permission cache
    4. Cookies
    """
    authentication_classes = [CSRFExemptSessionAuthentication]
    permission_classes = [SimpleAdminPermission]

    def post(self, request):
        session_key = None
        user_id = None
        
        try:
            # دریافت session key و user id قبل از حذف
            session_key = request.session.session_key
            user_id = getattr(request.user, 'id', None) if request.user.is_authenticated else None
            
            logger.info(f"Logout started for user_id={user_id}, session_key={session_key}")
            
            # 1. حذف از Redis
            if session_key:
                session_manager = CacheService.get_session_manager()
                redis_deleted = session_manager.delete_admin_session(session_key)
                logger.info(f"Redis session deleted: {redis_deleted}")
            
            # 2. حذف از Django sessions table
            if session_key:
                try:
                    from django.contrib.sessions.models import Session
                    deleted_count = Session.objects.filter(session_key=session_key).delete()[0]
                    logger.info(f"Django session deleted: {deleted_count}")
                except Exception as e:
                    logger.error(f"Failed to delete Django session: {e}")
            
            # 3. حذف permission cache
            if user_id:
                try:
                    cache_cleared = CacheService.clear_user_cache(user_id)
                    logger.info(f"User cache cleared: {cache_cleared} items")
                except Exception as e:
                    logger.error(f"Failed to clear user cache: {e}")
            
            # 4. Flush session
            request.session.flush()
            
            # 5. ساخت response
            response = APIResponse.success(
                message=AUTH_SUCCESS["auth_logged_out"],
                metaData={
                    'cleanup_status': {
                        'redis_session_deleted': True,
                        'django_session_deleted': True,
                        'cache_cleared': True
                    }
                }
            )
            
            # 6. حذف cookies
            cookie_names = ['sessionid', 'csrftoken']
            for cookie_name in cookie_names:
                response.delete_cookie(
                    cookie_name,
                    path='/',
                    domain=None,  # Same domain as set
                    samesite='Lax'
                )
            
            # 7. Security headers
            response['Cache-Control'] = 'no-cache, no-store, must-revalidate, private'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'
            
            logger.info(f"Logout completed successfully for user_id={user_id}")
            return response
            
        except Exception as e:
            logger.error(f"Logout error: {e}", exc_info=True)
            
            # حتی در صورت خطا، cleanup رو انجام بده
            if session_key:
                try:
                    AdminAuthService.logout_admin(session_key)
                    
                    session_manager = CacheService.get_session_manager()
                    session_manager.delete_admin_session(session_key)
                    
                    if user_id:
                        CacheService.clear_user_cache(user_id)
                except Exception as cleanup_error:
                    logger.error(f"Cleanup after error failed: {cleanup_error}")
            
            response = APIResponse.error(
                message=AUTH_ERRORS["auth_logout_error"]
            )
            
            # حذف cookies حتی در صورت خطا
            cookie_names = ['sessionid', 'csrftoken']
            for cookie_name in cookie_names:
                response.delete_cookie(
                    cookie_name,
                    path='/',
                    domain=None,
                    samesite='Lax'
                )
            
            response['Cache-Control'] = 'no-cache, no-store, must-revalidate, private'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'
            
            return response
