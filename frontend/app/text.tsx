"use client";

import { use, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import VideoPlayer from "@/components/VideoPlayer";
import ControlsBar from "@/components/ControlsBar";
import { useRouter } from "next/navigation";
import FallbackAvatar from "@/components/FallbackAvatar";
import { SendHorizonal } from "lucide-react";

const socket = io("https://video-calling-app-wbka.onrender.com", {
    transports: ["websocket"],
});

export default function Room({ params }: { params: Promise<{ id: string }> }) {
    const { id: roomId } = use(params);
    const router = useRouter();

    // ----------------- NEW FLAGS 🔥 -----------------
    const selfReady = useRef(false);        // I have camera
    const remoteReady = useRef(false);      // They have camera
    const offerSent = useRef(false);

    const [userCount, setUserCount] = useState(0);
    const trackAdded = useRef(false);

    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

    const [muted, setMuted] = useState(false);
    const [videoOff, setVideoOff] = useState(false);
    const [isLocalSharing, setIsLocalSharing] = useState(false);
    const [isRemoteSharing, setIsRemoteSharing] = useState(false);
    const [messages, setMessages] = useState<{ sender: string, message: string, time: number }[]>([]);
    const [chatOpen, setChatOpen] = useState(false);
    const [input, setInput] = useState("");

    const peer = useRef<RTCPeerConnection | null>(null);

    // ------------------ END CALL ------------------
    const endCall = () => {
        socket.emit("leave-room", roomId);

        localStream?.getTracks().forEach((t) => t.stop());
        remoteStream?.getTracks().forEach((t) => t.stop());

        peer.current?.close();
        peer.current = null;

        router.push("/");
    };

    // ------------------ MUTE ------------------
    const toggleMute = () => {
        if (!localStream) return;
        localStream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
        setMuted((m) => !m);
    };

    // ------------------ CAMERA ------------------
    const toggleVideo = () => {
        if (!localStream) return;
        localStream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
        setVideoOff((v) => !v);
    };

    // ------------------ SCREEN SHARE ------------------
    const startScreenShare = async () => {
        if (!peer.current) return;

        const screen = await navigator.mediaDevices.getDisplayMedia({
            video: true,
        });

        const screenTrack = screen.getVideoTracks()[0];
        const sender = peer.current
            .getSenders()
            .find((s) => s.track?.kind === "video");

        await sender?.replaceTrack(screenTrack);

        setIsLocalSharing(true);
        setIsRemoteSharing(false);

        screenTrack.onended = () => {
            stopScreenShare();
        };
    };

    const stopScreenShare = async () => {
        if (!peer.current || !localStream) return;

        // stop screen stream track
        peer.current.getSenders().forEach(sender => {
            if (sender.track && sender.track.label.includes("screen")) {
                sender.track.stop();  // kills Chrome "Stop sharing" banner
                const camTrack = localStream.getVideoTracks()[0];
                sender.replaceTrack(camTrack); // 🔥 send camera back to remote peer
            }
        });

        setIsLocalSharing(false);
        socket.emit("screen-stopped", roomId); // 🔥 notify remote peer
    };

    const sendMessage = () => {
        if (!input.trim()) return;

        // add to self UI
        setMessages(prev => [...prev, {
            sender: "me",
            message: input,
            time: Date.now()
        }]);

        // send to remote
        socket.emit("send-message", {
            roomId,
            message: input
        });

        setInput("");
    };

    /* --------------------------------------------------------
       🔥  initPeer extracted outside useEffect
       -------------------------------------------------------- */
    const initPeer = () => {
        console.log("🔵 Initializing new RTCPeerConnection");
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
        });

        peer.current = pc;

        if (localStream && !trackAdded.current) {
            localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
            trackAdded.current = true;
            console.log("🔥 Added local tracks to new peer connection");
        }

        pc.ontrack = (e) => {
            const incoming = e.streams[0];
            if (incoming.getVideoTracks()[0]?.label.includes("screen")) {
                setIsRemoteSharing(true);
                setIsLocalSharing(false);
            } else {
                setRemoteStream(incoming);
            }
            console.log("🔵 Received remote track");
        };

        pc.onicecandidate = (e) => {
            if (e.candidate) socket.emit("ice-candidate", { roomId, candidate: e.candidate });
            console.log("🔵 ICE candidate generated and sent");
        };
    };


    /* ------------------ START WEBCAM + JOIN ------------------ */
    useEffect(() => {
        socket.emit("join-room", roomId);
        console.log("🔵 Joined room:", roomId);
        const start = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);
                if (stream) {
                    selfReady.current = true;
                    socket.emit("ready", roomId);
                    console.log("🔥 Local peer is now ready for call");
                }      // 🔥 announce readiness

                initPeer();
            } catch {
                console.warn("User didn't allow media — waiting...");
            }

            // ---------------- ROOM EVENTS ----------------

            socket.on("room-user-count", c => setUserCount(c));

            socket.on("peer-ready", () => {
                remoteReady.current = true;
                console.log("🔥 Remote peer is now ready for call");

                if (selfReady.current && !offerSent.current) sendOffer();
            });

            socket.on("user-joined", () => console.log("🔵 Someone joined room"));

            socket.on("offer", async offer => {
                console.log("📡 OFFER RECEIVED FROM PEER");
                if (!peer.current) initPeer();
                await peer.current!.setRemoteDescription(offer);
                console.log("🔵 Creating and sending ANSWER");
                const answer = await peer.current!.createAnswer();
                await peer.current!.setLocalDescription(answer);
                console.log("📡 ANSWER SENT TO PEER");
                socket.emit("answer", { roomId, answer });
                console.log("🔥 Call established!");
            });

            socket.on("answer", async answer => {
                if (peer.current) await peer.current.setRemoteDescription(answer);
                console.log("🔥 Call established! 2");
            });

            socket.on("ice-candidate", cand => {
                if (peer.current) peer.current.addIceCandidate(cand);
                console.log("🔵 ICE CANDIDATE added");
            });

            socket.on("user-left", () => {
                setRemoteStream(null);
                peer.current?.close();
                peer.current = null;
                offerSent.current = false;
                remoteReady.current = false;
                console.log("🔴 Remote Peer disconnected")
            });

            socket.on("receive-message", ({ message, sender, timestamp }) => {
                setMessages(prev => [...prev, { sender, message, time: timestamp }]);
            });

        };

        start();

        return () => {
            socket.disconnect();
        };
    }, [roomId]);


    /* ---------------- WHEN WE FINALLY GET PERMISSION ---------------- */
    useEffect(() => {
        if (!localStream) return;

        localStream.getTracks().forEach(t => peer.current?.addTrack(t, localStream));
        if (!selfReady.current) {
            selfReady.current = true;
            socket.emit("ready", roomId);
            console.log("🔥 Local peer is now ready for call 2");
        }                 // 🔥 first time enabling webcam

        if (selfReady.current && remoteReady.current && !offerSent.current) {
            console.log("🔥 Both peers ready, sending offer... 2");
            sendOffer()
        };
    }, [localStream]);


    useEffect(() => {
        if (!localStream) return;

        const audioTrack = localStream.getAudioTracks()[0];

        if (userCount <= 1) {
            audioTrack.enabled = false;
        } else {
            audioTrack.enabled = true;
        }

    }, [userCount, localStream]);

    /* ---------------------- SEND OFFER ---------------------- */
    const sendOffer = async () => {
        if (!peer.current) initPeer();

        const offer = await peer.current!.createOffer();
        await peer.current!.setLocalDescription(offer);

        socket.emit("offer", { roomId, offer });
        offerSent.current = true;

        console.log("📡 OFFER SENT TO PEER");
    };


    // ------------------ UI LAYOUT LOGIC ------------------

    const someoneIsSharing = isLocalSharing || isRemoteSharing;

    // const bigScreenStream =
    //   isLocalSharing
    //     ? localStream
    //     : isRemoteSharing
    //       ? remoteStream
    //       : null;

    return (
        <div className="relative h-screen bg-gray-900 text-white md:p-6">

            {/* MAIN VIDEO AREA */}
            <div className="h-full w-full flex flex-col md:flex-row rounded-lg ">


                {/* BIG VIDEO DISPLAY */}
                <div className="relative flex-1 flex items-center justify-center bg-black">

                    {/* Priority:
     1) remote screen share (big)
     2) remote camera feed (big)
     3) only you → your own video (big)
  */}
                    {isRemoteSharing ? (
                        <VideoPlayer stream={remoteStream} />
                    ) : userCount > 1 ? (
                        <VideoPlayer stream={remoteStream} />
                    ) : (
                        <VideoPlayer stream={localStream} videoOff={videoOff} />
                    )}

                    {/* SELF PREVIEW PIP — on mobile always small */}
                    {(someoneIsSharing || userCount > 1) && (
                        <div className="absolute bottom-3 right-3 w-28 h-40 md:w-60 shadow-lg border border-white rounded-md overflow-hidden">
                            <VideoPlayer stream={localStream} muted videoOff={videoOff} />
                        </div>
                    )}
                </div>


                {/* THUMBNAILS — RIGHT ON DESKTOP, BELOW ON MOBILE */}
                {/* {someoneIsSharing && (
          <div className="w-full md:w-56 p-3 flex md:flex-col flex-row gap-2 items-center justify-center md:items-end">
            <VideoPlayer stream={localStream} small muted />
            {remoteStream && <VideoPlayer stream={remoteStream} small muted />}
          </div>
        )} */}

            </div>

            {/* Chat Toggle Button */}
            <button
                onClick={() => setChatOpen(!chatOpen)}
                className="absolute top-4 right-4 bg-white text-black px-3 py-1 rounded shadow"
            >
                💬 Chat
            </button>

            {/* Chat Box */}
            {chatOpen && (
                <div className="absolute right-4 top-16 w-72 h-96 bg-white text-black rounded shadow-lg flex flex-col">

                    {/* Messages */}
                    <div className="flex-1 p-3 overflow-y-auto">
                        {messages.map((m, i) => (
                            <div key={i} className={`mb-2 ${m.sender === "me" ? "text-right" : ""}`}>
                                <div className={`inline-block px-3 py-2 rounded 
            ${m.sender === "me" ? "bg-blue-500 text-white" : "bg-gray-300"}
          `}>
                                    {m.message}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t flex gap-2">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 border rounded px-2 py-1"
                        />
                        <button
                            onClick={sendMessage}
                            className="bg-blue-500 text-white px-3 rounded"
                        >
                            <SendHorizonal/>
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
    );
}
