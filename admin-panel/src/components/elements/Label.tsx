import type { ComponentProps } from "react"
import * as LabelPrimitive from "@radix-ui/react-label"

import { cn } from "@/core/utils/cn"

function Label({
  className,
  ...props
}: ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "text-sm font-medium text-font-p block",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
