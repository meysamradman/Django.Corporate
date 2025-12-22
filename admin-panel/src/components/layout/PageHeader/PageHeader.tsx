import { memo, type ReactNode } from 'react';
import { cn } from '@/core/utils/cn';

export interface PageHeaderProps {
  title: string | ReactNode;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export const PageHeader = memo<PageHeaderProps>(({
  title,
  description,
  children,
  className
}) => {

  return (
    <div className={cn(
      "sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4",
      "bg-wt dark:bg-gray-2",
      "-mt-4 -mx-4 px-4 py-4 sm:-mt-6 sm:-mx-6 sm:px-6 lg:-mt-8 lg:-mx-8 lg:px-8",
      "border-b border-br transition-all duration-200 mb-6",
      className
    )}>
      <div className="space-y-1">
        <h1 className="page-title">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-font-s">
            {description}
          </p>
        )}
      </div>

      {children && (
        <div className="flex items-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
});

PageHeader.displayName = 'PageHeader';
