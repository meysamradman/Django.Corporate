"use client";

import React from 'react';
import Link from 'next/link';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from '@/components/elements/navigation-menu';
import { cn } from '@/core/utils/cn';

type MenuVariant = 'transparent' | 'solid';

export type HeaderMenuStatusOption = {
    value: string;
    label: string;
};

export type HeaderMenuTypeOption = {
    value: string;
    label: string;
};

type MenuProps = {
    variant: MenuVariant;
    statusOptions?: HeaderMenuStatusOption[];
    typeOptions?: HeaderMenuTypeOption[];
};

const LABELS = {
    home: 'خانه',
    dealType: 'نوع معامله',
    propertyType: 'نوع ملک',
    all: 'همه',
    about: 'درباره ما',
};

const menuItems = [
    { href: '/property-request', label: 'درخواست ملک' },
];

const aboutMegaItems = [
    { href: '/about', title: 'درباره ما', description: 'آشنایی با شناسنامه برند و ارزش‌های تیم.' },
    { href: '/contact', title: 'تماس با ما', description: 'راه‌های ارتباط مستقیم با تیم فروش و پشتیبانی.' },
    { href: '/blogs', title: 'وبلاگ', description: 'محتوای تخصصی بازار املاک و آموزش‌های کاربردی.' },
    { href: '/portfolios', title: 'نمونه‌کارها', description: 'پروژه‌ها و نمونه‌های اجرا شده برای بررسی کیفیت کار.' },
    { href: '/agents', title: 'مشاورین', description: 'مشاهده پروفایل مشاوران فعال و راه‌های تماس.' },
    { href: '/agencies', title: 'آژانس‌ها', description: 'لیست آژانس‌های همکار و معتبر در پلتفرم.' },
];

export function Menu({ variant, statusOptions = [], typeOptions = [] }: MenuProps) {
    const textClass = variant === 'transparent' ? 'text-static-w' : 'text-font-p';
    const triggerClass = variant === 'transparent'
        ? 'bg-transparent text-static-w hover:bg-static-w/10 hover:text-static-w data-[state=open]:bg-static-w/15 data-[state=open]:text-static-w'
        : 'bg-transparent text-font-p hover:bg-bg hover:text-font-p data-[state=open]:bg-bg data-[state=open]:text-font-p';
    const itemClass = variant === 'transparent'
        ? 'hover:text-primary transition-colors text-static-w'
        : 'hover:text-primary transition-colors text-font-p';
    const megaItemClass = 'rounded-md p-3 transition-colors hover:bg-bg';
    const megaTitleClass = 'text-font-p';
    const megaDescriptionClass = 'text-font-s';
    const safeStatusOptions = statusOptions.filter((item) => item.value).slice(0, 10);
    const safeTypeOptions = typeOptions.filter((item) => item.value).slice(0, 12);

    return (
        <nav className={`hidden lg:flex items-center text-sm font-semibold ${textClass}`}>
            <Link
                href="/"
                className={cn('inline-flex h-9 cursor-pointer items-center px-2 ms-2', itemClass)}
            >
                {LABELS.home}
            </Link>

            <NavigationMenu viewport={false} dir="rtl">
                <NavigationMenuList className="gap-2">
                    {safeStatusOptions.length > 0 ? (
                        <NavigationMenuItem>
                            <NavigationMenuTrigger className={triggerClass}>
                                {LABELS.dealType}
                            </NavigationMenuTrigger>
                            <NavigationMenuContent className="min-w-56 border-br bg-card p-2 shadow-lg">
                                <ul className="grid gap-1">
                                    <li>
                                        <Link
                                            href="/properties"
                                            className="block rounded-md px-3 py-2 text-sm font-bold text-font-p hover:bg-bg hover:text-primary transition-colors"
                                        >
                                            {LABELS.all}
                                        </Link>
                                    </li>
                                    {safeStatusOptions.map((item) => (
                                        <li key={`status-${item.value}`}>
                                            <Link
                                                href={`/properties/${item.value}`}
                                                className="block rounded-md px-3 py-2 text-sm font-bold text-font-p hover:bg-bg hover:text-primary transition-colors"
                                            >
                                                {item.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </NavigationMenuContent>
                        </NavigationMenuItem>
                    ) : null}

                    {safeTypeOptions.length > 0 ? (
                        <NavigationMenuItem>
                            <NavigationMenuTrigger className={triggerClass}>
                                {LABELS.propertyType}
                            </NavigationMenuTrigger>
                            <NavigationMenuContent className="min-w-56 border-br bg-card p-2 shadow-lg">
                                <ul className="grid gap-1">
                                    <li>
                                        <Link
                                            href="/properties"
                                            className="block rounded-md px-3 py-2 text-sm font-bold text-font-p hover:bg-bg hover:text-primary transition-colors"
                                        >
                                            {LABELS.all}
                                        </Link>
                                    </li>
                                    {safeTypeOptions.map((item) => (
                                        <li key={`type-${item.value}`}>
                                            <Link
                                                href={`/properties/${item.value}`}
                                                className="block rounded-md px-3 py-2 text-sm font-bold text-font-p hover:bg-bg hover:text-primary transition-colors"
                                            >
                                                {item.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </NavigationMenuContent>
                        </NavigationMenuItem>
                    ) : null}

                    <NavigationMenuItem>
                        <NavigationMenuTrigger className={triggerClass}>
                            {LABELS.about}
                        </NavigationMenuTrigger>
                        <NavigationMenuContent
                            className={cn(
                                '!w-[44rem] max-w-[92vw] md:!w-[44rem] border-br bg-card p-3 shadow-lg'
                            )}
                        >
                            <ul className="grid gap-2 grid-cols-1 md:grid-cols-2">
                                {aboutMegaItems.map((item) => (
                                    <li key={item.href}>
                                        <NavigationMenuLink asChild>
                                            <Link href={item.href} className={megaItemClass}>
                                                <div className={cn('text-sm font-black leading-none', megaTitleClass)}>
                                                    {item.title}
                                                </div>
                                                <p className={cn('mt-1 line-clamp-2 text-xs leading-6', megaDescriptionClass)}>
                                                    {item.description}
                                                </p>
                                            </Link>
                                        </NavigationMenuLink>
                                    </li>
                                ))}
                            </ul>
                        </NavigationMenuContent>
                    </NavigationMenuItem>

                    {menuItems.map((item) => (
                        <NavigationMenuItem key={item.href}>
                            <Link
                                href={item.href}
                                className={cn('inline-flex h-9 cursor-pointer items-center px-2', itemClass)}
                            >
                                {item.label}
                            </Link>
                        </NavigationMenuItem>
                    ))}
                </NavigationMenuList>
            </NavigationMenu>
        </nav>
    );
}
