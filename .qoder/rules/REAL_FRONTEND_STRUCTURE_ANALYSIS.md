---
trigger: always_on
alwaysApply: true
---

# Next.js 15.4+ Admin Panel - Complete Development Rules

## 📋 Project Overview

**Type**: Client-Side Admin Panel (CSR)  
**Backend**: Django REST API with separate admin/user systems  
**Frontend**: Next.js 15.4+ with App Router  
**SEO**: Not required - Pure client-side rendering  
**Media**: Centralized media management system

---

## 🏗️ Technology Stack

```typescript
// Core
- Next.js 15.4+ (App Router + Turbopack)
- React 19.1+
- TypeScript 5+ (strict mode)
- Tailwind CSS 4.1+
- Shadcn/ui 2.9+

// State Management
- TanStack Query v5 (@tanstack/react-query)
- Zustand 4.4+

// Forms
- React Hook Form 7.48+
- Zod 3.22+ validation

// UI
- Lucide React 0.263+ (icons only)
```

---

## 📁 Project Architecture

```
src/
├── app/                 # Next.js App Router
│   ├── (auth)/         # Auth routes
│   ├── (main)/         # Main admin routes
│   └── layout.tsx
│
├── elements/           # Tailwind-based UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   └── ... (all styled components)
│
├── types/              # All TypeScript models/interfaces
│   ├── auth.types.ts
│   ├── admin.types.ts
│   ├── media.types.ts
│   ├── portfolio.types.ts
│   └── shared.types.ts
│
├── Core/               # Core configuration & utilities
│   ├── config/
│   │   ├── environment.ts
│   │   └── constants.ts
│   ├── http/
│   │   ├── client.ts
│   │   └── interceptors.ts
│   └── utils/
│       ├── helpers.ts
│       └── validators.ts
│
├── components/         # Business components
│   ├── auth/
│   ├── admin/
│   ├── media/
│   ├── portfolio/
│   └── shared/
│
├── hooks/             # Custom React hooks
├── services/          # API services
├── stores/            # Zustand stores
└── middleware.ts
```

---

## 🔧 Next.js 15.4 Configuration

### next.config.ts

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
    
    // CRITICAL: Package optimization
    optimizePackageImports: [
      'lucide-react',
      '@tanstack/react-query',
      'react-hook-form',
      'zod',
      'zustand'
    ],
    
    // Disable for admin panels
    ppr: false,
    dynamicIO: false,
  },
  
  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
    ],
  },
  
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;
```

### middleware.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  // Auth & CSRF logic
}

// REQUIRED for Next.js 15.4
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|assets).*)',
  ],
};
```

---

## 🎨 Component Development Rules

### ✅ Using Elements (Tailwind UI Components)

```typescript
'use client';

// ✅ CORRECT: Import from elements folder
import { Button } from '@/elements/Button';
import { Input } from '@/elements/Input';
import { Card } from '@/elements/Card';
import { DataTable } from '@/elements/DataTable';

// ✅ CORRECT: Import types from types folder
import type { Admin, AdminFilters } from '@/types/admin.types';
import type { ApiResponse } from '@/types/shared.types';

export function AdminList() {
  const { data, isLoading, error } = useQuery<ApiResponse<Admin[]>>({
    queryKey: ['admins'],
    queryFn: () => fetchApi.get('/admin/admins'),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <DataTableSkeleton />;
  if (error) return <ErrorAlert error={error} />;

  return (
    <Card>
      <DataTable data={data.results} columns={columns} />
    </Card>
  );
}
```

### ✅ Types Structure

```typescript
// types/admin.types.ts
export interface Admin {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  role: Role;
  created_at: string;
  updated_at: string;
}

export interface AdminFilters {
  search?: string;
  role?: number;
  is_active?: boolean;
  page?: number;
  page_size?: number;
}

export interface AdminFormData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: number;
  password?: string;
}
```

### ❌ Forbidden - Don't Create New UI Components

```typescript
// ❌ NEVER: Create custom styled components
const CustomButton = styled.button`...`;

// ❌ NEVER: Create duplicate UI components
export function MyButton() {
  return <button className="...">...</button>;
}

// ✅ ALWAYS: Use existing elements
import { Button } from '@/elements/Button';
```

### ✅ Server Components (Minimal)

