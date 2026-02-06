import React from 'react';
import Slider from "@/components/home/Slider";
import State from "@/components/home/State";
import RealFeachure from "@/components/home/RealFeachure";
import Types from "@/components/home/Types";

export default function HomePage() {
  return (
    <>
      <div className="">
        <Slider />
      </div>
      <div className="container mr-auto ml-auto pt-10 pb-10">
        <State />
      </div>
      <div className="container mr-auto ml-auto pt-10 pb-10">
        <RealFeachure />
      </div>
      <div className="container mr-auto ml-auto pt-10 pb-10">
        <Types />
      </div>
    </>



  );
}