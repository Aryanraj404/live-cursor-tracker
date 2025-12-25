import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(cors());

// ---- In-memory state ----
const users = {}; // socket.id -> { username, roomId }

const objects = [
  { id: "obj1", x: 200, y: 200, heldBy: null },
  { id: "obj2", x: 400, y: 300, heldBy: null },
];

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ---- Join room ----
  socket.on("join", ({ username, roomId }) => {
    users[socket.id] = { username, roomId };
    socket.join(roomId);

    // send existing objects to new user
    socket.emit("init-objects", objects);
  });

  // ---- Cursor movement ----
  socket.on("cursor-move", ({ x, y }) => {
    const user = users[socket.id];
    if (!user) return;

    socket.to(user.roomId).emit("cursor-update", {
      id: socket.id,
      x,
      y,
      username: user.username,
    });
  });

  // ---- Pick object ----
  socket.on("pick-object", (objectId) => {
    const obj = objects.find((o) => o.id === objectId);
    if (obj && obj.heldBy === null) {
      obj.heldBy = socket.id;
      io.emit("object-update", obj);
    }
  });

  // ---- Move object ----
  socket.on("move-object", ({ id, x, y }) => {
    const obj = objects.find((o) => o.id === id);
    if (obj && obj.heldBy === socket.id) {
      obj.x = x;
      obj.y = y;
      io.emit("object-update", obj);
    }
  });

  // ---- Drop object ----
  socket.on("drop-object", (objectId) => {
    const obj = objects.find((o) => o.id === objectId);
    if (obj && obj.heldBy === socket.id) {
      obj.heldBy = null;
      io.emit("object-update", obj);
    }
  });

  // ---- Disconnect ----
  socket.on("disconnect", () => {
    const user = users[socket.id];
    if (user) {
      socket.to(user.roomId).emit("cursor-remove", socket.id);
      delete users[socket.id];
    }

    // release any held objects
    objects.forEach((obj) => {
      if (obj.heldBy === socket.id) {
        obj.heldBy = null;
        io.emit("object-update", obj);
      }
    });

    console.log("User disconnected:", socket.id);
  });
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});
