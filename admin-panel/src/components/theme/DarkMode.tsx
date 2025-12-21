import { Moon, SunMedium } from "lucide-react"
import { useState, useEffect, useCallback } from "react";

export function DarkMode() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (newTheme: 'light' | 'dark') => {
    // 👇 جلوگیری از حالت تیکه‌تیکه شدن با غیرفعال کردن موقت انیمیشن‌ها
    const css = document.createElement('style');
    css.type = 'text/css';
    css.appendChild(
      document.createTextNode(
        `* {
           -webkit-transition: none !important;
           -moz-transition: none !important;
           -o-transition: none !important;
           -ms-transition: none !important;
           transition: none !important;
        }`
      )
    );
    document.head.appendChild(css);

    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Force a reflow
    window.getComputedStyle(css).opacity;

    // Remove the style tag
    document.head.removeChild(css);
  };

  const toggleTheme = useCallback(() => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  }, [theme]);

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
      {theme === "light" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <SunMedium className="h-5 w-5" />
      )}
    </div>
  );
}

