

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

<img width="446" height="275" alt="image" src="https://github.com/user-attachments/assets/a4fc7411-4065-4c20-b01d-b3f63bb72141" />


<img width="446" height="275" alt="image" src="https://github.com/user-attachments/assets/7b3c272d-8649-45e1-b9ea-8f6d33fd86d1" />

<img width="1892" height="1074" alt="image" src="https://github.com/user-attachments/assets/64791f59-aeb6-4c06-ad62-65a4addca071" />




