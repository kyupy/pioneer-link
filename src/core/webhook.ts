import { Hono } from "hono";
import { validateSignature } from "@line/bot-sdk";
import type { WebhookEvent } from "@line/bot-sdk";
import pino from "pino";
import type { TenantResolver } from "./tenant-resolver.js";
import type { Router } from "./router.js";
import {
  TenantNotFoundError,
  SignatureVerificationError,
} from "../shared/errors.js";

const logger = pino({ name: "webhook" });

export function createWebhookApp(
  tenantResolver: TenantResolver,
  router: Router,
): Hono {
  const app = new Hono();

  app.post("/webhook/:channelId", async (c) => {
    const channelId = c.req.param("channelId");

    // Resolve tenant
    const org = await tenantResolver.resolve(channelId);
    if (!org) {
      throw new TenantNotFoundError(channelId);
    }

    // Get raw body for signature verification
    const rawBody = await c.req.text();
    const signature = c.req.header("x-line-signature");

    if (!signature) {
      throw new SignatureVerificationError();
    }

    // Verify signature with tenant's channel secret
    const isValid = validateSignature(rawBody, org.lineChannelSecret, signature);
    if (!isValid) {
      throw new SignatureVerificationError();
    }

    // Parse events
    const body = JSON.parse(rawBody) as { events: WebhookEvent[] };
    const events = body.events;

    logger.info(
      { channelId, orgId: org.id, eventCount: events.length },
      "Webhook received",
    );

    // Dispatch events concurrently
    const results = await Promise.allSettled(
      events.map((event) => router.dispatch(org, event)),
    );

    for (const result of results) {
      if (result.status === "rejected") {
        logger.error({ err: result.reason }, "Event dispatch error");
      }
    }

    // Always return 200 to LINE
    return c.json({ ok: true });
  });

  return app;
}
