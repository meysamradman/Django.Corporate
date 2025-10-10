import localFont from 'next/font/local'

export const fontPersian = localFont({
  src: '../../assets/fonts/IRANSansXV.woff2',
  variable: "--font-persian",
  display: "swap",
  weight: '100 900',
  preload: true,
  fallback: ['Tahoma', 'Arial', 'sans-serif'],
}) 