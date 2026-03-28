import { onRequest } from "firebase-functions/v2/https";
import type { Request as ExpressRequest, Response as ExpressResponse } from "express";
import { Hono } from "hono";
import { webhook } from "./core/webhook";
import { loadPlugins } from "./core/plugin-loader";
import { plugins } from "./plugins";

const app = new Hono();

// Initialize plugins on cold start
loadPlugins(plugins);

app.route("/webhook", webhook);

app.get("/health", (c) => c.json({ status: "ok" }));

// Adapter: convert Express req/res (Firebase Functions v2) to Web Request/Response (Hono)
async function honoHandler(req: ExpressRequest, res: ExpressResponse): Promise<void> {
  const url = `${req.protocol}://${req.hostname}${req.originalUrl}`;
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) {
      headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }
  }

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody;
  const bodyStr = hasBody ? (rawBody ? rawBody.toString("utf-8") : JSON.stringify(req.body)) : undefined;

  const request = new Request(url, {
    method: req.method,
    headers,
    body: bodyStr ?? null,
  });

  const response = await app.fetch(request);

  res.status(response.status);
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  const text = await response.text();
  res.send(text);
}

export const api = onRequest(honoHandler);
