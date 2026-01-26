import React from 'react';
import Image from 'next/image';
import { Button } from "@/components/elements/Button";
import { Card, CardContent, CardFooter } from "@/components/elements/Card";
import { Separator } from "@/components/elements/Separator";

export default function Footer() {
  return (
    <footer className="bg-footer  ">

    <div className="grid grid-cols-4 container mr-auto ml-auto pt-10 pb-10">

        <div className=" flex flex-col gap-5 ">
            <h4 className="text-wt">
              درباره ما
            </h4>

            <p className="text-wt">gfdfgfff</p>

        </div>

      <div className=" ">

          <h4 className="text-wt">
          درباره ما
            </h4>

      </div>

      <div className=" ">
        <h4 className="text-wt">
          درباره ما
        </h4>


      </div>


              <div className=" ">
        <h4 className="text-wt">
          درباره ما
        </h4>


      </div>



    </div>


    </footer>
  );
}