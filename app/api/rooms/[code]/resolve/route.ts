import { NextResponse } from 'next/server'
import { getRoom, saveRoom } from '@/lib/db'
import { executePayout } from '@/lib/stellar-server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> | { code: string } }
) {
  const code = (await params).code;
  const body = await request.json()
  const { winningOption, resolverWallet } = body

  const room = await getRoom(code)
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  if (room.status !== 'open') return NextResponse.json({ error: 'Room is closed' }, { status: 400 })
  if (room.creatorWallet !== resolverWallet) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!room.escrowSecret) {
    return NextResponse.json({ error: 'Escrow key missing, cannot process payout' }, { status: 500 })
  }

  const winners = room.participants.filter(p => p.selectedOption === winningOption)
  
  if (winners.length > 0) {
    // Proportional split
    const winnersPool = winners.reduce((sum, p) => sum + p.amount, 0)
    
    const payoutPlan = winners.map(winner => {
      // proportion of the winning pool
      const percentage = winner.amount / winnersPool;
      // reward is that percentage of TOTAL pool
      const reward = room.totalPool * percentage;
      // Account for rough fees or keep it exactly
      // (Testnet tx fee is minimal. For now send 99% of calculated reward to leave padding for fees if pool was full)
      return {
        address: winner.walletAddress,
        amount: reward * 0.99
      }
    });
    
    console.log("Executing payout", payoutPlan);
    const result = await executePayout(room.escrowSecret, payoutPlan);
    if (!result.success) {
      console.error(result.error);
      return NextResponse.json({ error: 'Payout transaction failed' }, { status: 500 })
    }
  } else {
    // No winners, creator could get refund or pool burns. 
    console.log("No winners. Creator or nobody gets it.");
  }

  room.status = 'resolved'
  room.winningOption = winningOption
  await saveRoom(room)

  const { escrowSecret, ...safeRoom } = room
  return NextResponse.json(safeRoom)
}
