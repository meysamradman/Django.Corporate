import { useMemo, Fragment } from "react";
import { useLocation, Link } from "react-router-dom";
import { CaretRight as ChevronRight } from "@phosphor-icons/react";

interface BreadcrumbItem {
  label: string;
  href?: string;
  isLast?: boolean;
}

export function Breadcrumb() {
  const location = useLocation();
  const pathname = location.pathname;
  
  const { displayItems } = useMemo(() => {
    const getTranslatedLabel = (segment: string): string => {
      const normalizedSegment = segment.toLowerCase();
      
      const segmentMap: Record<string, string> = {
        'setting': 'تنظیمات',
        'admins': 'ادمین‌ها',
        'users': 'کاربران',
        'profile': 'پروفایل',
        'dashboard': 'داشبورد',
        'blogs': 'بلاگ',
        'portfolios': 'نمونه‌کارها',
        'blog': 'وبلاگ',
        'media': 'رسانه',
        'statistics': 'آمار',
        'create': 'ایجاد',
        'edit': 'ویرایش',
        'view': 'مشاهده',
        'categories': 'دسته‌بندی‌ها',
        'tags': 'برچسب‌ها',
        'role': 'نقش',
        'roles': 'نقش‌ها',
        'permissions': 'دسترسی‌ها',
        'panel': 'پنل',
        'general': 'عمومی',
        'appearance': 'ظاهر',
        'security': 'امنیت',
        'all': 'همه',
        'new': 'جدید',
        'details': 'جزئیات',
        'list': 'لیست',
        'settings': 'تنظیمات',
        'ai-content': 'تولید محتوا با AI',
        'ai-chat': 'چت AI',
        'ai-image': 'تولید تصویر با AI',
        'chat': 'چت',
        'email': 'ایمیل',
        'terms': 'قوانین',
        'page': 'صفحه',
        'about': 'درباره',
        'ticket': 'تیکت',
        'content': 'تولید محتوا',
        'audio': 'تولید پادکست',
        'image': 'تولید تصویر',
        'chatbot': 'چت بات',
        'models': 'مدلهای ai',
        'form-builder': 'فرم',
        'analytics': 'آمار',
        'real-estate': 'املاک',
        'properties': 'املاک',
        'property': 'ملک',
        'types': 'نوع‌ها',
        'states': 'وضعیت‌ها',
        'labels': 'برچسب‌ها',
        'features': 'ویژگی‌ها',
        'agents': 'نمایندگان',
        'agencies': 'آژانس‌ها',
        'provinces': 'استان‌ها',
        'cities': 'شهرها',
        'regions': 'مناطق',
        'me': 'من'
      };
      
      return segmentMap[normalizedSegment] || 
             segment.charAt(0).toUpperCase() + segment.slice(1);
    };

    const pathSegments = pathname.split("/").filter((segment) => segment);

    const items: BreadcrumbItem[] = [
      { label: "خانه", href: "/" }
    ];

    pathSegments.forEach((segment, index) => {
      const routeTo = "/" + pathSegments.slice(0, index + 1).join("/");
      const isLast = index === pathSegments.length - 1;

      items.push({
        label: getTranslatedLabel(segment),
        href: isLast ? undefined : routeTo,
        isLast
      });
    });

    const showEllipsis = items.length > 4;
    const display = showEllipsis 
      ? [items[0], { label: "...", href: undefined }, ...items.slice(-2)]
      : items;

    return { displayItems: display };
  }, [pathname]);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-font-p h-full py-2">
      {displayItems.map((item, index) => (
        <Fragment key={index}>
          {index > 0 && (
            <ChevronRight 
              weight="regular"
              size={16}
              className="text-font-s/50 rotate-180 shrink-0" 
            />
          )}
          
          {item.label === "..." ? (
            <span className="px-1 text-font-s/50 flex items-center">...</span>
          ) : item.isLast || !item.href ? (
            <span className="font-medium text-font-p flex items-center leading-none">
              {item.label}
            </span>
          ) : (
            <Link
              to={item.href}
              className="hover:text-font-p transition-colors duration-200 font-normal flex items-center leading-none"
            >
              {item.label}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  );
}

