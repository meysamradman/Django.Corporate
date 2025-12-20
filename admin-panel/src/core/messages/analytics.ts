export const PAGE_PATH_TRANSLATIONS: Record<string, string> = {
  '/': 'صفحه اصلی',
  '/about': 'درباره ما',
  '/portfolio': 'نمونه‌کارها',
  '/portfolios': 'نمونه‌کارها',
  '/blog': 'وبلاگ',
  '/blogs': 'وبلاگ',
  '/contact': 'تماس با ما',
  '/services': 'خدمات',
  '/products': 'محصولات',
  '/news': 'اخبار',
  '/articles': 'مقالات',
  '/gallery': 'گالری',
  '/team': 'تیم',
  '/careers': 'فرصت‌های شغلی',
  '/faq': 'سوالات متداول',
  '/terms': 'قوانین و مقررات',
  '/privacy': 'حریم خصوصی',
  '/login': 'ورود',
  '/register': 'ثبت‌نام',
  '/dashboard': 'داشبورد',
  '/profile': 'پروفایل',
  '/settings': 'تنظیمات',
  '/search': 'جستجو',
  '/category': 'دسته‌بندی',
  '/tag': 'تگ',
  '/archive': 'آرشیو',
  '/sitemap': 'نقشه سایت',
  '/rss': 'خبرخوان',
} as const;

const pathCache = new Map<string, string>();

export function translatePagePath(path: string): string {
  if (!path) return path;
  
  if (pathCache.has(path)) {
    return pathCache.get(path)!;
  }
  
  const cleanPath = path.split('?')[0];
  
  const translation = PAGE_PATH_TRANSLATIONS[cleanPath];
  if (translation) {
    pathCache.set(path, translation);
    return translation;
  }
  
  if (cleanPath !== '/') {
    for (const [key, value] of Object.entries(PAGE_PATH_TRANSLATIONS)) {
      if (key !== '/' && cleanPath.startsWith(key)) {
        const remaining = cleanPath.slice(key.length);
        if (remaining === '' || remaining.startsWith('/')) {
          const result = value + (remaining || '');
          pathCache.set(path, result);
          return result;
        }
      }
    }
  }
  
  pathCache.set(path, cleanPath);
  return cleanPath;
}

