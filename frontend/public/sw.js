/* Service worker — Web Push for Chrome / Edge / Firefox (Windows-first). */
/* global self, clients, registration */

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function asPath(url) {
  if (!url) return "/app/notifications";
  try {
    if (url.startsWith("http")) {
      const u = new URL(url);
      return u.pathname + u.search + u.hash;
    }
  } catch (_) {
    /* ignore */
  }
  return url.startsWith("/") ? url : `/${url}`;
}

self.addEventListener("push", (event) => {
  let data = {
    title: "Dar Al-Yousef",
    body: "",
    url: "/app/notifications",
    tag: "atelier",
  };
  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch (_) {
    try {
      data.body = event.data ? event.data.text() : "";
    } catch (__) {
      /* ignore */
    }
  }

  const title = data.title || "Notification";
  const options = {
    body: data.body || "",
    icon: "/logo.jpg",
    badge: "/favicon.svg",
    tag: data.tag || "atelier",
    renotify: true,
    requireInteraction: data.type === "chat.message",
    data: {
      url: asPath(data.url),
      type: data.type || "generic",
      notification_id: data.notification_id || null,
    },
  };

  event.waitUntil(
    (async () => {
      // If a tab is already focused, skip OS toast (in-app SSE covers it).
      try {
        const windowClients = await clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        });
        const focused = windowClients.some((c) => c.focused);
        if (focused) return;
      } catch (_) {
        /* still show */
      }
      await self.registration.showNotification(title, options);
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = asPath(event.notification?.data?.url);

  event.waitUntil(
    (async () => {
      const all = await clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of all) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) {
            try {
              await client.navigate(target);
              return;
            } catch (_) {
              /* fall through */
            }
          }
          client.postMessage({ type: "notification-click", url: target });
          return;
        }
      }
      await clients.openWindow(target);
    })(),
  );
});
