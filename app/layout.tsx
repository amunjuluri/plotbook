// app/layout.tsx - Using Next.js Font Optimization

import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'
import { Toaster } from 'sonner';


const CalSans = localFont({
  src: './fonts/CalSans-Regular.ttf',
  variable: '--font-cal-sans'
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
    <html lang="en" className={`${inter.variable} ${CalSans.variable}`}>
      <body className="antialiased font-cal-sans">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  )
}