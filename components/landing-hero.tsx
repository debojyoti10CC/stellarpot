"use client"

import { useWallet } from '@/lib/wallet-context'
import { Button } from '@/components/ui/button'
import { Wallet, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export function LandingHero() {
  const { isConnected, isConnecting, connect } = useWallet()

  return (
    <section className="relative overflow-hidden bg-background">
      <div className="mx-auto max-w-6xl px-5 pt-6 pb-24 lg:pt-12 lg:pb-40 relative z-10 flex flex-col lg:flex-row items-center gap-20">
        
        {/* Left Content */}
        <div className="flex-1 text-center lg:text-left">
          <div className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground shadow-sm mb-8 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            Soroban Mainnet Beta
          </div>

          <h1 className="animate-slide-up font-medium text-5xl sm:text-6xl lg:text-[4.5rem] tracking-tight text-foreground leading-[1.1]">
            Private betting.<br/>
            <span className="text-muted-foreground">Settled on-chain.</span>
          </h1>

          <p className="animate-slide-up mt-8 text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
            Create private betting rooms for your group chats. Everyone stakes XLM. Smart contracts handle the escrow and distribute payouts trustlessly to the winners.
          </p>

          <div className="animate-slide-up mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
            {isConnected ? (
              <>
                <Button asChild size="lg" className="h-12 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-all">
                  <Link href="/create">
                    Start a Bet <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 rounded-lg border-border bg-transparent hover:bg-accent transition-all">
                  <Link href="/join">Join a Friend's Bet</Link>
                </Button>
              </>
            ) : (
              <Button onClick={connect} disabled={isConnecting} size="lg" className="h-12 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-all w-full sm:w-auto">
                {isConnecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wallet className="w-4 h-4 mr-2" />}
                Connect Freighter
              </Button>
            )}
          </div>
          
          <div className="mt-14 flex items-center justify-center lg:justify-start gap-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
              <CheckCircle2 className="w-4 h-4 text-foreground" /> Non-custodial
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
              <CheckCircle2 className="w-4 h-4 text-foreground" /> Zero fees
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
              <CheckCircle2 className="w-4 h-4 text-foreground" /> Provably fair
            </div>
          </div>
        </div>

        {/* Right Content - Technical UI Preview */}
        <div className="flex-1 w-full max-w-md lg:max-w-none animate-fade-in" style={{ animationDelay: '300ms' }}>
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  ID: G6X9P
                </span>
              </div>
              <div className="text-xs font-mono bg-accent/50 text-foreground px-2 py-1 rounded">
                10 XLM STAKE
              </div>
            </div>
            
            <h3 className="text-xl font-medium mb-8 leading-snug">Will BTC trade above $120k before January 2027?</h3>
            
            <div className="space-y-2">
              <div className="relative overflow-hidden rounded-lg border border-border bg-accent/30 p-4 flex justify-between items-center">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-foreground"></div>
                <div className="font-medium text-sm">Yes</div>
                <div className="font-mono text-sm">74%</div>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 flex justify-between items-center">
                <div className="font-medium text-sm text-muted-foreground">No</div>
                <div className="font-mono text-sm text-muted-foreground">26%</div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-border flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-background"></div>
                  <div className="w-6 h-6 rounded-full bg-slate-300 border-2 border-background"></div>
                  <div className="w-6 h-6 rounded-full bg-slate-400 border-2 border-background"></div>
                </div>
                <span className="text-xs text-muted-foreground font-mono">15 bets</span>
              </div>
              <div className="text-sm font-mono">
                <span className="text-foreground">150.0</span> <span className="text-muted-foreground">XLM POOL</span>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </section>
  )
}
