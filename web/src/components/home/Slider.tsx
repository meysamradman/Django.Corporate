import React from 'react';
import Image from 'next/image';

export default function Slider() {
  return (
    <div className="relative flex flex-1 h-[80vh]">
                <Image
                    src="/06.jpg"
                    alt="Cover image"
                    fill
                    className="object-cover"
                    priority
                />

    </div>
  );
}