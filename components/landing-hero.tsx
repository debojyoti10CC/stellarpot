"use client"

import { useWallet } from '@/lib/wallet-context'
import { Button } from '@/components/ui/button'
import { Wallet, ArrowRight, Loader2, Activity, ShieldCheck, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export function LandingHero() {
  const { isConnected, isConnecting, connect } = useWallet()

  return (
    <div className="relative flex flex-col items-center px-5 pt-28 pb-0 w-full overflow-hidden">
      {/* Background Ambient Effects */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-[-10%] w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />

      {/* Badge */}
      <div 
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-foreground/80 mb-8 backdrop-blur-sm shadow-sm animate-fade-in relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="font-medium tracking-wide">Live on Soroban Testnet</span>
      </div>

      {/* Headline */}
      <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-center leading-[1.08] mb-6 animate-slide-up relative">
        Prediction markets,<br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/50">
          fully on-chain.
        </span>
      </h1>

      <p 
        className="text-lg md:text-xl text-muted-foreground text-center max-w-2xl mb-12 leading-relaxed animate-slide-up opacity-0"
        style={{ animationDelay: '100ms' }}
      >
        Create private betting rooms with friends. Stake XLM, pick outcomes, and let the Soroban smart contract handle trustless settlement.
      </p>

      {/* CTA */}
      <div 
        className="flex flex-col sm:flex-row items-center gap-4 animate-slide-up opacity-0 relative z-10"
        style={{ animationDelay: '200ms' }}
      >
        {isConnected ? (
          <>
            <Button asChild size="lg" className="h-12 px-8 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-semibold text-base transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(255,255,255,0.2)]">
              <Link href="/create">
                Create Room
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-foreground text-base transition-all">
              <Link href="/join">Join Room</Link>
            </Button>
          </>
        ) : (
          <Button 
            onClick={connect} 
            disabled={isConnecting} 
            size="lg" 
            className="h-12 px-8 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-semibold text-base transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(255,255,255,0.2)]"
          >
            {isConnecting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Wallet className="w-5 h-5 mr-2" />}
            Connect Wallet
          </Button>
        )}
      </div>

      {!isConnected && (
        <p className="mt-5 text-sm text-muted-foreground/60 animate-slide-up opacity-0" style={{ animationDelay: '300ms' }}>
          Requires Freighter wallet extension
        </p>
      )}

      {/* Feature Grids */}
      <div 
        className="grid md:grid-cols-3 gap-6 mt-28 w-full max-w-5xl px-4 animate-slide-up opacity-0"
        style={{ animationDelay: '400ms' }}
      >
        {[
          { icon: ShieldCheck, title: 'Trustless Escrow', desc: 'Funds locked in a smart contract. No human holds the keys.', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
          { icon: Activity, title: 'On-Chain Verified', desc: 'Every bet and payout is instantly verifiable on the Stellar ledger.', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
          { icon: RefreshCw, title: 'Instant Settlement', desc: 'Winners are paid automatically by the contract. ~5s finality.', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
        ].map((f, i) => (
          <div key={i} className="relative group p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/[0.07] transition-colors overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] ${f.bg} rounded-full -mr-10 -mt-10 opacity-50 group-hover:opacity-100 transition-opacity`} />
            <div className={`w-12 h-12 rounded-xl ${f.bg} border ${f.border} flex items-center justify-center mb-4 relative z-10`}>
              <f.icon className={`w-6 h-6 ${f.color}`} />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2 relative z-10">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed relative z-10">{f.desc}</p>
          </div>
        ))}
      </div>
      
      {/* Visual Mockup representation below features */}
      <div 
        className="mt-28 w-full max-w-4xl relative animate-slide-up opacity-0"
        style={{ animationDelay: '500ms' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-transparent to-transparent z-20 pointer-events-none top-1/2" />
        <div className="relative rounded-t-2xl border border-white/10 border-b-0 bg-[#121214] shadow-2xl p-6 md:p-8 overflow-hidden z-10 isolate">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                <div>
                     <h4 className="text-xl font-semibold mb-1.5 text-foreground/90">Will Bitcoin hit $100k by 2026?</h4>
                     <div className="flex gap-4 text-sm text-muted-foreground font-mono mt-2">
                        <span>👥 42 bets</span>
                        <span>💰 2,450 XLM pool</span>
                     </div>
                </div>
                <div className="hidden sm:block">
                   <div className="px-3 py-1 rounded bg-emerald-500/10 text-emerald-400 font-mono text-xs border border-emerald-500/20">LIVE</div>
                </div>
            </div>
            
            <div className="space-y-5">
               <div>
                  <div className="flex justify-between text-sm mb-2 font-medium">
                      <span className="text-foreground/80 flex items-center gap-2">Yes <span className="text-xs text-muted-foreground font-normal">31 bets</span></span>
                      <span className="text-emerald-400 font-mono">68%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full bg-emerald-500 relative">
                         <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/20" />
                      </div>
                  </div>
               </div>
               <div>
                  <div className="flex justify-between text-sm mb-2 font-medium">
                      <span className="text-foreground/80 flex items-center gap-2">No <span className="text-xs text-muted-foreground font-normal">11 bets</span></span>
                      <span className="text-amber-400 font-mono">32%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full bg-amber-500 w-[32%] relative">
                         <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/20" />
                      </div>
                  </div>
               </div>
            </div>
            
            <div className="mt-8 flex gap-3 pb-8">
               <div className="flex-1 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center pointer-events-none opacity-50">
                  <span className="text-muted-foreground font-medium text-sm">Place Bet</span>
               </div>
            </div>
        </div>
      </div>
    </div>
  )
}
