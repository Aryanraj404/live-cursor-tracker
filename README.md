🖱️ Live Cursor Tracker (GDSC Task 3)

A real-time shared dashboard where multiple users can see each other’s mouse cursors moving live.
Built using React, Node.js, and Socket.IO, with performance optimizations and bonus collaborative features.

📌 Task Description

A shared dashboard where 10+ users can move their mouse, and everyone else sees everyone else’s cursor moving in real time.

Mandatory Challenges

A mouse generates hundreds of events per second → Throttling

Throttling causes jerky movement → Linear Interpolation

Bonus (Optional)

Add objects that users can pick and drop collaboratively

✨ Features Implemented
✅ Core Requirements

Real-time multi-user cursor tracking

WebSocket-based communication using Socket.IO

Supports 10+ concurrent users

Smooth real-time experience

⚙️ Performance Optimizations

Throttling (50ms):
Mouse events are limited to 20 updates per second to prevent server overload.

Linear Interpolation:
Client-side interpolation ensures smooth cursor movement between throttled updates.

🧩 Bonus Features

Shared draggable objects (pick & drop)

Room-based isolation (users in different rooms don’t interfere)

Unique cursor colors per user

Usernames displayed next to cursors

Automatic cleanup on disconnect

Each browser tab represents a unique user

🛠️ Tech Stack

Frontend: React (Vite)

Backend: Node.js, Express

Real-time Communication: Socket.IO

Styling: Inline CSS (minimal & intentional)

Storage: sessionStorage (per-tab user identity)

🚀 How to Run Locally

1️⃣ Clone the repository

git clone https://github.com/Aryanraj404/live-cursor-tracker.git

cd live-cursor-tracker

2️⃣ Start the backend

cd server

npm install

node index.js


Server runs on:

http://localhost:3000

3️⃣ Start the frontend

cd client

npm install

npm run dev


Frontend runs on:

http://localhost:5173

🧪 How to Test

Open multiple browser tabs

Each tab will ask for:

Username

Room ID

Tabs in the same room:

See each other’s cursors

Can drag shared objects together

Tabs in different rooms:

Completely isolated state