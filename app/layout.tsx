// app/layout.tsx - Using Next.js Font Optimization

import './globals.css'
import type { Metadata } from 'next'
import { Inter, Montserrat } from 'next/font/google'
import localFont from 'next/font/local'
import { Toaster } from 'sonner';
import { Analytics } from "@vercel/analytics/next"


const CalSans = localFont({
  src: './fonts/CalSans-Regular.ttf',
  variable: '--font-cal-sans'
})

const montserrat = Montserrat({ 
  subsets: ['latin'],
  variable: '--font-montserrat'
})

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: 'PlotBook',
  description: 'Property intelligence made simple',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${CalSans.variable} ${montserrat.variable}`}>
      <body className="antialiased font-montserrat">
        {children}
        <Analytics />
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  )
}