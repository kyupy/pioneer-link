import { Hono } from "hono";
import { validateSignature } from "@line/bot-sdk";
import type { WebhookEvent } from "@line/bot-sdk";
import { resolveOrg } from "./tenant-resolver";
import { getLineClient } from "./line-client";
import { getEnabledPlugins } from "./plugin-loader";
import { orgDb } from "../shared/db";

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
  const { events } = JSON.parse(body) as { events: WebhookEvent[] };

  // 4. Dispatch each event to enabled plugins (first handler wins)
  const plugins = getEnabledPlugins(org);
  const lineClient = getLineClient(org);
  const db = orgDb(org.id);

  for (const event of events) {
    try {
      for (const plugin of plugins) {
        const handled = await plugin.handle({
          orgId: org.id,
          org,
          event,
          lineClient,
          db,
        });
        if (handled) break;
      }
    } catch (err) {
      console.error(`Error processing event for org ${org.id}:`, err);
    }
  }

  return c.json({ status: "ok" }, 200);
});
