"use client";

import { CustomTooltip, CustomTooltipContent, CustomTooltipTrigger } from '@/components/elements/Tooltip';
import { cn } from '@/core/utils/cn';

interface TruncatedTextProps {
  text: string;
  maxLength?: number;
  className?: string;
  showTooltip?: boolean;
}

/**
 * Component برای نمایش متن طولانی با Tooltip
 * سریع و بدون overhead - فقط CSS
 */
export function TruncatedText({ 
  text, 
  maxLength = 30, 
  className,
  showTooltip = true 
}: TruncatedTextProps) {
  const isTruncated = text.length > maxLength;
  
  // همیشه truncate CSS را اعمال می‌کنیم تا در inspect هم کار کند
  if (!showTooltip) {
    return (
      <span className={cn("truncate block min-w-0 w-full", className)} title={isTruncated ? text : undefined}>
        {text}
      </span>
    );
  }

  // با Tooltip - فقط اگر متن طولانی‌تر از maxLength باشد
  if (isTruncated) {
    return (
      <CustomTooltip>
        <CustomTooltipTrigger asChild>
          <span className={cn("truncate cursor-help block min-w-0 w-full", className)}>
            {text}
          </span>
        </CustomTooltipTrigger>
        <CustomTooltipContent side="top" className="max-w-xs break-words">
          <p className="text-xs">{text}</p>
        </CustomTooltipContent>
      </CustomTooltip>
    );
  }

  // اگر کوتاه بود، فقط truncate CSS (بدون tooltip)
  return (
    <span className={cn("truncate block min-w-0 w-full", className)}>
      {text}
    </span>
  );
}

