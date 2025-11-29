"use client"

import { useState } from "react"
import type { Socket } from "socket.io-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Video } from "lucide-react"
import { useRouter } from "next/navigation"

interface LobbyProps {
  socket: Socket
  onJoinRoom: (roomId: string) => void
}

export default function Lobby({ socket, onJoinRoom }: LobbyProps) {
  const [roomId, setRoomId] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleJoin = () => {
    if (!roomId.trim()) {
      setError("Please enter a room ID")
      return
    }
    setError("")
    router.push(`/room/${roomId}`)
  }

  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substring(7)
    setRoomId(newRoomId)
    router.push(`/room/${newRoomId}`)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-background to-card p-4">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <div className="flex justify-center mb-6">
          <div className="bg-primary p-3 rounded-lg">
            <Video className="w-8 h-8 text-primary-foreground" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-foreground mb-2">Video Call</h1>
        <p className="text-center text-muted-foreground mb-8">Connect with others in real-time</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Room ID</label>
            <Input
              type="text"
              placeholder="Enter or create a room ID"
              value={roomId}
              onChange={(e) => {
                setRoomId(e.target.value)
                setError("")
              }}
              className="w-full"
            />
            {error && <p className="text-destructive text-sm mt-1">{error}</p>}
          </div>

          <Button onClick={handleJoin} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            Join Room
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">or</span>
            </div>
          </div>

          <Button onClick={handleCreateRoom} variant="outline" className="w-full bg-transparent">
            Create New Room
          </Button>
        </div>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Tip:</strong> Share your room ID with others to invite them to join your call.
          </p>
        </div>
      </Card>
    </div>
  )
}
