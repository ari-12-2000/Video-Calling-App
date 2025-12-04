📹 WebRTC Video Calling App Link- https://video-calling-app-drab.vercel.app

A real-time peer-to-peer (P2P) video calling application built using:

Next.js 15 (App Router)

WebRTC (P2P audio/video + screen sharing)

Socket.IO (signaling server)

TypeScript

Tailwind CSS

Lucide Icons

The app supports 1-to-1 video calls, screen sharing, mute/camera toggle, and a Google Meet–style layout — all implemented with pure WebRTC (no SFU).

⭐ Features
🎥 Video & Audio

Real-time P2P video calling using WebRTC

Auto full-screen when only one participant is present

Dynamic split-screen when a remote peer joins

🖥 Screen Sharing

Share screen with 1 click

Remote participant video tiles shrink and move to the right (Google Meet style)

Auto-restore camera when screen sharing stops

🎤 Call Controls (Floating Bar)

Mute / Unmute microphone

Hide / Show camera

Start / Stop screen sharing

Chat with your peer

End call (closes stream + RTCPeerConnection)

Controls always stick to bottom center (floating pill design)

🔧 Signaling

Built using Socket.IO

Handles:

join-room

offer / answer (SDP)

ICE candidate exchange

user-left event

📐 Responsive UI

Tailwind CSS

Video players auto-resize

Full mobile support (full-screen mode)

🏗️ Tech Stack
Frontend

Next.js 15

React + Hooks

Tailwind CSS

lucide-react icons

TypeScript

WebRTC

RTCPeerConnection

STUN server

MediaStreamTrack replaceTrack()

getUserMedia / getDisplayMedia

Backend

Node.js

Express

Socket.IO signaling server

