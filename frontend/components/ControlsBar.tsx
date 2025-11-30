"use client";

import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  X,
  FileText,
  MonitorOff,
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
}: any) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-white/95 backdrop-blur-lg px-4 py-3 rounded-full shadow-2xl flex items-center gap-4 border border-gray-300">

        {/* Mic */}
        <button
          onClick={onToggleMute}
          className="p-3 bg-white border rounded-full hover:bg-gray-100 transition"
        >
          {muted ? (
            <MicOff className="text-red-600 w-5 h-5" />
          ) : (
            <Mic className="text-gray-900 w-5 h-5" />
          )}
        </button>

        {/* Camera */}
        <button
          onClick={onToggleVideo}
          className="p-3 bg-white border rounded-full hover:bg-gray-100 transition"
        >
          {videoOff ? (
            <VideoOff className="text-gray-700 w-5 h-5" />
          ) : (
            <Video className="text-gray-900 w-5 h-5" />
          )}
        </button>

        {/* Screen Share */}
        {!sharingScreen ? (
          <button
            onClick={onStartShare}
            className="p-3 bg-white border rounded-full hover:bg-gray-100 transition"
          >
            <Monitor className="text-gray-900 w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={onStopShare}
            className="p-3 bg-white border rounded-full hover:bg-gray-100 transition"
          >
            <MonitorOff className="text-blue-600 w-5 h-5" />
          </button>
        )}

        {/* End Call */}
        <button
          onClick={onEndCall}
          className="p-3 bg-red-600 rounded-full hover:bg-red-700 transition border border-red-700"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
}
