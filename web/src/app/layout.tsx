import { ReactNode } from 'react';
import "@/app/globals.css";

export default function RootLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <html lang="fa" dir="rtl" suppressHydrationWarning>
            <body className="bg-bg">
                {children}
            </body>
        </html>
    );
}