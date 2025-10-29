"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps, toast as originalToast } from "sonner"
import { fontPersian } from "@/core/styles/fonts"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className={`toaster group ${fontPersian.className}`}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          fontFamily: "var(--font-persian), Tahoma, Arial, sans-serif",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

// Override toast functions to use our colors by default
const toast = {
  ...originalToast,
  success: (message: string, options?: any) => {
    return originalToast.success(message, {
      ...options,
      className: 'success-toast',
    });
  },
  error: (message: string, options?: any) => {
    return originalToast.error(message, {
      ...options,
      className: 'error-toast',
    });
  },
  warning: (message: string, options?: any) => {
    return originalToast.warning(message, {
      ...options,
      className: 'warning-toast',
    });
  },
  info: (message: string, options?: any) => {
    return originalToast.info(message, {
      ...options,
      className: 'info-toast',
    });
  },
  loading: (message: string, options?: any) => {
    return originalToast.loading(message, {
      ...options,
      className: 'loading-toast',
    });
  },
};

export { Toaster, toast }
