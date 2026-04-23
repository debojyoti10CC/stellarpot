"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/lib/wallet-context'
import { createRoom } from '@/lib/soroban-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Plus, X } from 'lucide-react'

export function CreateRoomForm() {
  const router = useRouter()
  const { user, isConnected } = useWallet()
  const [isCreating, setIsCreating] = useState(false)
  const [prediction, setPrediction] = useState('')
  const [stakeAmount, setStakeAmount] = useState('10')
  const [expiryDays, setExpiryDays] = useState('7')
  const [options, setOptions] = useState(['Yes', 'No'])
  const [newOption, setNewOption] = useState('')

  const addOption = () => {
    if (newOption.trim() && options.length < 6) {
      setOptions([...options, newOption.trim()])
      setNewOption('')
    }
  }

  const removeOption = (index: number) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isConnected || !user) return
    setIsCreating(true)
    try {
      const expiryLedgers = parseInt(expiryDays) * 17280
      const roomCode = await createRoom(user.walletAddress, prediction, options, parseFloat(stakeAmount), expiryLedgers)
      router.push(`/room/${roomCode}`)
    } catch (error) {
      console.error('Failed to create room:', error)
      alert(error instanceof Error ? error.message : JSON.stringify(error))
    } finally {
      setIsCreating(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="max-w-lg mx-auto p-8 rounded-xl border border-white/[0.06] bg-white/[0.01]">
        <p className="text-center text-sm text-muted-foreground/60">Connect your wallet to create a room.</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Create Room</h1>
        <p className="text-sm text-muted-foreground/50 mt-1">Set up a new prediction market on Soroban</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-5 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="prediction" className="text-xs text-muted-foreground/60">Question</Label>
            <Textarea
              id="prediction"
              placeholder="Will Bitcoin reach $100k by December 2026?"
              value={prediction}
              onChange={(e) => setPrediction(e.target.value)}
              required
              rows={2}
              className="bg-transparent border-white/[0.06] focus:border-indigo-500/30 resize-none text-sm"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground/60">Options</Label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...options]
                      newOptions[index] = e.target.value
                      setOptions(newOptions)
                    }}
                    className="flex-1 bg-transparent border-white/[0.06] focus:border-indigo-500/30 text-sm h-9"
                  />
                  {options.length > 2 && (
                    <button type="button" onClick={() => removeOption(index)} className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-red-400 hover:bg-red-500/5 transition-all">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 6 && (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Add option…"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption() } }}
                  className="flex-1 bg-transparent border-white/[0.06] focus:border-indigo-500/30 text-sm h-9"
                />
                <button type="button" onClick={addOption} className="p-1.5 rounded-lg border border-white/[0.06] text-muted-foreground/40 hover:text-foreground hover:border-white/[0.12] transition-all">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-4 space-y-2">
            <Label htmlFor="stake" className="text-xs text-muted-foreground/60">Stake (XLM)</Label>
            <Input id="stake" type="number" min="1" step="1" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} required
              className="bg-transparent border-white/[0.06] focus:border-indigo-500/30 text-sm h-9 font-mono" />
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-4 space-y-2">
            <Label htmlFor="expiry" className="text-xs text-muted-foreground/60">Duration (days)</Label>
            <Input id="expiry" type="number" min="1" max="365" value={expiryDays} onChange={(e) => setExpiryDays(e.target.value)} required
              className="bg-transparent border-white/[0.06] focus:border-indigo-500/30 text-sm h-9 font-mono" />
          </div>
        </div>

        <Button type="submit" className="w-full h-11 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-black font-semibold text-sm" disabled={isCreating || !prediction.trim()}>
          {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Create Room
        </Button>
      </form>
    </div>
  )
}
