"use client"

import { WalletProvider, useWallet } from '@/lib/wallet-context'
import { Header } from '@/components/header'
import { LandingHero } from '@/components/landing-hero'
import { Dashboard } from '@/components/dashboard'
import { Sparkles } from 'lucide-react'
import { CONTRACT_ID } from '@/lib/soroban-client'

function HomeContent() {
  const { isConnected } = useWallet()
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {isConnected ? <Dashboard /> : <LandingHero />}
      </main>
      <footer className="border-t border-white/[0.04] py-8 bg-black/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground/60">
              <Sparkles className="w-3.5 h-3.5" />
              <span>StellarPot — Soroban Smart Contract</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground/40">
              <a 
                href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-muted-foreground/60 transition-colors font-mono"
              >
                {CONTRACT_ID.slice(0, 8)}...{CONTRACT_ID.slice(-8)}
              </a>
              <span>•</span>
              <span>Stellar Testnet</span>
            </div>
          </div>
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
