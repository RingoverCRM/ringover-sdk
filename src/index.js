import { io } from "socket.io-client";

let socket = null;

let socketUrl = "https://bb8c-103-62-93-142.ngrok-free.app/";

const defaultIconUrl =
  "https://storage.googleapis.com/apt-cubist-307713.appspot.com/crm/assets/32px%20logo%20RO.svg";

let iconUrl = defaultIconUrl;

let notificationDurationInMs = 7000;

let unreadNotifications = 0;

let originalTitle = document.title;
let originalFavicon = getCurrentFavicon();

const PLATFORMS = {
  EMPOWER: "empower",
  CADENCE: "cadence",
  TRANSCRIPTION: "transcription",
  AICHAT: "aichat",
  ALL: "all",
};

const NOTIFICATION_TYPES = {
  BROWSER: "browser",
  IN_APP: "in_app",
  ALL: "all",
};

function getCurrentFavicon() {
  // Select the link element with rel="icon" or rel="shortcut icon"
  const link = document.querySelector(
    "link[rel='icon'], link[rel='shortcut icon']",
  );

  // Check if the link element exists
  if (link) {
    return link.href; // Return the href attribute which contains the favicon URL
  } else {
    return null; // Return null if no favicon is found
  }
}

function getNotificationHtml(title, body) {
  return `
      <div class="notif-color"></div>

      <div class="notif-content">
        <div class="notif-heading">
          <div class="notif-icon">
            <img src="https://storage.googleapis.com/apt-cubist-307713.appspot.com/crm/assets/logo-primary.svg"/>
          </div>
          <strong>${title}</strong>
        </div>
        <div class="notif-text">
          <p>${body}</p>
        </div>
      </div>

      <button class="notif-close">
        <img src="https://storage.googleapis.com/apt-cubist-307713.appspot.com/crm/assets/close.svg"/>
      </button>
`;
}

function addGoogleFontHeaders() {
  // Create the preconnect links
  const preconnectGoogleFonts = document.createElement("link");
  preconnectGoogleFonts.rel = "preconnect";
  preconnectGoogleFonts.href = "https://fonts.googleapis.com";

  const preconnectGstatic = document.createElement("link");
  preconnectGstatic.rel = "preconnect";
  preconnectGstatic.href = "https://fonts.gstatic.com";
  preconnectGstatic.crossOrigin = "";

  // Create the stylesheet link
  const stylesheetLink = document.createElement("link");
  stylesheetLink.href =
    "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap";
  stylesheetLink.rel = "stylesheet";

  // Append the links to the document head
  document.head.appendChild(preconnectGoogleFonts);
  document.head.appendChild(preconnectGstatic);
  document.head.appendChild(stylesheetLink);
}

function addNotificationStack() {
  const style = document.createElement("style");
  style.textContent = `
  #ringover-sdk-notif-stack {
    position: absolute;
    top: 16px;
    right: 16px;

    width: 500px;
    padding-bottom: 20px;

    height: 60vh;
    overflow: auto;

    z-index: 2147483647;

    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    align-items: flex-end;
  }

  #ringover-sdk-notif-stack::-webkit-scrollbar {
    display: none;
    width: 0;
  }

`;

  // Append the style element to the head
  document.head.appendChild(style);

  const notificationStack = document.createElement("div");
  notificationStack.id = "ringover-sdk-notif-stack";

  // Append the notification to the body
  document.body.appendChild(notificationStack);
}

const notificationStyles = `
.ringover-sdk-notif {
  position: relative;
  border-radius: 8px;
  z-index: 1000;
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
  opacity: 1;
  transform: translateY(0);

  display: flex;
  width: 380px;
  max-width: 480px;
}

.ringover-sdk-notif.hide {
  opacity: 0;
  transform: translateY(-20px);
}

.ringover-sdk-notif .notif-color {
  width: 6px;
  border-radius: 8px 0px 0px 8px;
  background: #01707f;
}

.ringover-sdk-notif .notif-heading {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 8px;
}

.ringover-sdk-notif .notif-heading .notif-icon {
  transform: translateY(2px);
}

.ringover-sdk-notif .notif-heading strong {
  font-weight: 700;
  line-height: 21px; /* 150% */
  letter-spacing: 0.25px;
  color: #01707f;
  font-family: Inter;
}

.ringover-sdk-notif .notif-content {
  background-color: #f9fbff;
  position: relative;
  padding: 20px;
  width: 100%;
}

.ringover-sdk-notif .notif-content .notif-text p {
  color: #394759;
  margin: 0;
  font-family: Inter;
}

.ringover-sdk-notif .notif-close {
  background-color: #f9fbff;
  position: absolute;
  top: 20px;
  right: 20px;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
}
`;

