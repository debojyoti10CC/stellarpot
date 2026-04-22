"use client"

import { useWallet } from '@/lib/wallet-context'
import { Button } from '@/components/ui/button'
import { Wallet, LogOut, Loader2, Sparkles } from 'lucide-react'

export function Header() {
  const { user, isConnected, isConnecting, connect, disconnect, balance } = useWallet()

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <header className="glass-strong sticky top-0 z-50 border-b border-white/[0.04]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow duration-300">
            <Sparkles className="w-4.5 h-4.5 text-primary-foreground" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            Stellar<span className="text-gradient">Pot</span>
          </span>
        </a>

        {/* Wallet Section */}
        {isConnected ? (
          <div className="flex items-center gap-3">
            {/* Balance pill */}
            {balance !== null && (
              <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/8 border border-accent/15">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-glow-pulse" />
                <span className="text-sm font-mono font-medium text-accent">
                  {balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} XLM
                </span>
              </div>
            )}

            {/* Address pill */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.1] transition-colors">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
              <span className="text-sm font-mono text-foreground/80">
                {truncateAddress(user!.walletAddress)}
              </span>
            </div>

            {/* Disconnect */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={disconnect}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full w-8 h-8 transition-all duration-200"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <Button 
            onClick={connect} 
            disabled={isConnecting}
            className="btn-premium rounded-full px-5 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
          >
            {isConnecting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Wallet className="w-4 h-4 mr-2" />
            )}
            Connect Wallet
          </Button>
        )}
      </div>
    </header>
  )
}
