import React from 'react';
import Slider from "@/components/home/Slider";
import State from "@/components/home/State";
import RealFeachure from "@/components/home/RealFeachure";
import Types from "@/components/home/Types";
import { realEstateApi } from "@/api/real-estate/route";
import { brandingApi } from "@/api/settings/branding";
import type { HomeSliderItem } from "@/types/settings/branding";
import type { Property, PropertyState, PropertyType } from "@/types/real-estate/property";

export default async function HomePage() {
  // Server-side data fetching (parallel) for faster and SEO-friendly Home.
  // Keep Slider as a client component (interactive), but pass server-fetched data.

  const [slides, states, featured, types]: [
    HomeSliderItem[],
    PropertyState[],
    Property[],
    PropertyType[]
  ] = await Promise.all([
    brandingApi.getSliders().then((r) => (Array.isArray(r) ? r : [])).catch(() => []),
    realEstateApi.getStates({ size: 3 }).then((r) => (Array.isArray(r?.data) ? r.data.slice(0, 3) : [])).catch(() => []),
    realEstateApi.getFeaturedProperties(4).then((r) => (Array.isArray(r) ? r : [])).catch(() => []),
    realEstateApi.getTypes({ size: 4 }).then((r) => (Array.isArray(r?.data) ? r.data.slice(0, 4) : [])).catch(() => []),
  ]);

  return (
    <>
      <div className="">
        <Slider slidesData={slides} />
      </div>
      <div className="container mr-auto ml-auto pt-10 pb-10">
        <State states={states} />
      </div>
      <div className="container mr-auto ml-auto pt-10 pb-10">
        <RealFeachure properties={featured} />
      </div>
      <div className="container mr-auto ml-auto pt-10 pb-10">
        <Types types={types} />
      </div>
    </>



  );
}