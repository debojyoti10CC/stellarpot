"use client"

import { useState, useEffect } from 'react'
import { useWallet } from '@/lib/wallet-context'
import { getUserRooms } from '@/lib/soroban-client'
import type { OnChainRoom } from '@/lib/soroban-client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Users, Coins, ShieldCheck, Loader2 } from 'lucide-react'
import Link from 'next/link'

function RoomCard({ room }: { room: OnChainRoom }) {
  const statusColors = {
    Open: 'bg-green-500/10 text-green-500 border-green-500/20',
    Resolved: 'bg-primary/10 text-primary border-primary/20',
    Cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
  }

  return (
    <Link href={`/room/${room.id}`}>
      <Card className="hover:border-primary/30 transition-colors cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={statusColors[room.status]}>
              {room.status}
            </Badge>
            <Badge variant="outline" className="font-mono text-xs">
              #{room.id}
            </Badge>
          </div>
          <CardTitle className="text-base line-clamp-2">{room.description}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {room.bets.length}
            </span>
            <span className="flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" />
              {room.total_pool.toFixed(1)} XLM
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
              On-chain
            </span>
          </div>
        </CardContent>
      </Card>
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

  if (!isConnected) {
    return null
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Reading rooms from Soroban contract...</p>
      </div>
    )
  }

  const activeRooms = rooms.filter(r => r.status === 'Open')
  const resolvedRooms = rooms.filter(r => r.status === 'Resolved' || r.status === 'Cancelled')

  if (rooms.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center py-12 border border-dashed border-border rounded-xl">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">No rooms yet</h2>
          <p className="text-muted-foreground mb-6">
            Create a prediction room or join one by room ID
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button asChild>
              <Link href="/create">
                <Plus className="w-4 h-4 mr-2" />
                Create Room
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/join">Join Room</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Your Rooms</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/join">Join Room</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/create">
              <Plus className="w-4 h-4 mr-2" />
              Create
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="active">
            Active ({activeRooms.length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved ({resolvedRooms.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {activeRooms.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {activeRooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-border rounded-xl">
              <p className="text-muted-foreground">No active rooms</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="resolved">
          {resolvedRooms.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {resolvedRooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-border rounded-xl">
              <p className="text-muted-foreground">No resolved rooms yet</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
