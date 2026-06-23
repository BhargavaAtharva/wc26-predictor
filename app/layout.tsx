import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import './globals.css'

export const metadata: Metadata = {
  title: 'WC 2026 Predictor',
  description: 'Predict every match. Score points. Beat your friends.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <head>
        <link rel="preload" href="/silhouettes/kick.png" as="image" />
        <link rel="preload" href="/silhouettes/run.png" as="image" />
        <link rel="preload" href="/silhouettes/celebrate.png" as="image" />
        <link rel="preload" href="/silhouettes/header.png" as="image" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}