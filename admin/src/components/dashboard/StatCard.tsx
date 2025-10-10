import {
  Card,
  CardContent,
} from "@/components/elements/Card";
import { Skeleton } from "@/components/elements/Skeleton";
import React from "react";
import { formatNumber } from "@/core/utils/format";

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: number;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  loading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  icon: Icon, 
  title, 
  value, 
  iconColor, 
  bgColor, 
  borderColor,
  loading = false 
}) => {
  return (
    <Card className="border-0 border-b-4 shadow-sm" style={{ borderBottomColor: borderColor }}>
      <CardContent className="p-4 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between">
          <div className="text-3xl font-bold">
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              formatNumber(value)
            )}
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: bgColor }}>
            <Icon className="h-6 w-6" style={{ color: iconColor }} />
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