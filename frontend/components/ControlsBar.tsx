"use client";

import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  X,
  FileText,
} from "lucide-react";

export default function ControlsBar({
  muted,
  videoOff,
  sharingScreen,
  onToggleMute,
  onToggleVideo,
  onStartShare,
  onStopShare,
  onEndCall,
  resumeFilePath,
}: any) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-white/90 backdrop-blur-lg px-3 py-2 rounded-full shadow-xl flex items-center gap-3 border border-gray-200">

        <button onClick={onToggleMute} className="p-3 bg-white border rounded-full">
          {muted ? <MicOff className="text-red-600" /> : <Mic />}
        </button>

        <button onClick={onToggleVideo} className="p-3 bg-white border rounded-full">
          {videoOff ? <VideoOff /> : <Video />}
        </button>

        {sharingScreen ? (
          <button onClick={onStopShare} className="p-3 bg-white border rounded-full">
            <Monitor className="text-blue-600" />
          </button>
        ) : (
          <button onClick={onStartShare} className="p-3 bg-white border rounded-full">
            <Monitor />
          </button>
        )}

        <div className="w-2" />

        <button onClick={onEndCall} className="p-3 bg-red-600 rounded-full text-white border border-red-700">
          <X />
        </button>

        {resumeFilePath && (
          <a
            href={resumeFilePath}
            target="_blank"
            className="ml-3 inline-flex items-center gap-1 text-gray-700 text-sm"
          >
            <FileText className="h-4 w-4" /> Resume
          </a>
        )}
      </div>
    </div>
  );
}
