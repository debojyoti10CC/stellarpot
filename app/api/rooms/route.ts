import { NextResponse } from 'next/server'
import { getRooms, saveRoom } from '@/lib/db'
import { createEscrowAccount } from '@/lib/stellar-server'

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

function generateRoomId(): string {
  return crypto.randomUUID()
}

export async function GET() {
  const rooms = await getRooms()
  // remove secret keys before sending to client
  const safeRooms = rooms.map(r => {
    const { escrowSecret, ...safe } = r
    return safe
  })
  return NextResponse.json(safeRooms)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { creatorWallet, prediction, stakeAmount, expiryTime, options } = body

  // Generate real Escrow
  const { publicKey, secret } = await createEscrowAccount()

  const room = {
    id: generateRoomId(),
    code: generateRoomCode(),
    creatorWallet,
    prediction,
    stakeAmount,
    participants: [],
    totalPool: 0,
    status: 'open' as const,
    expiryTime,
    createdAt: new Date().toISOString(),
    options,
    escrowPublicKey: publicKey,
    escrowSecret: secret,
  }

  await saveRoom(room)

  const { escrowSecret, ...safeRoom } = room
  return NextResponse.json(safeRoom)
}
