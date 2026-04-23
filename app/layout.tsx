import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'StellarPot — Prediction Markets on Stellar',
  description: 'Create private prediction markets with friends. Stake XLM, predict outcomes, settle on-chain via Soroban.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="font-sans min-h-screen bg-[#020202] text-foreground">
        {children}
      </body>
    </html>
  )
}
