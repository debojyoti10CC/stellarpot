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
  Twitter,
  Activity,
  Timer,
  TrendingUp as TrendingUpIcon,
  Flame,
  Sparkles,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts'
import { CONTRACT_ID } from '@/lib/soroban-client'

interface RoomViewProps {
  roomCode: string
}

// ── Visual Data & Statistics ──────────────────────────────

const CHART_COLORS = [
  'var(--color-chart-1)', 
  'var(--color-chart-2)', 
  'var(--color-chart-3)', 
  'var(--color-chart-4)', 
  'var(--color-chart-5)'
]

function PoolDistribution({ options, bets, totalPool }: { options: string[], bets: any[], totalPool: number }) {
  const data = options.map((opt, idx) => {
    const pool = bets.filter(b => b.option_idx === idx).reduce((s, b) => s + b.amount, 0)
    return { name: opt, value: pool, color: CHART_COLORS[idx % CHART_COLORS.length] }
  })

  // If no bets, show a flat distribution
  const chartData = totalPool > 0 ? data.filter(d => d.value > 0) : data.map(d => ({...d, value: 1}))

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <div className="h-[200px] w-full md:w-1/2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
              {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} opacity={totalPool > 0 ? 1 : 0.3} />)}
            </Pie>
            {totalPool > 0 && (
              <RechartsTooltip 
                formatter={(value: number) => [`${value.toFixed(1)} XLM`, 'Pool']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="w-full md:w-1/2 space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Live Pool Distribution</h4>
        {data.map((d, i) => {
          const pct = totalPool > 0 ? Math.round((d.value / totalPool) * 100) : 0;
          return (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-sm font-medium text-foreground/80">{d.name}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold block">{pct}%</span>
                <span className="text-[10px] text-muted-foreground font-mono">{d.value.toFixed(1)} XLM</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function VolumeTrends({ bets }: { bets: any[] }) {
  let cumulative = 0
  const data = [{ name: 'Start', volume: 0 }]
  bets.forEach((b, i) => {
    cumulative += b.amount
    data.push({ name: `Bet ${i+1}`, volume: cumulative })
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUpIcon className="w-4 h-4 text-muted-foreground" />
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Staking Volume Trends</h4>
      </div>
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
            <XAxis dataKey="name" hide />
            <YAxis tickFormatter={(val) => `${val} XLM`} style={{ fontSize: '10px', fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <RechartsTooltip 
              contentStyle={{ borderRadius: '12px', border: '1px solid var(--color-border)', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
              labelStyle={{ color: '#64748b' }}
            />
            <Area type="monotone" dataKey="volume" stroke="var(--color-chart-1)" strokeWidth={3} fillOpacity={1} fill="url(#colorVol)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function ActivityFeed({ bets, options }: { bets: any[], options: string[] }) {
  const reversed = [...bets].reverse()
  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-muted-foreground" />
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Activity</h4>
      </div>
      <ScrollArea className="flex-1 w-full pr-4">
        {reversed.length === 0 ? (
          <p className="text-sm text-muted-foreground/50 text-center py-8">No bets placed yet.</p>
        ) : (
          <div className="space-y-5">
            {reversed.map((bet, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-border flex items-center justify-center shrink-0 shadow-sm">
                  <span className="text-[10px] font-mono font-bold text-foreground/60">{bet.bettor.slice(0,2)}</span>
                </div>
                <div className="pt-0.5">
                  <p className="text-[13px] leading-tight text-foreground/80">
                    <span className="font-mono font-bold text-foreground">{bet.bettor.slice(0,4)}…{bet.bettor.slice(-4)}</span> staked <strong className="text-foreground">{bet.amount} XLM</strong> on <strong style={{ color: 'var(--color-chart-1)' }}>{options[bet.option_idx]}</strong>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
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
  const [currentLedger, setCurrentLedger] = useState<number | null>(null)

  useEffect(() => {
    fetch('https://horizon-testnet.stellar.org')
      .then(r => r.json())
      .then(d => setCurrentLedger(d.core_latest_ledger))
      .catch(() => {})

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
    const interval = setInterval(() => {
      fetchRoom()
      fetch('https://horizon-testnet.stellar.org').then(r => r.json()).then(d => setCurrentLedger(d.core_latest_ledger)).catch(() => {})
    }, 10000)
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
        <div className="rounded-2xl border border-border bg-card shadow-sm p-12">
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
        <div className="rounded-2xl border border-border bg-card shadow-sm p-12">
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

  // Derived metrics
  const isHighVolume = room.total_pool >= 50
  const isNew = room.bets.length === 0
  const ledgersRemaining = currentLedger && room.status === 'Open' ? Math.max(0, room.expiry_ledger - currentLedger) : 0
  const isEndingSoon = room.status === 'Open' && ledgersRemaining > 0 && ledgersRemaining < 17280 // ~24 hrs
  
  const estimatedSecondsLeft = ledgersRemaining * 5
  const hoursLeft = Math.floor(estimatedSecondsLeft / 3600)
  const minutesLeft = Math.floor((estimatedSecondsLeft % 3600) / 60)
  
  const tweetText = encodeURIComponent(`I just placed a prediction on "${room.description}" in StellarPot!\n\nJoin the market: ${typeof window !== 'undefined' ? window.location.origin : ''}/room/${displayCode}\n\n#Stellar #PredictionMarket`)

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ── Header Card ── */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        
        {/* Top bar with Risk Metrics & Status */}
        <div className="flex flex-wrap items-center justify-between px-5 py-4 border-b border-border bg-slate-50/50 gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={`${sc.class} gap-1.5 text-xs font-medium px-2 py-0.5`}>
              {room.status === 'Open' && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${sc.dot} opacity-75`} />
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${sc.dot}`} />
                </span>
              )}
              {sc.label}
            </Badge>
            {isCreator && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 border-border">Creator</Badge>}
            
            {/* Risk Metrics */}
            {isHighVolume && (
              <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/20 px-1.5 py-0 gap-1">
                <Flame className="w-3 h-3" /> Trending
              </Badge>
            )}
            {isNew && room.status === 'Open' && (
              <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-500 border-blue-500/20 px-1.5 py-0 gap-1">
                <Sparkles className="w-3 h-3" /> New
              </Badge>
            )}
            {isEndingSoon && (
              <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-500 border-rose-500/20 px-1.5 py-0 gap-1 animate-pulse">
                <Timer className="w-3 h-3" /> Ending Soon
              </Badge>
            )}
          </div>
          
          {/* Room Code & Social Share */}
          <div className="flex items-center gap-2 ml-auto">
             <a 
               href={`https://twitter.com/intent/tweet?text=${tweetText}`}
               target="_blank"
               rel="noopener noreferrer"
               className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-all active:scale-95"
               title="Share on Twitter"
             >
               <Twitter className="w-4 h-4" />
             </a>
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

        {/* Question & Meta info */}
        <div className="px-5 pt-5 pb-5">
          <h1 className="text-xl sm:text-2xl font-semibold leading-snug text-foreground/95 mb-4">{room.description}</h1>
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground/60">
            <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{room.bets.length} participant{room.bets.length !== 1 ? 's' : ''}</span>
            <span className="flex items-center gap-1.5"><Coins className="w-4 h-4" />{room.total_pool.toFixed(1)} XLM pool</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" />{room.stake_amount} XLM entry</span>
            {room.status === 'Open' && currentLedger && (
              <span className="flex items-center gap-1.5 text-indigo-500/80">
                <Timer className="w-4 h-4" /> 
                {hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : minutesLeft > 0 ? `${minutesLeft}m` : '<1m'} remaining
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Dashboard Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Stats & Visuals) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
            <PoolDistribution options={room.options} bets={room.bets} totalPool={room.total_pool} />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
              <VolumeTrends bets={room.bets} />
            </div>
            <div className="rounded-2xl border border-border bg-card shadow-sm p-6 h-[270px]">
              <ActivityFeed bets={room.bets} options={room.options} />
            </div>
          </div>
        </div>

        {/* Right Column (Betting Panel) */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden sticky top-24">
        
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
                        : 'border-border hover:border-border/80 bg-card hover:bg-slate-50'}
                      ${canJoin ? 'cursor-pointer' : 'cursor-default'}
                    `}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all
                        ${isSelected ? 'border-primary' : isUserBet ? 'border-primary/50' : 'border-border'}
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
                <div className="divide-y divide-border">
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
                  <Button variant="outline" className="flex-1 h-10 rounded-xl text-sm border-border">
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
      </div>
      </div>
      {/* ── Footer: on-chain verification ── */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-6 text-[11px] text-muted-foreground/40">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-indigo-500/50" />
          <span className="font-mono">Contract: {CONTRACT_ID.slice(0, 8)}…{CONTRACT_ID.slice(-8)}</span>
        </div>
        <span className="hidden sm:inline-block">·</span>
        <a
          href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-muted-foreground transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          View on Stellar Explorer
        </a>
      </div>
    </div>
  )
}
