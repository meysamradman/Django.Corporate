import type { ReactNode } from "react";
import { ButtonsShowcase } from "./buttons/ButtonsShowcase";
import { TotalPropertiesStatCard } from "./stats/TotalPropertiesStatCard";
import { InputsShowcase } from "./inputs/InputsShowcase";
import { BadgesShowcase } from "./badges/BadgesShowcase";
import { SimpleStaticTable } from "./tables/SimpleStaticTable";

export function StaticDesignSystemPage() {
  return (
    <section className="space-y-6">
      <header className="rounded-sm border border-br bg-card px-5 py-4">
        <h1 className="text-xl font-bold text-font-p">Design System Static</h1>
        <p className="mt-1 text-sm text-font-s">نمایش نمونه‌های ثابت برای استفاده یکپارچه در پنل ادمین</p>
      </header>

      <ShowcaseSection title="دکمه‌ها" description="انواع دکمه شامل حالت‌های مختلف، آیکون‌دار و لودینگ">
        <ButtonsShowcase />
      </ShowcaseSection>

      <ShowcaseSection title="کارت آمار" description="الگوی کارت KPI برای نمایش آمارهای سریع داشبورد">
        <TotalPropertiesStatCard />
      </ShowcaseSection>

      <ShowcaseSection title="ورودی‌ها" description="فیلدهای متداول فرم همراه با لیبل و نوع‌های کاربردی">
        <InputsShowcase />
      </ShowcaseSection>

      <ShowcaseSection title="Badge وضعیت" description="نمایش وضعیت‌ها با رنگ‌بندی استاندارد سیستم">
        <BadgesShowcase />
      </ShowcaseSection>

      <ShowcaseSection title="جدول" description="نمونه جدول پایه برای لیست‌های پنل ادمین">
        <SimpleStaticTable />
      </ShowcaseSection>
    </section>
  );
}

interface ShowcaseSectionProps {
  title: string;
  description: string;
  children: ReactNode;
}

function ShowcaseSection({ title, description, children }: ShowcaseSectionProps) {
  return (
    <div className="rounded-sm border border-br bg-card px-5 py-5">
      <div className="mb-4 border-b border-divi pb-3">
        <h2 className="text-lg font-bold text-font-p">{title}</h2>
        <p className="mt-1 text-sm text-font-s">{description}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}
