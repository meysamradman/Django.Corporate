# مستندات پنل ادمین Next.js 16.0.3

## 📋 فهرست مطالب

1. [مقدمه](#مقدمه)
2. [ویژگی‌های Next.js 16](#ویژگی‌های-nextjs-16)
3. [معماری و اصول طراحی](#معماری-و-اصول-طراحی)
4. [ساختار پروژه](#ساختار-پروژه)
5. [Client-Side Rendering (CSR)](#client-side-rendering-csr)
6. [مدیریت کش (No Caching)](#مدیریت-کش-no-caching)
7. [API Routes](#api-routes)
8. [TypeScript و Types](#typescript-و-types)
9. [بهینه‌سازی و Performance](#بهینه‌سازی-و-performance)
10. [Best Practices](#best-practices)
11. [Proxy.ts و Middleware](#proxyts-و-middleware)
12. [Security](#security)
13. [Troubleshooting](#troubleshooting)

---

## مقدمه

این مستند راهنمای کامل توسعه پنل ادمین با استفاده از **Next.js 16.0.3** است. هدف اصلی این پروژه ایجاد یک پنل ادمین **سریع، بهینه و حرفه‌ای** است که:

- ✅ از **CSR (Client-Side Rendering)** استفاده می‌کند
- ✅ **هیچ کشی در فرانت‌اند** ندارد (کش فقط در بک‌اند با Redis)
- ✅ **سئو لازم نیست** (پنل ادمین)
- ✅ **سرعت و بهینه‌سازی** اولویت اول است
- ✅ از **API Routes** در فولدر `api` با `route.ts` استفاده می‌کند
- ✅ از **TypeScript** برای Types و Interfaces استفاده می‌کند (بدون تکرار)

---

## ویژگی‌های Next.js 16

### 1. Turbopack (Bundler جدید)

Next.js 16 از **Turbopack** به عنوان bundler پیش‌فرض در development استفاده می‌کند:

```json
{
  "scripts": {
    "dev": "next dev --turbopack"
  }
}
```

**مزایا:**
- ⚡ سرعت رفرش سریع‌تر (HMR)
- ⚡ بیلدهای بهینه‌تر
- ⚡ استفاده کمتر از حافظه

### 2. Cache Components (PPR)

Next.js 16 قابلیت **Partial Pre-Rendering (PPR)** را معرفی کرده است که امکان ترکیب کدهای ایستا و پویا را فراهم می‌کند.

**⚠️ توجه:** در پنل ادمین ما از این قابلیت استفاده **نمی‌کنیم** چون:
- همه چیز باید CSR باشد
- کش در فرانت‌اند نداریم
- همه داده‌ها از API می‌آیند

### 3. Proxy.ts (جایگزین Middleware.ts)

Next.js 16 از `proxy.ts` به جای `middleware.ts` پشتیبانی می‌کند که مرز شبکه را مشخص‌تر می‌کند.

**استفاده در پروژه:**
- فایل `src/proxy.ts` برای مدیریت authentication و security headers

### 4. Model Context Protocol (MCP)

Next.js 16 از MCP برای اتصال DevTools به ابزارهای مختلف پشتیبانی می‌کند (برای دیباگ).

---

## معماری و اصول طراحی

### اصول اصلی:

1. **CSR Only**: همه صفحات باید Client-Side Render شوند
2. **No Frontend Cache**: هیچ کشی در فرانت‌اند نداریم
3. **API-First**: همه داده‌ها از API می‌آیند
4. **Type Safety**: استفاده کامل از TypeScript
5. **Performance First**: بهینه‌سازی برای سرعت
6. **No SEO**: سئو لازم نیست

### Stack تکنولوژی:

- **Framework**: Next.js 16.0.3 (App Router)
- **Language**: TypeScript 5.9.3
- **State Management**: 
  - React Query (@tanstack/react-query) برای server state
  - Zustand برای client state
- **UI Library**: Radix UI + Tailwind CSS
- **Forms**: React Hook Form + Zod
- **Tables**: TanStack Table

---

## ساختار پروژه

```
admin/
├── src/
│   ├── api/              # API Routes (route.ts files)
│   │   ├── auth/
│   │   │   └── route.ts
│   │   ├── admins/
│   │   │   └── route.ts
│   │   ├── blogs/
│   │   │   └── route.ts
│   │   └── ...
│   │
│   ├── app/              # App Router Pages
│   │   ├── (auth)/      # Auth routes group
│   │   │   └── login/
│   │   ├── (dashboard)/ # Dashboard routes group
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── users/
│   │   │   ├── blogs/
│   │   │   └── ...
│   │   └── layout.tsx    # Root layout
│   │
│   ├── components/      # React Components
│   │   ├── elements/    # UI Elements (Button, Input, etc.)
│   │   ├── tables/      # Table Components
│   │   ├── layout/      # Layout Components
│   │   └── ...
│   │
│   ├── core/            # Core Utilities
│   │   ├── api/         # API Config
│   │   ├── auth/        # Auth Context
│   │   ├── config/      # Config Files
│   │   ├── hooks/       # Custom Hooks
│   │   ├── permissions/ # Permission System
│   │   └── utils/       # Utility Functions
│   │
│   ├── types/           # TypeScript Types & Interfaces
│   │   ├── api/         # API Types
│   │   ├── auth/        # Auth Types
│   │   ├── blog/        # Blog Types
│   │   ├── shared/      # Shared Types
│   │   └── ...
│   │
│   └── proxy.ts         # Proxy/Middleware
│
├── next.config.ts        # Next.js Configuration
├── tsconfig.json         # TypeScript Configuration
└── package.json          # Dependencies
```

---

## Client-Side Rendering (CSR)

### چرا CSR؟

1. **پنل ادمین**: سئو لازم نیست
2. **سرعت**: بارگذاری سریع‌تر برای کاربران
3. **تعامل**: تجربه کاربری بهتر
4. **کش**: کش در بک‌اند (Redis) مدیریت می‌شود

### نحوه پیاده‌سازی CSR:

#### 1. استفاده از `"use client"` در همه صفحات

```typescript
"use client"

import { useEffect, useState } from 'react'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  
  useEffect(() => {
    // Fetch data on client side
  }, [])
  
  return <div>...</div>
}
```

#### 2. استفاده از React Query برای Data Fetching

```typescript
"use client"

import { useQuery } from '@tanstack/react-query'
import { userApi } from '@/api/users/route'

export default function UsersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.getUserList(),
    // ✅ NO CACHE: همه داده‌ها از API می‌آیند
    staleTime: 0,
    gcTime: 0, // قبلاً cacheTime
  })
  
  if (isLoading) return <div>Loading...</div>
  
  return <div>{/* Render users */}</div>
}
```

#### 3. غیرفعال کردن SSG/SSR در next.config.ts

```typescript
const nextConfig: NextConfig = {
  // ✅ CSR برای پنل ادمین
  reactStrictMode: true,
  
  // Output standalone برای deploy
  output: 'standalone',
  
  // ✅ تصاویر unoptimized برای CSR
  images: {
    unoptimized: true,
  },
}
```

---

## مدیریت کش (No Caching)

### چرا No Cache در فرانت‌اند؟

1. **کش در بک‌اند**: Redis در Django بک‌اند کش را مدیریت می‌کند
2. **داده‌های Real-time**: پنل ادمین نیاز به داده‌های به‌روز دارد
3. **جلوگیری از تداخل**: جلوگیری از مشکلات کش در فرانت و بک‌اند

### نحوه غیرفعال کردن کش:

#### 1. React Query Configuration

```typescript
// src/components/providers/QueryProvider.tsx
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ✅ NO CACHE: همه queries بدون کش
      staleTime: 0,
      gcTime: 0, // قبلاً cacheTime
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
  },
})
```

#### 2. API Routes - Headers

```typescript
// src/api/users/route.ts
export const userApi = {
  getUserList: async (): Promise<ApiResponse<User[]>> => {
    // ✅ NO CACHE: Headers برای جلوگیری از کش مرورگر
    return fetchApi.get<User[]>('/admin/users/', {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  },
}
```

#### 3. fetchApi Configuration

```typescript
// src/core/config/fetch.ts
const fetchApi = {
  get: async <T>(url: string, options?: RequestInit) => {
    return fetch(url, {
      ...options,
      cache: 'no-store', // ✅ NO CACHE
      headers: {
        ...options?.headers,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  },
}
```

#### 4. Next.js Route Handlers (اگر استفاده می‌شود)

```typescript
// app/api/example/route.ts
export async function GET(request: Request) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  })
}
```

---

## API Routes

### ساختار API Routes

API Routes در فولدر `src/api/` با فایل `route.ts` در هر ماژول تعریف می‌شوند.

#### مثال: ساختار API Route

```typescript
// src/api/users/route.ts
import { fetchApi } from '@/core/config/fetch'
import { ApiResponse } from '@/types/api/apiResponse'
import { User, UserCreate, UserUpdate } from '@/types/auth/user'

export const userApi = {
  // GET - لیست کاربران
  getUserList: async (params?: {
    page?: number
    page_size?: number
    search?: string
  }): Promise<ApiResponse<User[]>> => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString())
    if (params?.search) queryParams.append('search', params.search)
    
    return fetchApi.get<User[]>(`/admin/users/?${queryParams.toString()}`)
  },

  // GET - دریافت یک کاربر
  getUser: async (id: number): Promise<ApiResponse<User>> => {
    return fetchApi.get<User>(`/admin/users/${id}/`)
  },

  // POST - ایجاد کاربر
  createUser: async (data: UserCreate): Promise<ApiResponse<User>> => {
    return fetchApi.post<User>('/admin/users/', data)
  },

  // PUT - به‌روزرسانی کاربر
  updateUser: async (id: number, data: UserUpdate): Promise<ApiResponse<User>> => {
    return fetchApi.put<User>(`/admin/users/${id}/`, data)
  },

  // DELETE - حذف کاربر
  deleteUser: async (id: number): Promise<ApiResponse<null>> => {
    return fetchApi.delete<null>(`/admin/users/${id}/`)
  },

  // PATCH - به‌روزرسانی جزئی
  updateUserStatus: async (id: number, is_active: boolean): Promise<ApiResponse<User>> => {
    return fetchApi.patch<User>(`/admin/users/${id}/status/`, { is_active })
  },
}
```

### اصول API Routes:

1. **یک فایل route.ts برای هر ماژول**
2. **Export یک object با متدهای مختلف**
3. **استفاده از Types برای Request/Response**
4. **استفاده از fetchApi برای همه درخواست‌ها**
5. **مدیریت خطاها با errorHandler**

### مثال کامل: Blog API

```typescript
// src/api/blogs/route.ts
import { fetchApi } from '@/core/config/fetch'
import { ApiResponse } from '@/types/api/apiResponse'
import { Blog, BlogCreate, BlogUpdate, BlogFilter } from '@/types/blog/blog'

export const blogApi = {
  getBlogList: async (filters?: BlogFilter): Promise<ApiResponse<Blog[]>> => {
    const queryParams = new URLSearchParams()
    
    if (filters?.page) queryParams.append('page', filters.page.toString())
    if (filters?.page_size) queryParams.append('page_size', filters.page_size.toString())
    if (filters?.search) queryParams.append('search', filters.search)
    if (filters?.category) queryParams.append('category', filters.category.toString())
    if (filters?.is_active !== undefined) queryParams.append('is_active', filters.is_active.toString())
    
    return fetchApi.get<Blog[]>(`/admin/blogs/?${queryParams.toString()}`)
  },

  getBlog: async (id: number): Promise<ApiResponse<Blog>> => {
    return fetchApi.get<Blog>(`/admin/blogs/${id}/`)
  },

  createBlog: async (data: BlogCreate): Promise<ApiResponse<Blog>> => {
    return fetchApi.post<Blog>('/admin/blogs/', data)
  },

  updateBlog: async (id: number, data: BlogUpdate): Promise<ApiResponse<Blog>> => {
    return fetchApi.put<Blog>(`/admin/blogs/${id}/`, data)
  },

  deleteBlog: async (id: number): Promise<ApiResponse<null>> => {
    return fetchApi.delete<null>(`/admin/blogs/${id}/`)
  },

  bulkDeleteBlogs: async (ids: number[]): Promise<ApiResponse<{ deleted_count: number }>> => {
    return fetchApi.post<{ deleted_count: number }>('/admin/blogs/bulk-delete/', { ids })
  },
}
```

---

## TypeScript و Types

### ساختار Types

Types در فولدر `src/types/` سازماندهی شده‌اند:

```
src/types/
├── api/              # API Response Types
│   └── apiResponse.ts
├── auth/             # Authentication Types
│   ├── user.ts
│   ├── admin.ts
│   └── auth.ts
├── blog/             # Blog Types
│   ├── blog.ts
│   ├── category.ts
│   └── tag.ts
├── shared/           # Shared Types
│   ├── base.ts       # Base Interface
│   ├── media.ts
│   ├── location.ts
│   └── tableFilters.ts
└── ...
```

### اصول Types:

1. **Base Interface**: همه entities از Base ارث‌بری می‌کنند
2. **بدون تکرار**: Types مشترک در `shared/`
3. **Naming Convention**: 
   - Interface: `User`, `Blog`, `Category`
   - Create DTO: `UserCreate`, `BlogCreate`
   - Update DTO: `UserUpdate`, `BlogUpdate`
   - Filter: `UserFilter`, `BlogFilter`

### مثال: Base Interface

```typescript
// src/types/shared/base.ts
export interface Base {
  id: number
  public_id: string
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
}
```

### مثال: User Types

```typescript
// src/types/auth/user.ts
import { Base } from '@/types/shared/base'
import { Media } from '@/types/shared/media'

export interface User extends Base {
  mobile: string
  email: string | null
  is_active: boolean
  is_staff: boolean
  is_superuser: boolean
  user_type: string
  full_name: string
}

export interface UserProfile extends Base {
  first_name: string
  last_name: string
  // ... other fields
}

export interface UserCreate {
  mobile: string
  email?: string
  first_name: string
  last_name: string
  // ... other fields
}

export interface UserUpdate {
  email?: string
  first_name?: string
  last_name?: string
  // ... other fields
}

export interface UserFilter {
  page?: number
  page_size?: number
  search?: string
  is_active?: boolean
  user_type?: string
}
```

### مثال: API Response Type

```typescript
// src/types/api/apiResponse.ts
export type ApiStatus = 'success' | 'error'

export interface ApiResponse<TData> {
  metaData: MetaData
  pagination?: Pagination
  data: TData
  errors?: Record<string, string[]>
}

export interface MetaData {
  status: ApiStatus
  message: string
  timestamp?: string
}

export interface Pagination {
  count: number
  next: string | null
  previous: string | null
  page: number
  page_size: number
  total_pages: number
}
```

### استفاده از Types در Components

```typescript
"use client"

import { useQuery } from '@tanstack/react-query'
import { userApi } from '@/api/users/route'
import { User } from '@/types/auth/user'
import { ApiResponse } from '@/types/api/apiResponse'

export default function UsersPage() {
  const { data, isLoading } = useQuery<ApiResponse<User[]>>({
    queryKey: ['users'],
    queryFn: () => userApi.getUserList(),
  })
  
  if (isLoading) return <div>Loading...</div>
  
  return (
    <div>
      {data?.data.map((user: User) => (
        <div key={user.id}>{user.full_name}</div>
      ))}
    </div>
  )
}
```

---

## بهینه‌سازی و Performance

### 1. Next.js Configuration

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  // ✅ React Strict Mode
  reactStrictMode: true,
  
  // ✅ Output standalone برای Docker/VPS
  output: 'standalone',
  
  // ✅ Source maps فقط در development
  productionBrowserSourceMaps: false,
  
  // ✅ Optimize Package Imports
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "@tanstack/react-query",
      // ... other packages
    ],
  },
  
  // ✅ Webpack Bundle Splitting
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            vendor: {
              name: "vendor",
              test: /[\\/]node_modules[\\/]/,
              chunks: "all",
              priority: 20,
            },
            common: {
              name: "common",
              minChunks: 2,
              chunks: "all",
              priority: 10,
            },
          },
        },
      }
    }
    return config
  },
}
```

### 2. Code Splitting

#### Dynamic Imports

```typescript
"use client"

import dynamic from 'next/dynamic'

// ✅ Lazy load heavy components
const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <div>Loading...</div>,
  ssr: false, // ✅ CSR only
})

export default function Page() {
  return <HeavyComponent />
}
```

#### Route-based Code Splitting

Next.js به صورت خودکار route-based code splitting انجام می‌دهد.

### 3. Image Optimization

```typescript
// next.config.ts
images: {
  unoptimized: true, // ✅ برای CSR
  formats: ["image/webp", "image/avif"],
  remotePatterns: [
    {
      protocol: "http",
      hostname: "localhost",
      port: "8000",
      pathname: "/media/**",
    },
  ],
}
```

### 4. React Query Optimization

```typescript
// ✅ استفاده از useQuery برای data fetching
const { data, isLoading } = useQuery({
  queryKey: ['users', filters],
  queryFn: () => userApi.getUserList(filters),
  staleTime: 0, // ✅ NO CACHE
  gcTime: 0,
})

// ✅ استفاده از useMutation برای mutations
const mutation = useMutation({
  mutationFn: (data: UserCreate) => userApi.createUser(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] })
  },
})
```

### 5. Memoization

```typescript
import { useMemo, useCallback } from 'react'

