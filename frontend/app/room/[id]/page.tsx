"use client"
import { use, useEffect, useRef, useState } from "react"
import { io } from "socket.io-client"
import VideoPlayer from "@/components/VideoPlayer"
import ControlsBar from "@/components/ControlsBar"
import { useRouter } from "next/navigation"
import { SendHorizontal, MessageCircle, X } from "lucide-react"

const socket = io("https://video-calling-app-wbka.onrender.com", {
    transports: ["websocket"],
})

export default function Room({ params }: { params: Promise<{ id: string }> }) {
    const { id: roomId } = use(params)
    const router = useRouter()

    const selfReady = useRef(false)
    const remoteReady = useRef(false)
    const offerSent = useRef(false)
    const [userCount, setUserCount] = useState(0)
    const trackAdded = useRef(false)

    const [localStream, setLocalStream] = useState<MediaStream | null>(null)
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
    const [muted, setMuted] = useState(false)
    const [videoOff, setVideoOff] = useState(false)
    const [isLocalSharing, setIsLocalSharing] = useState(false)
    const [isRemoteSharing, setIsRemoteSharing] = useState(false)
    const [messages, setMessages] = useState<{ sender: string; message: string; time: number }[]>([])
    const [chatOpen, setChatOpen] = useState(false)
    const [input, setInput] = useState("")
    const [remoteOrientation, setRemoteOrientation] = useState<"portrait" | "landscape">("landscape");
    const peer = useRef<RTCPeerConnection | null>(null)

    const endCall = () => {
        socket.emit("leave-room", roomId)
        localStream?.getTracks().forEach((t) => t.stop())
        remoteStream?.getTracks().forEach((t) => t.stop())
        peer.current?.close()
        peer.current = null
        router.push("/")
    }

    const toggleMute = () => {
        if (!localStream) return
        if (userCount > 1)
            localStream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled))
        setMuted((m) => !m)
    }

    const toggleVideo = () => {
        if (!localStream) return
        localStream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled))
        setVideoOff((v) => !v)
    }

    const startScreenShare = async () => {
        if (!peer.current) return
        const screen = await navigator.mediaDevices.getDisplayMedia({
            video: true,
        })
        const screenTrack = screen.getVideoTracks()[0]
        const sender = peer.current.getSenders().find((s) => s.track?.kind === "video")
        await sender?.replaceTrack(screenTrack)
        setIsLocalSharing(true)
        setIsRemoteSharing(false)
        screenTrack.onended = () => {
            stopScreenShare()
        }
    }

    const stopScreenShare = async () => {
        if (!peer.current || !localStream) return
        peer.current.getSenders().forEach((sender) => {
            if (sender.track && sender.track.label.includes("screen")) {
                sender.track.stop()
                const camTrack = localStream.getVideoTracks()[0]
                sender.replaceTrack(camTrack)
            }
        })
        setIsLocalSharing(false)
        socket.emit("screen-stopped", roomId)
    }

    const sendMessage = () => {
        if (!input.trim()) return
        setMessages((prev) => [
            ...prev,
            {
                sender: "me",
                message: input,
                time: Date.now(),
            },
        ])
        socket.emit("send-message", {
            roomId,
            message: input,
        })
        setInput("")
    }

    const initPeer = () => {
        console.log("🔵 Initializing new RTCPeerConnection")
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
            { urls: "stun:stun3.l.google.com:19302" },
            { urls: "stun:stun4.l.google.com:19302" },
            { urls: "stun:stun.stunprotocol.org:3478" },
            { urls: "stun:stun.services.mozilla.com" },
            {
                urls: "turn:global.relay.metered.ca:80",
                username: "57611b776b255e4c878c6c7f",
                credential: "MKmGM/mPSOQnH37y",
            },
            {
                urls: "turn:global.relay.metered.ca:80?transport=tcp",
                username: "57611b776b255e4c878c6c7f",
                credential: "MKmGM/mPSOQnH37y",
            },
            {
                urls: "turn:global.relay.metered.ca:443",
                username: "57611b776b255e4c878c6c7f",
                credential: "MKmGM/mPSOQnH37y",
            },
            {
                urls: "turns:global.relay.metered.ca:443?transport=tcp",
                username: "57611b776b255e4c878c6c7f",
                credential: "MKmGM/mPSOQnH37y",
            },
            ],
        })
        peer.current = pc
        if (localStream && !trackAdded.current) {
            localStream.getTracks().forEach((track) => pc.addTrack(track, localStream))
            trackAdded.current = true
            console.log("🔥 Added local tracks to new peer connection")
        }
        pc.ontrack = (e) => {
            const incoming = e.streams[0]
            const track = incoming.getVideoTracks()[0];
            console.log( track?.getSettings())
            const { width, height } = track?.getSettings();

            if (width && height) {
                console.log(height > width ? "portrait" : "landscape");
                setRemoteOrientation(height > width ? "portrait" : "landscape");
            }
            if (track?.label.includes("screen")) {
                setIsRemoteSharing(true)
                setIsLocalSharing(false)
            } else {
                setRemoteStream(incoming)
            }
            console.log("🔵 Received remote track")
        }
        pc.onicecandidate = (e) => {
            if (e.candidate) socket.emit("ice-candidate", { roomId, candidate: e.candidate })
            console.log("🔵 ICE candidate generated and sent")
        }
    }

    useEffect(() => {
        socket.emit("join-room", roomId)
        console.log("🔵 Joined room:", roomId)
        const start = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                setLocalStream(stream)
                if (stream) {
                    selfReady.current = true
                    socket.emit("ready", roomId)
                    console.log("🔥 Local peer is now ready for call")
                }
                initPeer()
            } catch {
                console.warn("User didn't allow media — waiting...")
            }

            socket.on("room-user-count", (c) => setUserCount(c))
            socket.on("peer-ready", () => {
                remoteReady.current = true
                console.log("🔥 Remote peer is now ready for call")
                if (selfReady.current && !offerSent.current) sendOffer()
            })
            socket.on("user-joined", () => console.log("🔵 Someone joined room"))
            socket.on("offer", async (offer) => {
                console.log("📡 OFFER RECEIVED FROM PEER")
                if (!peer.current) initPeer()
                await peer.current!.setRemoteDescription(offer)
                console.log("🔵 Creating and sending ANSWER")
                const answer = await peer.current!.createAnswer()
                await peer.current!.setLocalDescription(answer)
                console.log("📡 ANSWER SENT TO PEER")
                socket.emit("answer", { roomId, answer })
                console.log("🔥 Call established!")
            })
            socket.on("answer", async (answer) => {
                if (peer.current) await peer.current.setRemoteDescription(answer)
                console.log("🔥 Call established! 2")
            })
            socket.on("ice-candidate", (cand) => {
                if (peer.current) peer.current.addIceCandidate(cand)
                console.log("🔵 ICE CANDIDATE added")
            })
            socket.on("user-left", () => {
                setRemoteStream(null)
                peer.current?.close()
                peer.current = null
                offerSent.current = false
                remoteReady.current = false
                console.log("🔴 Remote Peer disconnected")
            })
            socket.on("receive-message", ({ message, sender, timestamp }) => {
                setMessages((prev) => [...prev, { sender, message, time: timestamp }])
            })
        }
        start()
        return () => {
            socket.off("room-user-count");
            socket.off("peer-ready");
            socket.off("user-joined");
            socket.off("offer");
            socket.off("answer");
            socket.off("ice-candidate");
            socket.off("user-left");
            socket.off("receive-message");
        }
    }, [roomId])

    useEffect(() => {
        if (!localStream) return
        localStream.getTracks().forEach((t) => peer.current?.addTrack(t, localStream))
        if (!selfReady.current) {
            selfReady.current = true
            socket.emit("ready", roomId)
            console.log("🔥 Local peer is now ready for call 2")
        }
        if (selfReady.current && remoteReady.current && !offerSent.current) {
            console.log("🔥 Both peers ready, sending offer... 2")
            sendOffer()
        }
    }, [localStream])

    useEffect(() => {
        if (!localStream) return
        const audioTrack = localStream.getAudioTracks()[0]
        if (userCount <= 1) {
            audioTrack.enabled = false
        } else {
            audioTrack.enabled = true
        }
    }, [userCount, localStream])

    const sendOffer = async () => {
        if (!peer.current) initPeer()
        const offer = await peer.current!.createOffer()
        await peer.current!.setLocalDescription(offer)
        socket.emit("offer", { roomId, offer })
        offerSent.current = true
        console.log("📡 OFFER SENT TO PEER")
    }

    const someoneIsSharing = isLocalSharing || isRemoteSharing

    return (
        <div className="relative h-screen bg-background text-foreground dark overflow-hidden">
            {/* MAIN VIDEO AREA */}
            <div className={`h-full flex flex-col md:flex-row gap-0 md:gap-3 md:p-4`}>
                {/* BIG VIDEO DISPLAY */}
                <div className="relative flex-1 flex items-center justify-center bg-card rounded-lg overflow-hidden border border-border/50 shadow-2xl">
                    {isRemoteSharing ? (
                        <VideoPlayer stream={remoteStream} remoteOrientation={remoteOrientation} />
                    ) : userCount > 1 ? (
                        <VideoPlayer stream={remoteStream} remoteOrientation={remoteOrientation} />
                    ) : (
                        <VideoPlayer stream={localStream} videoOff={videoOff} />
                    )}

                    {/* SELF PREVIEW PIP */}
                    {(someoneIsSharing || userCount > 1) && (
                        <div className="absolute bottom-4 right-4 h-44 md:h-80 rounded-xl overflow-hidden border-2 border-primary/30 shadow-2xl hover:border-primary/50 transition-colors">
                            <VideoPlayer stream={localStream} muted videoOff={videoOff} small={true} />
                        </div>
                    )}
                </div>
            </div>

            <button
                onClick={() => setChatOpen(!chatOpen)}
                className="absolute top-6 right-6 z-40 flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
                <MessageCircle size={20} />
                <span className="text-sm font-semibold">Chat</span>
                {messages.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {messages.length}
                    </span>
                )}
            </button>

            {chatOpen && (
                <div className="absolute right-6 top-20 z-50 w-80 h-96 bg-card border border-border/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-sm">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border/30 bg-card/50">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                            <MessageCircle size={18} className="text-primary" />
                            Chat
                        </h3>
                        <button
                            onClick={() => setChatOpen(false)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-background/50 ">
                        {messages.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                <p className="text-sm">No messages yet</p>
                            </div>
                        ) : (
                            messages.map((m, i) => (
                                <div key={i} className={`flex ${m.sender === "me" ? "justify-end" : "justify-start"}`}>
                                    <div
                                        className={`max-w-[70%] px-6 py-2 rounded-lg ${m.sender === "me"
                                            ? "bg-primary text-primary-foreground rounded-br-none"
                                            : "bg-muted text-muted-foreground rounded-bl-none"
                                            }`}
                                    >
                                        <p className="text-sm wrap-break-word whitespace-pre-wrap">{m.message}</p>
                                    </div>

                                </div>
                            ))
                        )}
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-border/30 flex gap-2 bg-card/50">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                            placeholder="Type a message..."
                            className="flex-1 bg-input border border-border/50 rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                        <button
                            onClick={sendMessage}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground p-2 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center"
                        >
                            <SendHorizontal size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* FLOATING CONTROLS */}
            <ControlsBar
                muted={muted}
                videoOff={videoOff}
                sharingScreen={isLocalSharing}
                onToggleMute={toggleMute}
                onToggleVideo={toggleVideo}
                onStartShare={startScreenShare}
                onStopShare={stopScreenShare}
                onEndCall={endCall}
                resumeFilePath="/mnt/data/AritraKumarBaraResume.pdf"
            />
        </div>
    )
}
