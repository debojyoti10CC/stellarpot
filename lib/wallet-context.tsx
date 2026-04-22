"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { isConnected as checkFreighterConnection, requestAccess } from '@stellar/freighter-api'
import type { User } from './types'

interface WalletContextType {
  user: User | null
  isConnected: boolean
  isConnecting: boolean
  connect: () => Promise<void>
  disconnect: () => void
  balance: number | null
}

const WalletContext = createContext<WalletContextType | null>(null)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)

  const fetchBalance = useCallback(async (address: string) => {
    try {
      const response = await fetch(
        `https://horizon-testnet.stellar.org/accounts/${address}`
      )
      if (response.ok) {
        const data = await response.json()
        const xlmBalance = data.balances.find(
          (b: { asset_type: string }) => b.asset_type === 'native'
        )
        setBalance(xlmBalance ? parseFloat(xlmBalance.balance) : 0)
      }
    } catch {
      setBalance(null)
    }
  }, [])

  const connect = useCallback(async () => {
    setIsConnecting(true)
    try {
      // Check if Freighter is available
      let hasFreighter = false
      try {
        const conn = await checkFreighterConnection()
        hasFreighter = conn.isConnected
      } catch (e) {
         // Not available
      }
      
      if (hasFreighter) {
        // Request access
        const accessResponse = await requestAccess()
        if (accessResponse.error) {
          throw new Error(accessResponse.error as string)
        }

        const address = accessResponse.address
        if (!address) {
          throw new Error("No address returned from Freighter")
        }

        setUser({ walletAddress: address })
        await fetchBalance(address)
        
        // Store in localStorage for persistence
        localStorage.setItem('stellarpot_wallet', address)
      } else {
        alert("Freighter wallet is not installed or not active. Please install the Freighter extension to continue.");
        throw new Error("Freighter wallet is not installed or not active.");
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    } finally {
      setIsConnecting(false)
    }
  }, [fetchBalance])

  const disconnect = useCallback(() => {
    setUser(null)
    setBalance(null)
    localStorage.removeItem('stellarpot_wallet')
  }, [])

  // Auto-reconnect on mount
  useEffect(() => {
    const savedWallet = localStorage.getItem('stellarpot_wallet')
    if (savedWallet) {
      setUser({ walletAddress: savedWallet })
      fetchBalance(savedWallet)
    }
  }, [fetchBalance])

  return (
    <WalletContext.Provider
      value={{
        user,
        isConnected: !!user,
        isConnecting,
        connect,
        disconnect,
        balance,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}