// ✅ Memoize expensive calculations
const filteredUsers = useMemo(() => {
  return users.filter(user => user.is_active)
}, [users])

// ✅ Memoize callbacks
const handleClick = useCallback((id: number) => {
  // handle click
}, [])
```

### 6. Bundle Size Optimization

- استفاده از `optimizePackageImports` در next.config.ts
- Tree shaking برای unused code
- استفاده از dynamic imports برای heavy libraries

---

## Best Practices

### 1. Component Structure

```typescript
"use client"

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { userApi } from '@/api/users/route'
import { User } from '@/types/auth/user'

// ✅ Component با TypeScript
export default function UsersPage() {
  const [filters, setFilters] = useState({})
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['users', filters],
    queryFn: () => userApi.getUserList(filters),
  })
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error</div>
  
  return (
    <div>
      {/* Component content */}
    </div>
  )
}
```

### 2. Error Handling

```typescript
// src/core/config/errorHandler.ts
import { toast } from 'sonner'

export function showErrorToast(error: unknown, defaultMessage?: string) {
  const message = error instanceof Error 
    ? error.message 
    : defaultMessage || 'An error occurred'
  
  toast.error(message)
}

// استفاده در API
try {
  const response = await fetchApi.get('/admin/users/')
  return response.data
} catch (error) {
  showErrorToast(error, 'Failed to fetch users')
  throw error
}
```

### 3. Form Handling

```typescript
"use client"

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { userApi } from '@/api/users/route'

const userSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
})

type UserFormData = z.infer<typeof userSchema>

export default function UserForm() {
  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  })
  
  const onSubmit = async (data: UserFormData) => {
    try {
      await userApi.createUser(data)
      toast.success('User created successfully')
    } catch (error) {
      showErrorToast(error, 'Failed to create user')
    }
  }
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  )
}
```

### 4. Table Implementation

```typescript
"use client"

import { useQuery } from '@tanstack/react-query'
import { DataTable } from '@/components/tables/DataTable'
import { userApi } from '@/api/users/route'
import { User } from '@/types/auth/user'
import { UserTableColumns } from '@/components/users/UserTableColumns'

export default function UsersTable() {
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.getUserList(),
  })
  
  if (isLoading) return <div>Loading...</div>
  
  return (
    <DataTable
      data={data?.data || []}
      columns={UserTableColumns}
      // ... other props
    />
  )
}
```

### 5. State Management

```typescript
// ✅ Server State: React Query
const { data } = useQuery({
  queryKey: ['users'],
  queryFn: () => userApi.getUserList(),
})

// ✅ Client State: Zustand (اگر نیاز باشد)
import { create } from 'zustand'

interface UserStore {
  selectedUser: User | null
  setSelectedUser: (user: User | null) => void
}

export const useUserStore = create<UserStore>((set) => ({
  selectedUser: null,
  setSelectedUser: (user) => set({ selectedUser: user }),
}))
```

---

## Proxy.ts و Middleware

### Proxy.ts در Next.js 16

Next.js 16 از `proxy.ts` به جای `middleware.ts` پشتیبانی می‌کند.

### مثال: Authentication Proxy

```typescript
// src/proxy.ts
import { NextRequest, NextResponse } from "next/server"

