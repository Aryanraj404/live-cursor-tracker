import { useEffect, useRef, useState } from "react";
import socket from "./socket";

/* ---------- Color generator ---------- */
const getColorFromId = (id) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 50%)`;
};

function App() {
  /* ==============================
     User identity (TAB-SCOPED)
     ============================== */
  const usernameRef = useRef(null);
  const roomRef = useRef(null);

  if (!usernameRef.current) {
    usernameRef.current =
      sessionStorage.getItem("username") ||
      prompt("Enter your name") ||
      "Anonymous";

    sessionStorage.setItem("username", usernameRef.current);
  }

  if (!roomRef.current) {
    roomRef.current =
      sessionStorage.getItem("roomId") ||
      prompt("Enter room ID") ||
      "global";

    sessionStorage.setItem("roomId", roomRef.current);
  }

  const username = usernameRef.current;
  const roomId = roomRef.current;

  /* ==============================
     State
     ============================== */
  const [cursors, setCursors] = useState({});
  const [objects, setObjects] = useState([]);
  const [draggingId, setDraggingId] = useState(null);

  /* ==============================
     Socket + Mouse + Objects
     ============================== */
  useEffect(() => {
    // 🔥 JOIN ROOM IMMEDIATELY (do NOT wait for "connect")
    socket.emit("join", { username, roomId });

    let lastSent = 0;

    const handleMouseMove = (e) => {
      const now = Date.now();

      if (now - lastSent > 50) {
        // cursor update
        socket.emit("cursor-move", {
          x: e.clientX,
          y: e.clientY,
        });

        // object dragging
        if (draggingId) {
          socket.emit("move-object", {
            id: draggingId,
            x: e.clientX,
            y: e.clientY,
          });
        }

        lastSent = now;
      }
    };

    const handleMouseUp = () => {
      if (draggingId) {
        socket.emit("drop-object", draggingId);
        setDraggingId(null);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    // -------- Cursor updates (ROOM-SCOPED from server) --------
    socket.on("cursor-update", ({ id, x, y, username }) => {
      setCursors((prev) => {
        const prevCursor = prev[id] || {
          x,
          y,
          targetX: x,
          targetY: y,
          username,
        };

        return {
          ...prev,
          [id]: {
            ...prevCursor,
            targetX: x,
            targetY: y,
            username,
          },
        };
      });
    });

    socket.on("cursor-remove", (id) => {
      setCursors((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    });

    // -------- Objects (ROOM-SCOPED from server) --------
    socket.on("init-objects", (serverObjects) => {
      setObjects(serverObjects);
    });

    socket.on("object-update", (updatedObj) => {
      setObjects((prev) =>
        prev.map((o) => (o.id === updatedObj.id ? updatedObj : o))
      );
    });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      socket.off("cursor-update");
      socket.off("cursor-remove");
      socket.off("init-objects");
      socket.off("object-update");
    };
  }, [username, roomId, draggingId]);

  /* ==============================
     Linear Interpolation
     ============================== */
  useEffect(() => {
    const animate = () => {
      setCursors((prev) => {
        const updated = {};
        for (const id in prev) {
          const c = prev[id];
          const dx = c.targetX - c.x;
          const dy = c.targetY - c.y;

          updated[id] = {
            ...c,
            x: c.x + dx * 0.2,
            y: c.y + dy * 0.2,
          };
        }
        return updated;
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  /* ==============================
     Pick object
     ============================== */
  const handlePickObject = (id) => {
    socket.emit("pick-object", id);
    setDraggingId(id);
  };

  /* ==============================
     Render
     ============================== */
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#0f172a",
        color: "white",
        overflow: "hidden",
        position: "relative",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h2 style={{ padding: "10px 16px", margin: 0 }}>
        Live Cursor Tracker — Room: {roomId}
      </h2>

      <div
  style={{
    position: "absolute",
    top: 12,
    right: 16,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "rgba(0,0,0,0.4)",
    padding: "6px 10px",
    borderRadius: "10px",
    fontSize: "12px",
  }}
>
  <img
    src="https://res.cloudinary.com/startup-grind/image/upload/c_fill,dpr_2.0,f_auto,g_center,q_auto:good/v1/gcs/platform-data-goog/events/gdsc_jaCyFcF.jpg"
    alt="GDSC"
    style={{
      width: "32px",
      height: "32px",
      borderRadius: "50%",
      objectFit: "cover",
    }}
  />
  <span style={{ opacity: 0.85 }}>
    GDSC - NITC
  </span>
</div>


      {/* Cursors */}
      {Object.entries(cursors).map(([id, pos]) => (
        <div
          key={id}
          style={{
            position: "absolute",
            left: pos.x,
            top: pos.y,
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: getColorFromId(id),
              boxShadow: `0 0 8px ${getColorFromId(id)}`,
            }}
          />
          <span
            style={{
              fontSize: "12px",
              color: getColorFromId(id),
              background: "rgba(0,0,0,0.4)",
              padding: "2px 6px",
              borderRadius: "6px",
            }}
          >
            {pos.username}
          </span>
        </div>
      ))}

      {/* Objects (ROOM-SCOPED) */}
      {objects.map((obj) => (
        <div
          key={obj.id}
          onMouseDown={() => handlePickObject(obj.id)}
          style={{
            position: "absolute",
            left: obj.x,
            top: obj.y,
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            backgroundColor: obj.heldBy ? "#f97316" : "#3b82f6",
            boxShadow: "0 4px 10px rgba(0,0,0,0.4)",
            cursor: "grab",
            userSelect: "none",
          }}
        />
      ))}
    </div>
  );
}

export default App;
