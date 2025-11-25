"use client";

import { useEffect, useRef } from "react";

type Props = {
  stream: MediaStream | null;
  small?: boolean; // when true, render small stacked video
  muted?: boolean;
  autoPlay?: boolean;
};

export default function VideoPlayer({ stream, small = false, muted = false, autoPlay = true }: Props) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      if (stream) {
        ref.current.srcObject = stream;
      } else {
        ref.current.srcObject = null;
      }
    }
  }, [stream]);

  return (
    <video
      ref={ref}
      autoPlay={autoPlay}
      playsInline
      muted={muted}
      className={`bg-black rounded-lg object-cover ${small ? "w-36 h-20" : "w-full h-full"}`}
    />
  );
}
