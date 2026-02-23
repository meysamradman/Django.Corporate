import type { ComponentProps } from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/core/utils/cn"
import { Spinner } from "@/components/elements/Spinner"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all leading-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 [&_svg]:!stroke-current outline-none focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-[3px] aria-invalid:ring-red-1/20 aria-invalid:border-red-1 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-static-w shadow-xs hover:bg-primary",
        destructive:
          "bg-red-1 text-static-w shadow-xs hover:bg-red-2",
        outline:
          "border bg-wt shadow-xs text-font-s hover:bg-bg",
        link: "text-primary underline-offset-4 hover:text-primary hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-9 rounded-md gap-1.5 px-4 has-[>svg]:px-2.5",
        lg: "h-9 rounded-md px-4 has-[>svg]:px-4",
        xl: "h-9 rounded-md px-4 has-[>svg]:px-6",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    isLoading?: boolean
    loadingText?: string
  }

function Button({
  className,
  variant,
  size,
  asChild = false,
  isLoading = false,
  loadingText,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"
  const baseContent =
    loadingText && isLoading ? (
      <span>{loadingText}</span>
    ) : (
      children
    )

  return (
    <Comp
      data-slot="button"
      className={cn(
        buttonVariants({ variant, size, className }),
        isLoading && "cursor-wait"
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <Spinner className="size-4 animate-spin" aria-hidden="true" />
          {baseContent}
        </span>
      ) : (
        baseContent
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
