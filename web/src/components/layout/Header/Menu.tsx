"use client";

import React from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/elements/dropdown-menu';

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
    const safeStatusOptions = statusOptions.filter((item) => item.value).slice(0, 10);
    const safeTypeOptions = typeOptions.filter((item) => item.value).slice(0, 12);

    return (
            <nav className={`hidden lg:flex items-center gap-8 text-sm font-semibold ${textClass}`}>
                <Link
                    href="/"
                    className={`hover:text-primary transition-colors ${textClass}`}
                >
                    خانه
                </Link>

                {safeStatusOptions.length > 0 ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger className={`inline-flex items-center gap-1.5 hover:text-primary transition-colors outline-none ${textClass}`}>
                            نوع معامله
                            <ChevronDown className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="min-w-56">
                            <DropdownMenuItem asChild>
                                <Link href="/properties">
                                    همه
                                </Link>
                            </DropdownMenuItem>
                            {safeStatusOptions.map((item) => {
                                const href = `/properties/${item.value}`;

                                return (
                                    <DropdownMenuItem asChild key={`status-${item.value}`}>
                                        <Link href={href}>
                                            {item.label}
                                        </Link>
                                    </DropdownMenuItem>
                                );
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : null}

                {safeTypeOptions.length > 0 ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger className={`inline-flex items-center gap-1.5 hover:text-primary transition-colors outline-none ${textClass}`}>
                            نوع ملک
                            <ChevronDown className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="min-w-56">
                            <DropdownMenuItem asChild>
                                <Link href="/properties">
                                    همه
                                </Link>
                            </DropdownMenuItem>
                            {safeTypeOptions.map((item) => {
                                const href = `/properties/${item.value}`;

                                return (
                                    <DropdownMenuItem asChild key={`type-${item.value}`}>
                                        <Link href={href}>
                                            {item.label}
                                        </Link>
                                    </DropdownMenuItem>
                                );
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : null}

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
