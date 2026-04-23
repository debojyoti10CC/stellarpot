"use client"

import { useWallet } from '@/lib/wallet-context'
import { Button } from '@/components/ui/button'
import { Wallet, ArrowRight, Loader2, Maximize2, Minimize2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export function LandingHero() {
  const { isConnected, isConnecting, connect } = useWallet()
  const [fullBleed, setFullBleed] = useState(true)

  const VIDEO_URL = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260210_031346_d87182fb-b0af-4273-84d1-c6fd17d6bf0f.mp4"

  return (
    <section
      className={`relative w-full overflow-hidden transition-all duration-500 ease-in-out flex flex-col items-center ${
        fullBleed ? "min-h-[120vh]" : "py-32 lg:py-40"
      }`}
    >
      {/* Height Toggle */}
      <button
        onClick={() => setFullBleed(!fullBleed)}
        aria-label={fullBleed ? "Switch to fit-to-content" : "Switch to full-bleed"}
        className="absolute top-4 right-4 z-20 p-2.5 rounded-[10px] backdrop-blur-xl border border-[rgba(164,132,215,0.5)] bg-[rgba(10,10,20,0.6)] text-foreground hover:bg-[rgba(85,80,110,0.6)] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        {fullBleed ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>

      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        >
          <source src={VIDEO_URL} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-[#020202]/80 to-transparent" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center text-center mt-32 px-6">
        {/* Tagline Pill */}
        <div className="inline-flex items-center gap-2.5 h-[38px] px-3.5 mb-8 rounded-[10px] backdrop-blur-xl border border-[rgba(164,132,215,0.5)] bg-[rgba(85,80,110,0.4)] shadow-[0_0_20px_rgba(123,57,252,0.15),inset_0_1px_0_rgba(255,255,255,0.08)] animate-fade-in">
          <span className="bg-indigo-500 text-white font-medium text-xs px-2.5 py-1 rounded-[6px] shadow-[0_0_8px_rgba(123,57,252,0.4)]">
            Live
          </span>
          <span className="font-medium text-sm text-foreground tracking-wide">
            Soroban Testnet
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-foreground text-5xl lg:text-[80px] font-extrabold leading-[1.05] tracking-[-0.02em] max-w-5xl animate-slide-up">
          Prediction markets
          <br className="hidden lg:block" />
          fully{" "}
          <em
            className="italic mx-[0.08em] relative inline-block text-indigo-400"
            style={{ fontStyle: "italic" }}
          >
            on-chain.
          </em>
        </h1>

        {/* Subtext */}
        <p className="font-normal text-lg text-muted-foreground mt-8 max-w-[662px] animate-slide-up" style={{ animationDelay: '100ms' }}>
          Create private betting rooms with friends. Stake XLM, pick outcomes, and let the Soroban smart contract handle trustless settlement.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-10 animate-slide-up" style={{ animationDelay: '200ms' }}>
          {isConnected ? (
            <>
              <Button asChild size="lg" className="px-8 py-3.5 h-auto rounded-[10px] bg-foreground text-background font-medium text-base hover:brightness-110 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-95">
                <Link href="/create">
                  Create Room <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="px-8 py-3.5 h-auto rounded-[10px] backdrop-blur-md bg-white/5 border-white/10 text-foreground font-medium text-base hover:bg-white/10 transition-all active:scale-95">
                <Link href="/join">Join Room</Link>
              </Button>
            </>
          ) : (
            <Button onClick={connect} disabled={isConnecting} size="lg" className="px-8 py-3.5 h-auto rounded-[10px] bg-indigo-500 text-white font-medium text-base hover:bg-indigo-400 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] active:scale-95">
              {isConnecting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Wallet className="w-5 h-5 mr-2" />}
              Connect Wallet
            </Button>
          )}
        </div>
        
        {!isConnected && (
          <p className="mt-5 text-sm text-muted-foreground/60 animate-slide-up" style={{ animationDelay: '300ms' }}>
            Requires Freighter wallet extension
          </p>
        )}
      </div>

      {/* Visual Mockup representation below features */}
      <div 
        className="mt-28 w-full max-w-4xl relative z-10 animate-slide-up px-5"
        style={{ animationDelay: '400ms' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-transparent to-transparent z-20 pointer-events-none top-1/2" />
        <div className="relative rounded-t-2xl border border-white/10 border-b-0 backdrop-blur-xl bg-[rgba(10,10,15,0.7)] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] p-6 md:p-8 overflow-hidden isolate">
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
                <line x1="0" y1="50" x2="1000" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <line x1="0" y1="150" x2="1000" y2="150" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <line x1="0" y1="250" x2="1000" y2="250" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <text x="500" y="165" fill="rgba(255,255,255,0.03)" fontSize="64" fontWeight="bold" textAnchor="middle">StellarPot</text>
                
                <path d="M 0 130 L 50 130 L 100 120 L 150 125 L 200 145 L 250 135 L 300 230 L 320 250 L 350 200 L 380 230 L 400 180 L 450 170 L 500 150 L 550 140 L 600 160 L 650 155 L 700 145 L 750 160 L 800 170 L 850 190 L 900 180 L 950 155 L 1000 160" 
                      fill="none" stroke="#60a5fa" strokeWidth="3" strokeLinejoin="round" />
                <path d="M 0 170 L 50 170 L 100 180 L 150 175 L 200 155 L 250 165 L 300 70 L 320 50 L 350 100 L 380 70 L 400 120 L 450 130 L 500 150 L 550 160 L 600 140 L 650 145 L 700 155 L 750 140 L 800 130 L 850 110 L 900 120 L 950 145 L 1000 140" 
                      fill="none" stroke="#818cf8" strokeWidth="3" strokeLinejoin="round" />
                      
                <circle cx="1000" cy="160" r="5" fill="#60a5fa" />
                <circle cx="1000" cy="140" r="5" fill="#818cf8" />
              </svg>
              
              <div className="absolute top-[30px] left-0 text-[10px] text-muted-foreground/40 font-mono">75¢</div>
              <div className="absolute top-[130px] left-0 text-[10px] text-muted-foreground/40 font-mono">50¢</div>
              <div className="absolute top-[230px] left-0 text-[10px] text-muted-foreground/40 font-mono">25¢</div>
              
              <div className="absolute bottom-[-20px] left-[5%] text-[10px] text-muted-foreground/40 font-mono">May</div>
              <div className="absolute bottom-[-20px] left-[25%] text-[10px] text-muted-foreground/40 font-mono">Jun</div>
              <div className="absolute bottom-[-20px] left-[45%] text-[10px] text-muted-foreground/40 font-mono">Jul</div>
              <div className="absolute bottom-[-20px] left-[65%] text-[10px] text-muted-foreground/40 font-mono">Aug</div>
              <div className="absolute bottom-[-20px] left-[85%] text-[10px] text-muted-foreground/40 font-mono">Sep</div>

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
    </section>
  )
}
