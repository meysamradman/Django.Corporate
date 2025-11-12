"use client";
import * as React from "react";
import { Bell } from 'lucide-react';
import { Button } from "@/components/elements/Button";

export function Notifications() {
    return (
        <Button
            variant="outline"
            size="icon"
            aria-label="Notifications"
            className="[&_svg]:!size-5 p-0 hover:bg-transparent relative">
            <Bell className="hover:text-foreground/80" />
            <div
                className="absolute inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-static-w bg-red-2 border border-static-w rounded-full top-0 right-0">
                8
            </div>
        </Button>
    );
}
