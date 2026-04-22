import { NextResponse } from 'next/server'
import { getRoom } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> | { code: string } }
) {
  // Await params to handle both Next.js 14 and Next.js 15
  const code = (await params).code;
  const room = await getRoom(code)
  
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }

  const { escrowSecret, ...safeRoom } = room
  return NextResponse.json(safeRoom)
}
