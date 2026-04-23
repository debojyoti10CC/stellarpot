"use client"

import { useWallet } from '@/lib/wallet-context'
import { Button } from '@/components/ui/button'
import { Wallet, LogOut, Loader2 } from 'lucide-react'
import Link from 'next/link'

export function Header() {
  const { user, isConnected, isConnecting, connect, disconnect, balance } = useWallet()

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl" style={{ borderBottom: '1px solid #eee' }}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <img src="/logo.png" alt="StellarPot Logo" className="w-full h-full object-cover" />
            </span>
            <div>
              <span className="font-display block text-[15px] font-semibold tracking-tight text-foreground">StellarPot</span>
              <span className="block text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Private betting for friends</span>
            </div>
          </Link>
          {isConnected && (
            <nav className="hidden items-center gap-2 sm:flex">
              <Link href="/create" className="rounded-full px-4 py-2 text-[13px] text-muted-foreground transition-all hover:bg-accent hover:text-foreground">Create</Link>
              <Link href="/join" className="rounded-full px-4 py-2 text-[13px] text-muted-foreground transition-all hover:bg-accent hover:text-foreground">Join</Link>
            </nav>
          )}
        </div>

        {isConnected ? (
          <div className="flex items-center gap-2">
            {balance !== null && (
              <div className="hidden rounded-full border border-border bg-card px-3 py-1.5 text-xs font-mono text-primary sm:flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {balance.toLocaleString(undefined, { maximumFractionDigits: 1 })} XLM
              </div>
            )}
            <div className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-mono text-muted-foreground">
              {user!.walletAddress.slice(0, 4)}…{user!.walletAddress.slice(-4)}
            </div>
            <button onClick={disconnect} className="rounded-full p-2 text-muted-foreground transition-all hover:bg-red-50 hover:text-red-500">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <Button onClick={connect} disabled={isConnecting} size="sm" className="h-10 rounded-full bg-primary px-5 text-xs font-semibold text-primary-foreground shadow-none transition-colors hover:bg-primary/92">
            {isConnecting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5 mr-1.5" />}
            Connect
          </Button>
        )}
      </div>
    </header>
  )
}