const SESSION_COOKIE_NAME = 'sessionid'
const CSRF_COOKIE_NAME = 'csrftoken'

const PUBLIC_PATHS = ['/login']
const PUBLIC_PREFIXES = ['/_next', '/api', '/favicon.ico', '/images', '/assets']

export default function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  // ✅ Allow public paths
  if (PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)
  const isAuthenticated = !!sessionCookie?.value
  const isPublicPath = PUBLIC_PATHS.includes(pathname)

  // ✅ Redirect to login if not authenticated
  if (!isAuthenticated && !isPublicPath) {
    const loginUrl = new URL('/login', req.url)
    if (pathname !== '/') {
      loginUrl.searchParams.set('return_to', pathname + search)
    }
    return NextResponse.redirect(loginUrl)
  }

  // ✅ Redirect to dashboard if authenticated and on login page
  if (isAuthenticated && isPublicPath) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // ✅ Security headers
  if (isAuthenticated) {
    const response = NextResponse.next()
    
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|assets).*)',
  ]
}
```

---

## Security

### 1. Security Headers

```typescript
// proxy.ts
response.headers.set('X-Frame-Options', 'DENY')
response.headers.set('X-Content-Type-Options', 'nosniff')
response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
```

### 2. CSRF Protection

```typescript
// src/core/auth/csrfToken.ts
export async function getCSRFToken(): Promise<string> {
  const response = await fetch('/api/auth/csrf')
  const data = await response.json()
  return data.csrf_token
}

