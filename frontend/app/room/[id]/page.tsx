"use client";

import { use, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import VideoPlayer from "@/components/VideoPlayer";
import ControlsBar from "@/components/ControlsBar";
import { useRouter } from "next/navigation";

const socket = io("https://video-calling-app-wbka.onrender.com", {
  transports: ["websocket"],
  autoConnect: true,
  forceNew: true,
});

export default function Room({ params }: { params: Promise<{ id: string }> }) {
  const { id: roomId } = use(params);
  const router = useRouter();

  // Streams
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // Screen Sharing
  const [isLocalSharing, setIsLocalSharing] = useState(false);
  const [isRemoteSharing, setIsRemoteSharing] = useState(false);

  // Toggles
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

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



  // ------------------ SETUP CALL ------------------
  useEffect(() => {
    socket.emit("join-room", roomId);

    const start = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setLocalStream(stream);

      peer.current = new RTCPeerConnection({
        iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
      });

      stream.getTracks().forEach((track) => {
        peer.current!.addTrack(track, stream);
      });

      // Remote track
      peer.current.ontrack = (e) => {
        const incoming = e.streams[0];
        // Distinguish between camera and screen
        if (incoming.getVideoTracks()[0].label.includes("screen")) {
          setIsRemoteSharing(true);
          setIsLocalSharing(false);
        } else {
          setRemoteStream(incoming);
        }
      };

      // ICE
      peer.current.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("ice-candidate", {
            roomId,
            candidate: e.candidate,
          });
        }
      };

      // -------- SIGNALING FLOW --------

      socket.on("user-joined", async () => {
        const offer = await peer.current!.createOffer();
        await peer.current!.setLocalDescription(offer);
        socket.emit("offer", { roomId, offer });
      });

      socket.on("offer", async (offer) => {
        await peer.current!.setRemoteDescription(offer);
        const answer = await peer.current!.createAnswer();
        await peer.current!.setLocalDescription(answer);
        socket.emit("answer", { roomId, answer });
      });

      socket.on("answer", (answer) => {
        peer.current!.setRemoteDescription(answer);
      });

      socket.on("ice-candidate", (candidate) => {
        peer.current!.addIceCandidate(candidate);
      });

      socket.on("user-left", () => {
        setRemoteStream(null);
        setIsRemoteSharing(false);
        peer.current?.close();
      });

      socket.on("screen-stopped", () => {
        setIsRemoteSharing(false);
      });
    };

    start();

    return
  }, [roomId]);

  // ------------------ UI LAYOUT LOGIC ------------------

  const someoneIsSharing = isLocalSharing || isRemoteSharing;

  const bigScreenStream =
    isLocalSharing
      ? localStream
      : isRemoteSharing
        ? remoteStream
        : null;

  return (
    <div className="relative h-screen bg-gray-900 text-white">

      {/* MAIN VIDEO AREA */}
      <div className="h-full w-full flex flex-col md:flex-row">


        {/* BIG VIDEO DISPLAY */}
        <div className="relative flex-1 flex items-center justify-center bg-black">

          {/* Priority:
     1) remote screen share (big)
     2) remote camera feed (big)
     3) only you → your own video (big)
  */}
          {isRemoteSharing ? (
            <VideoPlayer stream={remoteStream} />
          ) : remoteStream ? (
            <VideoPlayer stream={remoteStream} />
          ) : (
            <VideoPlayer stream={localStream} />
          )}

          {/* SELF PREVIEW PIP — on mobile always small */}
          {localStream && (
            <div className="absolute bottom-3 right-3 w-28 h-40 md:hidden shadow-lg border border-white rounded-md overflow-hidden">
              <VideoPlayer stream={localStream} muted />
            </div>
          )}
        </div>


        {/* THUMBNAILS — RIGHT ON DESKTOP, BELOW ON MOBILE */}
        {someoneIsSharing && (
          <div className="w-full md:w-56 p-3 flex md:flex-col flex-row gap-2 items-center justify-center md:items-end">
            <VideoPlayer stream={localStream} small muted />
            {remoteStream && <VideoPlayer stream={remoteStream} small muted />}
          </div>
        )}

      </div>


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
