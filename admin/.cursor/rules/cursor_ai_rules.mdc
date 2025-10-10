---
alwaysApply: true
---

# Cursor AI Rules - Admin Panel بهینه شده

## 📋 Core Development Rules

### 1. **Architecture & Technology Stack**
```typescript
// ONLY use these technologies:
- Next.js 15.4+ (App Router)
- TypeScript (strict mode)
- Tailwind CSS 4.1+
- Shadcn/ui 2.9+
- React Query (@tanstack/react-query)
- Zustand (state management)
- React Hook Form + Zod validation
- Lucide React (icons)
```

### 2. **Performance First Rules**
- **Client Components Only**: Use `'use client'` for ALL components except layout shells
- **Pure Client-Side**: Admin panels don't need SEO - handle everything client-side
- **Server-Side Security**: Use middleware for authentication/authorization only
- **React Query**: ALWAYS use for server state management with 5min stale time
- **Zustand**: Use for client state (UI state, user sessions)
- **Lazy Loading**: Dynamic imports for heavy components
- **Optimistic Updates**: Implement for all mutations

### 3. **Loading Strategy Rules (CRITICAL)**
```typescript
// ALWAYS implement this loading hierarchy:
1. Skeleton UI for immediate visual feedback
2. Suspense for lazy-loaded components  
3. Loading spinners only for actions (use Button with Loader2 icon)
4. Page-level loading for navigation

// REQUIRED Loading Components:
- DataTableSkeleton for tables
- CardSkeleton for cards
- PageSkeleton for full pages
- Button with Loader2 icon for actions

// REQUIRED Loading States:
- useLoadingStore (Zustand) for global loading
- React Query loading states
- Suspense boundaries for lazy components
```

### 4. **Component Development Rules**

#### ✅ DO:
```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton'

export function AdminTable() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-data'],
    queryFn: () => fetchApi.get('/admin/data'),
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) return <DataTableSkeleton />
  if (error) return <div>Error loading data</div>

  return (
    <div className="space-y-4">
      {/* Component content */}
    </div>
  )
}
```

#### ❌ DON'T:
- Use Server Components for ANY admin functionality
- Handle authentication in components (use middleware)
- Create custom fetch functions (use existing fetchApi)
- Use useState for server data (use React Query)
- Create unnecessary abstractions
- Mix server and client logic
- Show loading spinners without skeletons

### 5. **State Management Rules**

#### Server State (React Query):
```typescript
// hooks/use-admin-data.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchApi } from '@/lib/api'

export const useAdminData = () => useQuery({
  queryKey: ['admin-data'],
  queryFn: () => fetchApi.get('/admin/data'),
  staleTime: 5 * 60 * 1000,
})

export const useUpdateData = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => fetchApi.post('/admin/data', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-data'] }),
  })
}
```

#### Client State (Zustand):
```typescript
// stores/admin-store.ts
import { create } from 'zustand'

interface AdminStore {
  sidebarOpen: boolean
  currentUser: User | null
  isPageLoading: boolean
  isApiLoading: boolean
  toggleSidebar: () => void
  setUser: (user: User) => void
  setPageLoading: (loading: boolean) => void
  setApiLoading: (loading: boolean) => void
}

export const useAdminStore = create<AdminStore>((set) => ({
  sidebarOpen: true,
  currentUser: null,
  isPageLoading: false,
  isApiLoading: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setUser: (user) => set({ currentUser: user }),
  setPageLoading: (loading) => set({ isPageLoading: loading }),
  setApiLoading: (loading) => set({ isApiLoading: loading }),
}))
```

### 6. **Form Handling Rules**
```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

const formSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
})

export function AdminForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  const mutation = useMutation({
    mutationFn: (data) => fetchApi.post('/admin/create', data),
  })

  return (
    <Form {...form}>
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Submit
      </Button>
    </Form>
  )
}
```

### 7. **API Integration Rules**
- **ALWAYS use existing fetchApi** from your lib/api.ts
- **Never create new fetch functions**
- **Use React Query for all API calls**
- **Implement optimistic updates for better UX**
- **Use loading states with skeletons**

### 8. **Error Handling Rules**
```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { fetchApi } from '@/lib/api'
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton'

export function DataComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['data'],
    queryFn: () => fetchApi.get('/data'),
    retry: 1,
  })

  if (isLoading) return <DataTableSkeleton />
  if (error) return (
    <Alert variant="destructive">
      <AlertDescription>
        Error loading data. Please try again.
      </AlertDescription>
    </Alert>
  )

  return <div>{/* Success content */}</div>
}
```

### 9. **Styling Rules**
- **Use Tailwind classes only** - no custom CSS
- **Use Shadcn/ui components** for consistent design
- **Mobile-first approach** with responsive design
- **Dark mode support** using Tailwind dark: prefix

### 10. **Security Rules**
- **Use existing CSRF token handling** from fetchApi
- **Include credentials in requests** (already implemented)
- **Handle authentication errors** properly
- **Validate all form inputs** with Zod