// استفاده در API calls
const csrfToken = await getCSRFToken()
fetch('/api/users/', {
  method: 'POST',
  headers: {
    'X-CSRFToken': csrfToken,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
})
```

### 3. Authentication

```typescript
// src/core/auth/AuthContext.tsx
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminWithProfile | null>(null)
  
  useEffect(() => {
    // Check authentication on mount
    authApi.getCurrentAdminUser()
      .then(setUser)
      .catch(() => setUser(null))
  }, [])
  
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### 4. Permission System

```typescript
// src/core/permissions/context/PermissionContext.tsx
export function PermissionProvider({ children }: { children: React.ReactNode }) {
  // Permission logic
  return (
    <PermissionContext.Provider value={permissions}>
      {children}
    </PermissionContext.Provider>
  )
}

// استفاده در Components
import { usePermission } from '@/core/permissions/hooks/usePermission'

export default function ProtectedComponent() {
  const canEdit = usePermission('users', 'update')
  
  if (!canEdit) return <div>Access Denied</div>
  
  return <div>Edit Form</div>
}
```

---

## Troubleshooting

### مشکل: داده‌ها کش می‌شوند

**راه حل:**
1. بررسی React Query configuration (staleTime: 0, gcTime: 0)
2. بررسی API headers (Cache-Control: no-store)
3. بررسی fetchApi configuration (cache: 'no-store')

### مشکل: صفحات SSR می‌شوند

**راه حل:**
1. اطمینان از وجود `"use client"` در ابتدای فایل
2. بررسی next.config.ts (output: 'standalone')
3. بررسی که از async/await در Server Components استفاده نمی‌شود

### مشکل: Bundle Size بزرگ است

**راه حل:**
1. استفاده از dynamic imports برای heavy components
2. استفاده از optimizePackageImports در next.config.ts
3. بررسی unused dependencies

### مشکل: Performance پایین است

**راه حل:**
1. استفاده از React.memo برای components
2. استفاده از useMemo و useCallback
3. بررسی React Query configuration
4. استفاده از code splitting

---

## خلاصه نکات کلیدی

### ✅ باید انجام شود:

1. ✅ همه صفحات باید `"use client"` داشته باشند
2. ✅ React Query با `staleTime: 0` و `gcTime: 0`
3. ✅ API calls با `cache: 'no-store'`
4. ✅ استفاده از Types برای همه API calls
5. ✅ Error handling در همه API calls
6. ✅ Security headers در proxy.ts
7. ✅ Code splitting برای heavy components
8. ✅ استفاده از dynamic imports

### ❌ نباید انجام شود:

1. ❌ استفاده از SSG/SSR
2. ❌ استفاده از کش در فرانت‌اند
3. ❌ استفاده از async/await در Server Components
4. ❌ تکرار Types
5. ❌ استفاده از inline styles (استفاده از Tailwind)
6. ❌ Hardcode کردن API URLs (استفاده از config)

---

## منابع و مراجع

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## Django 5.2.8 Performance Optimization

### Critical Performance Rules for API Speed

#### 1. Redis Caching Configuration

```python
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': f'redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 50,
                'retry_on_timeout': True,
                'socket_connect_timeout': 5,
                'socket_timeout': 5,
            },
            'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor',
            'SERIALIZER': 'django_redis.serializers.json.JSONSerializer',
        },
        'KEY_PREFIX': 'webtalik',
        'VERSION': 1,
        'TIMEOUT': 300,
    },
    'session': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': f'redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB + 1}',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
        'TIMEOUT': SESSION_COOKIE_AGE,
    }
}

SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'session'
```

**Key Points:**
- Separate Redis DB for sessions
- Connection pooling with max_connections: 50
- Compression enabled for large data
- JSON serializer for better performance
- Timeout: 5 seconds for socket operations

#### 2. Database Query Optimization

**Always use select_related for ForeignKey:**

```python
queryset = Portfolio.objects.select_related(
    'og_image',
    'created_by',
    'updated_by'
)
```

**Always use prefetch_related for ManyToMany/Reverse FK:**

```python
queryset = Portfolio.objects.prefetch_related(
    'categories',
    'tags',
    'options',
    Prefetch(
        'images',
        queryset=PortfolioImage.objects.filter(is_main=True).select_related('image'),
        to_attr='main_image_media'
    )
)
```

**Use only() and defer() for large models:**

```python
queryset = User.objects.only('id', 'email', 'full_name')
queryset = Blog.objects.defer('content', 'description')
```

**Avoid N+1 queries:**

```python
# BAD
for portfolio in portfolios:
    print(portfolio.created_by.email)

# GOOD
portfolios = Portfolio.objects.select_related('created_by')
for portfolio in portfolios:
    print(portfolio.created_by.email)
```

#### 3. Database Connection Pooling

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'CONN_MAX_AGE': 600,
        'OPTIONS': {
            'connect_timeout': 10,
            'options': '-c statement_timeout=30000'
        }
    }
}
```

**Key Points:**
- CONN_MAX_AGE: 600 seconds (persistent connections)
- statement_timeout: 30 seconds
- connect_timeout: 10 seconds

#### 4. Database Indexes

**Always index ForeignKey fields:**

```python
class Portfolio(models.Model):
    category = models.ForeignKey(
        'Category',
        on_delete=models.CASCADE,
        db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['is_active', 'is_public']),
            models.Index(fields=['created_at', '-is_featured']),
        ]
