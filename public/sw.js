// Runs in the background, separately from any open tab — this is what lets
// a notification show up even if the app isn't open in the browser.
self.addEventListener("push", (event) => {
  let data = { title: "Reminder", body: "" };
  try {
    data = event.data.json();
  } catch {
    // Ignore malformed payloads rather than crashing the service worker.
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "Reminder", {
      body: data.body || "",
      icon: "/icon.png",
      badge: "/icon.png",
      data: { url: data.url || "/dashboard/planner" },
    })
  );
});

// Clicking the notification focuses an existing tab if there is one,
// otherwise opens a new one at the relevant page.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/dashboard/planner";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
