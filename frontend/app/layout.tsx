import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PILI HARBOR - Control Center',
  description: 'Plataforma de localização e gestão operacional para pátios industriais',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#05080a" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  )
}
