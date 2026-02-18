import localFont from 'next/font/local'

export const fontIran = localFont({
  src: '../../../public/fonts/IRANSansXV.woff2',
  variable: "--font-persian",
  display: "swap",
  weight: '100 900',
  preload: true,
  fallback: ['Tahoma', 'Arial', 'sans-serif'],
})

export const fontPeyda = localFont({
  src: '../../../public/fonts/PeydaWebVF.woff2',
  variable: "--font-persian",
  display: "swap",
  weight: '100 900',
  preload: true,
  fallback: ['Tahoma', 'Arial', 'sans-serif'],
})