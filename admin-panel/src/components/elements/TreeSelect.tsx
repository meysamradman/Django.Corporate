import * as React from "react"
import { Check, ChevronsUpDown, Folder, FolderOpen } from "lucide-react"

import { cn } from "@/core/utils/cn"
import { Button } from "@/components/elements/Button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/elements/Command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/elements/Popover"

export interface TreeSelectItem {
    id: string | number
    name: string
    parent_id?: string | number | null
    level?: number | null
    [key: string]: any
}

interface TreeSelectProps {
    data: TreeSelectItem[]
    value?: string | number | null
    onChange: (value: string | null) => void
    placeholder?: string
    searchPlaceholder?: string
    emptyText?: string
    className?: string
    dir?: "rtl" | "ltr"
}

export function TreeSelect({
    data,
    value,
    onChange,
    placeholder = "انتخاب کنید...",
    searchPlaceholder = "جستجو...",
    emptyText = "موردی یافت نشد.",
    className,
    dir = "rtl",
}: TreeSelectProps) {
    const [open, setOpen] = React.useState(false)

    const selectedItem = React.useMemo(() =>
        value ? data.find((item) => String(item.id) === String(value)) : null
        , [data, value])

    const handleSelect = (currentValue: string) => {
        if (currentValue === "null") {
            onChange(null)
        } else {
            onChange(currentValue)
        }
        setOpen(false)
    }

    const renderItem = (item: TreeSelectItem) => {
        const level = item.level || 1
        const isSelected = String(value) === String(item.id)
        const Icon = level === 1 ? FolderOpen : Folder

        const indentStyle = {
            paddingRight: dir === 'rtl' ? `${(level - 1) * 1.5}rem` : 0,
            paddingLeft: dir === 'ltr' ? `${(level - 1) * 1.5}rem` : 0
        }

        return (
            <CommandItem
                key={item.id}
                value={String(item.id)}
                keywords={[item.name]}
                onSelect={handleSelect}
                className={cn(
                    "flex items-center gap-2 cursor-pointer w-full py-2.5", // Added slightly more padding for touch targets
                    dir === "rtl" ? "text-right" : "text-left",
                    "px-2"
                )}
            >
                <div
                    className="flex items-center gap-2 flex-1 min-w-0"
                    style={indentStyle}
                >
                    {level > 1 && (
                        <div className="flex gap-1 shrink-0 text-border select-none opacity-50">
                            <span className="is-rtl:-scale-x-100">└</span>
                        </div>
                    )}

                    <Icon
                        className={cn(
                            "w-4 h-4 shrink-0 transition-colors",
                            isSelected ? "text-primary fill-primary/10" : "text-font-s"
                        )}
                    />

                    <span className={cn("truncate flex-1 font-normal", isSelected && "font-medium text-primary")}>
                        {item.name}
                    </span>

                    {isSelected && (
                        <Check
                            className={cn(
                                "mr-2 h-4 w-4 text-primary shrink-0",
                                dir === 'rtl' ? "mr-auto ml-0" : "ml-auto mr-0"
                            )}
                        />
                    )}
                </div>
            </CommandItem>
        )
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between font-normal px-3 bg-card hover:bg-bg/50", !value && "text-muted-foreground", className)}
                >
                    {selectedItem ? (
                        <div className="flex items-center gap-2 w-full min-w-0">
                            <span className="truncate flex-1 text-start">
                                <span className="text-muted-foreground/50 mx-1 inline-block align-middle">
                                    {(selectedItem.level || 1) === 1 ? <FolderOpen className="w-3.5 h-3.5" /> : <Folder className="w-3.5 h-3.5" />}
                                </span>
                                {selectedItem.name}
                            </span>
                        </div>
                    ) : (
                        placeholder
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command dir={dir} className="w-full">
                    <CommandInput placeholder={searchPlaceholder} className="text-start" />

                    <CommandList className={cn(
                        "max-h-[400px] overflow-y-auto overflow-x-hidden",
                        "scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent" // If you have custom scrollbar plugins
                    )}>
                        <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">{emptyText}</CommandEmpty>
                        <CommandGroup>
                            <CommandItem
                                value="null"
                                keywords={["بدون والد", "mother", "مادر", "root"]}
                                onSelect={() => handleSelect("null")}
                                className={cn(
                                    "flex items-center gap-2 cursor-pointer font-medium mb-1",
                                    "text-font-p hover:bg-bg"
                                )}
                            >
                                <div className="flex items-center gap-2 flex-1 w-full p-1">
                                    <span className="truncate">بدون والد (دسته‌بندی مادر)</span>
                                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full whitespace-nowrap">پیش‌فرض</span>
                                </div>
                                <Check
                                    className={cn(
                                        "h-4 w-4 text-primary shrink-0",
                                        dir === 'rtl' ? "mr-auto ml-0" : "ml-auto mr-0",
                                        value === null || value === "null" ? "opacity-100" : "opacity-0"
                                    )}
                                />
                            </CommandItem>

                            {data.map((item) => renderItem(item))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
