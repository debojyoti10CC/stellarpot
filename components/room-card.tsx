"use client"

import type { Room } from '@/lib/types'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Clock, Coins } from 'lucide-react'
import Link from 'next/link'

interface RoomCardProps {
  room: Room
}

export function RoomCard({ room }: RoomCardProps) {
  const statusColors = {
    open: 'bg-green-500/10 text-green-500 border-green-500/20',
    locked: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    resolved: 'bg-muted text-muted-foreground border-border',
  }

  const timeLeft = new Date(room.expiryTime).getTime() - Date.now()
  const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)))
  const daysLeft = Math.floor(hoursLeft / 24)

  return (
    <Link href={`/room/${room.code}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <Badge variant="outline" className={statusColors[room.status]}>
              {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
            </Badge>
            <span className="font-mono text-xs text-muted-foreground">
              {room.code}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="font-medium text-balance line-clamp-2">{room.prediction}</p>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>{room.participants.length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Coins className="w-4 h-4" />
              <span>{room.totalPool} XLM</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>
                {daysLeft > 0
                  ? `${daysLeft}d left`
                  : hoursLeft > 0
                  ? `${hoursLeft}h left`
                  : 'Expired'}
              </span>
            </div>
          </div>

          {room.status === 'resolved' && room.winningOption && (
            <div className="pt-2 border-t border-border">
              <span className="text-sm text-muted-foreground">Winner: </span>
              <span className="text-sm font-medium text-accent">
                {room.winningOption}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
