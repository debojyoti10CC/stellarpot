"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/lib/wallet-context'
import { getRoom } from '@/lib/soroban-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2, Search } from 'lucide-react'

export function JoinRoomForm() {
  const router = useRouter()
  const { isConnected } = useWallet()
  const [roomId, setRoomId] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSearching(true)

    try {
      const id = parseInt(roomId, 10)
      if (isNaN(id) || id <= 0) {
        setError('Please enter a valid room number.')
        return
      }
      const room = await getRoom(id)
      if (room) {
        router.push(`/room/${room.id}`)
      } else {
        setError('Room not found on-chain. Please check the ID and try again.')
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
          Enter the room ID to find an on-chain prediction market
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roomId">Room ID</Label>
            <Input
              id="roomId"
              type="number"
              min="1"
              placeholder="Enter room number (e.g. 1)"
              value={roomId}
              onChange={(e) => {
                setRoomId(e.target.value)
                setError('')
              }}
              className="font-mono text-center text-lg"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSearching || !roomId}
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
