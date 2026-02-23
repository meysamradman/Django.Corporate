import type { ComponentProps } from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/core/utils/cn"

function Checkbox({
  className,
  ...props
}: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer border-br data-[state=checked]:bg-primary data-[state=checked]:text-static-w data-[state=checked]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-static-w data-[state=indeterminate]:border-primary focus-visible:border-primary focus-visible:ring-primary/20 aria-invalid:ring-red-1/20 aria-invalid:border-red-1 size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center transition-none"
      >
        <CheckIcon className="size-3.5 text-static-w" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