```typescript
// ONLY for layout shells
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

### ❌ Forbidden Patterns

```typescript
// ❌ Server components for admin features
export default async function Page() {
  const data = await fetch('...');
  return <div>{data}</div>;
}

// ❌ useState for server data
const [data, setData] = useState([]);
useEffect(() => fetch('/api').then(setData), []);

// ❌ Custom fetch
const res = await fetch('/api/data');

// ❌ Spinner without skeleton
if (isLoading) return <Spinner />;

// ❌ Auth in components
if (!user) return <Redirect />;
```

---

## 📊 Loading Strategy (CRITICAL)

### Hierarchy

1. **Skeleton UI** - Immediate feedback
2. **Suspense** - Lazy components
3. **Button Spinners** - Actions only
4. **Page Loading** - Navigation

### Implementation

```typescript
// 1. Skeleton for data
if (isLoading) return <DataTableSkeleton />;

// 2. Suspense for lazy
const Heavy = lazy(() => import('./Heavy'));
<Suspense fallback={<Skeleton />}>
  <Heavy />
</Suspense>

// 3. Button loading
<Button disabled={isPending}>
  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  Submit
</Button>

// 4. Dynamic imports (>150 lines)
const Modal = dynamic(
  () => import('./Modal'),
  { loading: () => <Skeleton />, ssr: false }
);
```

---

## 🔄 State Management

### Server State (TanStack Query)

```typescript
// hooks/useAdmin.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/Core/http/client';
import type { Admin, AdminFilters, AdminFormData } from '@/types/admin.types';
import type { ApiResponse } from '@/types/shared.types';

export const useAdmins = (filters?: AdminFilters) => {
  return useQuery<ApiResponse<Admin[]>>({
    queryKey: ['admins', filters],
    queryFn: () => fetchApi.get('/admin/admins', { params: filters }),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateAdmin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: AdminFormData) => fetchApi.post('/admin/admins', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
  });
};
```

### Client State (Zustand)

```typescript
// stores/auth.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, PanelSettings } from '@/types/auth.types';

interface AuthStore {
  user: User | null;
  panelSettings: PanelSettings | null;
  setUser: (user: User | null) => void;
  setPanelSettings: (settings: PanelSettings | null) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      panelSettings: null,
      setUser: (user) => set({ user }),
      setPanelSettings: (settings) => set({ panelSettings: settings }),
    }),
    { name: 'auth-storage' }
  )
);
```

**CRITICAL:**
- ✅ All types from `@/types/` folder
- ✅ fetchApi from `@/Core/http/client`
- ❌ Never define types inline

---

## 📝 Form Handling

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/elements/Button';
import { Input } from '@/elements/Input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/elements/Form';
import type { AdminFormData } from '@/types/admin.types';

const schema = z.object({
  name: z.string().min(2, 'نام باید حداقل 2 کاراکتر باشد'),
  email: z.string().email('ایمیل معتبر وارد کنید'),
});

export function AdminForm() {
  const form = useForm<AdminFormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (data: AdminFormData) => fetchApi.post('/admin', data),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نام</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          ذخیره
        </Button>
      </form>
    </Form>
  );
}
```

**CRITICAL:**
- ✅ All form elements from `@/elements/`
- ✅ All types from `@/types/`
- ✅ Never create custom form components

---

## 🌐 API Integration

### fetchApi Client (Use Core Config)

```typescript
// Core/http/client.ts
import { environment } from '@/Core/config/environment';

class ApiClient {
  private baseURL = environment.api.baseUrl;
  
  async get<T>(url: string, options?: Options): Promise<T> {
    return this.request('GET', url, options);
  }
  
  async post<T>(url: string, data?: any): Promise<T> {
    return this.request('POST', url, { body: data });
  }
  
  private async request(method: string, url: string, options?: Options) {
    const response = await fetch(`${this.baseURL}${url}`, {
      method,
      credentials: 'include', // Django sessions
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken(),
        ...options?.headers,
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });
    
    if (!response.ok) throw await this.handleError(response);
    
    return response.json();
  }
}

export const fetchApi = new ApiClient();
```

### Environment Configuration

