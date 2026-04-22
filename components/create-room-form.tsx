"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/lib/wallet-context'
import { createRoom } from '@/lib/soroban-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isConnected || !user) return

    setIsCreating(true)
    try {
      // Convert days to ledger sequences (~5s per ledger, ~17280 per day)
      const expiryLedgers = parseInt(expiryDays) * 17280

      // This calls the SOROBAN CONTRACT directly
      // Transaction is signed by Freighter, submitted to chain
      // Room state is stored ON-CHAIN, not in any database
      const roomId = await createRoom(
        user.walletAddress,
        prediction,
        options,
        parseFloat(stakeAmount),
        expiryLedgers,
      )
      router.push(`/room/${roomId}`)
    } catch (error) {
      console.error('Failed to create room:', error)
      alert("Failed to create room: " + (error instanceof Error ? error.message : JSON.stringify(error)))
    } finally {
      setIsCreating(false)
    }
  }

  if (!isConnected) {
    return (
      <Card className="max-w-lg mx-auto glass rounded-2xl border-white/[0.06]">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Please connect your wallet to create a room.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-lg mx-auto glass rounded-2xl border-white/[0.06] animate-scale-in">
      <CardHeader>
        <CardTitle className="text-gradient">Create Prediction Room</CardTitle>
        <CardDescription>
          Set up a new prediction — all logic is enforced on-chain via Soroban
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="prediction">Prediction Question</Label>
            <Textarea
              id="prediction"
              placeholder="e.g., Will Bitcoin reach $100k by December 2026?"
              value={prediction}
              onChange={(e) => setPrediction(e.target.value)}
              required
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <Label>Prediction Options</Label>
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
                    className="flex-1"
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(index)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 6 && (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Add another option..."
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addOption()
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addOption}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stake">Entry Stake (XLM)</Label>
              <Input
                id="stake"
                type="number"
                min="1"
                step="1"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiry">Duration (days)</Label>
              <Input
                id="expiry"
                type="number"
                min="1"
                max="365"
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full btn-premium rounded-xl h-11 bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/20"
            disabled={isCreating || !prediction.trim()}
          >
            {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Room (On-Chain)
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