```

**Index frequently filtered fields:**

```python
class Meta:
    indexes = [
        models.Index(fields=['status', 'created_at']),
        models.Index(fields=['user', 'created_at']),
    ]
```

#### 5. Serializer Optimization

**Use SerializerMethodField only when necessary:**

```python
class PortfolioSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Portfolio
        fields = ['id', 'title', 'category_name']
```

**Avoid nested serializers in list views:**

```python
class PortfolioListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Portfolio
        fields = ['id', 'title', 'slug', 'is_active']

class PortfolioDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    
    class Meta:
        model = Portfolio
        fields = '__all__'
```

#### 6. Pagination Optimization

**Always use cursor pagination for large datasets:**

```python
from rest_framework.pagination import CursorPagination

class OptimizedCursorPagination(CursorPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    ordering = '-created_at'
```

**Use limit/offset only for small datasets:**

```python
class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
```

#### 7. ViewSet Optimization

**Use queryset caching in get_queryset():**

```python
class PortfolioViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        cache_key = f'portfolio_queryset_{self.request.query_params}'
        queryset = cache.get(cache_key)
        if queryset is None:
            queryset = Portfolio.objects.select_related(
                'og_image'
            ).prefetch_related(
                'categories', 'tags'
            )
            cache.set(cache_key, queryset, 300)
        return queryset
```

**Use only() in list actions:**

```python
def list(self, request, *args, **kwargs):
    queryset = self.get_queryset().only('id', 'title', 'slug', 'is_active')
    return super().list(request, *args, **kwargs)
```

#### 8. Cache Usage in Services

**Cache expensive operations:**

```python
from django.core.cache import cache

class PortfolioService:
    @staticmethod
    def get_portfolio_list(filters=None):
        cache_key = f'portfolio_list_{hash(str(filters))}'
        result = cache.get(cache_key)
        if result is None:
            queryset = Portfolio.objects.select_related('og_image')
            if filters:
                queryset = queryset.filter(**filters)
            result = list(queryset.values('id', 'title', 'slug'))
            cache.set(cache_key, result, 300)
        return result
    
    @staticmethod
    def invalidate_cache(portfolio_id):
        cache.delete_pattern(f'portfolio_*{portfolio_id}*')
```

#### 9. Bulk Operations

**Always use bulk_create for multiple inserts:**

```python
portfolios = [Portfolio(title=f'Title {i}') for i in range(100)]
Portfolio.objects.bulk_create(portfolios, batch_size=50)
```

**Use bulk_update for multiple updates:**

```python
portfolios = Portfolio.objects.filter(is_active=True)
for portfolio in portfolios:
    portfolio.is_featured = True
Portfolio.objects.bulk_update(portfolios, ['is_featured'], batch_size=50)
```

**Use update() for bulk field updates:**

```python
Portfolio.objects.filter(category_id=1).update(is_active=True)
```

#### 10. Async Views (Django 5.2+)

**Use async views for I/O-bound operations:**

```python
from django.http import JsonResponse
from asgiref.sync import sync_to_async

async def portfolio_list(request):
    queryset = await sync_to_async(list)(
        Portfolio.objects.select_related('og_image').values('id', 'title')
    )
    return JsonResponse({'data': queryset})
```

**Use async database operations:**

```python
from django.db import connection

async def get_portfolios():
    async with connection.cursor() as cursor:
        await cursor.execute("SELECT id, title FROM portfolio_portfolio")
        return await cursor.fetchall()
```

#### 11. Response Compression

**Enable GZip middleware:**

```python
MIDDLEWARE = [
    'django.middleware.gzip.GZipMiddleware',
    # ... other middleware
]
```

**Compress JSON responses:**

```python
from django.http import JsonResponse
import gzip
import json

def compressed_json_response(data):
    json_data = json.dumps(data)
    compressed = gzip.compress(json_data.encode())
    response = HttpResponse(compressed, content_type='application/json')
    response['Content-Encoding'] = 'gzip'
    return response
```

#### 12. Critical Performance Rules

**DO:**
- Always use select_related for ForeignKey
- Always use prefetch_related for ManyToMany
- Index all filtered/sorted fields
- Use connection pooling (CONN_MAX_AGE)
- Cache expensive queries
- Use bulk operations for multiple records
- Separate serializers for list/detail views
- Use cursor pagination for large datasets

**DON'T:**
- Never use Model.objects.all() without select_related/prefetch_related
- Never iterate over queryset without optimization
- Never use SerializerMethodField for simple fields
- Never use nested serializers in list views
- Never cache user-specific data
- Never use synchronous operations in async views
- Never forget to add indexes on ForeignKey fields

#### 13. Monitoring Query Performance

**Enable query logging in development:**

```python
LOGGING = {
    'version': 1,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
```

**Use django-debug-toolbar for query analysis:**

```python
if DEBUG:
    INSTALLED_APPS += ['debug_toolbar']
    MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
```

#### 14. Redis Cache Patterns

**Cache key naming:**

```python
CACHE_KEY_PATTERNS = {
    'portfolio_list': 'portfolio:list:{hash}',
    'portfolio_detail': 'portfolio:detail:{id}',
    'user_permissions': 'user:permissions:{user_id}',
}
```

**Cache invalidation:**

```python
from django.core.cache import cache

def invalidate_portfolio_cache(portfolio_id):
    cache.delete(f'portfolio:detail:{portfolio_id}')
    cache.delete_pattern('portfolio:list:*')
```

**Cache versioning:**

```python
cache.set('portfolio:detail:1', data, timeout=300, version=2)
cache.get('portfolio:detail:1', version=2)
```

---

**آخرین به‌روزرسانی:** 2024

**نسخه:** 1.0.0