### 11. **Performance Optimization Rules**
```typescript
// Lazy loading for heavy components
const DataTable = lazy(() => import('./DataTable'))

// Memoization for expensive calculations
const memoizedData = useMemo(() => processData(data), [data])

// Virtual scrolling for large lists
import { useVirtualizer } from '@tanstack/react-virtual'

// Skeleton loading for immediate feedback
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton'
```

### 12. **Code Quality Rules**
- **Use TypeScript strict mode**
- **Add proper types for all functions**
- **Use consistent naming conventions**
- **Keep components small and focused**
- **Add JSDoc comments for complex functions**

### 13. **Development Environment Rules**
- **Use existing environment.ts** configuration
- **No hardcoded URLs** - use environment variables
- **Enable debug mode** in development
- **Use React Query DevTools** in development

## 🚫 Forbidden Practices

- ❌ Creating Server Components for admin functionality
- ❌ Handling authentication in components (use middleware only)
- ❌ Using useState for server data
- ❌ Creating custom fetch functions
- ❌ Using external state management libraries (Redux, etc.)
- ❌ Adding unnecessary dependencies
- ❌ Ignoring TypeScript errors
- ❌ Using inline styles instead of Tailwind
- ❌ Not handling loading/error states
- ❌ Mixing server-side and client-side logic
- ❌ Showing loading spinners without skeletons
- ❌ Not using Suspense for lazy components

## 🎯 Code Generation Guidelines

When generating code:
1. **Always start with** `'use client'` for interactive components
2. **Import existing utilities** (fetchApi, environment config)
3. **Use React Query** for server state
4. **Use Zustand** for client state
5. **Implement proper error handling**
6. **Add loading states with skeletons**
7. **Use TypeScript properly**
8. **Follow existing patterns**
9. **Use Suspense for lazy loading**

## 📦 Essential Dependencies
```json
{
  "@tanstack/react-query": "^5.0.0",
  "@tanstack/react-query-devtools": "^5.0.0",
  "@tanstack/react-virtual": "^3.0.0",
  "zustand": "^4.4.0",
  "react-hook-form": "^7.48.0",
  "@hookform/resolvers": "^3.3.0",
  "zod": "^3.22.0",
  "lucide-react": "^0.263.0"
}
```

## 🔧 Environment Setup
```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_MEDIA_BASE_URL=http://localhost:8000/media
NEXT_PUBLIC_APP_NAME=Admin Panel
NEXT_PUBLIC_ENABLE_DEBUG_MODE=true
```

---

**Remember: Speed and efficiency are priorities. Use existing code, follow patterns, and focus on functionality over fancy features. ALWAYS implement skeleton loading for instant visual feedback.**# Cursor AI Rules - Admin Panel بهینه شده

## 📋 Core Development Rules

### 1. **Architecture & Technology Stack**
```typescript
// ONLY use these technologies:
- Next.js 15.4+ (App Router)
- TypeScript (strict mode)
- Tailwind CSS 4.1
- Shadcn/ui 2.9
- React Query (@tanstack/react-query)
- Zustand (state management)
- React Hook Form + Zod validation
- Lucide React (icons)
```

### 2. **Performance First Rules**
- **Client Components Only**: Use `'use client'` for ALL components except layout shells
- **Pure Client-Side**: Admin panels don't need SEO - handle everything client-side
- **Server-Side Security**: Use middleware for authentication/authorization only
- **React Query**: ALWAYS use for server state management with 5min stale time
- **Zustand**: Use for client state (UI state, user sessions)
- **Lazy Loading**: Dynamic imports for heavy components
- **Optimistic Updates**: Implement for all mutations

### 3. **Loading Strategy Rules (CRITICAL)**
```typescript
// ALWAYS implement this loading hierarchy:
1. Skeleton UI for immediate visual feedback
2. Suspense for lazy-loaded components  
3. Loading spinners only for actions (use Button with Loader2 icon)
4. Page-level loading for navigation

// REQUIRED Loading Components:
- DataTableSkeleton for tables
- CardSkeleton for cards
- PageSkeleton for full pages
- Button with Loader2 icon for actions

// REQUIRED Loading States:
- useLoadingStore (Zustand) for global loading
- React Query loading states
- Suspense boundaries for lazy components
```

### 4. **Component Development Rules**

#### ✅ DO:
```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton'

export function AdminTable() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-data'],
    queryFn: () => fetchApi.get('/admin/data'),
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) return <DataTableSkeleton />
  if (error) return <div>Error loading data</div>

  return (
    <div className="space-y-4">
      {/* Component content */}
    </div>
  )
}
```

#### ❌ DON'T:
- Use Server Components for ANY admin functionality
- Handle authentication in components (use middleware)
- Create custom fetch functions (use existing fetchApi)
- Use useState for server data (use React Query)
- Create unnecessary abstractions
- Mix server and client logic
- Show loading spinners without skeletons

### 5. **State Management Rules**

#### Server State (React Query):
```typescript
// hooks/use-admin-data.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchApi } from '@/lib/api'

export const useAdminData = () => useQuery({
  queryKey: ['admin-data'],
  queryFn: () => fetchApi.get('/admin/data'),
  staleTime: 5 * 60 * 1000,
})

export const useUpdateData = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => fetchApi.post('/admin/data', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-data'] }),
  })
}
```

