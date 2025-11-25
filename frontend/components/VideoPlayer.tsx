"use client";

import { useEffect, useRef } from "react";

export default function VideoPlayer({
  stream,
  small = false,
  muted = false,
}: {
  stream: MediaStream | null;
  small?: boolean;
  muted?: boolean;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream || null;
    }
  }, [stream]);

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={muted}
      className={`bg-black rounded-lg object-cover ${
        small ? "w-36 h-24" : "w-full h-full"
      }`}
    />
  );
}
