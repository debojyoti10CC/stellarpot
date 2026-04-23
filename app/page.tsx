"use client"

import { WalletProvider, useWallet } from '@/lib/wallet-context'
import { Header } from '@/components/header'
import { LandingHero } from '@/components/landing-hero'
import { Dashboard } from '@/components/dashboard'
import { CONTRACT_ID } from '@/lib/soroban-client'

function HomeContent() {
  const { isConnected } = useWallet()
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {isConnected ? <Dashboard /> : <LandingHero />}
      </main>
      <footer className="border-t border-border/80 py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 text-[11px] text-muted-foreground">
          <span>StellarPot · Soroban Testnet</span>
          <a 
            href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono transition-colors hover:text-foreground"
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
