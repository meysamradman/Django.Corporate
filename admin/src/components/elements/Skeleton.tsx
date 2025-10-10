import { cn } from "@/core/utils/cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-gray-200 dark:bg-gray-700 rounded-md",
        "min-h-[1rem] min-w-[2rem]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
