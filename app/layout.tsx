import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vidbot- Created by HUNI SEN 409 students',
  description: 'Created by HUNI SEN 409 students',
  generator: 'emma',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
