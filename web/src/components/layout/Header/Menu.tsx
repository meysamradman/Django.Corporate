"use client";

import React from 'react';
import Link from 'next/link';

export function Menu() {
    return (
            <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-wt">
                <Link href="/" className="hover:text-primary transition-colors text-wt">خانه</Link>
                <Link href="/real-estate" className="hover:text-primary transition-colors text-wt">جستجوی ملک</Link>
                <Link href="/agents" className="hover:text-primary transition-colors text-wt">مشاورین</Link>
                <Link href="/agencies" className="hover:text-primary transition-colors text-wt">آژانس‌ها</Link>
                <Link href="/blogs" className="hover:text-primary transition-colors text-wt">وبلاگ</Link>
                <Link href="/contact" className="hover:text-primary transition-colors text-wt">تماس با ما</Link>
            </nav>
    );
}
