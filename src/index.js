import { io } from "socket.io-client";

let socket = null;

let socketUrl = "https://bb8c-103-62-93-142.ngrok-free.app/";

const defaultIconUrl =
  "https://storage.googleapis.com/apt-cubist-307713.appspot.com/crm/assets/32px%20logo%20RO.svg";

let iconUrl = defaultIconUrl;

let unreadNotifications = 0;

const PLATFORMS = {
  EMPOWER: "empower",
  CADENCE: "cadence",
  TRANSCRIPTION: "transcription",
  AICHAT: "aichat",
  ALL: "all",
};

const notificationStyles = `
    .ringover-sdk-notif {
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #4caf50; /* Green background */
      color: white; /* White text */
      padding: 15px;
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      z-index: 1000; /* Ensure it appears above other elements */
      transition: opacity 0.5s ease, transform 0.5s ease;
      opacity: 1;
      transform: translateY(0);
    }

    .ringover-sdk-notif.hide {
      opacity: 0;
      transform: translateY(-20px);
    }
`;

function playAlertSound() {
  const audio = new Audio("path/to/your/alert-sound.mp3"); // Replace with your sound file path
  audio.play().catch((error) => {
    console.error("Error playing sound:", error);
  });
}

function updateUnreadNotifications() {
  unreadNotifications++;
  document.title = `(${unreadNotifications}) New Notifications - Your Page Title`; // Update the title
  // Optionally, change the favicon
  changeFavicon("path/to/your/unread-favicon.ico"); // Replace with your unread favicon path
}

function changeFavicon(src) {
  let link =
    document.querySelector("link[rel*='icon']") ||
    document.createElement("link");
  link.type = "image/x-icon";
  link.rel = "icon";
  link.href = src;
  document.getElementsByTagName("head")[0].appendChild(link);
}

class RingoverNotification {
  title = "";
  body = "";
  platform = "";

  constructor({ title, body, platform }) {
    this.title = title;
    this.body = body;
    this.platform = platform;
  }

  showInAppNotification() {
    const style = document.createElement("style");
    style.textContent = notificationStyles;

    // Append the style element to the head
    document.head.appendChild(style);

    // Create a notification element
    const notification = document.createElement("div");
    notification.className = "ringover-sdk-notif";
    notification.innerHTML = `<strong>${this.title}</strong><p>${this.body}</p>`;

    // Append the notification to the body
    document.body.appendChild(notification);

    // Automatically hide the notification after a certain time (e.g., 5 seconds)
    setTimeout(() => {
      notification.classList.add("hide");
      // Remove the notification from the DOM after the animation
      notification.addEventListener("transitionend", () => {
        if (document.body.contains(notification))
          document.body.removeChild(notification);
      });
    }, 5000); // Adjust time as needed
  }

  showSystemNotification() {
    if (Notification?.permission === "granted") {
      const notification = new Notification(this.title, {
        body: this.body,
        icon: iconUrl,
      });

      notification.onclick = function (e) {
        window.focus();
      };
    } else if (Notification?.permission !== "denied") {
      Notification.requestPermission().then((status) => {
        // If the user said okay
        if (status === "granted") {
          const notification = new Notification(this.title, {
            body: this.body,
            icon: iconUrl,
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
}

function initializeSocketEvents(platform) {
  socket.on("connect", () => {
    console.log("Connected to the backend socket");
    socket.emit("join-room", platform);
    socket.emit("join-room", "all");
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from the backend socket");
  });

  socket.on("notification", (data) => {
    console.log("Notification received:", data);
    const notification = new RingoverNotification({
      title: data.title,
      body: data.caption,
      platform: data.platform,
    });
    notification.showSystemNotification();
  });
}

// This is the main function which is called by the client
function connect({ platform, notificationIconUrl }) {
  if (!platform) {
    console.log("Platform is required");
    return;
  }
  if (
    !Object.values(PLATFORMS).includes(platform) ||
    platform === PLATFORMS.ALL
  ) {
    console.log("Invalid platform provided");
    return;
  }

  iconUrl = notificationIconUrl || defaultIconUrl;
  try {
    socket = io(socketUrl, {
      transports: ["websocket"],
    });
    initializeSocketEvents(platform);
  } catch (err) {
    console.log(err);
  }
}

function sendTestNotification() {
  const notification = new RingoverNotification({
    title: "Call",
    body: "You got a call from someone special",
    platform: "cadence",
  });
  notification.showInAppNotification();
}

export { connect, sendTestNotification };
