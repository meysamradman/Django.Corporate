import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/elements/Tooltip';
import { cn } from '@/core/utils/cn';

interface TruncatedTextProps {
  text: string;
  maxLength?: number;
  className?: string;
  showTooltip?: boolean;
}

export function TruncatedText({ 
  text, 
  maxLength = 30, 
  className,
  showTooltip = true 
}: TruncatedTextProps) {
  const isTruncated = text.length > maxLength;
  const displayText = isTruncated ? `${text.slice(0, maxLength)}...` : text;
  
  if (!showTooltip) {
    return (
      <span className={cn("truncate block min-w-0 w-full", className)} title={isTruncated ? text : undefined}>
        {displayText}
      </span>
    );
  }
  if (isTruncated) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("truncate cursor-help block min-w-0 w-full", className)}>
            {displayText}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs wrap-break-word">
          <p className="text-xs">{text}</p>
        </TooltipContent>
      </Tooltip>
    );
  }
  return (
    <span className={cn("truncate block min-w-0 w-full", className)}>
      {displayText}
    </span>
  );
}

