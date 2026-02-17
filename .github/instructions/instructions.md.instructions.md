---
description: Describe when these instructions should be loaded
# applyTo: 'Describe when these instructions should be loaded' # when provided, instructions will automatically be added to the request context when the pattern matches an attached file
---

# AI Project Instructions (MANDATORY)

## Language
- AI MUST ALWAYS respond in **Persian (فارسی)**.
- Messages must be short, clear, and practical.
- No unnecessary explanations unless requested.

---

## Project Overview
This is a **Real Estate Platform** with separated backend and frontends.

### Backend
- Framework: **Django**
- Uses **Redis** for caching
- Structure:
  - `admin/` → Backend for Admin Panel
  - `public/` → Backend APIs for Public Website
- Backend is the **single source of truth**

---

## Frontend Projects

### Admin Panel
- Framework: **React + Vite**
- Purpose: Full CRUD
- Connected ONLY to `admin/` backend APIs
- Must show **ONLY validated server errors**
- Do NOT display all backend messages
- Client-side validation must handle most errors for performance

### Public Website
- Framework: **Next.js 16**
- Purpose: **Read-only**
  - ❌ No authentication
  - ❌ No create / update / delete
  - ✅ Only data display (real estate listings, slider, logo, etc.)
- Currently working on:
  - Homepage
  - Dynamic slider
  - Dynamic logo
- Folder structure:
  - `api/` → Route handlers for fetching data
- Website must be lightweight and fast

---

## Caching Rules (CRITICAL)
- Redis is used ONLY in backend
- Cache must:
  - Update quickly after admin panel changes
  - Never cause stale data on public website
- Cache MUST be invalidated when admin updates data
- Avoid caching on public website where not necessary
- No cache conflict between:
  - Admin Panel
  - Public Website
- Redis keys must be scoped clearly

---

## Core Backend Rules (VERY IMPORTANT)

### Core Utilities
- `ApiResponse` from **core** MUST be used everywhere
- Pagination MUST be used from **core**
- Error handling MUST go through **core handler**

### Messages System
- Messages MUST be read from **messages**
- Messages are defined per app
- Messages are used for:
  - Admin Panel display
  - Controlled server-side feedback
- NEVER hardcode messages in frontend

### Validation & Errors
- Each component has:
  - `validations` files
  - schema-based validation
- Frontend must handle:
  - Required fields
  - Schema validation errors
- Backend must return ONLY necessary errors

---

## Admin Panel Error Rules (PERFORMANCE-CRITICAL)
- Do NOT show all backend errors
- Show ONLY:
  - Errors that are validated and checked by server
- Other errors MUST be handled in frontend
- Purpose:
  - Increase speed
  - Reduce payload size
  - Improve UX

---

## Core Messages Structure
- In Admin Panel:
  - Core contains `messages`
  - Each app has its own module inside `messages`
  - `errors.ts` is the reference for error mapping
- Always follow this structure
- No duplicate or random error definitions

---

## Coding Standards
- Follow best practices for:
  - Django
  - React
  - Next.js 16
- Clean, production-ready code only
- No over-engineering
- No breaking current architecture

---

## Forbidden Actions
- ❌ Do NOT suggest auth for public website
- ❌ Do NOT suggest CRUD for public website
- ❌ Do NOT bypass core utilities
- ❌ Do NOT ignore Redis invalidation logic

## Styling Rules (Tailwind CSS 4+)
- Tailwind version: **4+**
- ALWAYS use predefined colors from the main CSS theme
- NEVER use hardcoded colors
- Use semantic class naming where applicable
- Follow consistent spacing and layout rules

## SSR / CSR & SEO (CRITICAL)
- Every page MUST correctly choose between:
- **SSR** (Server Components) for SEO-critical content
- **CSR** ONLY when interaction is required
- Avoid unnecessary `"use client"`
- SEO-first mindset:
- Metadata must be defined properly
- Content important for SEO MUST be rendered on the server

## Component Rules
- Components must:
- Be small
- Be reusable
- Live inside `app/components`
- No business logic inside pages
- Heavy logic must be extracted to helpers or hooks

## Page Structure Rules
- Pages must:
- Import components
- Stay readable
- Have clear layout structure
- Use proper skeleton/loading states
- Implement loading.tsx where needed

## Types & Interfaces
- ALL interfaces and types MUST be placed inside:
app/types/

- No inline interfaces inside components or pages
- Types must be reused and shared where possible

## General Rules
- Target framework is **Next.js 16**
- Project uses **App Router**
- Code must be clean, modular, and SEO-friendly
- Pages MUST remain lightweight (pages must not become fat)