// app/layout.tsx - Using Next.js Font Optimization

import './globals.css'
import type { Metadata } from 'next'
import { Inter, Montserrat } from 'next/font/google'
import localFont from 'next/font/local'
import { Toaster } from 'sonner';
import { Analytics } from "@vercel/analytics/next"
import { cn } from '@/lib/utils'

const CalSans = localFont({
  src: './fonts/CalSans-Regular.ttf',
  variable: '--font-cal-sans',
  display: 'swap'
})

const montserrat = Montserrat({ 
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap'
})

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
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
  const fontClasses = cn(
    inter.variable,
    CalSans.variable,
    montserrat.variable
  )

  return (
    <html lang="en" className={fontClasses} suppressHydrationWarning>
      <body className="antialiased font-montserrat" suppressHydrationWarning>
        {children}
        <Analytics />
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  )
}