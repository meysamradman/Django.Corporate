"use client";

import React from "react";
import NextTopLoader from 'nextjs-toploader';

export default function AuthLayout({children,}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <NextTopLoader
                showSpinner={false}
                color="#3b82f6"
                height={3}
                shadow={false}
                easing="ease"
                speed={200}
            />
            {children}
        </>
    )
}

