"use client";
import {Moon, SunMedium} from "lucide-react"
import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/elements/Button";

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
            <Button 
                variant="ghost" 
                size="icon" 
                aria-label="Loading theme"
                className="cursor-pointer [&_svg]:!size-5 p-0 hover:bg-transparent">
                <div className="w-6 h-6 bg-gray-200 animate-pulse rounded-full" />
            </Button>
        );
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            className="cursor-pointer [&_svg]:!size-5 p-0 hover:bg-transparent"
            onClick={toggleTheme}>
            {resolvedTheme === "light" ? (
                <Moon className="hover:text-foreground/80" />
            ) : (
                <SunMedium className="hover:text-foreground/80 text-foreground" />
            )}
        </Button>
    );
}