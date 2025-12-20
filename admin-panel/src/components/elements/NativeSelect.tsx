import type { ComponentProps } from "react"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/core/utils/cn"

function NativeSelect({ className, ...props }: ComponentProps<"select">) {
  return (
    <div
      className="group/native-select relative w-full min-w-[150px] has-[select:disabled]:opacity-50"
      data-slot="native-select-wrapper"
    >
      <select
        data-slot="native-select"
        dir="rtl"
        className={cn(
          "border-br placeholder:text-font-s selection:bg-primary selection:text-static-w h-9 w-full appearance-none rounded-md border bg-card px-3 pl-10 text-sm text-font-p shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed text-right",
          "focus-visible:border-br focus-visible:ring-primary/20 focus-visible:ring-[3px]",
          "aria-invalid:ring-red-1/20 aria-invalid:border-red-1",
          className
        )}
        {...props}
      />
      <ChevronDownIcon
        className="text-font-s pointer-events-none absolute inset-y-0 left-3 size-4 my-auto opacity-60 select-none"
        aria-hidden="true"
        data-slot="native-select-icon"
      />
    </div>
  )
}

function NativeSelectOption({ ...props }: ComponentProps<"option">) {
  return <option data-slot="native-select-option" {...props} />
}

function NativeSelectOptGroup({
  className,
  ...props
}: ComponentProps<"optgroup">) {
  return (
    <optgroup
      data-slot="native-select-optgroup"
      className={cn(className)}
      {...props}
    />
  )
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption }
