"use client";

import React from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/elements/dropdown-menu';

type MenuVariant = 'transparent' | 'solid';

export type HeaderMenuTypeOption = {
    value: string;
    label: string;
    slug?: string;
};

type MenuProps = {
    variant: MenuVariant;
    typeOptions?: HeaderMenuTypeOption[];
};

const menuItems = [
    { href: '/', label: 'خانه' },
    { href: '/agents', label: 'مشاورین' },
    { href: '/agencies', label: 'آژانس‌ها' },
    { href: '/portfolios', label: 'نمونه‌کارها' },
    { href: '/blogs', label: 'وبلاگ' },
    { href: '/contact', label: 'تماس با ما' },
];

export function Menu({ variant, typeOptions = [] }: MenuProps) {
    const textClass = variant === 'transparent' ? 'text-wt' : 'text-font-p';
    const safeTypeOptions = typeOptions.filter((item) => item.value).slice(0, 10);

    return (
            <nav className={`hidden lg:flex items-center gap-8 text-sm font-semibold ${textClass}`}>
                <DropdownMenu>
                    <DropdownMenuTrigger className={`inline-flex items-center gap-1.5 hover:text-primary transition-colors outline-none ${textClass}`}>
                        املاک
                        <ChevronDown className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-56">
                        <DropdownMenuItem asChild>
                            <Link href="/properties">همه ملک‌ها</Link>
                        </DropdownMenuItem>

                        {safeTypeOptions.length > 0 ? (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>نوع ملک</DropdownMenuLabel>
                                {safeTypeOptions.map((item) => {
                                    const href = item.slug
                                        ? `/properties/type/${item.slug}`
                                        : `/properties?property_type=${encodeURIComponent(item.value)}`;

                                    return (
                                        <DropdownMenuItem asChild key={`type-${item.value}`}>
                                            <Link href={href}>
                                                {item.label}
                                            </Link>
                                        </DropdownMenuItem>
                                    );
                                })}
                            </>
                        ) : null}

                    </DropdownMenuContent>
                </DropdownMenu>

                {menuItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`hover:text-primary transition-colors ${textClass}`}
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>
    );
}
