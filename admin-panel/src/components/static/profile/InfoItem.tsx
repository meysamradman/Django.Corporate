import { cn } from "@/core/utils/cn";
import { type LucideIcon } from "lucide-react";

interface InfoItemProps {
  label: string;
  value?: string | number | null;
  dir?: "rtl" | "ltr";
  className?: string;
  valueClassName?: string;
  icon?: LucideIcon;
}

export function InfoItem({ label, value, dir = "rtl", className, valueClassName, icon: Icon }: InfoItemProps) {
  return (
    <div className={cn(
      "group relative flex items-start gap-4 rounded-xl border border-br/60 bg-card p-4 transition-all duration-300 hover:border-primary/20 hover:bg-card-2/50 hover:shadow-sm",
      className
    )}>
      {Icon && (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary ring-1 ring-primary/10 transition-colors group-hover:bg-primary/10">
          <Icon className="size-5" />
        </div>
      )}
      <div className="flex flex-1 flex-col justify-center gap-1.5 min-w-0">
        <span className="text-xs font-medium text-font-s/80 select-none group-hover:text-primary/80 transition-colors">
          {label}
        </span>
        <p 
          className={cn(
            "text-sm font-bold text-font-p truncate leading-relaxed",
            dir === "ltr" ? "text-left font-mono tracking-wide" : "",
            valueClassName
          )}
        >
          {value || "---"}
        </p>
      </div>
      
      {/* Subtle hover effect indicator */}
      <div className="absolute inset-y-0 right-0 w-0.5 scale-y-0 rounded-l-full bg-primary transition-transform duration-300 group-hover:scale-y-75" />
    </div>
  );
}