```typescript
// Core/config/environment.ts
export const environment = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api',
    mediaUrl: process.env.NEXT_PUBLIC_MEDIA_BASE_URL || 'http://localhost:8000/media',
    timeout: 30000,
  },
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Admin Panel',
    version: '1.0.0',
    debugMode: process.env.NEXT_PUBLIC_ENABLE_DEBUG_MODE === 'true',
  },
};
```

**CRITICAL RULES:**
- ✅ ALWAYS use `fetchApi` from `@/Core/http/client`
- ✅ ALWAYS use `environment` from `@/Core/config/environment`
- ❌ NEVER create custom fetch functions
- ❌ NEVER hardcode API URLs

---

## 🎯 Performance Rules

### Code Splitting

```typescript
// Heavy components (>150 lines)
const MediaUpload = dynamic(
  () => import('@/modules/media/components/MediaUpload'),
  { loading: () => <Skeleton />, ssr: false }
);

const DataTable = dynamic(
  () => import('@/modules/shared/components/DataTable'),
  { loading: () => <DataTableSkeleton />, ssr: false }
);
```

### React 19 Features

```typescript
// use() for async
import { use, Suspense } from 'react';

function AsyncComponent() {
  const data = use(fetchData());
  return <Content data={data} />;
}

<Suspense fallback={<Skeleton />}>
  <AsyncComponent />
</Suspense>

// useTransition for UX
const [isPending, startTransition] = useTransition();

const handleClick = () => {
  startTransition(() => {
    performAction();
  });
};
```

### Memoization

```typescript
// Expensive calculations
const processed = useMemo(() => 
  processData(data, filters), 
  [data, filters]
);

// Callbacks
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

---

## 🚫 Forbidden Practices

### File Structure Rules
1. ❌ Creating new UI components (use `@/elements/`)
2. ❌ Defining types inline (use `@/types/`)
3. ❌ Hardcoding config values (use `@/Core/config/`)
4. ❌ Custom fetch functions (use `@/Core/http/client`)
5. ❌ Styled-components or CSS-in-JS (use Tailwind from elements)

### Code Rules
6. ❌ Server Components for admin features (use client components)
7. ❌ useState for server data (use TanStack Query)
8. ❌ Loading spinners without skeletons
9. ❌ Not using Suspense for lazy components
10. ❌ Ignoring TypeScript errors

### Performance Rules
11. ❌ Importing entire libraries (use tree shaking)
12. ❌ Not lazy loading heavy components (>150 lines)
13. ❌ Mixing server/client logic
14. ❌ Inline styles instead of Tailwind

**Remember**: 
- All UI → `@/elements/`
- All types → `@/types/`
- All config → `@/Core/config/`
- All HTTP → `@/Core/http/client`

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "next": "^15.4.6",
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "@tanstack/react-query": "^5.0.0",
    "@tanstack/react-virtual": "^3.0.0",
    "zustand": "^4.4.0",
    "react-hook-form": "^7.48.0",
    "@hookform/resolvers": "^3.3.0",
    "zod": "^3.22.0",
    "lucide-react": "^0.263.0"
  }
}
```

---

## 🔧 Environment

```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_MEDIA_BASE_URL=http://localhost:8000/media
NEXT_PUBLIC_APP_NAME=Admin Panel
NEXT_PUBLIC_ENABLE_DEBUG_MODE=true
```

---

## ✅ Code Generation Checklist

1. ✅ `'use client'` for interactive components
2. ✅ Import fetchApi (never custom fetch)
3. ✅ TanStack Query for server state
4. ✅ Zustand for client state
5. ✅ Skeleton loading states
6. ✅ Proper error handling
7. ✅ TypeScript strict mode
8. ✅ Follow existing patterns
9. ✅ Suspense for lazy loading
10. ✅ Keep files <150 lines

---

## 🎯 Core Principles

**Speed**: Use existing code, avoid over-engineering  
**Client-Side**: Everything runs in browser  
**Skeletons**: Instant visual feedback  
**Type Safety**: Strict TypeScript  
**Performance**: Code splitting & lazy loading  
**Consistency**: Follow patterns  
**Simplicity**: No unnecessary abstractions

---

**Version**: 2.0  
**Compatible**: Next.js 15.4.6, React 19.1.1, Tailwind 4.1.11برای بهینه‌سازی کامل فرانت‌اند!** 🚀