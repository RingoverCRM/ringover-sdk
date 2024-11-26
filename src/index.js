import { io } from "socket.io-client";

let socket = null;

let socketUrl = "";

function showNotification(title, body) {
  if (Notification?.permission === "granted") {
    const n = new Notification(title, {
      body,
    });
  } else if (Notification?.permission !== "denied") {
    Notification.requestPermission().then((status) => {
      // If the user said okay
      if (status === "granted") {
        const n = new Notification(title, {
          body,
        });
      } else {
        console.log("User denied notification access");
      }
    });
  } else {
    // If the user refuses to get notified, we can fallback to a regular modal alert
  }
}

function initializeSocketEvents() {
  socket.on("connect", () => {
    console.log("Connected to the backend socket");
    socket.emit("join-room", "all");
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from the backend socket");
  });

  socket.on("notification", (data) => {
    console.log("Notification received:", data);
    showNotification(data.title, data.caption);
  });
}

function connect(url) {
  socketUrl = url;
  try {
    socket = io(socketUrl, {
      transports: ["websocket"],
    });
    initializeSocketEvents();
  } catch (err) {
    console.log(err);
  }
}

export { connect };
