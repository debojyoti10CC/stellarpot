"use client"

import { useState, useEffect } from 'react'
import { useWallet } from '@/lib/wallet-context'
import { getRoom, placeBet, resolveRoom as resolveRoomOnChain, cancelRoom } from '@/lib/soroban-client'
import type { OnChainRoom } from '@/lib/soroban-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Clock, 
  Coins, 
  Copy, 
  Check, 
  ExternalLink,
  Loader2,
  Trophy,
  AlertCircle,
  Ban,
  ShieldCheck
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
  roomCode: string // This is now a room ID (number)
}

export function RoomView({ roomCode }: RoomViewProps) {
  const { user, isConnected, balance } = useWallet()
  const [room, setRoom] = useState<OnChainRoom | null>(null)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [isResolving, setIsResolving] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [copied, setCopied] = useState(false)
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const roomId = parseInt(roomCode, 10)

  useEffect(() => {
    const fetchRoom = async () => {
      const foundRoom = await getRoom(roomId)
      if (foundRoom) {
        setRoom(foundRoom)
      }
      setLoading(false)
    }
    fetchRoom()
    // Poll for updates every 10 seconds (on-chain reads)
    const interval = setInterval(fetchRoom, 10000)
    return () => clearInterval(interval)
  }, [roomId])

  const copyContractId = () => {
    navigator.clipboard.writeText(CONTRACT_ID)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleJoin = async () => {
    if (!user || !room || selectedOption === null) return

    setIsJoining(true)
    try {
      // This calls the Soroban contract's place_bet function
      // The contract transfers XLM from user -> contract address
      // No server involved. Freighter prompts for signature.
      const txHash = await placeBet(
        user.walletAddress,
        roomId,
        selectedOption,
      )
      console.log('Bet placed, tx:', txHash)
      
      // Refresh room state from chain
      const updated = await getRoom(roomId)
      if (updated) setRoom(updated)
    } catch (error) {
      console.error('Failed to place bet:', error)
      alert("Transaction failed: " + (error instanceof Error ? error.message : JSON.stringify(error)))
    } finally {
      setIsJoining(false)
    }
  }

  const handleResolve = async (winningOptionIdx: number) => {
    if (!user || !room) return

    setIsResolving(true)
    try {
      // The Soroban contract distributes funds to winners automatically
      // No server touches the money. It's all on-chain.
      const txHash = await resolveRoomOnChain(
        user.walletAddress,
        roomId,
        winningOptionIdx,
      )
      console.log('Room resolved, tx:', txHash)
      
      const updated = await getRoom(roomId)
      if (updated) {
        setRoom(updated)
        setResolveDialogOpen(false)
      }
    } catch (error) {
      console.error('Failed to resolve room:', error)
      alert("Resolution failed: " + (error instanceof Error ? error.message : JSON.stringify(error)))
    } finally {
      setIsResolving(false)
    }
  }

  const handleCancel = async () => {
    if (!user || !room) return

    setIsCancelling(true)
    try {
      const txHash = await cancelRoom(user.walletAddress, roomId)
      console.log('Room cancelled, tx:', txHash)
      
      const updated = await getRoom(roomId)
      if (updated) setRoom(updated)
    } catch (error) {
      console.error('Failed to cancel:', error)
      alert("Cancel failed: " + (error instanceof Error ? error.message : JSON.stringify(error)))
    } finally {
      setIsCancelling(false)
    }
  }

  if (loading) {
    return (
      <Card className="max-w-2xl mx-auto glass rounded-2xl border-white/[0.06]">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Reading from Soroban contract...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!room) {
    return (
      <Card className="max-w-2xl mx-auto glass rounded-2xl border-white/[0.06]">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Room Not Found</h2>
            <p className="text-muted-foreground">
              Room #{roomCode} doesn&apos;t exist on-chain.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isCreator = user?.walletAddress === room.creator
  const hasJoined = room.bets.some(
    b => b.bettor === user?.walletAddress
  )
  const userBet = room.bets.find(
    b => b.bettor === user?.walletAddress
  )
  const canJoin = isConnected && !hasJoined && room.status === 'Open'
  const canResolve = isCreator && room.status === 'Open' && room.bets.length > 0
  const canCancel = isCreator && room.status === 'Open'

  const statusColors = {
    Open: 'bg-green-500/10 text-green-500 border-green-500/20',
    Resolved: 'bg-primary/10 text-primary border-primary/20',
    Cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
  }

  // Calculate potential winnings
  const getOptionStats = (optionIdx: number) => {
    const optionBets = room.bets.filter(b => b.option_idx === optionIdx)
    const optionPool = optionBets.reduce((sum, b) => sum + b.amount, 0)
    return {
      count: optionBets.length,
      pool: optionPool,
      percentage: room.total_pool > 0 ? Math.round((optionPool / room.total_pool) * 100) : 0,
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* On-chain verification badge */}
      <div className="flex items-center justify-center gap-2.5 p-3 rounded-xl glass border-emerald-500/10 text-sm animate-fade-in">
        <ShieldCheck className="w-4 h-4 text-green-500" />
        <span className="text-green-400">On-Chain Verified — All state lives in Soroban Contract</span>
      </div>

      <Card className="glass rounded-2xl border-white/[0.06] animate-scale-in">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={statusColors[room.status]}>
                  {room.status}
                </Badge>
                {isCreator && (
                  <Badge variant="secondary">Creator</Badge>
                )}
                <Badge variant="outline" className="font-mono text-xs">
                  Room #{room.id}
                </Badge>
              </div>
              <CardTitle className="text-xl">{room.description}</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyContractId}
              className="shrink-0"
            >
              {copied ? (
                <Check className="w-4 h-4 mr-2" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              Contract
            </Button>
          </div>
          <CardDescription className="flex flex-wrap gap-4 pt-2">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {room.bets.length} bet{room.bets.length !== 1 && 's'}
            </span>
            <span className="flex items-center gap-1.5">
              <Coins className="w-4 h-4" />
              {room.total_pool.toFixed(1)} XLM pool
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Stake: {room.stake_amount} XLM
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Options Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              {room.status === 'Resolved' ? 'Final Results' : 'Select Your Prediction'}
            </h3>
            <div className="grid gap-3">
              {room.options.map((option, index) => {
                const stats = getOptionStats(index)
                const isWinner = room.status === 'Resolved' && room.winning_option === index
                const isSelected = selectedOption === index
                const isUserBet = userBet?.option_idx === index

                return (
                  <button
                    key={index}
                    onClick={() => canJoin && setSelectedOption(index)}
                    disabled={!canJoin}
                    className={`
                      relative p-4 rounded-lg border-2 text-left transition-all
                      ${isWinner 
                        ? 'border-accent bg-accent/10' 
                        : isSelected 
                        ? 'border-primary bg-primary/5' 
                        : isUserBet
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-border hover:border-primary/50'
                      }
                      ${!canJoin && 'cursor-default'}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isWinner && (
                          <Trophy className="w-5 h-5 text-accent" />
                        )}
                        <span className="font-medium">{option}</span>
                        {isUserBet && (
                          <Badge variant="secondary" className="text-xs">
                            Your bet
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{stats.count} bets</div>
                        <div className="text-xs text-muted-foreground">
                          {stats.pool.toFixed(1)} XLM ({stats.percentage}%)
                        </div>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${isWinner ? 'bg-accent' : 'bg-primary/50'}`}
                        style={{ width: `${stats.percentage}%` }}
                      />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Action Buttons */}
          {canJoin && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Entry stake</span>
                <span className="font-mono font-medium">{room.stake_amount} XLM</span>
              </div>
              {balance !== null && balance < room.stake_amount && (
                <p className="text-sm text-destructive">
                  Insufficient balance. You need {room.stake_amount} XLM to join.
                </p>
              )}
              <Button
                onClick={handleJoin}
                disabled={selectedOption === null || isJoining || (balance !== null && balance < room.stake_amount)}
                className="w-full"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing & Submitting...
                  </>
                ) : (
                  <>
                    <Coins className="w-4 h-4 mr-2" />
                    Place Bet ({room.stake_amount} XLM) — On-Chain
                  </>
                )}
              </Button>
            </div>
          )}

          {hasJoined && room.status === 'Open' && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm text-center">
                You bet <span className="font-medium">{userBet?.amount} XLM</span> on{' '}
                <span className="font-medium text-primary">{room.options[userBet?.option_idx || 0]}</span>
              </p>
            </div>
          )}

          {room.status === 'Resolved' && (
            <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
              <div className="flex items-center justify-center gap-2">
                <Trophy className="w-5 h-5 text-accent" />
                <span className="font-medium">
                  Winning answer: {room.options[room.winning_option]}
                </span>
              </div>
              {userBet?.option_idx === room.winning_option && (
                <p className="text-sm text-center mt-2 text-accent">
                  Congratulations! Winnings were sent to your wallet automatically.
                </p>
              )}
            </div>
          )}

          {room.status === 'Cancelled' && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center justify-center gap-2">
                <Ban className="w-5 h-5 text-red-500" />
                <span className="font-medium text-red-400">
                  Room cancelled — all bets refunded on-chain
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {canResolve && (
              <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1">
                    <Trophy className="w-4 h-4 mr-2" />
                    Resolve Prediction
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Resolve Prediction</DialogTitle>
                    <DialogDescription>
                      Select the winning outcome. The smart contract will
                      automatically distribute the pool to all winners. This is
                      an irreversible on-chain transaction.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-2 pt-4">
                    {room.options.map((option, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        onClick={() => handleResolve(index)}
                        disabled={isResolving}
                        className="justify-start"
                      >
                        {isResolving ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Trophy className="w-4 h-4 mr-2" />
                        )}
                        {option}
                      </Button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {canCancel && (
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleCancel}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Ban className="w-4 h-4 mr-2" />
                )}
                Cancel Room
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Participants List */}
      {room.bets.length > 0 && (
        <Card className="glass rounded-2xl border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-lg text-gradient">On-Chain Bets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {room.bets.map((bet, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">
                        {bet.bettor.slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="font-mono text-sm">
                        {bet.bettor.slice(0, 4)}...
                        {bet.bettor.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">{room.options[bet.option_idx]}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {bet.amount} XLM
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction Info */}
      <Card className="glass rounded-2xl border-white/[0.06]">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <span>Contract: <span className="font-mono text-xs">{CONTRACT_ID.slice(0, 8)}...{CONTRACT_ID.slice(-8)}</span></span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <ExternalLink className="w-4 h-4" />
              <a
                href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
              >
                Verify on Stellar Explorer
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
