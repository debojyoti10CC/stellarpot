"use client"

import { WalletProvider } from '@/lib/wallet-context'
import { Header } from '@/components/header'
import { JoinRoomForm } from '@/components/join-room-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function JoinPage() {
  return (
    <WalletProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-8 px-4">
          <div className="max-w-md mx-auto mb-6">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
          </div>
          <JoinRoomForm />
        </main>
      </div>
    </WalletProvider>
  )
}
