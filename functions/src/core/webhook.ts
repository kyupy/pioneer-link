import { Hono } from "hono";
import { validateSignature } from "@line/bot-sdk";
import type { WebhookEvent } from "@line/bot-sdk";
import { resolveOrg } from "./tenant-resolver";
import { resolveUser } from "./user-service";
import { getLineClient } from "./line-client";
import { route } from "./router";

const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";

export const webhook = new Hono();

webhook.post("/:channelId", async (c) => {
  const channelId = c.req.param("channelId");
  const body = await c.req.text();
  const signature = c.req.header("x-line-signature") ?? "";

  // 1. Resolve tenant
  const org = await resolveOrg(channelId);
  if (!org) {
    return c.json({ error: "Unknown channel" }, 404);
  }

  // 2. Verify signature (skip in emulator)
  if (!isEmulator && !validateSignature(body, org.lineChannelSecret, signature)) {
    return c.json({ error: "Invalid signature" }, 401);
  }

  // 3. Parse events
  const parsed = JSON.parse(body) as { events: WebhookEvent[] };
  const events = parsed.events;

  // 4. Process each event
  const lineClient = getLineClient(org);

  for (const event of events) {
    try {
      const userId = event.source?.userId;
      if (!userId) continue;

      const { user, member } = await resolveUser(userId, org.id, lineClient);
      await route(event, org, user, member);
    } catch (err) {
      console.error(`Error processing event for org ${org.id}:`, err);
    }
  }

  return c.json({ status: "ok" }, 200);
});