#### Client State (Zustand):
```typescript
// stores/admin-store.ts
import { create } from 'zustand'

interface AdminStore {
  sidebarOpen: boolean
  currentUser: User | null
  isPageLoading: boolean
  isApiLoading: boolean
  toggleSidebar: () => void
  setUser: (user: User) => void
  setPageLoading: (loading: boolean) => void
  setApiLoading: (loading: boolean) => void
}

export const useAdminStore = create<AdminStore>((set) => ({
  sidebarOpen: true,
  currentUser: null,
  isPageLoading: false,
  isApiLoading: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setUser: (user) => set({ currentUser: user }),
  setPageLoading: (loading) => set({ isPageLoading: loading }),
  setApiLoading: (loading) => set({ isApiLoading: loading }),
}))
```

### 6. **Form Handling Rules**
```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

const formSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
})

export function AdminForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  const mutation = useMutation({
    mutationFn: (data) => fetchApi.post('/admin/create', data),
  })

  return (
    <Form {...form}>
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Submit
      </Button>
    </Form>
  )
}
```

### 7. **API Integration Rules**
- **ALWAYS use existing fetchApi** from your lib/api.ts
- **Never create new fetch functions**
- **Use React Query for all API calls**
- **Implement optimistic updates for better UX**
- **Use loading states with skeletons**

### 8. **Error Handling Rules**
```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { fetchApi } from '@/lib/api'
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton'

export function DataComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['data'],
    queryFn: () => fetchApi.get('/data'),
    retry: 1,
  })

  if (isLoading) return <DataTableSkeleton />
  if (error) return (
    <Alert variant="destructive">
      <AlertDescription>
        Error loading data. Please try again.
      </AlertDescription>
    </Alert>
  )

  return <div>{/* Success content */}</div>
}
```

### 9. **Styling Rules**
- **Use Tailwind classes only** - no custom CSS
- **Use Shadcn/ui components** for consistent design
- **Mobile-first approach** with responsive design
- **Dark mode support** using Tailwind dark: prefix

### 10. **Security Rules**
- **Use existing CSRF token handling** from fetchApi
- **Include credentials in requests** (already implemented)
- **Handle authentication errors** properly
- **Validate all form inputs** with Zod

### 11. **Performance Optimization Rules**
```typescript
// Lazy loading for heavy components
const DataTable = lazy(() => import('./DataTable'))

// Memoization for expensive calculations
const memoizedData = useMemo(() => processData(data), [data])

// Virtual scrolling for large lists
import { useVirtualizer } from '@tanstack/react-virtual'

// Skeleton loading for immediate feedback
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton'
```

### 12. **Code Quality Rules**
- **Use TypeScript strict mode**
- **Add proper types for all functions**
- **Use consistent naming conventions**
- **Keep components small and focused**
- **Add JSDoc comments for complex functions**

### 13. **Development Environment Rules**
- **Use existing environment.ts** configuration
- **No hardcoded URLs** - use environment variables
- **Enable debug mode** in development
- **Use React Query DevTools** in development

## 🚫 Forbidden Practices

- ❌ Creating Server Components for admin functionality
- ❌ Handling authentication in components (use middleware only)
- ❌ Using useState for server data
- ❌ Creating custom fetch functions
- ❌ Using external state management libraries (Redux, etc.)
- ❌ Adding unnecessary dependencies
- ❌ Ignoring TypeScript errors
- ❌ Using inline styles instead of Tailwind
- ❌ Not handling loading/error states
- ❌ Mixing server-side and client-side logic
- ❌ Showing loading spinners without skeletons
- ❌ Not using Suspense for lazy components

## 🎯 Code Generation Guidelines

When generating code:
1. **Always start with** `'use client'` for interactive components
2. **Import existing utilities** (fetchApi, environment config)
3. **Use React Query** for server state
4. **Use Zustand** for client state
5. **Implement proper error handling**
6. **Add loading states with skeletons**
7. **Use TypeScript properly**
8. **Follow existing patterns**
9. **Use Suspense for lazy loading**

## 📦 Essential Dependencies
```json
{
  "@tanstack/react-query": "^5.0.0",
  "@tanstack/react-query-devtools": "^5.0.0",
  "@tanstack/react-virtual": "^3.0.0",
  "zustand": "^4.4.0",
  "react-hook-form": "^7.48.0",
  "@hookform/resolvers": "^3.3.0",
  "zod": "^3.22.0",
  "lucide-react": "^0.263.0"
}
```

## 🔧 Environment Setup
```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_MEDIA_BASE_URL=http://localhost:8000/media
NEXT_PUBLIC_APP_NAME=Admin Panel
NEXT_PUBLIC_ENABLE_DEBUG_MODE=true
```

---

**Remember: Speed and efficiency are priorities. Use existing code, follow patterns, and focus on functionality over fancy features. ALWAYS implement skeleton loading for instant visual feedback.**