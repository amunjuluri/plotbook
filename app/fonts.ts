// app/fonts.ts

import localFont from 'next/font/local'

export const calSans = localFont({
  src: [
    {
      path: './fonts/CalSans-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-cal-sans',
  display: 'swap',
})