"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/lib/wallet-context'
import { getRoomByCode, getRoom, getRoomIdFromCode } from '@/lib/soroban-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
      if (!code) {
        setError('Please enter a room code.')
        return
      }

      // Try as room code first
      let room = await getRoomByCode(code)
      
      // Fallback: try as numeric ID
      if (!room) {
        const numericId = parseInt(code, 10)
        if (!isNaN(numericId) && numericId > 0) {
          room = await getRoom(numericId)
        }
      }

      if (room) {
        // Navigate using the code (or numeric ID as fallback)
        const shareCode = room.code || code
        router.push(`/room/${shareCode}`)
      } else {
        setError('Room not found. Check the code and try again.')
      }
    } catch {
      setError('Failed to query contract. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  if (!isConnected) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Please connect your wallet to join a room.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Join Prediction Room</CardTitle>
        <CardDescription>
          Enter the room code shared by the creator to join their prediction market
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roomCode">Room Code</Label>
            <Input
              id="roomCode"
              type="text"
              placeholder="e.g. A3K7RP"
              value={roomCode}
              onChange={(e) => {
                setRoomCode(e.target.value.toUpperCase())
                setError('')
              }}
              className="font-mono text-center text-lg tracking-widest uppercase"
              maxLength={10}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSearching || !roomCode}
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Search className="w-4 h-4 mr-2" />
            )}
            Find Room On-Chain
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
