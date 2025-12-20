import { useState, lazy, Suspense, useMemo, useCallback, type ReactNode, type ComponentType } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { Button } from '@/components/elements/Button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/elements/Popover';
import { cn } from '@/core/utils/cn';

const HelpGuideContent = lazy(() => import('./HelpGuideContent').then(m => ({ default: m.HelpGuideContent })));

export interface HelpGuideProps {
    title?: string;
    content: string | ReactNode;
    icon?: ComponentType<{ className?: string }>;
    size?: 'sm' | 'md' | 'lg';
    position?: 'top' | 'bottom' | 'left' | 'right';
    className?: string;
    variant?: 'icon' | 'button' | 'badge';
    buttonText?: string;
}

export function HelpGuide({
    title = 'راهنما',
    content,
    icon: Icon = HelpCircle,
    size = 'md',
    position = 'bottom',
    className,
    variant = 'icon',
    buttonText = 'راهنما',
}: HelpGuideProps) {
    const [isOpen, setIsOpen] = useState(false);

    const iconSizes = useMemo(() => ({
        sm: 'h-3.5 w-3.5',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
    }), []);

    const handleOpenChange = useCallback((open: boolean) => {
        setIsOpen(open);
    }, []);

    return (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                {variant === 'badge' ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleOpenChange(!isOpen);
                        }}
                        className={cn(
                            "inline-flex items-center justify-center",
                            "h-6 w-6 rounded-full",
                            "bg-primary/10 text-primary",
                            "hover:bg-primary/20 hover:scale-110",
                            "transition-all duration-200 ease-out",
                            "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1",
                            "group cursor-pointer border border-primary/20",
                            "relative",
                            className
                        )}
                        aria-label="نمایش راهنما"
                    >
                        <Icon className={cn(iconSizes.sm, "group-hover:scale-110 transition-transform")} />
                        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-primary rounded-full border border-card" />
                    </button>
                ) : variant === 'icon' ? (
                    <button
                        onClick={() => handleOpenChange(!isOpen)}
                        className={cn(
                            "relative inline-flex items-center justify-center",
                            "text-font-s hover:text-primary transition-colors duration-200",
                            "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 rounded-md",
                            "cursor-pointer",
                            "p-1.5 hover:bg-bg/50 rounded-md",
                            className
                        )}
                        aria-label="نمایش راهنما"
                    >
                        <Icon className={iconSizes[size]} />
                    </button>
                ) : (
                    <Button
                        onClick={() => handleOpenChange(!isOpen)}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                    >
                        <Icon className={iconSizes.md} />
                        {buttonText}
                    </Button>
                )}
            </PopoverTrigger>
            
            <PopoverContent
                side={position}
                align="start"
                sideOffset={8}
                className={cn(
                    "w-80 max-w-[90vw] p-0",
                    "!rounded-xl !border !border-br",
                    "shadow-[rgb(0_0_0/2%)_0px_6px_24px_0px,rgb(0_0_0/2%)_0px_0px_0px_1px]",
                    "!z-[101]"
                )}
                dir="rtl"
            >
                <div className="flex items-center justify-between p-4 border-b border-br bg-bg/30 rounded-t-xl">
                    <h3 className="text-sm font-semibold text-font-p text-right flex-1">
                        {title}
                    </h3>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleOpenChange(false)}
                        className="h-7 w-7 border-0 hover:bg-bg/50 rounded-md"
                        aria-label="بستن"
                    >
                        <X className="h-3.5 w-3.5 text-font-s" />
                    </Button>
                </div>
                <div className="p-4 max-h-[400px] overflow-y-auto text-right bg-card rounded-b-xl">
                    <Suspense
                        fallback={
                            <div className="flex items-center justify-center py-8">
                                <div className="text-sm text-font-s text-right">در حال بارگذاری...</div>
                            </div>
                        }
                    >
                        <HelpGuideContent content={content} />
                    </Suspense>
                </div>
            </PopoverContent>
        </Popover>
    );
}

