import React from 'react';
import Image from 'next/image';
import { Button } from "@/components/elements/Button";
import { Card, CardContent, CardFooter } from "@/components/elements/Card";
import { Separator } from "@/components/elements/Separator";

export default function State() {
  return (
    <div className=" justify-center grid grid-cols-4 gap-5  bg-bg">

        <Card className="p-0 gap-0">

            <div className="relative h-40 md:h-56">
                    <Image
                        src="/images/profile-banner.png"
                        alt="Cover image"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>


            <CardContent className="p-5">
                <h1 className="">sdsd</h1>
                <p className="">sdsd</p>
            </CardContent>
            <Separator></Separator>
            <CardFooter className="flex justify-between gap-5 p-5">
                <h1 className="">sdsd</h1>
                <p className="">sdsd</p>
            </CardFooter>

        </Card>
        <Card className="p-0 gap-0">

            <div className="relative h-40 md:h-56">
                    <Image
                        src="/images/profile-banner.png"
                        alt="Cover image"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>


            <CardContent className="p-5">
                <h1 className="">sdsd</h1>
                <p className="">sdsd</p>
            </CardContent>
            <Separator></Separator>
            <CardFooter className="flex justify-between gap-5 p-5">
                <h1 className="">sdsd</h1>
                <p className="">sdsd</p>
            </CardFooter>

        </Card>
        <Card className="p-0 gap-0">

            <div className="relative h-40 md:h-56">
                    <Image
                        src="/images/profile-banner.png"
                        alt="Cover image"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>


            <CardContent className="p-5">
                <h1 className="">sdsd</h1>
                <p className="">sdsd</p>
            </CardContent>
            <Separator></Separator>
            <CardFooter className="flex justify-between gap-5 p-5">
                <h1 className="">sdsd</h1>
                <p className="">sdsd</p>
            </CardFooter>

        </Card>
        <Card className="p-0 gap-0">

            <div className="relative h-40 md:h-56">
                    <Image
                        src="/images/profile-banner.png"
                        alt="Cover image"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>


            <CardContent className="p-5">
                <h1 className="">sdsd</h1>
                <p className="">sdsd</p>
            </CardContent>
            <Separator></Separator>
            <CardFooter className="flex justify-between gap-5 p-5">
                <h1 className="">sdsd</h1>
                <p className="">sdsd</p>
            </CardFooter>

        </Card>

    </div>
  );
}