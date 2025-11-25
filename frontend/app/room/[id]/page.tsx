"use client";

import { use, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import VideoPlayer from "@/components/VideoPlayer";
import ControlsBar from "@/components/ControlsBar";
import { useRouter } from "next/navigation";

const socket = io(process.env.BASE_URL);

export default function Room({ params }: { params: Promise<{ id: string }> }) {
  const { id: roomId } = use(params);
  const router = useRouter();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [sharingScreen, setSharingScreen] = useState(false);

  // mute / video toggles
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  const peer = useRef<RTCPeerConnection | null>(null);

  // Helper to stop all local tracks (used when ending call)
  const stopLocalTracks = () => {
    localStream?.getTracks().forEach((t) => t.stop());
  };

  // ------------------ END CALL ------------------
  const endCall = () => {
    // notify server
    socket.emit("leave-room", roomId);

    // stop tracks and close peer
    stopLocalTracks();
    remoteStream?.getTracks().forEach((t) => t.stop());
    peer.current?.close();
    peer.current = null;

    router.push("/");
  };

  // ------------------ MUTE / UNMUTE ------------------
  const toggleMute = () => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setMuted((m) => !m);
  };

  // ------------------ CAMERA ON/OFF ------------------
  const toggleVideo = () => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
    setVideoOff((v) => !v);
  };

  // ------------------ SCREEN SHARE ------------------
  const startScreenShare = async () => {
    if (!peer.current) return;
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screen.getVideoTracks()[0];

      // Replace current video sender track with screen track
      const sender = peer.current.getSenders().find((s) => s.track?.kind === "video");
      await sender?.replaceTrack(screenTrack);

      // when sharing stops, restore camera track
      screenTrack.onended = async () => {
        await stopScreenShare();
      };

      setSharingScreen(true);
    } catch (err) {
      console.error("Screen share failed:", err);
    }
  };

  const stopScreenShare = async () => {
    if (!peer.current || !localStream) return;
    const cameraTrack = localStream.getVideoTracks()[0];
    const sender = peer.current.getSenders().find((s) => s.track?.kind === "video");
    await sender?.replaceTrack(cameraTrack);
    setSharingScreen(false);
  };

  // ------------------ SETUP CALL ------------------
  useEffect(() => {
    socket.emit("join-room", roomId);

    const start = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);

      // Create peer
      peer.current = new RTCPeerConnection({
        iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
      });

      // add local tracks
      stream.getTracks().forEach((track) => peer.current!.addTrack(track, stream));

      // when remote track arrives
      peer.current.ontrack = (e) => {
        setRemoteStream(e.streams[0]);
      };

      // send ice candidates to other peer via signaling
      peer.current.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("ice-candidate", { roomId, candidate: e.candidate });
        }
      };

      // signaling handlers
      socket.on("user-joined", async () => {
        // existing user creates offer
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
      });
    };

    start();

    // cleanup handlers on unmount
    return () => {
      socket.off("user-joined");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("user-left");
    };
  }, [roomId]);

  // ------------------ UI layout logic ------------------
  // If sharing screen, make the remote/other videos stacked on right (small)
  // If only local (no remote), show fullscreen local
  // We'll render accordingly in JSX

  // Resume file path (uploaded file)
  const resumePath = "/mnt/data/AritraKumarBaraResume.pdf";

  return (
    <div className="relative h-screen bg-gray-900 text-white">
      {/* Main content area */}
      <div className="h-full w-full flex">
        {/* When sharing, primary area is the shared screen or remote stream */}
        <div className={`flex-1 flex items-center justify-center p-4 ${sharingScreen ? "bg-black" : ""}`}>
          {/* Primary video/display area */}
          {sharingScreen ? (
            // If sharing screen, show the remote stream or local stream full width (depending on who's sharing)
            <div className="w-full h-full flex items-center justify-center">
              <VideoPlayer stream={remoteStream ?? localStream} />
            </div>
          ) : (
            // Not sharing: if remote exists show grid split, else show local fullscreen
            remoteStream ? (
              <div className="grid grid-cols-2 gap-4 w-full h-full p-6">
                <VideoPlayer stream={localStream} />
                <VideoPlayer stream={remoteStream} />
              </div>
            ) : (
              <div className="w-full h-full p-6">
                <VideoPlayer stream={localStream} />
              </div>
            )
          )}
        </div>

        {/* Right side stacked small videos when sharing */}
        {sharingScreen && (
          <div className="w-56 p-4 flex flex-col gap-3 items-end">
            {/* Local small video */}
            <div className="w-full flex justify-end">
              <VideoPlayer stream={localStream} small muted />
            </div>
            {/* Remote small video (if present) */}
            {remoteStream && (
              <div className="w-full flex justify-end">
                <VideoPlayer stream={remoteStream} small muted />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Controls (Option C) */}
      <ControlsBar
        muted={muted}
        videoOff={videoOff}
        sharingScreen={sharingScreen}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onStartShare={startScreenShare}
        onStopShare={stopScreenShare}
        onEndCall={endCall}
        resumeFilePath={resumePath}
      />
    </div>
  );
}
