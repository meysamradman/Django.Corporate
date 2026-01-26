"use client";

import React, { useState } from "react";


import Carousel from "@/components/real-estate/Carousel";
import Detail from "@/components/real-estate/Detail";
import Widget from "@/components/real-estate/Widget";


export default function view() {

  return (
      <>

          <div className="container mr-auto ml-auto pt-10 pb-10 grid grid-cols-12 gap-5">


              <div className="col-span-full flex flex-col">
                <Carousel/>
              </div>


              <div className="grid col-span-8 gap-5">
                    <Detail/>
              </div>
              <div className="relative col-span-4">
                  <div className="sticky top-[116px] h-fit w-full">
                    <Widget/>
                  </div>

              </div>


          </div>





      </>
  );
}