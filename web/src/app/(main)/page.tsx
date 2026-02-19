import React, { Suspense } from 'react';
import Slider from "@/components/home/Slider";
import State from "@/components/home/State";
import RealFeachure from "@/components/home/RealFeachure";
import Types from "@/components/home/Types";
import PropertyHeroSearch from "@/components/real-estate/search/PropertyHeroSearch";
import { realEstateApi } from "@/api/real-estate/route";
import { brandingApi } from "@/api/settings/branding";
import type { HomeSliderItem } from "@/types/settings/branding";
import type { Property, PropertyState, PropertyType } from "@/types/real-estate/property";
import Link from 'next/link';
import { Button } from '@/components/elements/custom/button';

export default async function HomePage() {
  // Server-side data fetching (parallel) for faster and SEO-friendly Home.
  // Keep Slider as a client component (interactive), but pass server-fetched data.

  const [slides, states, featured, types, allStates, allTypes, statuses]: [
    HomeSliderItem[],
    PropertyState[],
    Property[],
    PropertyType[],
    PropertyState[],
    PropertyType[],
    Array<{ value: string; label: string }>
  ] = await Promise.all([
    brandingApi.getSliders().then((r) => (Array.isArray(r) ? r : [])).catch(() => []),
    realEstateApi.getStates({ size: 3 }).then((r) => (Array.isArray(r?.data) ? r.data.slice(0, 3) : [])).catch(() => []),
    realEstateApi.getFeaturedProperties(4).then((r) => (Array.isArray(r) ? r : [])).catch(() => []),
    realEstateApi.getTypes({ size: 4 }).then((r) => (Array.isArray(r?.data) ? r.data.slice(0, 4) : [])).catch(() => []),
    realEstateApi.getStates({ page: 1, size: 100 }).then((r) => (Array.isArray(r?.data) ? r.data : [])).catch(() => []),
    realEstateApi.getTypes({ page: 1, size: 100 }).then((r) => (Array.isArray(r?.data) ? r.data : [])).catch(() => []),
    realEstateApi.getPropertyStatuses().catch(() => []),
  ]);

  const typeOptions = allTypes.map((item) => ({
    id: item.id,
    value: String(item.id),
    title: item.name,
  }));

  const stateOptions = allStates.map((item) => ({
    id: item.id,
    value: String(item.id),
    title: item.title || item.name,
  }));

  const statusOptions = statuses.map((item, index) => ({
    id: index + 1,
    value: item.value,
    title: item.label,
  }));

  return (
    <>
      <section>
        <Suspense fallback={<div className="relative w-full h-[80vh] bg-bg" />}>
          <Slider slidesData={slides} />
        </Suspense>
      </section>

      {/* Hero Search Bar */}
      <PropertyHeroSearch
        typeOptions={typeOptions}
        stateOptions={stateOptions}
        statusOptions={statusOptions}
      />

      <section className="bg-bg py-12 md:py-16">
        <div className="container mr-auto ml-auto">
          <div className="mb-8 text-center">
            <h2>خوش آمدید</h2>
            <p className="mt-2 mx-auto max-w-2xl">
              برای شروع، نوع معامله را انتخاب کنید تا سریع‌تر به آگهی‌های مرتبط دسترسی داشته باشید.
            </p>
          </div>
          <State states={states} />
        </div>
      </section>

      <section className="bg-card py-12 md:py-16">
        <div className="container mr-auto ml-auto">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="text-right">
              <h2>املاک ویژه</h2>
              <p className="mt-2 max-w-2xl">
                جدیدترین و بهترین املاک منتخب را ببینید و برای مشاهده همه آگهی‌ها وارد صفحه املاک شوید.
              </p>
            </div>

            <Button asChild className="shrink-0">
              <Link href="/properties">مشاهده همه</Link>
            </Button>
          </div>

          <RealFeachure properties={featured} />
        </div>
      </section>

      <section className="bg-bg py-12 md:py-16">
        <div className="container mr-auto ml-auto">
          <div className="mb-8 text-center">
            <h2>دسته‌بندی املاک</h2>
            <p className="mt-2 mx-auto max-w-2xl">
              املاک را بر اساس نوع ملک مرور کنید و با یک کلیک وارد لیست آگهی‌های همان دسته شوید.
            </p>
          </div>
          <Types types={types} />
        </div>
      </section>
    </>



  );
}