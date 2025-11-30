"use client";
import * as React from "react";
import { Bell } from 'lucide-react';

export function Notifications() {
    return (
        <div
            className="relative inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center cursor-pointer text-font-p hover:text-foreground transition-colors shrink-0"
            aria-label="Notifications"
            role="button"
            tabIndex={0}
        >
            <Bell className="h-5 w-5" />
            <div
                className="absolute inline-flex items-center justify-center w-3.5 h-3.5 sm:w-4 sm:h-4 text-[9px] sm:text-[10px] font-bold text-static-w bg-red-2 border border-static-w rounded-full top-0.5 right-0.5 sm:top-1 sm:right-1"
            >
                8
            </div>
        </div>
    );
}
