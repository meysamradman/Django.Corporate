"use client";

import React from 'react';
import Link from 'next/link';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
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

const menuItems = [
    { href: '/agents', label: 'مشاورین' },
    { href: '/agencies', label: 'آژانس‌ها' },
    { href: '/property-request', label: 'درخواست ملک' },
    { href: '/portfolios', label: 'نمونه‌کارها' },
    { href: '/blogs', label: 'وبلاگ' },
    { href: '/contact', label: 'تماس با ما' },
];

export function Menu({ variant, statusOptions = [], typeOptions = [] }: MenuProps) {
    const textClass = variant === 'transparent' ? 'text-wt' : 'text-font-p';
    const triggerClass = variant === 'transparent'
        ? 'bg-transparent text-wt hover:bg-wt/10 hover:text-wt data-[state=open]:bg-wt/15 data-[state=open]:text-wt'
        : 'bg-transparent text-font-p hover:bg-bg hover:text-font-p data-[state=open]:bg-bg data-[state=open]:text-font-p';
    const itemClass = variant === 'transparent'
        ? 'hover:text-primary transition-colors text-wt'
        : 'hover:text-primary transition-colors text-font-p';
    const safeStatusOptions = statusOptions.filter((item) => item.value).slice(0, 10);
    const safeTypeOptions = typeOptions.filter((item) => item.value).slice(0, 12);

    return (
            <nav className={`hidden lg:flex items-center text-sm font-semibold ${textClass}`}>
                <Link
                    href="/"
                    className={cn("ms-2", itemClass)}
                >
                    خانه
                </Link>

                <NavigationMenu viewport={false} dir="rtl">
                    <NavigationMenuList className="gap-2">
                        {safeStatusOptions.length > 0 ? (
                            <NavigationMenuItem>
                                <NavigationMenuTrigger className={triggerClass}>
                                    نوع معامله
                                </NavigationMenuTrigger>
                                <NavigationMenuContent className="min-w-56 border-br bg-wt p-2 shadow-lg">
                                    <ul className="grid gap-1">
                                        <li>
                                            <Link
                                                href="/properties"
                                                className="block rounded-md px-3 py-2 text-sm font-bold text-font-p hover:bg-bg hover:text-primary transition-colors"
                                            >
                                                همه
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
                                    نوع ملک
                                </NavigationMenuTrigger>
                                <NavigationMenuContent className="min-w-56 border-br bg-wt p-2 shadow-lg">
                                    <ul className="grid gap-1">
                                        <li>
                                            <Link
                                                href="/properties"
                                                className="block rounded-md px-3 py-2 text-sm font-bold text-font-p hover:bg-bg hover:text-primary transition-colors"
                                            >
                                                همه
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

                        {menuItems.map((item) => (
                            <NavigationMenuItem key={item.href}>
                                <Link
                                    href={item.href}
                                    className={cn("inline-flex h-9 items-center px-2", itemClass)}
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
