import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pino from "pino";
import { loadEnv } from "./env.js";
import { getDb } from "./db/index.js";
import { EventBus } from "./core/event-bus.js";
import { LineClientFactory } from "./core/line-client.js";
import { TenantResolver } from "./core/tenant-resolver.js";
import { UserService } from "./core/user-service.js";
import { StateService } from "./core/state-service.js";
import { ConnectionService } from "./core/connection-service.js";
import { PluginLoader } from "./core/plugin-loader.js";
import { Router } from "./core/router.js";
import { createWebhookApp } from "./core/webhook.js";
import { AppError } from "./shared/errors.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const logger = pino({ name: "pioneer-link" });

async function main() {
  const env = loadEnv();
  logger.level = env.LOG_LEVEL;

  // Database
  const db = getDb(env.DATABASE_URL);
  logger.info("Database connected");

  // Core services
  const eventBus = new EventBus();
  const lineClientFactory = new LineClientFactory();
  const tenantResolver = new TenantResolver(db);
  const userService = new UserService(db);
  const stateService = new StateService(db);
  const connectionService = new ConnectionService(db);
  const pluginLoader = new PluginLoader(db, eventBus);

  // Load plugins
  const pluginsDir = join(__dirname, "plugins");
  await pluginLoader.discoverAndLoad(pluginsDir);

  // Router
  const router = new Router(
    userService,
    stateService,
    pluginLoader,
    lineClientFactory,
  );

  // Hono app
  const app = new Hono();

  // Health check
  app.get("/health", (c) => c.json({ status: "ok" }));

  // Webhook routes
  const webhookApp = createWebhookApp(tenantResolver, router);
  app.route("/", webhookApp);

  // Error handler
  app.onError((err, c) => {
    if (err instanceof AppError) {
      logger.warn({ err: err.message, status: err.statusCode }, "App error");
      return c.json({ error: err.message }, err.statusCode as 400);
    }
    logger.error({ err }, "Unhandled error");
    return c.json({ error: "Internal Server Error" }, 500);
  });

  // Start server
  serve({ fetch: app.fetch, port: env.PORT }, (info) => {
    logger.info(
      { port: info.port },
      "Pioneer-Link platform started",
    );
  });
}

main().catch((err) => {
  logger.fatal({ err }, "Failed to start");
  process.exit(1);
});

// Export for testing
export { main };
