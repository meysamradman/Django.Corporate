import { ReactNode } from 'react';
import "@/app/globals.css";
import {fontPersian} from '@/core/styles/fonts';

export default function RootLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <html lang="fa" dir="rtl" className={fontPersian.className} suppressHydrationWarning>
            <body className="bg-bg">
                {children}
            </body>
        </html>
    );
}