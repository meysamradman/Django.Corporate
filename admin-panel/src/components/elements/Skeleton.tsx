import type { ComponentProps } from "react"
import { cn } from "@/core/utils/cn"

function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-gray rounded-md",
        "min-h-[1rem] min-w-[2rem]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
