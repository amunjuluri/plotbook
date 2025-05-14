// app/layout.tsx - Using Next.js Font Optimization

import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

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
    <html lang="en" className={`${inter.variable}`}>
      <body className="antialiased font-cal-sans">
        {children}
      </body>
    </html>
  )
}