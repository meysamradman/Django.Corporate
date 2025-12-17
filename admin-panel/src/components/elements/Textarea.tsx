import * as React from "react"

import { cn } from "@/core/utils/cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      dir="rtl"
      className={cn(
        "border-br placeholder:text-font-s focus-visible:border-primary focus-visible:ring-primary/20 aria-invalid:ring-red-1/20 aria-invalid:border-red-1 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-start",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
