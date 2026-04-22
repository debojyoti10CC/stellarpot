// ═══════════════════════════════════════════════════════════
//  ROOM STORE — Thin wrapper around Soroban contract reads
//  All state lives on-chain. This file just exports
//  convenience functions for the React components.
// ═══════════════════════════════════════════════════════════

export {
  createRoom,
  placeBet,
  resolveRoom,
  cancelRoom,
  getRoom,
  getRoomCount,
  getAllRooms,
  getUserRooms,
} from './soroban-client'

// Re-export types
export type { OnChainRoom, OnChainBet } from './soroban-client'
