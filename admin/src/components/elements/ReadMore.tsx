"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/elements/Button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/core/utils/cn";

interface ReadMoreProps {
  content: string;
  maxHeight?: string;
  className?: string;
  isHTML?: boolean;
  defaultOpen?: boolean;
}

export function ReadMore({ 
  content, 
  maxHeight = "200px", 
  className,
  isHTML = false,
  defaultOpen = false 
}: ReadMoreProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [needsReadMore, setNeedsReadMore] = useState(false);
  const [contentHeight, setContentHeight] = useState<string>("auto");
  const innerRef = useRef<HTMLDivElement>(null);

  const maxHeightNum = useMemo(() => {
    return parseInt(maxHeight.replace('px', '')) || 200;
  }, [maxHeight]);

  const checkHeight = useCallback(() => {
    if (innerRef.current) {
      const height = innerRef.current.scrollHeight;
      const needsMore = height > maxHeightNum;
      setNeedsReadMore(needsMore);
      if (needsMore) {
        setContentHeight(`${height}px`);
      }
    }
  }, [maxHeightNum]);

  useEffect(() => {
    checkHeight();
    const timer = setTimeout(checkHeight, 100);
    window.addEventListener('resize', checkHeight);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkHeight);
    };
  }, [content, checkHeight]);

  const renderContent = () => {
    if (isHTML) {
      return (
        <div
          className={cn(
            "prose prose-sm max-w-none prose-headings:font-semibold prose-p:leading-relaxed prose-a:text-primary text-base text-font-p",
            className
          )}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }
    return (
      <div className={cn("text-base text-font-p leading-relaxed", className)}>
        {content}
      </div>
    );
  };

  if (!content || content.trim() === "") {
    return (
      <div className={cn("text-font-s", className)}>
        محتوایی وجود ندارد
      </div>
    );
  }

  if (!needsReadMore) {
    return (
      <div className={cn(className)}>
        <div ref={innerRef}>{renderContent()}</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <div
          className="overflow-hidden transition-[height] duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{
            height: isOpen ? contentHeight : `${maxHeightNum}px`
          }}
        >
          <div ref={innerRef}>{renderContent()}</div>
        </div>
        
        {!isOpen && (
          <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-bg via-bg/95 via-bg/85 via-bg/50 via-bg/20 to-transparent pointer-events-none transition-opacity duration-500" />
        )}
      </div>

      <Button
        variant="link"
        onClick={() => setIsOpen(!isOpen)}
        className="text-primary hover:text-primary/80 font-medium px-0 transition-all duration-300 hover:gap-1"
        size="sm"
      >
        {isOpen ? (
          <>
            نمایش کمتر
            <ChevronUp className="w-4 h-4 me-2 transition-transform duration-300" />
          </>
        ) : (
          <>
            ادامه مطلب
            <ChevronDown className="w-4 h-4 me-2 transition-transform duration-300" />
          </>
        )}
      </Button>
    </div>
  );
}

