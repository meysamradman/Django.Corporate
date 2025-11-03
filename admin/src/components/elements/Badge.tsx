import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/core/utils/cn"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-sm border px-2 py-0.5 text-xs font-medium leading-[normal] w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        outline:
          "text-foreground",
        green:
          "border-green-100 bg-green-50 text-green-600",
        red:
          "border-red-100 bg-red-50 text-red-600",
        yellow:
          "border-yellow-100 bg-yellow-50 text-yellow-600",
        violet:
          "border-violet-100 bg-violet-50 text-violet-600",
        blue:
          "border-blue-100 bg-blue-50 text-blue-600",
        gray:
          "border-gray-100 bg-gray-50 text-gray-600",
        indigo:
          "border-indigo-100 bg-indigo-50 text-indigo-600",
        emerald:
          "border-emerald-100 bg-emerald-50 text-emerald-600",
        teal:
          "border-teal-100 bg-teal-50 text-teal-600",
        purple:
          "border-purple-100 bg-purple-50 text-purple-600",
        amber:
          "border-amber-100 bg-amber-50 text-amber-600",
        sky:
          "border-sky-100 bg-sky-50 text-sky-600",
        fuchsia:
          "border-fuchsia-100 bg-fuchsia-50 text-fuchsia-600",
        slate:
          "border-slate-100 bg-slate-50 text-slate-600",
        rose:
          "border-rose-100 bg-rose-50 text-rose-600",
        lime:
          "border-lime-100 bg-lime-50 text-lime-600",
        cyan:
          "border-cyan-100 bg-cyan-50 text-cyan-600",
        zinc:
          "border-zinc-100 bg-zinc-50 text-zinc-600",
        orange:
          "border-orange-100 bg-orange-50 text-orange-600",
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
}: React.ComponentProps<"span"> &
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
