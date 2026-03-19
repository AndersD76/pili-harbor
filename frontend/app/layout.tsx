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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#05080a" />
      </head>
      <body className="antialiased text-base">{children}</body>
    </html>
  )
}
