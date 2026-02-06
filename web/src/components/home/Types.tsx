import React from 'react';
import Image from 'next/image';
import { Button } from "@/components/elements/Button";
import { Card, CardContent, CardFooter } from "@/components/elements/Card";
import { Separator } from "@/components/elements/Separator";

export default function State() {
    return (
        <div className=" justify-center grid grid-cols-4 gap-5  bg-bg">

            <div className="relative h-150">
                <Image
                    src="/images/profile-banner.png"
                    alt="Cover image"
                    fill
                    className="object-cover"
                    priority
                />
            </div>
            <div className="relative h-150">
                <Image
                    src="/images/profile-banner.png"
                    alt="Cover image"
                    fill
                    className="object-cover"
                    priority
                />
            </div>
            <div className="relative h-150">
                <Image
                    src="/images/profile-banner.png"
                    alt="Cover image"
                    fill
                    className="object-cover"
                    priority
                />
            </div>
            <div className="relative h-150">
                <Image
                    src="/images/profile-banner.png"
                    alt="Cover image"
                    fill
                    className="object-cover"
                    priority
                />
            </div>

        </div>
    );
}