import type { HTMLAttributes } from 'react';
import { cn } from "@/core/utils/cn"

interface LoaderProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Size of the loading dots
   * @default "default"
   */
  size?: "sm" | "default" | "lg"
  /**
   * Custom color variant
   * @default "primary"
   */
  variant?: "primary" | "secondary" | "muted"
}

function Loader({ 
  className,
  size = "default",
  variant = "primary",
  ...props 
}: LoaderProps) {
  const sizeClasses = {
    sm: "w-2 h-2",
    default: "w-2.5 h-2.5",
    lg: "w-3 h-3"
  }

  const variantClasses = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    muted: "bg-muted-foreground"
  }

  return (
    <div 
      role="status"
      aria-label="Loading"
      className={cn("flex items-center justify-center py-4", className)}
      {...props}
    >
      <div className="flex gap-1" aria-hidden="true">
        <div 
          className={cn(
            "rounded-full animate-bounce [animation-duration:0.6s]",
            sizeClasses[size],
            variantClasses[variant]
          )} 
        />
        <div 
          className={cn(
            "rounded-full animate-bounce [animation-delay:-0.3s] [animation-duration:0.6s]",
            sizeClasses[size],
            variantClasses[variant]
          )} 
        />
        <div 
          className={cn(
            "rounded-full animate-bounce [animation-delay:-0.5s] [animation-duration:0.6s]",
            sizeClasses[size],
            variantClasses[variant]
          )} 
        />
      </div>
    </div>
  );
}

export { Loader }