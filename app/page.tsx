"use client"

import { WalletProvider, useWallet } from '@/lib/wallet-context'
import { Header } from '@/components/header'
import { LandingHero } from '@/components/landing-hero'
import { Dashboard } from '@/components/dashboard'
import { CONTRACT_ID } from '@/lib/soroban-client'

function HomeContent() {
  const { isConnected } = useWallet()
  
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0b]">
      <Header />
      <main className="flex-1">
        {isConnected ? <Dashboard /> : <LandingHero />}
      </main>
      <footer className="border-t border-white/[0.04] py-6">
        <div className="max-w-5xl mx-auto px-5 flex items-center justify-between text-[11px] text-muted-foreground/25">
          <span>StellarPot · Soroban Testnet</span>
          <a 
            href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono hover:text-muted-foreground/50 transition-colors"
          >
            {CONTRACT_ID.slice(0, 8)}…{CONTRACT_ID.slice(-6)}
          </a>
        </div>
      </footer>
    </div>
  )
}

export default function HomePage() {
  return (
    <WalletProvider>
      <HomeContent />
    </WalletProvider>
  )
}
