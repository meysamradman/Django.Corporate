"use client";
import {Moon, SunMedium} from "lucide-react"
import * as React from "react";
import { useTheme } from "next-themes";

export function DarkMode() {
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
                className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center shrink-0">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-br animate-pulse rounded-full" />
            </div>
        );
    }

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={toggleTheme}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggleTheme()}
            aria-label="Toggle theme"
            className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center cursor-pointer select-none text-font-p hover:text-foreground transition-colors shrink-0"
        >
            {resolvedTheme === "light" ? (
                <Moon className="h-5 w-5" />
            ) : (
                <SunMedium className="h-5 w-5" />
            )}
        </div>
    );
}