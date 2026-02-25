"use client";
import {Moon, SunMedium} from "lucide-react"
import * as React from "react";
import { useTheme } from "next-themes";
import { cn } from "@/core/utils/cn";

type DarkModeProps = {
    variant?: "transparent" | "solid";
};

export function DarkMode({ variant = "solid" }: DarkModeProps) {
    const { setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const toggleTheme = React.useCallback(() => {
        setTheme(resolvedTheme === "light" ? "dark" : "light");
    }, [resolvedTheme, setTheme]);

    if (!mounted) {
        return (
            <div
                aria-label="Loading theme"
                className="inline-flex h-9 w-9 items-center justify-center shrink-0">
                <div className="size-5 bg-br animate-pulse rounded-full" />
            </div>
        );
    }

    const triggerClass = variant === "transparent"
        ? "border-static-w/20 bg-static-w/10 text-static-w hover:bg-static-w/15"
        : "border-br bg-bg text-font-p hover:bg-card";

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={toggleTheme}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggleTheme()}
            aria-label="Toggle theme"
            className={cn(
                "inline-flex h-9 w-9 items-center justify-center cursor-pointer select-none rounded-lg border transition-colors shrink-0",
                triggerClass
            )}
        >
            {resolvedTheme === "light" ? (
                <Moon className="h-5 w-5" />
            ) : (
                <SunMedium className="h-5 w-5" />
            )}
        </div>
    );
}
