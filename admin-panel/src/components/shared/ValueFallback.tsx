import { Badge } from "@/components/elements/Badge";
import { cn } from "@/core/utils/cn";

interface ValueFallbackProps {
    value?: any;
    fallback?: string;
    className?: string;
}

/**
 * A professional fallback component for missing data fields.
 * Replaces loud "Not Entered" text with a subtle, premium-styled indicator.
 */
export function ValueFallback({ value, fallback = "تعیین نشده", className }: ValueFallbackProps) {
    if (value !== null && value !== undefined && value !== "") {
        return <span className={className}>{value}</span>;
    }

    return (
        <Badge
            variant="outline"
            className={cn(
                "h-5 px-2 text-[10px] font-bold border-br/40 bg-bg/30 text-font-s/40 italic rounded-md",
                className
            )}
        >
            {fallback}
        </Badge>
    );
}
