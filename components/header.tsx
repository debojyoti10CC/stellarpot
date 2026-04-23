"use client"

import { useWallet } from '@/lib/wallet-context'
import { Button } from '@/components/ui/button'
import { Wallet, LogOut, Loader2 } from 'lucide-react'
import Link from 'next/link'

export function Header() {
  const { user, isConnected, isConnecting, connect, disconnect, balance } = useWallet()

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0b]/80 border-b border-white/[0.06]">
      <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-[11px] font-black text-black tracking-tight">SP</div>
            <span className="font-semibold text-[15px] text-foreground/90">StellarPot</span>
          </Link>
          {isConnected && (
            <nav className="hidden sm:flex items-center gap-1">
              <Link href="/create" className="px-3 py-1.5 rounded-lg text-[13px] text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-all">Create</Link>
              <Link href="/join" className="px-3 py-1.5 rounded-lg text-[13px] text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-all">Join</Link>
            </nav>
          )}
        </div>

        {isConnected ? (
          <div className="flex items-center gap-2">
            {balance !== null && (
              <div className="hidden sm:block px-3 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs font-mono text-emerald-400">
                {balance.toLocaleString(undefined, { maximumFractionDigits: 1 })} XLM
              </div>
            )}
            <div className="px-3 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs font-mono text-muted-foreground">
              {user!.walletAddress.slice(0, 4)}…{user!.walletAddress.slice(-4)}
            </div>
            <button onClick={disconnect} className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-red-400 hover:bg-red-500/5 transition-all">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <Button onClick={connect} disabled={isConnecting} size="sm" className="h-8 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold px-4">
            {isConnecting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5 mr-1.5" />}
            Connect
          </Button>
        )}
      </div>
    </header>
  )
}
