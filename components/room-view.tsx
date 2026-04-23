"use client"

import { useState, useEffect, useMemo } from 'react'
import { useWallet } from '@/lib/wallet-context'
import { 
  getRoom, getRoomIdFromCode,
  placeBet, resolveRoom as resolveRoomOnChain, cancelRoom,
  calculatePayouts
} from '@/lib/soroban-client'
import type { OnChainRoom, PayoutInfo } from '@/lib/soroban-client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Coins, 
  Copy, 
  Check, 
  ExternalLink,
  Loader2,
  Trophy,
  AlertCircle,
  Ban,
  ShieldCheck,
  Share2,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ChevronDown,
  BarChart3,
  Clock,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { CONTRACT_ID } from '@/lib/soroban-client'

interface RoomViewProps {
  roomCode: string
}

// ── Probability Bar (Polymarket-style) ──────────────────

function ProbabilityBar({ options, bets, totalPool, winningOption, isResolved }: {
  options: string[]
  bets: { option_idx: number; amount: number }[]
  totalPool: number
  winningOption: number
  isResolved: boolean
}) {
  const segments = options.map((opt, idx) => {
    const optBets = bets.filter(b => b.option_idx === idx)
    const pool = optBets.reduce((s, b) => s + b.amount, 0)
    const pct = totalPool > 0 ? (pool / totalPool) * 100 : 100 / options.length
    return { label: opt, pct: Math.round(pct), pool, count: optBets.length, idx }
  })

  // Colors rotate through a curated palette
  const colors = [
    { bg: 'bg-indigo-500', text: 'text-indigo-400', bar: 'bg-indigo-500/20', ring: 'ring-indigo-500/30' },
    { bg: 'bg-rose-500', text: 'text-rose-400', bar: 'bg-rose-500/20', ring: 'ring-rose-500/30' },
    { bg: 'bg-blue-500', text: 'text-blue-400', bar: 'bg-blue-500/20', ring: 'ring-blue-500/30' },
    { bg: 'bg-amber-500', text: 'text-amber-400', bar: 'bg-amber-500/20', ring: 'ring-amber-500/30' },
    { bg: 'bg-violet-500', text: 'text-violet-400', bar: 'bg-violet-500/20', ring: 'ring-violet-500/30' },
    { bg: 'bg-cyan-500', text: 'text-cyan-400', bar: 'bg-cyan-500/20', ring: 'ring-cyan-500/30' },
  ]

  return (
    <div className="space-y-1">
      {/* Stacked bar */}
      <div className="flex h-2.5 rounded-full overflow-hidden bg-white/[0.04]">
        {segments.map((seg, i) => (
          <div
            key={i}
            className={`${colors[i % colors.length].bg} transition-all duration-700 ease-out ${
              isResolved && seg.idx === winningOption ? 'opacity-100' : isResolved ? 'opacity-30' : 'opacity-80'
            }`}
            style={{ width: `${Math.max(seg.pct, 2)}%` }}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap pt-1">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <div className={`w-2 h-2 rounded-full ${colors[i % colors.length].bg} ${
              isResolved && seg.idx === winningOption ? '' : isResolved ? 'opacity-30' : ''
            }`} />
            <span className={`${isResolved && seg.idx === winningOption ? colors[i % colors.length].text : 'text-muted-foreground'} font-medium`}>
              {seg.label}
            </span>
            <span className={`font-mono ${isResolved && seg.idx === winningOption ? 'text-foreground font-semibold' : 'text-muted-foreground/60'}`}>
              {seg.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Polymarket-style Odds Chart ─────────────────────────

// ── Polymarket-style Odds Chart ─────────────────────────

function OddsChart({ options, bets, totalPool, roomId }: {
  options: string[]
  bets: { option_idx: number; amount: number }[]
  totalPool: number
  roomId: number
}) {
  const colors = ['#818cf8', '#fb7185', '#60a5fa', '#fbbf24', '#a78bfa', '#22d3ee']
  const textColors = ['text-indigo-400', 'text-rose-400', 'text-blue-400', 'text-amber-400', 'text-violet-400', 'text-cyan-400']

  const data = options.map((opt, idx) => {
    const optBets = bets.filter(b => b.option_idx === idx)
    const pool = optBets.reduce((s, b) => s + b.amount, 0)
    const pct = totalPool > 0 ? (pool / totalPool) * 100 : (100 / options.length) // even split if no bets
    return { label: opt, pct, pool, count: optBets.length }
  })

  // Build true history from chronologically ordered bets
  const generateRealPaths = () => {
    const history: number[][] = []
    const currentPools = new Array(options.length).fill(0)
    let currentTotal = 0
    
    // Helper to calculate and record percentages
    const recordState = () => {
       const pcts = currentTotal > 0 
           ? currentPools.map(p => (p / currentTotal) * 100)
           : currentPools.map(() => 100 / options.length)
       history.push(pcts)
    }
    
    // Step 0: Initial neutral state
    recordState()
    
    // Replay each bet in order
    for (const bet of bets) {
       currentPools[bet.option_idx] += bet.amount
       currentTotal += bet.amount
       recordState()
    }
    
    const numSteps = Math.max(history.length - 1, 1)
    const stepX = 1000 / numSteps
    
    return options.map((_, optIdx) => {
       const points = history.map((pcts, stepIdx) => {
          const pct = pcts[optIdx]
          const x = stepIdx * stepX
          const y = Math.max(10, Math.min(290, 290 - (pct * 2.8)))
          return [x, y]
       })
       
       // Create a stepped line chart (horizontal then vertical)
       let path = `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`
       for (let i = 1; i < points.length; i++) {
           path += ` L ${points[i][0].toFixed(1)} ${points[i-1][1].toFixed(1)}` // move right
           path += ` L ${points[i][0].toFixed(1)} ${points[i][1].toFixed(1)}` // jump to new prob
       }
       return path
    })
  }

  const actualPaths = generateRealPaths()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Market Odds Over Time</span>
        </div>
        <span className="text-xs text-muted-foreground/50 font-mono">{totalPool > 0 ? `${totalPool.toFixed(1)} XLM total` : 'No bets yet'}</span>
      </div>

      <div className="relative w-full h-[220px] select-none border border-white/[0.04] rounded-xl bg-black/20 overflow-hidden">
        <svg width="100%" height="100%" viewBox="0 0 1000 300" preserveAspectRatio="none">
          {/* Grid lines */}
          <line x1="0" y1="75" x2="1000" y2="75" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1="0" y1="150" x2="1000" y2="150" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1="0" y1="225" x2="1000" y2="225" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          
          {data.map((d, i) => {
             const endY = 290 - (d.pct * 2.8);
             return (
               <g key={i}>
                 <path d={actualPaths[i]} fill="none" stroke={colors[i % colors.length]} strokeWidth="3" strokeLinejoin="round" />
                 <circle cx="1000" cy={endY} r="5" fill={colors[i % colors.length]} />
               </g>
             )
          })}
        </svg>
        
        {/* Y-axis labels */}
        <div className="absolute top-[65px] left-2 text-[10px] text-muted-foreground/40 font-mono">75%</div>
        <div className="absolute top-[140px] left-2 text-[10px] text-muted-foreground/40 font-mono">50%</div>
        <div className="absolute top-[215px] left-2 text-[10px] text-muted-foreground/40 font-mono">25%</div>
      </div>
      
      {/* Legend */}
      <div className="grid grid-cols-2 gap-3">
        {data.map((d, i) => (
           <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                 <span className="text-xs text-foreground/80 truncate max-w-[100px]">{d.label}</span>
              </div>
              <span className={`text-xs font-mono font-medium ${textColors[i % textColors.length]}`}>{d.pct.toFixed(0)}%</span>
           </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Room View ──────────────────────────────────────

export function RoomView({ roomCode }: RoomViewProps) {
  const { user, isConnected, balance } = useWallet()
  const [room, setRoom] = useState<OnChainRoom | null>(null)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [isResolving, setIsResolving] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [payouts, setPayouts] = useState<PayoutInfo[]>([])
  const [resolvedRoomId, setResolvedRoomId] = useState<number | null>(null)
  const [showParticipants, setShowParticipants] = useState(false)

  useEffect(() => {
    const fetchRoom = async () => {
      let foundRoom: OnChainRoom | null = null
      const roomId = getRoomIdFromCode(roomCode)
      if (roomId !== null) {
        foundRoom = await getRoom(roomId)
        setResolvedRoomId(roomId)
      } else {
        const numericId = parseInt(roomCode, 10)
        if (!isNaN(numericId) && numericId > 0) {
          foundRoom = await getRoom(numericId)
          setResolvedRoomId(numericId)
        }
      }
      if (foundRoom) {
        setRoom(foundRoom)
        if (foundRoom.status === 'Resolved') {
          setPayouts(calculatePayouts(foundRoom))
        }
      }
      setLoading(false)
    }
    fetchRoom()
    const interval = setInterval(fetchRoom, 10000)
    return () => clearInterval(interval)
  }, [roomCode])

  const copyContractId = () => { navigator.clipboard.writeText(CONTRACT_ID); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  const copyRoomLink = () => { 
    const shareCode = room?.code || roomCode
    navigator.clipboard.writeText(`${window.location.origin}/room/${shareCode}`)
    setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000) 
  }

  const handleJoin = async () => {
    if (!user || !room || selectedOption === null || resolvedRoomId === null) return
    setIsJoining(true)
    try {
      await placeBet(user.walletAddress, resolvedRoomId, selectedOption)
      const updated = await getRoom(resolvedRoomId)
      if (updated) setRoom(updated)
    } catch (error) {
      alert(error instanceof Error ? error.message : JSON.stringify(error))
    } finally { setIsJoining(false) }
  }

  const handleResolve = async (winningOptionIdx: number) => {
    if (!user || !room || resolvedRoomId === null) return
    setIsResolving(true)
    try {
      await resolveRoomOnChain(user.walletAddress, resolvedRoomId, winningOptionIdx)
      const updated = await getRoom(resolvedRoomId)
      if (updated) { setRoom(updated); setPayouts(calculatePayouts(updated)); setResolveDialogOpen(false) }
    } catch (error) {
      alert(error instanceof Error ? error.message : JSON.stringify(error))
    } finally { setIsResolving(false) }
  }

  const handleCancel = async () => {
    if (!user || !room || resolvedRoomId === null) return
    setIsCancelling(true)
    try {
      await cancelRoom(user.walletAddress, resolvedRoomId)
      const updated = await getRoom(resolvedRoomId)
      if (updated) setRoom(updated)
    } catch (error) {
      alert(error instanceof Error ? error.message : JSON.stringify(error))
    } finally { setIsCancelling(false) }
  }

  // ── Loading / Not found ──

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-12">
          <div className="text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-primary" />
            <p className="text-sm text-muted-foreground">Reading contract state…</p>
          </div>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-12">
          <div className="text-center">
            <AlertCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <h2 className="text-base font-semibold mb-1">Room not found</h2>
            <p className="text-sm text-muted-foreground">&quot;{roomCode}&quot; doesn&apos;t exist on-chain.</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Computed state ──

  const isCreator = user?.walletAddress === room.creator
  const hasJoined = room.bets.some(b => b.bettor === user?.walletAddress)
  const userBet = room.bets.find(b => b.bettor === user?.walletAddress)
  const canJoin = isConnected && !hasJoined && room.status === 'Open'
  const canResolve = isCreator && room.status === 'Open' && room.bets.length > 0
  const canCancel = isCreator && room.status === 'Open'
  const displayCode = room.code || roomCode
  const userPayout = payouts.find(p => p.address === user?.walletAddress)

  const statusConfig = {
    Open: { label: 'Live', class: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', dot: 'bg-indigo-400' },
    Resolved: { label: 'Resolved', class: 'bg-primary/10 text-primary border-primary/20', dot: 'bg-primary' },
    Cancelled: { label: 'Cancelled', class: 'bg-red-500/10 text-red-400 border-red-500/20', dot: 'bg-red-400' },
  }

  const sc = statusConfig[room.status]

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* ── Header Card ── */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
        
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04] bg-white/[0.005]">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={`${sc.class} gap-1.5 text-xs font-medium px-2 py-0.5`}>
              {room.status === 'Open' && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${sc.dot} opacity-75`} />
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${sc.dot}`} />
                </span>
              )}
              {sc.label}
            </Badge>
            {isCreator && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 border-white/[0.1]">Creator</Badge>}
          </div>
          
          {/* Room Code Prominent Display */}
          <div className="flex items-center gap-2">
             <span className="text-xs font-medium text-muted-foreground/60 hidden sm:inline-block">Room Code:</span>
             <button 
               onClick={copyRoomLink}
               className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-500/40 transition-all active:scale-95"
               title="Copy Invite Link"
             >
               <span className="font-mono text-sm font-bold text-indigo-400 tracking-[0.15em] uppercase">{displayCode}</span>
               {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400/50 group-hover:text-indigo-400" />}
             </button>
          </div>
        </div>

        {/* Question */}
        <div className="px-5 pt-5 pb-4">
          <h1 className="text-lg font-semibold leading-snug text-foreground/95">{room.description}</h1>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground/60">
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{room.bets.length} participant{room.bets.length !== 1 ? 's' : ''}</span>
            <span className="flex items-center gap-1"><Coins className="w-3.5 h-3.5" />{room.total_pool.toFixed(1)} XLM pool</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{room.stake_amount} XLM entry</span>
          </div>
        </div>

        {/* Probability bar */}
        <div className="px-5 pb-5">
          <ProbabilityBar 
            options={room.options} 
            bets={room.bets} 
            totalPool={room.total_pool} 
            winningOption={room.winning_option}
            isResolved={room.status === 'Resolved'}
          />
        </div>
      </div>

      {/* ── Odds Chart ── */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5">
        <OddsChart options={room.options} bets={room.bets} totalPool={room.total_pool} roomId={resolvedRoomId || 0} />
      </div>

      {/* ── Bet / Resolution Section ── */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
        
        {/* Betting options (only when room is open) */}
        {room.status === 'Open' && (
          <div className="p-5 space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              {canJoin ? 'Select your prediction' : hasJoined ? 'Your prediction' : 'Predictions'}
            </h3>
            <div className="grid gap-2">
              {room.options.map((option, index) => {
                const optBets = room.bets.filter(b => b.option_idx === index)
                const pct = room.total_pool > 0 ? Math.round((optBets.reduce((s, b) => s + b.amount, 0) / room.total_pool) * 100) : 0
                const isSelected = selectedOption === index
                const isUserBet = userBet?.option_idx === index

                return (
                  <button
                    key={index}
                    onClick={() => canJoin && setSelectedOption(index)}
                    disabled={!canJoin}
                    className={`
                      flex items-center justify-between p-3.5 rounded-xl border text-left transition-all duration-200
                      ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                        : isUserBet ? 'border-primary/40 bg-primary/[0.03]'
                        : 'border-white/[0.06] hover:border-white/[0.12] bg-white/[0.01]'}
                      ${canJoin ? 'cursor-pointer' : 'cursor-default'}
                    `}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all
                        ${isSelected ? 'border-primary' : isUserBet ? 'border-primary/50' : 'border-white/[0.15]'}
                      `}>
                        {(isSelected || isUserBet) && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <span className="text-sm font-medium text-foreground/90">{option}</span>
                      {isUserBet && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Your bet</Badge>}
                    </div>
                    <span className="text-xs font-mono text-muted-foreground/50">{pct}%</span>
                  </button>
                )
              })}
            </div>

            {/* Place bet button */}
            {canJoin && (
              <div className="pt-2 space-y-2">
                {balance !== null && balance < room.stake_amount && (
                  <p className="text-xs text-red-400">Insufficient balance. Need {room.stake_amount} XLM.</p>
                )}
                <Button
                  onClick={handleJoin}
                  disabled={selectedOption === null || isJoining || (balance !== null && balance < room.stake_amount)}
                  className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-sm font-medium"
                >
                  {isJoining ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Confirming in Freighter…</>
                  ) : (
                    <>Place Bet · {room.stake_amount} XLM</>
                  )}
                </Button>
              </div>
            )}

            {hasJoined && (
              <div className="flex items-center justify-center gap-2 py-2 text-sm text-primary/70">
                <Check className="w-3.5 h-3.5" />
                <span>You bet {userBet?.amount} XLM on <strong>{room.options[userBet?.option_idx || 0]}</strong></span>
              </div>
            )}
          </div>
        )}

        {/* Resolved state */}
        {room.status === 'Resolved' && (
          <div className="p-5 space-y-4">
            {/* Winner */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-accent/5 border border-accent/10">
              <Trophy className="w-5 h-5 text-accent shrink-0" />
              <div>
                <div className="text-sm font-medium">Winning outcome</div>
                <div className="text-base font-semibold text-accent">{room.options[room.winning_option]}</div>
              </div>
            </div>

            {/* Your result */}
            {userPayout && (
              <div className={`flex items-center justify-between p-4 rounded-xl border ${
                userPayout.isWinner ? 'bg-indigo-500/5 border-indigo-500/10' : 'bg-red-500/5 border-red-500/10'
              }`}>
                <div className="flex items-center gap-2.5">
                  {userPayout.isWinner ? <TrendingUp className="w-4 h-4 text-indigo-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
                  <span className="text-sm font-medium">{userPayout.isWinner ? 'You won!' : 'Better luck next time'}</span>
                </div>
                <div className="text-right">
                  <div className={`font-mono font-semibold text-sm ${userPayout.isWinner ? 'text-indigo-400' : 'text-red-400'}`}>
                    {userPayout.isWinner ? '+' : ''}{userPayout.profit.toFixed(1)} XLM
                  </div>
                  <div className="text-[11px] text-muted-foreground/50 font-mono">
                    {userPayout.betAmount.toFixed(1)} → {userPayout.payout.toFixed(1)} XLM
                  </div>
                </div>
              </div>
            )}

            {/* Payouts table */}
            {payouts.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground/50 uppercase tracking-wider">Settlement</span>
                <div className="divide-y divide-white/[0.04]">
                  {payouts.map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-muted-foreground/60">{p.address.slice(0, 4)}…{p.address.slice(-4)}</span>
                        {p.address === user?.walletAddress && <Badge variant="secondary" className="text-[9px] px-1 py-0">You</Badge>}
                        {p.isWinner && <Trophy className="w-3 h-3 text-accent" />}
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-muted-foreground/40">{p.betAmount.toFixed(1)}</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground/20" />
                        <span className={p.isWinner ? 'text-indigo-400 font-medium' : 'text-red-400'}>{p.payout.toFixed(1)} XLM</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cancelled state */}
        {room.status === 'Cancelled' && (
          <div className="p-5">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
              <Ban className="w-5 h-5 text-red-400 shrink-0" />
              <div className="text-sm"><strong className="text-red-400">Cancelled</strong> — all bets have been refunded on-chain.</div>
            </div>
          </div>
        )}

        {/* Creator actions */}
        {(canResolve || canCancel) && (
          <div className="flex gap-2 px-5 pb-5">
            {canResolve && (
              <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1 h-10 rounded-xl text-sm border-white/[0.08]">
                    <Trophy className="w-3.5 h-3.5 mr-2" />Resolve
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Declare Winner</DialogTitle>
                    <DialogDescription>
                      The smart contract will automatically distribute the pool. This is irreversible.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-2 pt-2">
                    {room.options.map((option, index) => (
                      <Button key={index} variant="outline" onClick={() => handleResolve(index)} disabled={isResolving} className="justify-start h-11 rounded-xl">
                        {isResolving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trophy className="w-4 h-4 mr-2" />}
                        {option}
                      </Button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            )}
            {canCancel && (
              <Button variant="outline" className="flex-1 h-10 rounded-xl text-sm border-red-500/20 text-red-400 hover:bg-red-500/5 hover:text-red-300" onClick={handleCancel} disabled={isCancelling}>
                {isCancelling ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Ban className="w-3.5 h-3.5 mr-2" />}
                Cancel
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ── Participants (collapsible) ── */}
      {room.bets.length > 0 && room.status === 'Open' && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
          <button 
            onClick={() => setShowParticipants(!showParticipants)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="font-medium">Participants ({room.bets.length})</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showParticipants ? 'rotate-180' : ''}`} />
          </button>
          {showParticipants && (
            <div className="px-5 pb-4 divide-y divide-white/[0.04]">
              {room.bets.map((bet, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-white/[0.04] flex items-center justify-center text-[10px] font-mono text-muted-foreground/60">
                      {bet.bettor.slice(0, 2)}
                    </div>
                    <span className="font-mono text-muted-foreground/60">{bet.bettor.slice(0, 4)}…{bet.bettor.slice(-4)}</span>
                    {bet.bettor === user?.walletAddress && <Badge variant="secondary" className="text-[9px] px-1 py-0">You</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-white/[0.06]">{room.options[bet.option_idx]}</Badge>
                    <span className="font-mono text-muted-foreground/40">{bet.amount} XLM</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Footer: on-chain verification ── */}
      <div className="flex items-center justify-center gap-4 py-3 text-[11px] text-muted-foreground/30">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-indigo-500/50" />
          <span className="font-mono">{CONTRACT_ID.slice(0, 6)}…{CONTRACT_ID.slice(-6)}</span>
        </div>
        <span>·</span>
        <a
          href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-muted-foreground/60 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Stellar Explorer
        </a>
      </div>
    </div>
  )
}
