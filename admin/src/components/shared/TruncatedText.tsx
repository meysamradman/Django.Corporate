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
  
  // اگر کوتاه بود، مستقیم نمایش بده
  if (!isTruncated) {
    return <span className={className}>{text}</span>;
  }

  // اگر Tooltip نمی‌خوایم، فقط truncate با CSS
  if (!showTooltip) {
    return (
      <span className={cn("truncate block", className)} title={text}>
        {text}
      </span>
    );
  }

  // با Tooltip برای نمایش کامل
  return (
    <CustomTooltip>
      <CustomTooltipTrigger asChild>
        <span className={cn("truncate cursor-help inline-block", className)}>
          {text}
        </span>
      </CustomTooltipTrigger>
      <CustomTooltipContent side="top" className="max-w-xs break-words">
        <p className="text-xs">{text}</p>
      </CustomTooltipContent>
    </CustomTooltip>
  );
}

