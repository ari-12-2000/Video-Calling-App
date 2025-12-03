const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.on("join-room", (roomId) => {
    console.log(`User joined room ${roomId}`);
    socket.join(roomId);
    // get number of participants
    const count = io.sockets.adapter.rooms.get(roomId)?.size || 0;

    // send the active users count to both sides
    io.to(roomId).emit("room-user-count", count);
    socket.to(roomId).emit("user-joined", socket.id);
  });

  socket.on("ready", (roomId) => {
    socket.to(roomId).emit("peer-ready");
  });
  socket.on("offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("offer", offer);
  });
  socket.on("answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("answer", answer);
  });
  socket.on("ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("ice-candidate", candidate);
  });
  socket.on("leave-room", (roomId) => {
    socket.leave(roomId); // ❗ remove socket from room

    // Update count after removal
    const count = io.sockets.adapter.rooms.get(roomId)?.size || 0;
    io.to(roomId).emit("room-user-count", count);

    socket.to(roomId).emit("user-left");
    console.log(`User ${socket.id} left room ${roomId}. Users left: ${count}`);
  });

  socket.on("screen-stopped", (roomId) => {
    socket.to(roomId).emit("screen-stopped");
  });

  socket.on("send-message", ({ roomId, message }) => {
    socket.to(roomId).emit("receive-message", {
      message,
      sender: socket.id,
      timestamp: Date.now(),
    });
  });
});
server.listen(5000, () => {
  console.log("Signaling server running on http://localhost:5000");
});
