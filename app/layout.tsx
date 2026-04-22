import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'StellarPot — Trustless Prediction Markets on Stellar',
  description: 'Create private, trust-minimized prediction markets with friends. Stake XLM, make predictions, and settle outcomes through Soroban smart contracts — fully on-chain.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} bg-background`}>
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        <div className="relative">
          {/* Background ambient effects */}
          <div className="fixed inset-0 bg-grid pointer-events-none opacity-40" />
          <div className="fixed inset-0 bg-radial-glow pointer-events-none" />
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
