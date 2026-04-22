"use client"

import { use } from 'react'
import { WalletProvider } from '@/lib/wallet-context'
import { Header } from '@/components/header'
import { RoomView } from '@/components/room-view'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface RoomPageProps {
  params: Promise<{ code: string }>
}

export default function RoomPage({ params }: RoomPageProps) {
  const { code } = use(params)
  
  return (
    <WalletProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-8 px-4">
          <div className="max-w-2xl mx-auto mb-6">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
          </div>
          <RoomView roomCode={code} />
        </main>
      </div>
    </WalletProvider>
  )
}
