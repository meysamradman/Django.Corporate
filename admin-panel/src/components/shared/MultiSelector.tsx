import { X, Plus } from "lucide-react";
import { cn } from "@/core/utils/cn";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/elements/Select";
import { Label } from "@/components/elements/Label";
import { Button } from "@/components/elements/Button";
import type { ReactNode } from "react";

export interface MultiSelectorItem {
    id: number | string;
    title: string;
}

interface MultiSelectorProps<T extends MultiSelectorItem> {
    label: string;
    icon?: ReactNode;
    iconBgColor?: string; // Kept for backward compatibility if needed, though we use theme now
    items: T[];
    selectedItems: T[];
    onToggle: (item: T) => void;
    onRemove: (id: number | string) => void;
    onAdd?: () => void;
    loading?: boolean;
    disabled?: boolean;
    placeholder?: string;
    colorTheme?: "purple" | "indigo" | "teal" | "blue" | "green" | "orange" | "red" | "gray";
    className?: string;
}

const colorStyles = {
    purple: {
        bg: "bg-purple",
        text: "text-purple-2",
        iconBg: "bg-purple",
        iconStroke: "stroke-purple-2",
        chipBg: "bg-purple",
        chipText: "text-purple-2",
        dot: "bg-purple-2",
        shadow: "shadow-[0_0_5px_rgba(107,33,168,0.7)]",
        addButtonBorder: "border-purple-1",
        addButtonText: "text-purple-2",
        addButtonHover: "hover:bg-purple",
    },
    indigo: {
        bg: "bg-indigo",
        text: "text-indigo-2",
        iconBg: "bg-indigo",
        iconStroke: "stroke-indigo-2",
        chipBg: "bg-indigo",
        chipText: "text-indigo-2",
        dot: "bg-indigo-2",
        shadow: "shadow-[0_0_5px_rgba(55,48,163,0.7)]",
        addButtonBorder: "border-indigo-1",
        addButtonText: "text-indigo-2",
        addButtonHover: "hover:bg-indigo",
    },
    teal: {
        bg: "bg-teal",
        text: "text-teal-2",
        iconBg: "bg-teal",
        iconStroke: "stroke-teal-2",
        chipBg: "bg-teal",
        chipText: "text-teal-2",
        dot: "bg-teal-2",
        shadow: "shadow-[0_0_5px_rgba(13,148,136,0.7)]",
        addButtonBorder: "border-teal-1",
        addButtonText: "text-teal-2",
        addButtonHover: "hover:bg-teal",
    },
    blue: {
        bg: "bg-blue",
        text: "text-blue-2",
        iconBg: "bg-blue",
        iconStroke: "stroke-blue-2",
        chipBg: "bg-blue",
        chipText: "text-blue-2",
        dot: "bg-blue-2",
        shadow: "shadow-sm",
        addButtonBorder: "border-blue-1",
        addButtonText: "text-blue-2",
        addButtonHover: "hover:bg-blue",
    },
    green: {
        bg: "bg-green",
        text: "text-green-2",
        iconBg: "bg-green",
        iconStroke: "stroke-green-2",
        chipBg: "bg-green",
        chipText: "text-green-2",
        dot: "bg-green-2",
        shadow: "shadow-sm",
        addButtonBorder: "border-green-1",
        addButtonText: "text-green-2",
        addButtonHover: "hover:bg-green",
    },
    orange: {
        bg: "bg-orange",
        text: "text-orange-2",
        iconBg: "bg-orange",
        iconStroke: "stroke-orange-2",
        chipBg: "bg-orange",
        chipText: "text-orange-2",
        dot: "bg-orange-2",
        shadow: "shadow-sm",
        addButtonBorder: "border-orange-1",
        addButtonText: "text-orange-2",
        addButtonHover: "hover:bg-orange",
    },
    red: {
        bg: "bg-red",
        text: "text-red-2",
        iconBg: "bg-red",
        iconStroke: "stroke-red-2",
        chipBg: "bg-red",
        chipText: "text-red-2",
        dot: "bg-red-2",
        shadow: "shadow-sm",
        addButtonBorder: "border-red-1",
        addButtonText: "text-red-2",
        addButtonHover: "hover:bg-red",
    },
    gray: {
        bg: "bg-gray",
        text: "text-gray-2",
        iconBg: "bg-gray",
        iconStroke: "stroke-gray-2",
        chipBg: "bg-gray",
        chipText: "text-gray-2",
        dot: "bg-gray-2",
        shadow: "shadow-sm",
        addButtonBorder: "border-gray-2",
        addButtonText: "text-gray-2",
        addButtonHover: "hover:bg-gray",
    },
};

export function MultiSelector<T extends MultiSelectorItem>({
    label,
    icon,
    items,
    selectedItems,
    onToggle,
    onRemove,
    onAdd,
    loading = false,
    disabled = false,
    placeholder = "Select...",
    colorTheme = "gray",
    className,
}: MultiSelectorProps<T>) {
    const styles = colorStyles[colorTheme] || colorStyles.gray;

    return (
        <div className={cn("space-y-2", className)}>
            <div className="flex items-center gap-2">
                {icon && (
                    <div className={cn("p-1.5 rounded-lg", styles.iconBg)}>
                        {icon}
                    </div>
                )}
                <Label>{label}</Label>
            </div>
            <div className="space-y-2">
                {selectedItems.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {selectedItems.map((item) => (
                            <span
                                key={item.id}
                                className={cn(
                                    "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition hover:shadow-sm",
                                    styles.chipBg,
                                    styles.chipText
                                )}
                            >
                                {item.title}
                                <button
                                    type="button"
                                    className={cn("cursor-pointer hover:opacity-75", styles.chipText)}
                                    title="حذف"
                                    onClick={() => onRemove(item.id)}
                                    disabled={disabled}
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                <div className="flex gap-2">
                    <Select
                        disabled={disabled || loading}
                        onValueChange={(value) => {
                            const item = items.find((i) => String(i.id) === value);
                            if (item) onToggle(item);
                        }}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={loading ? "در حال بارگذاری..." : placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                            {items.map((item) => {
                                const isSelected = selectedItems.some((i) => i.id === item.id);
                                return (
                                    <SelectItem
                                        key={item.id}
                                        value={String(item.id)}
                                        disabled={isSelected}
                                        className={cn(isSelected && "opacity-70")}
                                    >
                                        <div className="flex items-center justify-between w-full gap-2">
                                            <span>{item.title}</span>
                                            {isSelected && (
                                                <span className="inline-flex items-center">
                                                    <span
                                                        className={cn(
                                                            "w-1.5 h-1.5 rounded-full",
                                                            styles.dot,
                                                            styles.shadow
                                                        )}
                                                    />
                                                </span>
                                            )}
                                        </div>
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                    {onAdd && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={cn("shrink-0", styles.addButtonBorder, styles.addButtonText, styles.addButtonHover)}
                            onClick={onAdd}
                            disabled={disabled}
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
