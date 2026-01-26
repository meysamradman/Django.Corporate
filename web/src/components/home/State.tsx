import React from 'react';
import Image from 'next/image';
import { Button } from "@/components/elements/Button";
import { Card, CardContent, CardFooter } from "@/components/elements/Card";

export default function State() {
  return (
    <div className=" justify-center grid grid-cols-3 gap-5  bg-bg">

        <Card className="">

            <CardContent className="">

                <div className="relative h-40 md:h-56">
                    <Image
                        src="/images/profile-banner.png"
                        alt="Cover image"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-5">
                <h1 className="">sdsd</h1>
                <p className="">sdsd</p>
            </CardFooter>

        </Card>

        <Card className="">

            <CardContent className="">

                <div className="relative h-40 md:h-56">
                    <Image
                        src="/images/profile-banner.png"
                        alt="Cover image"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-5">
                <h1 className="">sdsd</h1>
                <p className="">sdsd</p>
            </CardFooter>

        </Card>
        <Card className="">

            <CardContent className="">

                <div className="relative h-40 md:h-56">
                    <Image
                        src="/images/profile-banner.png"
                        alt="Cover image"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-5">
                <h1 className="">sdsd</h1>
                <p className="">sdsd</p>
            </CardFooter>

        </Card>

    </div>
  );
}