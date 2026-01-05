"use client";
import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
interface BreadcrumbItem {
    label: string;
    href?: string;
    isLast?: boolean;
}

export function Breadcrumb() {
    const pathname = usePathname();

    const { breadcrumbItems, displayItems } = React.useMemo(() => {
        const getTranslatedLabel = (segment: string): string => {
            const normalizedSegment = segment.toLowerCase();

            const segmentMap: Record<string, string> = {
                'dashboard': 'داشبورد',
                'blogs': 'بلاگ',
                'portfolios': 'نمونه‌کارها',
                'blog': 'وبلاگ',
                'media': 'رسانه',
                'create': 'ایجاد',
                'edit': 'ویرایش',
                'view': 'مشاهده',
                'categories': 'دسته‌بندی‌ها',
                'tags': 'برچسب‌ها',
                'general': 'عمومی',
                'appearance': 'ظاهر',
                'security': 'امنیت',
                'all': 'همه',
                'new': 'جدید',
                'details': 'جزئیات',
                'list': 'لیست',
                'ai-content': 'تولید محتوا با AI',
                'chat': 'چت',
                'email': 'ایمیل',
                'terms': 'قوانین',
                'page': 'صفحه',
                'about': 'درباره',
                'image': 'تولید تصویر',
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

        return { breadcrumbItems: items, displayItems: display };
    }, [pathname]);

    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-font-p h-full py-2">
            {displayItems.map((item, index) => (
                <React.Fragment key={index}>
                    {index > 0 && (
                        <ChevronRight
                            className="h-4 w-4 text-font-s/50 rotate-180 shrink-0"
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
                            href={item.href}
                            className="hover:text-font-p transition-colors duration-200 font-normal flex items-center leading-none"
                        >
                            {item.label}
                        </Link>
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
}