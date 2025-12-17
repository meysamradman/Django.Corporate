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
  
  if (!showTooltip) {
    return (
      <span className={cn("truncate block min-w-0 w-full", className)} title={isTruncated ? text : undefined}>
        {text}
      </span>
    );
  }
  if (isTruncated) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("truncate cursor-help block min-w-0 w-full", className)}>
            {text}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs break-words">
          <p className="text-xs">{text}</p>
        </TooltipContent>
      </Tooltip>
    );
  }
  return (
    <span className={cn("truncate block min-w-0 w-full", className)}>
      {text}
    </span>
  );
}

