import { ReactNode } from 'react';
import "@/app/globals.css";
import {fontPeyda} from '@/core/fonts/persian';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

export default function RootLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <html lang="fa" dir="rtl" className={fontPeyda.className} suppressHydrationWarning>
            <body className="bg-bg">
                <ThemeProvider>
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}