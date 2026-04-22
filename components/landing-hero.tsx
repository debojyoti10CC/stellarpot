"use client"

import { useWallet } from '@/lib/wallet-context'
import { Button } from '@/components/ui/button'
import { Wallet, Users, Shield, Zap, ArrowRight, Loader2, Code2, Lock, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export function LandingHero() {
  const { isConnected, isConnecting, connect } = useWallet()

  const features = [
    {
      icon: Lock,
      title: 'Trustless Escrow',
      description: 'Funds locked in a Soroban smart contract. No human holds the keys.',
      gradient: 'from-primary/20 to-primary/5',
      iconColor: 'text-primary',
    },
    {
      icon: Shield,
      title: 'On-Chain Verified',
      description: 'Every bet, payout, and resolution is verifiable on the Stellar ledger.',
      gradient: 'from-emerald-500/20 to-emerald-500/5',
      iconColor: 'text-emerald-400',
    },
    {
      icon: Zap,
      title: 'Instant Settlement',
      description: 'Winners are paid automatically by the contract. ~5 second finality.',
      gradient: 'from-accent/20 to-accent/5',
      iconColor: 'text-accent',
    },
  ]

  const stats = [
    { value: 'Soroban', label: 'Smart Contract' },
    { value: '~5s', label: 'Finality' },
    { value: '0%', label: 'Platform Fee' },
  ]

  return (
    <div className="relative flex flex-col items-center px-4 sm:px-6 pt-16 pb-24 md:pt-28 md:pb-32 overflow-hidden">
      {/* Ambient background orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/[0.04] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-accent/[0.03] rounded-full blur-[100px] pointer-events-none" />

      {/* Hero content */}
      <div className="relative text-center max-w-4xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.06] px-4 py-2 rounded-full text-sm font-medium mb-8 animate-fade-in backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="text-foreground/70">Deployed on Stellar Testnet</span>
          <Code2 className="w-3.5 h-3.5 text-muted-foreground" />
        </div>

        {/* Heading */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 animate-slide-up leading-[1.1]">
          <span className="block">Bet with friends,</span>
          <span className="text-gradient-hero">not trust.</span>
        </h1>

        {/* Subheading */}
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-pretty animate-slide-up stagger-1 leading-relaxed opacity-0">
          Create private prediction markets powered by Soroban smart contracts. 
          Stake XLM, predict outcomes, and let the contract handle the rest.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up stagger-2 opacity-0">
          {isConnected ? (
            <>
              <Button size="lg" asChild 
                className="btn-premium rounded-full px-8 h-12 text-base bg-gradient-to-r from-primary to-primary/80 shadow-xl shadow-primary/25 hover:shadow-primary/40"
              >
                <Link href="/create">
                  Create Room
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild 
                className="rounded-full px-8 h-12 text-base border-white/10 hover:bg-white/[0.04] hover:border-white/15 transition-all duration-300"
              >
                <Link href="/join">Join Room</Link>
              </Button>
            </>
          ) : (
            <Button 
              size="lg" 
              onClick={connect} 
              disabled={isConnecting} 
              className="btn-premium rounded-full px-8 h-12 text-base bg-gradient-to-r from-primary to-primary/80 shadow-xl shadow-primary/25 hover:shadow-primary/40"
            >
              {isConnecting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Wallet className="w-4 h-4 mr-2" />
              )}
              Connect Wallet to Start
            </Button>
          )}
        </div>

        {!isConnected && (
          <p className="mt-5 text-sm text-muted-foreground/60 animate-slide-up stagger-3 opacity-0">
            Requires Freighter wallet extension
          </p>
        )}
      </div>

      {/* Stats bar */}
      <div className="relative mt-16 w-full max-w-2xl mx-auto animate-slide-up stagger-3 opacity-0">
        <div className="glass rounded-2xl px-8 py-5 flex items-center justify-around">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-lg font-bold text-gradient">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-5 mt-16 max-w-4xl w-full">
        {features.map((feature, i) => (
          <div
            key={feature.title}
            className={`card-hover glass rounded-2xl p-6 animate-slide-up opacity-0 stagger-${i + 2}`}
          >
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}>
              <feature.icon className={`w-5 h-5 ${feature.iconColor}`} />
            </div>
            <h3 className="font-semibold text-foreground/90 mb-1.5">{feature.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
