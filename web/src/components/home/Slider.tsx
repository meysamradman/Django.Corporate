"use client";

import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, EffectFade, Parallax } from "swiper/modules";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { HomeSliderItem } from "@/types/settings/branding";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/effect-fade";

type SliderProps = {
  slidesData?: HomeSliderItem[];
};

export default function Slider({ slidesData = [] }: SliderProps) {
  const slides = (Array.isArray(slidesData) ? slidesData : []).filter((item) => item.media_url) as HomeSliderItem[];
  const prevRef = React.useRef<HTMLButtonElement | null>(null);
  const nextRef = React.useRef<HTMLButtonElement | null>(null);
  const [activeIndex, setActiveIndex] = React.useState(1);

  const formatSlideNumber = (value: number) => value.toString().padStart(2, "0");

  if (slides.length === 0) {
    return <div className="relative w-full h-[80vh] bg-bg" />;
  }

  return (
    <div className="relative w-full h-[80vh]">
      <Swiper
        modules={[Navigation, Autoplay, EffectFade, Parallax]}
        spaceBetween={0}
        slidesPerView={1}
        loop={true}
        parallax={true}
        effect="fade"
        fadeEffect={{
          crossFade: true,
        }}
        autoplay={{
          delay: 7000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        onSlideChange={(swiper) => {
          setActiveIndex(swiper.realIndex + 1);
        }}
        onBeforeInit={(swiper) => {
          // Swiper React may initialize before selector-based nav is ready.
          // Using element refs here makes navigation reliable.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const navigation = (swiper.params as any).navigation;
          if (navigation && typeof navigation !== "boolean") {
            navigation.prevEl = prevRef.current;
            navigation.nextEl = nextRef.current;
          }
        }}
        navigation={{
          prevEl: prevRef.current,
          nextEl: nextRef.current,
        }}
        speed={1200}
        watchSlidesProgress={true}
        className="home-hero-slider h-full w-full"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id} className="relative overflow-hidden">
            {slide.media_type === "image" ? (
              <div className="relative w-full h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.media_url || ""}
                  alt={slide.title || "slide"}
                  className="home-hero-media h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="max-w-4xl text-center text-white px-6">
                    {slide.title && (
                      <h2 className="text-4xl md:text-6xl font-black mb-6 drop-shadow-2xl" data-swiper-parallax="-400">
                        {slide.title}
                      </h2>
                    )}
                    {slide.description && (
                      <p className="text-lg md:text-2xl font-medium opacity-90 drop-shadow-lg" data-swiper-parallax="-200">
                        {slide.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full">
                <video
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  poster={slide.media_poster_url || undefined}
                >
                  <source src={slide.media_url || ""} type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="max-w-4xl text-center text-white px-6">
                    {slide.title && (
                      <h2 className="text-4xl md:text-6xl font-black mb-6 drop-shadow-2xl" data-swiper-parallax="-400">
                        {slide.title}
                      </h2>
                    )}
                    {slide.description && (
                      <p className="text-lg md:text-2xl font-medium opacity-90" data-swiper-parallax="-200">
                        {slide.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </SwiperSlide>
        ))}

        <button type="button" aria-label="Previous slide" className="home-hero-nav-button home-hero-nav-prev" ref={prevRef}>
          <ArrowUp aria-hidden="true" focusable="false" />
        </button>
        <button type="button" aria-label="Next slide" className="home-hero-nav-button home-hero-nav-next" ref={nextRef}>
          <ArrowDown aria-hidden="true" focusable="false" />
        </button>

        <div className="home-hero-counter" aria-hidden="true">
          <span className="home-hero-counter-active">{formatSlideNumber(activeIndex)}</span>
          <span className="home-hero-counter-separator" />
          <span className="home-hero-counter-total">{formatSlideNumber(slides.length)}</span>
        </div>
      </Swiper>
    </div>
  );
}
