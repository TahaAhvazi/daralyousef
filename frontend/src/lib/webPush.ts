import { notificationsApi } from "@/api/modules";

const SW_PATH = "/sw.js";
const DISMISSED_KEY = "atelier.push.dismissed";

export type PushCapability =
  | "unsupported"
  | "denied"
  | "default"
  | "granted"
  | "subscribed"
  | "no-vapid";

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function permissionState(): NotificationPermission | "unsupported" {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

function subscriptionToPayload(sub: PushSubscription) {
  const json = sub.toJSON();
  return {
    endpoint: json.endpoint!,
    keys: {
      p256dh: json.keys!.p256dh!,
      auth: json.keys!.auth!,
    },
    user_agent: navigator.userAgent,
  };
}

export async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;
  try {
    return await navigator.serviceWorker.register(SW_PATH, { scope: "/" });
  } catch (err) {
    console.warn("[push] SW register failed", err);
    return null;
  }
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  const reg = await navigator.serviceWorker.ready.catch(() => null);
  if (!reg) return null;
  return reg.pushManager.getSubscription();
}

export async function enableWebPush(): Promise<{ ok: boolean; reason?: string }> {
  if (!isPushSupported()) return { ok: false, reason: "unsupported" };

  const vapid = await notificationsApi.pushVapidPublicKey();
  if (!vapid.configured || !vapid.public_key) {
    return { ok: false, reason: "no-vapid" };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, reason: permission === "denied" ? "denied" : "default" };
  }

  const reg = (await registerPushServiceWorker()) ?? (await navigator.serviceWorker.ready);
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapid.public_key),
    });
  }

  await notificationsApi.pushSubscribe(subscriptionToPayload(sub));
  localStorage.removeItem(DISMISSED_KEY);
  return { ok: true };
}

export async function disableWebPush(): Promise<void> {
  if (!isPushSupported()) return;
  const sub = await getExistingSubscription();
  if (sub) {
    try {
      await notificationsApi.pushUnsubscribe(sub.endpoint);
    } catch {
      /* still drop local */
    }
    try {
      await sub.unsubscribe();
    } catch {
      /* ignore */
    }
  } else {
    try {
      await notificationsApi.pushUnsubscribeAll();
    } catch {
      /* ignore */
    }
  }
}

export function dismissPushPrompt() {
  localStorage.setItem(DISMISSED_KEY, "1");
}

export function isPushPromptDismissed() {
  return localStorage.getItem(DISMISSED_KEY) === "1";
}

/** Keep browser ↔ server subscription in sync when already granted. */
export async function syncWebPushIfGranted(): Promise<void> {
  if (!isPushSupported()) return;
  if (Notification.permission !== "granted") return;
  try {
    await registerPushServiceWorker();
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    await notificationsApi.pushSubscribe(subscriptionToPayload(sub));
  } catch (err) {
    console.warn("[push] sync failed", err);
  }
}
