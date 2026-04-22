export interface User {
  walletAddress: string
  username?: string
}

// The canonical types now come from soroban-client.ts (OnChainRoom, OnChainBet)
// These legacy types are kept ONLY for backwards compatibility with any
// remaining imports. New code should use OnChainRoom/OnChainBet directly.

export interface Room {
  id: string
  code: string
  creatorWallet: string
  prediction: string
  stakeAmount: number
  participants: Participant[]
  totalPool: number
  status: 'open' | 'locked' | 'resolved'
  expiryTime: string | Date
  createdAt: string | Date
  options: string[]
  winningOption?: string
  escrowPublicKey?: string
  escrowSecret?: string // Server side only
}

export interface Participant {
  walletAddress: string
  username?: string
  selectedOption: string
  amount: number
  joinedAt: string | Date
  transactionHash?: string
}

export interface Bet {
  userWallet: string
  roomId: string
  selectedOption: string
  amount: number
  timestamp: string | Date
}

export interface Transaction {
  hash: string
  type: 'deposit' | 'payout'
  amount: number
  from: string
  to: string
  timestamp: string | Date
}
