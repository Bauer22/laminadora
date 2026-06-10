import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Laminadora — Sistema de Gestão',
  description: 'Sistema de Gestão Industrial',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
