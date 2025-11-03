"use client";

import React from "react";
import { Badge } from "@/components/elements/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";

const badgeVariants = [
  { name: "default", label: "Default", description: "رنگ پیش‌فرض (Primary)", category: "basic" },
  { name: "outline", label: "Outline", description: "فقط حاشیه", category: "basic" },
  
  // Primary Colors
  { name: "green", label: "Green", description: "سبز - موفقیت/تأیید", category: "primary" },
  { name: "blue", label: "Blue", description: "آبی - اعتماد/اطلاعات", category: "primary" },
  { name: "red", label: "Red", description: "قرمز - خطا/هشدار", category: "primary" },
  { name: "yellow", label: "Yellow", description: "زرد - هشدار/توجه", category: "primary" },
  { name: "orange", label: "Orange", description: "نارنجی - انرژی/فعالیت", category: "primary" },
  
  // Purple Variants
  { name: "violet", label: "Violet", description: "بنفش روشن - خلاقیت", category: "purple" },
  { name: "purple", label: "Purple", description: "بنفش - لوکس/ویژه", category: "purple" },
  { name: "indigo", label: "Indigo", description: "بنفش تیره - حرفه‌ای", category: "purple" },
  { name: "fuchsia", label: "Fuchsia", description: "صورتی روشن - جذاب", category: "purple" },
  
  // Green Variants
  { name: "emerald", label: "Emerald", description: "سبز زمردی - طبیعی", category: "green" },
  { name: "teal", label: "Teal", description: "آبی-سبز - تازگی", category: "green" },
  { name: "lime", label: "Lime", description: "سبز لیمویی - روشن", category: "green" },
  
  // Blue Variants
  { name: "sky", label: "Sky", description: "آسمانی - آرام", category: "blue" },
  { name: "cyan", label: "Cyan", description: "فیروزه‌ای - تازه", category: "blue" },
  
  // Neutral
  { name: "gray", label: "Gray", description: "خاکستری - خنثی", category: "neutral" },
  { name: "slate", label: "Slate", description: "سنگ لوح - خنثی تیره", category: "neutral" },
  { name: "zinc", label: "Zinc", description: "روی - خنثی روشن", category: "neutral" },
  
  // Warm Colors
  { name: "amber", label: "Amber", description: "کهربایی - گرم", category: "warm" },
  { name: "rose", label: "Rose", description: "گل‌رز - نرم", category: "warm" },
] as const;

const categoryLabels: Record<string, string> = {
  basic: "رنگ‌های پایه",
  primary: "رنگ‌های اصلی",
  purple: "خانواده بنفش",
  green: "خانواده سبز",
  blue: "خانواده آبی",
  neutral: "رنگ‌های خنثی",
  warm: "رنگ‌های گرم",
};

export default function BadgesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">صفحه تست Badge ها</h1>
        <p className="text-muted-foreground mt-2">
          تمام variant های Badge با رنگ‌های مختلف
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تمام Badge Variants ({badgeVariants.length} عدد)</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            تمام variant ها با پشتیبانی کامل از Dark Mode
          </p>
        </CardHeader>
        <CardContent>
          {Object.keys(categoryLabels).map((category) => {
            const variantsInCategory = badgeVariants.filter(
              (v) => v.category === category
            );
            if (variantsInCategory.length === 0) return null;

            return (
              <div key={category} className="mb-8 last:mb-0">
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b">
                  {categoryLabels[category]}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {variantsInCategory.map((variant) => (
                    <div
                      key={variant.name}
                      className="flex flex-col gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <h4 className="font-semibold text-base mb-1">
                          {variant.label}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {variant.description}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={variant.name as any}>
                          {variant.label}
                        </Badge>
                        <Badge variant={variant.name as any}>
                          {variant.name}
                        </Badge>
                        <Badge variant={variant.name as any}>
                          مثال
                        </Badge>
                        <Badge variant={variant.name as any}>
                          12
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono p-2 bg-muted rounded border">
                        variant="{variant.name}"
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Badge های استفاده شده در Portfolio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">وضعیت‌های نمونه کار</h3>
            <div className="flex flex-wrap gap-3">
              <Badge variant="green">منتشر شده</Badge>
              <Badge variant="yellow">پیش‌نویس</Badge>
              <Badge variant="blue">فعال</Badge>
              <Badge variant="red">غیرفعال</Badge>
              <Badge variant="amber">ویژه</Badge>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">کارت‌های اطلاعات</h3>
            <div className="flex flex-wrap gap-3">
              <Badge variant="teal">دسته‌بندی‌ها</Badge>
              <Badge variant="fuchsia">تگ‌ها</Badge>
              <Badge variant="indigo">رسانه‌ها</Badge>
              <Badge variant="amber">گزینه‌ها</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
