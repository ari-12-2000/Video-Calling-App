"use client";

import { useEffect, useRef } from "react";
import FallbackAvatar from "./FallbackAvatar";

export default function VideoPlayer({
  stream,
  small = false,
  muted = false,
  videoOff = false,
  remoteOrientation,
}: {
  stream: MediaStream | null;
  small?: boolean;
  muted?: boolean;
  videoOff?: boolean;
  remoteOrientation?: "portrait" | "landscape"

}) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (ref.current && stream && !videoOff) {
      ref.current.srcObject = stream;
      console.log("🎥 Video stream attached.");
    }
  }, [stream, videoOff]);

  // fallback UI when no stream (camera off / waiting / no permission)
  if (!stream || videoOff) {
    return (
      <div className="w-full h-full grid items-center bg-black rounded-lg">
        <FallbackAvatar />
      </div>
    );
  }

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={muted}
      className={`bg-black rounded-lg object-cover h-full ${remoteOrientation && remoteOrientation === "portrait" ? "aspect-9/16":"w-full"}`}
    />
  );
}
