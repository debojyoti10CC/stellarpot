"use client"

import { useState, useEffect } from 'react'
import { useWallet } from '@/lib/wallet-context'
import { getUserRooms } from '@/lib/soroban-client'
import type { OnChainRoom } from '@/lib/soroban-client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Coins, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

function RoomCard({ room }: { room: OnChainRoom }) {
  const statusConfig = {
    Open: { label: 'Live', class: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
    Resolved: { label: 'Resolved', class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    Cancelled: { label: 'Cancelled', class: 'bg-red-500/10 text-red-400 border-red-500/20' },
  }
  const sc = statusConfig[room.status]
  const linkPath = room.code ? `/room/${room.code}` : `/room/${room.id}`

  // Calculate top option
  const topOption = room.options.reduce((best, opt, idx) => {
    const pool = room.bets.filter(b => b.option_idx === idx).reduce((s, b) => s + b.amount, 0)
    return pool > best.pool ? { label: opt, pool, pct: room.total_pool > 0 ? Math.round((pool / room.total_pool) * 100) : 0 } : best
  }, { label: '', pool: 0, pct: 0 })

  return (
    <Link href={linkPath} className="block group">
      <div className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:border-white/[0.1] transition-all duration-200">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-sm font-medium text-foreground/90 leading-snug line-clamp-2 group-hover:text-foreground transition-colors">{room.description}</h3>
          <Badge variant="outline" className={`${sc.class} text-[10px] shrink-0`}>{sc.label}</Badge>
        </div>
        
        {topOption.label && room.total_pool > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground/60 truncate">{topOption.label}</span>
              <span className="font-mono text-indigo-400">{topOption.pct}%</span>
            </div>
            <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
              <div className="h-full bg-indigo-500/40 rounded-full" style={{ width: `${topOption.pct}%` }} />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 text-[11px] text-muted-foreground/40">
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{room.bets.length}</span>
          <span className="flex items-center gap-1"><Coins className="w-3 h-3" />{room.total_pool.toFixed(1)} XLM</span>
          <span className="font-mono ml-auto">{room.code || `#${room.id}`}</span>
        </div>
      </div>
    </Link>
  )
}

export function Dashboard() {
  const { user, isConnected } = useWallet()
  const [rooms, setRooms] = useState<OnChainRoom[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRooms = async () => {
      if (user) {
        const fetched = await getUserRooms(user.walletAddress)
        setRooms(fetched)
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
      <div className="max-w-3xl mx-auto px-5 py-20">
        <div className="text-center py-16 rounded-xl border border-dashed border-white/[0.06]">
          <div className="text-3xl mb-3">🎯</div>
          <h2 className="text-base font-semibold mb-1">No rooms yet</h2>
          <p className="text-sm text-muted-foreground/50 mb-6">Create a prediction or join one with a room code</p>
          <div className="flex items-center justify-center gap-3">
            <Button asChild size="sm" className="h-9 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-black text-xs font-semibold px-4">
              <Link href="/create"><Plus className="w-3.5 h-3.5 mr-1.5" />Create</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="h-9 rounded-lg border-white/[0.08] text-xs px-4">
              <Link href="/join">Join Room</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-5 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Your Rooms</h2>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="h-8 rounded-lg border-white/[0.06] text-xs px-3">
            <Link href="/join">Join</Link>
          </Button>
          <Button asChild size="sm" className="h-8 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-black text-xs font-semibold px-3">
            <Link href="/create"><Plus className="w-3.5 h-3.5 mr-1" />Create</Link>
          </Button>
        </div>
      </div>

      {activeRooms.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xs font-medium text-muted-foreground/40 uppercase tracking-wider mb-3">Active ({activeRooms.length})</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {activeRooms.map(room => <RoomCard key={room.id} room={room} />)}
          </div>
        </div>
      )}

      {pastRooms.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-muted-foreground/40 uppercase tracking-wider mb-3">Past ({pastRooms.length})</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {pastRooms.map(room => <RoomCard key={room.id} room={room} />)}
          </div>
        </div>
      )}
    </div>
  )
}
