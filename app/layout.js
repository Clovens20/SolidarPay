import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'SolidarPay - Tontine Digitalisée',
  description: 'Gérez votre tontine familiale en toute simplicité avec KOHO',
  icons: {
    icon: '/logo.png.jpg',
    shortcut: '/logo.png.jpg',
    apple: '/logo.png.jpg',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className={inter.className}>{children}</body>
    </html>
  )
}