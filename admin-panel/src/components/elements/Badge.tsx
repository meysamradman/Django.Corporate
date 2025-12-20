import type { ComponentProps } from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/core/utils/cn"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-sm border px-2 py-0.5 text-xs font-medium leading-[normal] w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-[3px] aria-invalid:ring-red-1/20 aria-invalid:border-red-1 transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-static-w",
        outline:
          "text-font-p",
        red:
          "border-red bg-red text-red-2",
        green:
          "border-green bg-green text-green-2",
        yellow:
          "border-yellow bg-yellow text-yellow-2",
        blue:
          "border-blue bg-blue text-blue-2",
        gray:
          "border-gray bg-gray text-gray-2",
        purple:
          "border-purple bg-purple text-purple-2",
        orange:
          "border-orange bg-orange text-orange-2",
        pink:
          "border-pink bg-pink text-pink-2",
        teal:
          "border-teal bg-teal text-teal-2",
        indigo:
          "border-indigo bg-indigo text-indigo-2",
        amber:
          "border-amber bg-amber text-amber-2",
        emerald:
          "border-emerald bg-emerald text-emerald-2",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
