import {ReactNode} from 'react';
import {fontPersian} from '@/core/styles/fonts';
import "@/app/globals.css";
import {Toaster} from '@/components/elements/Sonner';
import {AuthProvider} from '@/core/auth/AuthContext';
import {ThemeProvider} from '@/components/providers/ThemeProvider';
import {QueryProvider} from '@/components/providers/QueryProvider';
import NextTopLoader from 'nextjs-toploader';

export default function RootLayout({
                                       children,
                                   }: {
    children: ReactNode;
}) {
    return (
        <html lang="fa" dir="rtl" className={fontPersian.className} suppressHydrationWarning>
        <body className="bg-bg">
        <NextTopLoader
            showSpinner={false}
            color="#3b82f6"
            height={3}
            shadow={false}
            easing="ease"
            speed={200}
        />
        <QueryProvider>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                <AuthProvider>
                    {children}
                    <Toaster
                        position="top-right"
                        duration={4000}
                    />
                </AuthProvider>
            </ThemeProvider>
        </QueryProvider>
        </body>
        </html>
    );
}