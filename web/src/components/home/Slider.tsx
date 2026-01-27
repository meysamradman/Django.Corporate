"use client";

import React from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade, Parallax } from 'swiper/modules';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

// Type برای آیتم‌های اسلایدر
interface SlideItem {
  id: string | number;
  type: 'image' | 'video';
  src: string;
  alt?: string;
  title?: string;
  description?: string;
}

// داده‌های نمونه - بعداً از API می‌آید
const slides: SlideItem[] = [
  {
    id: 1,
    type: 'image',
    src: '/06.jpg',
    alt: 'اسلاید اول',
    title: 'عنوان اسلاید اول',
    description: 'توضیحات اسلاید اول'
  },
  {
    id: 4,
    type: 'video',
    src: '/images/Hailuo_Video_Create_a_10_second_cinematic_g_428070623869059075_2.mp4',
    alt: 'ویدئو معرفی',
    title: 'ویدئو معرفی پروژه',
    description: 'یک تجربه سینمایی متفاوت'
  },
  {
    id: 2,
    type: 'image',
    src: '/back-one.jpg',
    alt: 'اسلاید دوم',
    title: 'عنوان اسلاید دوم',
    description: 'توضیحات اسلاید دوم'
  },
  {
    id: 3,
    type: 'image',
    src: '/t54t45t.jpg',
    alt: 'اسلاید سوم',
    title: 'عنوان اسلاید سوم',
    description: 'توضیحات اسلاید سوم'
  },
];

export default function Slider() {
  return (
    <div className="relative w-full h-[80vh]" dir="rtl">
      <Swiper
        modules={[Navigation, Pagination, Autoplay, EffectFade, Parallax]}
        spaceBetween={0}
        slidesPerView={1}
        loop={true}
        parallax={true}
        effect="fade"
        fadeEffect={{
          crossFade: true
        }}
        autoplay={{
          delay: 6000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        navigation={{
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        }}
        pagination={{
          clickable: true,
          bulletClass: 'swiper-pagination-bullet',
          bulletActiveClass: 'swiper-pagination-bullet-active',
        }}
        speed={1200}
        watchSlidesProgress={true}
        className="h-full w-full group"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id} className="relative overflow-hidden">
            {slide.type === 'image' ? (
              <div className="relative w-full h-full">
                <Image
                  src={slide.src}
                  alt={slide.alt || 'اسلاید'}
                  fill
                  className="object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-110"
                  priority={slide.id === slides[0].id}
                  sizes="100vw"
                  quality={90}
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="max-w-4xl text-center text-white px-6">
                    {slide.title && (
                      <h2
                        className="text-4xl md:text-6xl font-black mb-6 drop-shadow-2xl"
                        data-swiper-parallax="-400"
                      >
                        {slide.title}
                      </h2>
                    )}
                    {slide.description && (
                      <p
                        className="text-lg md:text-2xl font-medium opacity-90 drop-shadow-lg"
                        data-swiper-parallax="-200"
                      >
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
                >
                  <source src={slide.src} type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="max-w-4xl text-center text-white px-6">
                    {slide.title && (
                      <h2
                        className="text-4xl md:text-6xl font-black mb-6 drop-shadow-2xl"
                        data-swiper-parallax="-400"
                      >
                        {slide.title}
                      </h2>
                    )}
                    {slide.description && (
                      <p
                        className="text-lg md:text-2xl font-medium opacity-90"
                        data-swiper-parallax="-200"
                      >
                        {slide.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </SwiperSlide>
        ))}

        {/* Navigation Buttons */}
        <div className="swiper-button-prev !flex items-center justify-center translate-x-4 md:translate-x-0 z-10 opacity-70 hover:opacity-100 transition-opacity duration-300">
          <ChevronRight className="w-12 h-12 text-white stroke-[1px]" />
        </div>
        <div className="swiper-button-next !flex items-center justify-center -translate-x-4 md:translate-x-0 z-10 opacity-70 hover:opacity-100 transition-opacity duration-300">
          <ChevronLeft className="w-12 h-12 text-white stroke-[1px]" />
        </div>

        {/* Pagination */}
        <div className="swiper-pagination swiper-pagination-custom"></div>
      </Swiper>
    </div>
  );
}