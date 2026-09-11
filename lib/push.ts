import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { requireEnv } from "@/lib/env";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  webpush.setVapidDetails(
    requireEnv("VAPID_SUBJECT"), // e.g. "mailto:you@example.com"
    requireEnv("VAPID_PUBLIC_KEY"),
    requireEnv("VAPID_PRIVATE_KEY")
  );
  configured = true;
}

/**
 * Sends a push notification to every device the given user has subscribed
 * on. Subscriptions that the browser has revoked or expired (410 Gone / 404)
 * are removed automatically so they stop being retried forever.
 */
export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string }
) {
  ensureConfigured();

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subscriptions.length === 0) return { sent: 0 };

  const results = await Promise.allSettled(
    subscriptions.map((sub: { endpoint: string; p256dh: string; auth: string }) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload)
      )
    )
  );

  const deadSubscriptionIds: string[] = [];
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      const statusCode = (result.reason as { statusCode?: number })?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        deadSubscriptionIds.push(subscriptions[i].id);
      }
    }
  });

  if (deadSubscriptionIds.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: deadSubscriptionIds } } });
  }

  return { sent: results.filter((r) => r.status === "fulfilled").length };
}
