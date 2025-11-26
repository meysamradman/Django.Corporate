import {
  Card,
  CardContent,
} from "@/components/elements/Card";
import { Skeleton } from "@/components/elements/Skeleton";
import React from "react";
import { formatNumber } from "@/core/utils/format";
import { cn } from "@/core/utils/cn";

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: number;
  iconColorClass: string;
  bgColorClass: string;
  borderColorClass: string;
  loading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  icon: Icon, 
  title, 
  value, 
  iconColorClass, 
  bgColorClass, 
  borderColorClass,
  loading = false 
}) => {
  return (
    <Card className={cn("border-b-4 shadow-sm overflow-hidden", borderColorClass)}>
      <CardContent className="p-4 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between">
          <div className="text-3xl font-bold">
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              formatNumber(value)
            )}
          </div>
          <div className={cn("p-3 rounded-lg", bgColorClass)}>
            <Icon className={cn("h-6 w-6", iconColorClass)} />
          </div>
        </div>
        <div className="mt-2">
          {loading ? (
            <Skeleton className="h-6 w-24" />
          ) : (
            <p className="text-base font-medium">{title}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 