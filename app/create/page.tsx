"use client"

import { WalletProvider } from '@/lib/wallet-context'
import { Header } from '@/components/header'
import { CreateRoomForm } from '@/components/create-room-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CreatePage() {
  return (
    <WalletProvider>
      <div className="min-h-screen flex flex-col bg-[#020202]">
        <Header />
        <main className="flex-1 py-8 px-5">
          <div className="max-w-lg mx-auto mb-5">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors">
              <ArrowLeft className="w-3 h-3" />Back
            </Link>
          </div>
          <CreateRoomForm />
        </main>
      </div>
    </WalletProvider>
  )
}
