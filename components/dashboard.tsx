"use client"

import { useState, useEffect } from 'react'
import { useWallet } from '@/lib/wallet-context'
import { getUserRooms, getAllRooms, calculatePayouts } from '@/lib/soroban-client'
import type { OnChainRoom } from '@/lib/soroban-client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Coins, Loader2, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

function RoomCard({ room }: { room: OnChainRoom }) {
  const isLive = room.status === 'Open'
  const statusConfig = {
    Open: { label: 'Live', class: 'bg-emerald-50 text-emerald-600 border-emerald-100', dot: 'bg-emerald-500' },
    Resolved: { label: 'Resolved', class: 'bg-accent/50 text-foreground border-border', dot: '' },
    Cancelled: { label: 'Cancelled', class: 'bg-accent/50 text-muted-foreground border-border', dot: '' },
  }
  const sc = statusConfig[room.status]
  const linkPath = `/room/${room.code}`

  // Calculate top option
  const topOption = room.options.reduce((best, opt, idx) => {
    const pool = room.bets.filter(b => b.option_idx === idx).reduce((s, b) => s + b.amount, 0)
    return pool > best.pool ? { label: opt, pool, pct: room.total_pool > 0 ? Math.round((pool / room.total_pool) * 100) : 0 } : best
  }, { label: '', pool: 0, pct: 0 })

  return (
    <Link href={linkPath} className="block group">
      <div 
        className="p-5 rounded-xl bg-card shadow-sm hover:shadow-md transition-all duration-200 border border-border"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <h3 className="text-[15px] font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-muted-foreground transition-colors lowercase first-letter:capitalize">{room.description}</h3>
          <Badge variant="outline" className={`${sc.class} text-[10px] shrink-0 font-bold px-2 py-0.5 gap-1.5`}>
            {isLive && (
              <span className="relative flex h-1.5 w-1.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${sc.dot} opacity-75`} />
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${sc.dot}`} />
              </span>
            )}
            {sc.label}
          </Badge>
        </div>
        
        {topOption.label && room.total_pool > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground/80 font-medium truncate">{topOption.label}</span>
              <span className="font-mono font-bold text-foreground">{topOption.pct}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden bg-accent">
              <div className="h-full rounded-full transition-all duration-500 bg-foreground" style={{ width: `${topOption.pct}%` }} />
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 text-[11px] font-medium text-muted-foreground/60">
          <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{room.bets.length}</span>
          <span className="flex items-center gap-1.5"><Coins className="w-3.5 h-3.5" />{room.total_pool.toFixed(1)} XLM</span>
          <span className="font-mono ml-auto opacity-50 font-bold tracking-widest">{room.code}</span>
        </div>
      </div>
    </Link>
  )
}

export function Dashboard() {
  const { user, isConnected } = useWallet()
  const [rooms, setRooms] = useState<OnChainRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [globalStats, setGlobalStats] = useState({ tvl: 0, activeCount: 0 })
  const [userEarnings, setUserEarnings] = useState(0)

  useEffect(() => {
    const fetchRooms = async () => {
      if (user) {
        const [fetchedUser, fetchedAll] = await Promise.all([
          getUserRooms(user.walletAddress),
          getAllRooms()
        ])
        setRooms(fetchedUser)
        
        // Global Stats
        const activeAll = fetchedAll.filter(r => r.status === 'Open')
        const tvl = activeAll.reduce((sum, r) => sum + r.total_pool, 0)
        setGlobalStats({ tvl, activeCount: activeAll.length })
        
        // User Earnings
        let earnings = 0
        fetchedUser.filter(r => r.status === 'Resolved').forEach(r => {
          const payouts = calculatePayouts(r)
          const myPayout = payouts.find(p => p.address === user.walletAddress)
          if (myPayout && myPayout.isWinner) {
            earnings += myPayout.profit
          }
        })
        setUserEarnings(earnings)
      }
      setLoading(false)
    }
    fetchRooms()
  }, [user])

  if (!isConnected) return null

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-20 text-center">
        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground/40">Loading rooms…</p>
      </div>
    )
  }

  const activeRooms = rooms.filter(r => r.status === 'Open')
  const pastRooms = rooms.filter(r => r.status !== 'Open')

  if (rooms.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-5 py-8 space-y-8">
        
        {/* Real-Time Dashboard Stats (Even when empty user rooms) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
             <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total Value Locked</div>
             <div className="text-3xl font-bold text-foreground">{globalStats.tvl.toFixed(1)} <span className="text-lg text-muted-foreground/50 font-medium">XLM</span></div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
             <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Active Predictions</div>
             <div className="text-3xl font-bold text-foreground">{globalStats.activeCount}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
             <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Your Earnings</div>
             <div className="text-3xl font-bold text-foreground">+{userEarnings.toFixed(1)} <span className="text-lg opacity-50 font-medium">XLM</span></div>
          </div>
        </div>

        {/* Enhanced Empty State - GenZ Edition */}
        <div className="text-center py-20 px-5 rounded-2xl border border-border bg-card shadow-sm max-w-2xl mx-auto relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6 bg-accent border border-border">
              <Sparkles className="w-8 h-8 text-foreground" />
            </div>
            
            <h2 className="text-3xl font-medium tracking-tight mb-3 lowercase">no active bets.</h2>
            <p className="text-base text-muted-foreground mb-10 max-w-sm mx-auto">Start a room, send the link to the group chat, and settle your predictions on-chain.</p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
              <Button asChild size="lg" className="w-full sm:w-auto h-12 rounded-lg bg-foreground hover:bg-foreground/90 transition-all text-background px-8 shadow-sm">
                <Link href="/create"><Plus className="w-5 h-5 mr-1.5" /> Start a Room</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto h-12 rounded-lg border border-border bg-transparent hover:bg-accent px-8 shadow-sm transition-all">
                <Link href="/join">Join a Room</Link>
              </Button>
            </div>

            <div className="text-left max-w-md mx-auto space-y-4 bg-slate-50 rounded-2xl p-6 border border-border">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">how we operate</h3>
              
              <div className="flex items-start gap-3">
                <div className="text-lg leading-none mt-0.5">🤖</div>
                <div>
                  <div className="text-sm font-bold text-foreground">zero middlemen</div>
                  <div className="text-[13px] text-muted-foreground">smart contracts hold the bag until the bet settles. no sketchy servers.</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="text-lg leading-none mt-0.5">💸</div>
                <div>
                  <div className="text-sm font-bold text-foreground">auto-payouts</div>
                  <div className="text-[13px] text-muted-foreground">winner takes all. money goes straight to your wallet instantly.</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="text-lg leading-none mt-0.5">🔒</div>
                <div>
                  <div className="text-sm font-bold text-foreground">your keys, your crypto</div>
                  <div className="text-[13px] text-muted-foreground">we literally cannot touch your funds. strictly non-custodial vibes.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-5 py-8">
      
      {/* Real-Time Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
           <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Total Value Locked</div>
           <div className="text-3xl font-bold text-foreground">{globalStats.tvl.toFixed(1)} <span className="text-xs text-muted-foreground/50 font-semibold uppercase ml-1">XLM</span></div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
           <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Active Predictions</div>
           <div className="text-3xl font-bold text-foreground">{globalStats.activeCount}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
           <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Your Earnings</div>
           <div className="text-3xl font-bold text-foreground">+{userEarnings.toFixed(1)} <span className="text-xs font-semibold uppercase ml-1 text-muted-foreground/50">XLM</span></div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">Your Rooms</h2>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="h-8 rounded-lg border border-border bg-transparent hover:bg-accent text-xs px-3">
            <Link href="/join">Join</Link>
          </Button>
          <Button asChild size="sm" className="h-8 rounded-lg bg-foreground hover:bg-foreground/90 text-background text-xs px-3">
            <Link href="/create"><Plus className="w-3.5 h-3.5 mr-1" />Create</Link>
          </Button>
        </div>
      </div>

      {activeRooms.length > 0 && (
        <div className="mb-10">
          <h3 className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-4">Active ({activeRooms.length})</h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            {activeRooms.map(room => <RoomCard key={room.id} room={room} />)}
          </div>
        </div>
      )}

      {activeRooms.length > 0 && pastRooms.length > 0 && (
        <hr className="border-border/60 my-10" />
      )}

      {pastRooms.length > 0 && (
        <div>
          <h3 className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-4">Past ({pastRooms.length})</h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            {pastRooms.map(room => <RoomCard key={room.id} room={room} />)}
          </div>
        </div>
      )}
    </div>
  )
}
