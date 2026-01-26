"use client";

import React, { useState } from "react";
import Image from "next/image";




export default function Carousel() {

  return (
    <div className="relative flex  h-[60vh]">
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