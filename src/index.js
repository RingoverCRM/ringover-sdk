import { io } from "socket.io-client";

let socket = null;

let socketUrl = "";

const defaultIconUrl =
  "https://storage.googleapis.com/apt-cubist-307713.appspot.com/crm/assets/32px%20logo%20RO.svg";

function showNotification(title, body, iconUrl) {
  const notificationIconUrl = iconUrl || defaultIconUrl;

  if (Notification?.permission === "granted") {
    const notification = new Notification(title, {
      body,
      icon: notificationIconUrl,
    });

    notification.onclick = function (e) {
      window.focus();
    };
  } else if (Notification?.permission !== "denied") {
    Notification.requestPermission().then((status) => {
      // If the user said okay
      if (status === "granted") {
        const notification = new Notification(title, {
          body,
          icon: notificationIconUrl,
        });

        notification.onclick = function () {
          window.focus();
        };
      } else {
        console.log("User denied notification access");
      }
    });
  } else {
    // If the user refuses to get notified, we can fallback to a regular modal alert
  }
}

function initializeSocketEvents(iconUrl) {
  socket.on("connect", () => {
    console.log("Connected to the backend socket");
    socket.emit("join-room", "all");
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from the backend socket");
  });

  socket.on("notification", (data) => {
    console.log("Notification received:", data);
    showNotification(data.title, data.caption, iconUrl);
  });
}

function connect(url, iconUrl) {
  socketUrl = url;
  try {
    socket = io(socketUrl, {
      transports: ["websocket"],
    });
    initializeSocketEvents(iconUrl);
  } catch (err) {
    console.log(err);
  }
}

export { connect };
