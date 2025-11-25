"use client";

import { Mic, MicOff, Video, VideoOff, Monitor, X, FileText } from "lucide-react";

type ControlsProps = {
  muted: boolean;
  videoOff: boolean;
  sharingScreen: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onStartShare: () => void;
  onStopShare: () => void;
  onEndCall: () => void;
  resumeFilePath?: string; // optional local file path for download link
};

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
}: ControlsProps) {
  return (
    // floating pill centered bottom
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div
        className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg flex items-center gap-3
                   border border-gray-200"
        role="toolbar"
        aria-label="Call controls"
      >
        {/* Mic */}
        <button
          onClick={onToggleMute}
          aria-label={muted ? "Unmute microphone" : "Mute microphone"}
          className="p-3 rounded-full hover:scale-105 transition transform bg-white border"
        >
          {muted ? <MicOff className="h-5 w-5 text-red-600" /> : <Mic className="h-5 w-5 text-gray-900" />}
        </button>

        {/* Camera */}
        <button
          onClick={onToggleVideo}
          aria-label={videoOff ? "Turn on camera" : "Turn off camera"}
          className="p-3 rounded-full hover:scale-105 transition transform bg-white border"
        >
          {videoOff ? <VideoOff className="h-5 w-5 text-gray-700" /> : <Video className="h-5 w-5 text-gray-900" />}
        </button>

        {/* Screen share */}
        {!sharingScreen ? (
          <button
            onClick={onStartShare}
            aria-label="Share screen"
            className="p-3 rounded-full hover:scale-105 transition transform bg-white border"
          >
            <Monitor className="h-5 w-5 text-gray-900" />
          </button>
        ) : (
          <button
            onClick={onStopShare}
            aria-label="Stop sharing"
            className="p-3 rounded-full hover:scale-105 transition transform bg-white border"
          >
            <Monitor className="h-5 w-5 text-blue-600" />
          </button>
        )}

        {/* Spacer */}
        <div className="w-2" />

        {/* End call (red) */}
        <button
          onClick={onEndCall}
          aria-label="End call"
          className="p-3 rounded-full hover:scale-105 transition transform bg-red-600 border border-red-700 text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Optional: Resume download (developer note: this uses the uploaded local path) */}
        {resumeFilePath && (
          <a
            href={resumeFilePath}
            target="_blank"
            rel="noreferrer"
            className="ml-3 inline-flex items-center gap-2 text-sm text-gray-700 hover:underline"
            title="Open resume"
          >
            <FileText className="h-4 w-4" />
            Resume
          </a>
        )}
      </div>
    </div>
  );
}
