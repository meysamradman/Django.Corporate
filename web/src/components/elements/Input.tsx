import * as React from "react"

import { cn } from "@/core/utils/cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-font-p placeholder:text-font-s selection:bg-primary selection:text-static-w bg-card border-br h-12 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-[3px]",
        "aria-invalid:ring-red-1/20 aria-invalid:border-red-1",
        className
      )}
      {...props}
    />
  )
}

export { Input }
