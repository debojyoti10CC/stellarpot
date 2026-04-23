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
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-[-10%] w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />

      {/* Badge */}
      <div 
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-foreground/80 mb-8 backdrop-blur-sm shadow-sm animate-fade-in relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/10 to-indigo-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
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


      
      {/* Visual Mockup representation below features */}
      <div 
        className="mt-20 w-full max-w-4xl relative animate-slide-up opacity-0"
        style={{ animationDelay: '400ms' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-transparent to-transparent z-20 pointer-events-none top-1/2" />
        <div className="relative rounded-t-2xl border border-white/10 border-b-0 bg-[#0A0A0A] shadow-2xl p-6 md:p-8 overflow-hidden z-10 isolate">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
            <div className="flex items-center justify-between mb-6">
                <div>
                     <h4 className="text-xl font-semibold mb-1.5 text-foreground/90">Will Bitcoin hit $100k by 2026?</h4>
                     <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                        <span>$2,450,000 Vol.</span>
                     </div>
                </div>
                <div className="hidden sm:block">
                   <div className="px-3 py-1 rounded bg-indigo-500/10 text-indigo-400 font-medium text-xs border border-indigo-500/20">LIVE</div>
                </div>
            </div>
            
            {/* Fake SVG Line Graph */}
            <div className="relative w-full h-[240px] mb-8 select-none">
              <svg width="100%" height="100%" viewBox="0 0 1000 300" preserveAspectRatio="none" className="overflow-visible">
                {/* Grid lines */}
                <line x1="0" y1="50" x2="1000" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <line x1="0" y1="150" x2="1000" y2="150" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <line x1="0" y1="250" x2="1000" y2="250" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                
                {/* Background watermark */}
                <text x="500" y="165" fill="rgba(255,255,255,0.03)" fontSize="64" fontWeight="bold" textAnchor="middle">StellarPot</text>
                
                {/* Line 1: No (Blue) */}
                <path d="M 0 130 L 50 130 L 100 120 L 150 125 L 200 145 L 250 135 L 300 230 L 320 250 L 350 200 L 380 230 L 400 180 L 450 170 L 500 150 L 550 140 L 600 160 L 650 155 L 700 145 L 750 160 L 800 170 L 850 190 L 900 180 L 950 155 L 1000 160" 
                      fill="none" stroke="#60a5fa" strokeWidth="3" strokeLinejoin="round" />
                      
                {/* Line 2: Yes (Indigo) */}
                <path d="M 0 170 L 50 170 L 100 180 L 150 175 L 200 155 L 250 165 L 300 70 L 320 50 L 350 100 L 380 70 L 400 120 L 450 130 L 500 150 L 550 160 L 600 140 L 650 145 L 700 155 L 750 140 L 800 130 L 850 110 L 900 120 L 950 145 L 1000 140" 
                      fill="none" stroke="#818cf8" strokeWidth="3" strokeLinejoin="round" />
                      
                {/* End points */}
                <circle cx="1000" cy="160" r="5" fill="#60a5fa" />
                <circle cx="1000" cy="140" r="5" fill="#818cf8" />
              </svg>
              
              {/* Y-axis labels */}
              <div className="absolute top-[30px] left-0 text-[10px] text-muted-foreground/40 font-mono">75¢</div>
              <div className="absolute top-[130px] left-0 text-[10px] text-muted-foreground/40 font-mono">50¢</div>
              <div className="absolute top-[230px] left-0 text-[10px] text-muted-foreground/40 font-mono">25¢</div>
              
              {/* X-axis labels */}
              <div className="absolute bottom-[-20px] left-[5%] text-[10px] text-muted-foreground/40 font-mono">May</div>
              <div className="absolute bottom-[-20px] left-[25%] text-[10px] text-muted-foreground/40 font-mono">Jun</div>
              <div className="absolute bottom-[-20px] left-[45%] text-[10px] text-muted-foreground/40 font-mono">Jul</div>
              <div className="absolute bottom-[-20px] left-[65%] text-[10px] text-muted-foreground/40 font-mono">Aug</div>
              <div className="absolute bottom-[-20px] left-[85%] text-[10px] text-muted-foreground/40 font-mono">Sep</div>

              {/* Badges on right side */}
              <div className="absolute top-[130px] right-0 translate-x-[110%] flex flex-col gap-2">
                <div className="px-2 py-1 rounded bg-indigo-500/20 text-indigo-400 font-mono text-xs border border-indigo-500/30 font-semibold whitespace-nowrap">
                  Yes 68¢
                </div>
                <div className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 font-mono text-xs border border-blue-500/30 font-semibold whitespace-nowrap">
                  No 32¢
                </div>
              </div>
            </div>
            
            <div className="mt-12 flex gap-3 pb-8">
               <div className="flex-1 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center pointer-events-none opacity-50">
                  <span className="text-muted-foreground font-medium text-sm text-center">Please connect to place bet</span>
               </div>
            </div>
        </div>
      </div>
    </div>
  )
}
