import type { ReactNode } from "react";
import { ButtonsShowcase } from "./buttons/ButtonsShowcase";
import { TotalPropertiesStatCard } from "./stats/TotalPropertiesStatCard";
import { InputsShowcase } from "./inputs/InputsShowcase";
import { BadgesShowcase } from "./badges/BadgesShowcase";
import { PropertiesStaticTable } from "./tables/PropertiesStaticTable";
import { PropertyViewPlainCard } from "./cards/PropertyViewPlainCard";
import { PropertyViewCardWithIcon } from "./cards/PropertyViewCardWithIcon";
import { PropertyConditionSelectItem } from "./items/PropertyConditionSelectItem";
import { SystemManagerRoleItem } from "./items/SystemManagerRoleItem";
import { PhoneInfoItem } from "./items/PhoneInfoItem";
import { LicenseNumberItem } from "./items/LicenseNumberItem";
import { SettingToggleItemSamples } from "./items/SettingToggleItem";

export function StaticDesignSystemPage() {
  return (
    <section className="space-y-6">
      <header className="rounded-sm border border-br bg-card px-5 py-4">
        <h1 className="text-xl font-bold text-font-p">Design System Static</h1>
        <p className="mt-1 text-sm text-font-s">نمایش نمونه‌های ثابت برای استفاده یکپارچه در پنل ادمین</p>
      </header>

      <ShowcaseSection title="دکمه‌ها" description="انواع دکمه شامل حالت‌های مختلف، آیکون‌دار و لودینگ">
        <SampleWithFile fileName="buttons/ButtonsShowcase.tsx">
          <ButtonsShowcase />
        </SampleWithFile>
      </ShowcaseSection>

      <ShowcaseSection title="کارت آمار" description="الگوی کارت KPI برای نمایش آمارهای سریع داشبورد">
        <SampleWithFile fileName="stats/TotalPropertiesStatCard.tsx">
          <TotalPropertiesStatCard />
        </SampleWithFile>
      </ShowcaseSection>

      <ShowcaseSection title="ورودی‌ها" description="فیلدهای متداول فرم همراه با لیبل و نوع‌های کاربردی">
        <SampleWithFile fileName="inputs/InputsShowcase.tsx">
          <InputsShowcase />
        </SampleWithFile>
      </ShowcaseSection>

      <ShowcaseSection title="Badge وضعیت" description="نمایش وضعیت‌ها با رنگ‌بندی استاندارد سیستم">
        <SampleWithFile fileName="badges/BadgesShowcase.tsx">
          <BadgesShowcase />
        </SampleWithFile>
      </ShowcaseSection>

      <ShowcaseSection title="جدول" description="کپی کامل جدول املاک با ستون‌ها، فیلترها و چیدمان واقعی صفحه املاک">
        <SampleWithFile fileName="tables/PropertiesStaticTable.tsx">
          <PropertiesStaticTable />
        </SampleWithFile>
      </ShowcaseSection>

      <ShowcaseSection title="Card ها" description="الگوی Card ساده و CardWithIcon بر اساس صفحه view ملک">
        <div className="space-y-4">
          <SampleWithFile fileName="cards/PropertyViewPlainCard.tsx">
            <PropertyViewPlainCard />
          </SampleWithFile>
          <SampleWithFile fileName="cards/PropertyViewCardWithIcon.tsx">
            <PropertyViewCardWithIcon />
          </SampleWithFile>
        </div>
      </ShowcaseSection>

      <ShowcaseSection title="Item ها" description="آیتم‌های کارت/نمایش بر اساس نمونه‌های تصویری شما">
        <div className="space-y-4">
          <SampleWithFile fileName="items/PropertyConditionSelectItem.tsx">
            <PropertyConditionSelectItem />
          </SampleWithFile>
          <SampleWithFile fileName="items/SystemManagerRoleItem.tsx">
            <SystemManagerRoleItem />
          </SampleWithFile>
          <SampleWithFile fileName="items/PhoneInfoItem.tsx">
            <PhoneInfoItem />
          </SampleWithFile>
          <SampleWithFile fileName="items/LicenseNumberItem.tsx">
            <LicenseNumberItem />
          </SampleWithFile>
          <SampleWithFile fileName="items/SettingToggleItem.tsx">
            <SettingToggleItemSamples />
          </SampleWithFile>
        </div>
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

interface SampleWithFileProps {
  fileName: string;
  children: ReactNode;
}

function SampleWithFile({ fileName, children }: SampleWithFileProps) {
  return (
    <div className="space-y-2">
      <div className="rounded-md border border-divi bg-bg px-3 py-2 text-xs text-font-s" dir="ltr">
        {fileName}
      </div>
      {children}
    </div>
  );
}
