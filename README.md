

## Meetly — WebRTC One-to-One Video Calling App

🔗 Live Demo: https://video-calling-app-drab.vercel.app  

### Features
- Real-time peer-to-peer video calling using WebRTC  
- Screen sharing, mute/unmute, camera toggle  
- Text chat during calls  
- Dynamic video layout and responsive UI  
- Robust reconnection handling for network failures  

### Technical Highlights
- Implemented custom signaling server using Node.js + Socket.IO  
- Managed WebRTC lifecycle: offer/answer exchange, ICE candidates, renegotiation  
- Integrated STUN + TURN servers for reliable NAT traversal  
- Handled join/leave events, reconnections, and session recovery  
- Optimized for real-world unstable network conditions  

### Tech Stack
Frontend: Next.js, React, Tailwind CSS  
Backend: Node.js, Socket.IO  
Protocols: WebRTC (ICE, STUN, TURN)

### How to Run Locally

1️⃣ Start backend server

cd server
npm install
npm start

2️⃣ Start frontend

cd frontend
npm install
npm run dev

<img width="1700" height="1039" alt="image" src="https://github.com/user-attachments/assets/3b49b31f-9969-4205-9197-0fc91bcfae0b" />

<img width="446" height="275" alt="image" src="https://github.com/user-attachments/assets/7b3c272d-8649-45e1-b9ea-8f6d33fd86d1" />



