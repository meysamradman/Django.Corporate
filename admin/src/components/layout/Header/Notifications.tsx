"use client";
import * as React from "react";
import { Bell } from 'lucide-react';

export function Notifications() {
    return (
        <div
            className="relative inline-flex h-10 w-10 items-center justify-center cursor-pointer text-font-p hover:text-foreground transition-colors"
            aria-label="Notifications"
            role="button"
            tabIndex={0}
        >
            <Bell className="h-5 w-5" />
            <div
                className="absolute inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-static-w bg-red-2 border border-static-w rounded-full top-1 right-1"
            >
                8
            </div>
        </div>
    );
}
