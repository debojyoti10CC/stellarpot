"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/lib/wallet-context'
import { getRoomByCode, getRoom } from '@/lib/soroban-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Search } from 'lucide-react'

export function JoinRoomForm() {
  const router = useRouter()
  const { isConnected } = useWallet()
  const [roomCode, setRoomCode] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSearching(true)
    try {
      const code = roomCode.trim().toUpperCase()
      if (!code) { setError('Enter a room code.'); return }

      let room = await getRoomByCode(code)
      if (!room) {
        const numericId = parseInt(code, 10)
        if (!isNaN(numericId) && numericId > 0) room = await getRoom(numericId)
      }

      if (room) {
        router.push(`/room/${room.code || code}`)
      } else {
        setError('Room not found. Check the code and try again.')
      }
    } catch {
      setError('Failed to query contract.')
    } finally {
      setIsSearching(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="max-w-sm mx-auto p-8 rounded-xl border border-white/[0.06] bg-white/[0.01]">
        <p className="text-center text-sm text-muted-foreground/60">Connect your wallet to join a room.</p>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Join Room</h1>
        <p className="text-sm text-muted-foreground/50 mt-1">Enter a code shared by the room creator</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-5 space-y-3">
          <Label htmlFor="roomCode" className="text-xs text-muted-foreground/60">Room Code</Label>
          <Input
            id="roomCode"
            type="text"
            placeholder="e.g. A3K7RP"
            value={roomCode}
            onChange={(e) => { setRoomCode(e.target.value.toUpperCase()); setError('') }}
            className="bg-transparent border-white/[0.06] focus:border-indigo-500/30 font-mono text-center text-lg tracking-[0.3em] uppercase h-12"
            maxLength={10}
            required
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <Button type="submit" className="w-full h-11 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-black font-semibold text-sm" disabled={isSearching || !roomCode}>
          {isSearching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
          Find Room
        </Button>
      </form>
    </div>
  )
}
