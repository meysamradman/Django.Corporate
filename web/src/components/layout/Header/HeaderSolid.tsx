"use client";

import React from 'react';
import { Logo } from '../Logo';
import { Menu } from '../Header/Menu';
import { Button } from "@/components/elements/Button";
import {Edit} from "lucide-react";
import {router} from "next/dist/client";

export function HeaderSolid() {
    return (
        <header className="sticky top-0 z-50 h-16 flex items-center justify-between px-6 lg:px-12 bg-header-s border-b transition-all">
            <Logo />

            <Menu />

            <div className="flex items-center gap-4">

                <Button
            size="sm"
            onClick={() => router.push('/portfolios/create')}>
            <Edit className="h-4 w-4" />
            افزودن نمونه‌کار
          </Button>

            </div>
        </header>
    );
}
