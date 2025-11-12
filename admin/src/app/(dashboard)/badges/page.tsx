"use client";

import React from "react";
import { Badge } from "@/components/elements/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { colorPaletteShowcase, type ColorPaletteItem, type ColorScheme } from "./palette-data";
import { CheckCircle2, Sparkles, Star, ShieldCheck, Rocket, Flame, Award } from "lucide-react";

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
  const paletteIcons = [CheckCircle2, Sparkles, Star, ShieldCheck, Rocket, Flame, Award];
  const colorModes: Array<{ key: keyof ColorPaletteItem["colors"]; title: string }> = [
    { key: "light", title: "Light" },
    { key: "dark", title: "Dark" },
  ];
  const swatchKeys: Array<keyof ColorScheme> = ["surface", "accent", "iconBg", "border", "text", "mutedText", "highlight"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">صفحه تست Badge ها</h1>
        <p className="text-font-s mt-2">
          تمام variant های Badge با رنگ‌های مختلف
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>پروپوزال پالت رنگی برای Badge و کارت‌ها</CardTitle>
          <p className="text-sm text-font-s mt-1">
            ترکیب‌های پیشنهادی شامل رنگ سطح، حاشیه، آیکون و Badge جهت انتخاب نهایی و هماهنگی با Dark Mode اختصاصی.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {colorPaletteShowcase.map((palette, index) => {
              const Icon = paletteIcons[index % paletteIcons.length];
              const light = palette.colors.light;
              return (
                <div
                  key={palette.name}
                  className="flex flex-col gap-6 rounded-3xl border p-6 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
                  style={{
                    backgroundColor: light.surface,
                    borderColor: light.border,
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl shadow-sm"
                        style={{
                          backgroundColor: light.iconBg,
                          color: light.icon,
                        }}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3
                          className="text-base font-semibold"
                          style={{ color: light.text }}
                        >
                          {palette.title}
                        </h3>
                        <p
                          className="text-sm leading-6"
                          style={{ color: light.mutedText }}
                        >
                          {palette.description}
                        </p>
                      </div>
                    </div>
                    <span
                      className="rounded-full px-3 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: light.highlight,
                        color: light.text,
                      }}
                    >
                      {palette.name}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {palette.usage.map((usage) => (
                      <span
                        key={usage}
                        className="rounded-full px-3 py-1 text-xs font-medium"
                        style={{
                          backgroundColor: light.border,
                          color: light.text,
                        }}
                      >
                        {usage}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {colorModes.map((mode) => {
                      const scheme = palette.colors[mode.key];
                      const isDark = mode.key === "dark";
                      const backgroundColor = isDark ? "#111827" : scheme.surface;
                      const borderColor = isDark ? scheme.border : scheme.border;

                      return (
                        <div
                          key={mode.key}
                          className="rounded-2xl border p-4"
                          style={{
                            backgroundColor,
                            borderColor,
                            color: scheme.text,
                          }}
                        >
                          <div className="flex items-center justify-between pb-3">
                            <span className="text-sm font-semibold">{mode.title}</span>
                            <span
                              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                              style={{
                                backgroundColor: scheme.highlight,
                                color: scheme.text,
                              }}
                            >
                              {scheme.surface}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 pb-3">
                            <span
                              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold shadow-sm"
                              style={{
                                backgroundColor: scheme.accent,
                                color: scheme.accentText,
                              }}
                            >
                              <Icon className="h-4 w-4" />
                              نمونه Badge
                            </span>
                            <span
                              className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium"
                              style={{
                                borderColor: scheme.border,
                                color: scheme.text,
                              }}
                            >
                              عنوان کارت
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 pb-3">
                            <div
                              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold shadow-sm"
                              style={{
                                backgroundColor: scheme.iconBg,
                                color: scheme.text,
                              }}
                            >
                              <span
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-transparent"
                              >
                                <Icon
                                  className="h-4 w-4"
                                  style={{ color: scheme.accent }}
                                />
                              </span>
                              <span>آیکون با پس‌زمینه کمرنگ</span>
                            </div>
                            <div
                              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium border"
                              style={{
                                borderColor: scheme.border,
                                color: scheme.text,
                              }}
                            >
                              <span
                                className="flex h-6 w-6 items-center justify-center rounded-full"
                                style={{
                                  backgroundColor: scheme.highlight,
                                }}
                              >
                                <Icon
                                  className="h-4 w-4"
                                  style={{ color: scheme.accent }}
                                />
                              </span>
                              <span>آیکون روی زمینه ملایم</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-[10px]">
                            {swatchKeys.map((key) => (
                              <div key={key} className="flex flex-col items-center gap-1 text-center">
                                <span
                                  className="h-9 w-full rounded-md border"
                                  style={{
                                    backgroundColor: scheme[key],
                                    borderColor: scheme.border,
                                  }}
                                />
                                <span>{key}</span>
                                <span style={{ color: scheme.mutedText }}>{scheme[key]}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تمام Badge Variants ({badgeVariants.length} عدد)</CardTitle>
          <p className="text-sm text-font-s mt-1">
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
                      className="flex flex-col gap-3 p-4 border rounded-lg hover:bg-bg/50 transition-colors"
                    >
                      <div>
                        <h4 className="font-semibold text-base mb-1">
                          {variant.label}
                        </h4>
                        <p className="text-sm text-font-s">
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
                      <div className="text-xs text-font-s font-mono p-2 bg-bg rounded border">
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
