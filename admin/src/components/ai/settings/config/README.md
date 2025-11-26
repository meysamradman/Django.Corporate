# AI Provider Configuration Guide

## 📖 راهنمای اضافه کردن Provider جدید

این راهنما نحوه اضافه کردن یک AI Provider جدید به سیستم را توضیح می‌دهد.

---

## 🚀 مراحل اضافه کردن Provider جدید

### گام 1: اضافه کردن به `PROVIDER_METADATA`

فایل: [`providerConfig.ts`](./providerConfig.ts)

```typescript
export const PROVIDER_METADATA: Record<string, ProviderMetadata> = {
  // ... providers موجود
  
  // ✅ Provider جدید
  'anthropic': {
    name: 'Anthropic Claude',
    icon: '🧠',
    description: 'Claude AI برای محاوره پیشرفته',
    apiKeyLabel: 'Anthropic API Key',
    category: 'popular', // یا 'standard' یا 'specialized'
    supportedFeatures: ['chat', 'content'], // قابلیت‌های پشتیبانی شده
  },
};
```

### گام 2: اضافه کردن به Mappings

همان فایل [`providerConfig.ts`](./providerConfig.ts):

```typescript
export const BACKEND_TO_FRONTEND_ID: Record<string, string> = {
  // ... mappings موجود
  'anthropic': 'anthropic', // ✅ اضافه کنید
};

export const FRONTEND_TO_BACKEND_NAME: Record<string, string> = {
  // ... mappings موجود
  'anthropic': 'anthropic', // ✅ اضافه کنید
};
```

### گام 3: تمام! 🎉

هیچ تغییر دیگری لازم نیست! سیستم به صورت خودکار:
- Provider جدید را در لیست نمایش می‌دهد
- API key management را فراهم می‌کند
- Model selection را پشتیبانی می‌کند
- Cache و React Query را مدیریت می‌کند

---

## 📊 ساختار ProviderMetadata

```typescript
interface ProviderMetadata {
  name: string;              // نام نمایشی
  icon: string;              // ایموجی (مثل 🤖)
  description: string;       // توضیح کوتاه
  apiKeyLabel: string;       // برچسب input API key
  category?: 'popular' | 'standard' | 'specialized';
  supportedFeatures?: ('chat' | 'content' | 'image')[];
}
```

---

## 🔍 مثال‌های آماده

### Provider های محبوب

```typescript
// Anthropic Claude
'anthropic': {
  name: 'Anthropic Claude',
  icon: '🧠',
  description: 'Claude AI برای محاوره پیشرفته',
  apiKeyLabel: 'Anthropic API Key',
  category: 'popular',
  supportedFeatures: ['chat', 'content'],
}

// Groq (سریع)
'groq': {
  name: 'Groq',
  icon: '⚡',
  description: 'سریع‌ترین inference (300+ tokens/sec)',
  apiKeyLabel: 'Groq API Key',
  category: 'standard',
  supportedFeatures: ['chat', 'content'],
}

// Mistral AI
'mistral': {
  name: 'Mistral AI',
  icon: '🌪️',
  description: 'Mistral Large و Medium',
  apiKeyLabel: 'Mistral API Key',
  category: 'standard',
  supportedFeatures: ['chat', 'content'],
}
```

### Provider های تصویر

```typescript
// Stability AI
'stability': {
  name: 'Stability AI',
  icon: '🎨',
  description: 'SDXL و SD3 برای تولید تصویر',
  apiKeyLabel: 'Stability API Key',
  category: 'specialized',
  supportedFeatures: ['image'],
}

// Replicate
'replicate': {
  name: 'Replicate',
  icon: '🔄',
  description: 'صدها مدل open-source',
  apiKeyLabel: 'Replicate API Key',
  category: 'specialized',
  supportedFeatures: ['chat', 'content', 'image'],
}
```

---

## ⚙️ توابع کمکی موجود

```typescript
// دریافت metadata یک provider
getProviderMetadata(providerId: string): ProviderMetadata | null

// دریافت لیست provider ها بر اساس دسته‌بندی
getProvidersByCategory(category: 'popular' | 'standard' | 'specialized'): string[]

// دریافت لیست provider ها بر اساس قابلیت
getProvidersByFeature(feature: 'chat' | 'content' | 'image'): string[]

// بررسی پشتیبانی provider
isProviderSupported(providerId: string): boolean

// دریافت لیست کامل
getAllProviders(): string[]
getAllProvidersWithMetadata(): Array<{ id: string; metadata: ProviderMetadata }>
```

---

## 🎯 نکات مهم

### ✅ بهینه‌سازی
- تمام configuration ها در یک فایل (`providerConfig.ts`)
- بدون نیاز به تغییر در component ها
- React Query مدیریت cache را انجام می‌دهد
- CSR (Client-Side Rendering) - بدون SSR

### ✅ Cache Strategy
- **Frontend**: `staleTime: 0` برای backend providers (بدون cache)
- **Backend**: Redis cache برای performance بالا
- Model list ها: `staleTime: 5 min` (داده‌های ثابت‌تر)

### ✅ Scalability
- تا 30+ provider به راحتی قابل اضافه کردن
- هیچ محدودیتی برای تعداد providers نیست
- Performance optimized با React Query

---

## 🔧 Backend Requirements

برای هر provider جدید در backend هم باید:

1. Model در `Backend/src/ai/models/` اضافه شود
2. Service در `Backend/src/ai/services/` پیاده‌سازی شود
3. Cache در Redis تنظیم شود

---

## 📚 مراجع

- [React Query Docs](https://tanstack.com/query/latest)
- [Next.js 15.4 Docs](https://nextjs.org/docs)
- [Backend AI API](../../../../Backend/src/ai/)

---

**آخرین به‌روزرسانی**: 2025-11-24  
**نسخه**: 2.0