function playAlertSound() {
  const audio = new Audio(
    "https://storage.googleapis.com/apt-cubist-307713.appspot.com/crm/assets/alert.mp3",
  );
  audio.play().catch((error) => {
    console.error("Error playing sound:", error);
  });
}

function updateUnreadNotifications() {
  unreadNotifications++;
  const title = document.title.replace(/^\(\d+\)\s*/, "");
  document.title = `(${unreadNotifications}) ${title}`;
  // Optionally, change the favicon
  changeFavicon(
    "https://storage.googleapis.com/apt-cubist-307713.appspot.com/crm/assets/red-favicon-16x16.png",
  );
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
  notificationTypes = [];

  constructor({ title, body, platform, notificationTypes }) {
    this.title = title;
    this.body = body;
    this.platform = platform;
    this.notificationTypes = notificationTypes;
  }

  showInAppNotification() {
    const style = document.createElement("style");
    style.textContent = notificationStyles;

    // Append the style element to the head
    document.head.appendChild(style);

    // Create a notification element
    const notification = document.createElement("div");
    notification.className = "ringover-sdk-notif";
    notification.innerHTML = getNotificationHtml(this.title, this.body);

    const notificationStack = document.getElementById(
      "ringover-sdk-notif-stack",
    );

    notificationStack.prepend(notification);

    // Select the close button
    const closeButton = notification.querySelector(".notif-close");

    // Add click event listener to the close button
    closeButton.addEventListener("click", () => {
      notification.classList.add("hide");
      // Remove the notification from the DOM after the animation
      notification.addEventListener("transitionend", () => {
        if (notificationStack.contains(notification)) {
          notificationStack.removeChild(notification);
        }
      });
    });

    // Automatically hide the notification after a certain time (e.g., 5 seconds)
    setTimeout(() => {
      notification.classList.add("hide");
      // Remove the notification from the DOM after the animation
      notification.addEventListener("transitionend", () => {
        if (notificationStack.contains(notification))
          notificationStack.removeChild(notification);
      });
    }, notificationDurationInMs); // Adjust time as needed

    // Only play sound and update title if the user is not in the current tab
    if (document.hidden) {
      playAlertSound();
      updateUnreadNotifications();
    }
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

  sendNotification() {
    for (const notificationType of this.notificationTypes) {
      switch (notificationType) {
        case NOTIFICATION_TYPES.BROWSER: {
          this.showSystemNotification();
          break;
        }

        case NOTIFICATION_TYPES.IN_APP: {
          this.showInAppNotification();
          break;
        }

        case NOTIFICATION_TYPES.ALL: {
          this.showInAppNotification();
          this.showSystemNotification();
          break;
        }
      }
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
    if (data.platform !== platform && data.platform !== PLATFORMS.ALL) return;

    const notification = new RingoverNotification({
      title: data.title,
      body: data.caption,
      platform: data.platform,
      notificationTypes: data.notification_types,
    });
    notification.sendNotification();
  });
}

// This is the main function which is called by the client
function connect({ platform, notificationIconUrl, notificationDuration }) {
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
  addGoogleFontHeaders();
  addNotificationStack();

  if (notificationIconUrl) iconUrl = notificationIconUrl;
  if (notificationDuration) notificationDurationInMs = notificationDuration;

  try {
    socket = io(socketUrl, {
      transports: ["websocket"],
    });
    initializeSocketEvents(platform);
  } catch (err) {
    console.log(err);
  }

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      if (unreadNotifications > 0) {
        document.title = originalTitle;
        unreadNotifications = 0;
        changeFavicon(originalFavicon);
      }
    }
  });
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
