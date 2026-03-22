import type { WebhookEvent } from "@line/bot-sdk";
import pino from "pino";
import type { Organization, HandlerContext } from "../shared/types.js";
import type { UserService } from "./user-service.js";
import type { StateService } from "./state-service.js";
import type { PluginLoader } from "./plugin-loader.js";
import type { LineClientFactory } from "./line-client.js";

const logger = pino({ name: "router" });

function getReplyToken(event: WebhookEvent): string | null {
  if ("replyToken" in event) {
    return event.replyToken ?? null;
  }
  return null;
}

function getUserId(event: WebhookEvent): string | null {
  if (event.source && "userId" in event.source) {
    return event.source.userId ?? null;
  }
  return null;
}

export class Router {
  constructor(
    private userService: UserService,
    private stateService: StateService,
    private pluginLoader: PluginLoader,
    private lineClientFactory: LineClientFactory,
  ) {}

  async dispatch(org: Organization, event: WebhookEvent): Promise<void> {
    const lineUserId = getUserId(event);
    if (!lineUserId) {
      logger.debug({ eventType: event.type }, "Event has no userId, skipping");
      return;
    }

    // Upsert user and membership
    const user = await this.userService.upsertUser(lineUserId);
    const membership = await this.userService.ensureMembership(
      user.id,
      org.id,
    );

    const lineClient = this.lineClientFactory.getClient(org);
    const replyToken = getReplyToken(event);

    const ctx: HandlerContext = {
      org,
      user,
      membership,
      event,
      lineClient,
      replyToken,
    };

    // 1. Check conversation state — if user is mid-flow with a plugin
    const activeState = await this.stateService.getActiveState(
      user.id,
      org.id,
    );
    if (activeState) {
      const plugin = this.pluginLoader.getPlugin(activeState.plugin);
      if (
        plugin &&
        (await this.pluginLoader.isPluginEnabled(org.id, plugin.name))
      ) {
        await this.dispatchToPlugin(plugin.name, ctx);
        return;
      }
    }

    // 2. Handle by event type
    switch (event.type) {
      case "message":
        await this.handleMessage(ctx, event);
        break;
      case "follow":
        await this.handleFollow(ctx);
        break;
      case "unfollow":
        await this.handleUnfollow(ctx);
        break;
      case "postback":
        await this.handlePostback(ctx, event);
        break;
      default:
        logger.debug({ eventType: event.type }, "Unhandled event type");
    }
  }

  private async handleMessage(
    ctx: HandlerContext,
    event: WebhookEvent & { type: "message" },
  ): Promise<void> {
    if (event.message.type !== "text") {
      // For non-text messages, try each plugin's onMessage
      await this.broadcastToPlugins(ctx, "onMessage");
      return;
    }

    const text = event.message.text.trim();

    // Command dispatch: messages starting with /
    if (text.startsWith("/")) {
      const parts = text.slice(1).split(/\s+/);
      const commandName = "/" + parts[0];
      const args = parts.slice(1);

      const enabledPlugins = await this.pluginLoader.getEnabledPlugins(
        ctx.org.id,
      );
      for (const plugin of enabledPlugins) {
        const cmd = plugin.commands?.find((c) => c.name === commandName);
        if (cmd) {
          try {
            await cmd.handler(ctx, args);
          } catch (err) {
            logger.error(
              { plugin: plugin.name, command: commandName, err },
              "Command handler error",
            );
          }
          return;
        }
      }
    }

    // Keyword matching
    const enabledPlugins = await this.pluginLoader.getEnabledPlugins(
      ctx.org.id,
    );
    for (const plugin of enabledPlugins) {
      if (!plugin.keywords) continue;
      for (const kw of plugin.keywords) {
        const match = text.match(kw.pattern);
        if (match) {
          try {
            await kw.handler(ctx, match);
          } catch (err) {
            logger.error(
              { plugin: plugin.name, pattern: kw.pattern.source, err },
              "Keyword handler error",
            );
          }
          return;
        }
      }
    }

    // Default: broadcast onMessage to all enabled plugins
    await this.broadcastToPlugins(ctx, "onMessage");
  }

  private async handleFollow(ctx: HandlerContext): Promise<void> {
    await this.broadcastToPlugins(ctx, "onFollow");
  }

  private async handleUnfollow(ctx: HandlerContext): Promise<void> {
    await this.broadcastToPlugins(ctx, "onUnfollow");
  }

  private async handlePostback(
    ctx: HandlerContext,
    event: WebhookEvent & { type: "postback" },
  ): Promise<void> {
    // Parse postback data: plugin=xxx&action=yyy
    const params = new URLSearchParams(event.postback.data);
    const pluginName = params.get("plugin");

    if (pluginName) {
      const plugin = this.pluginLoader.getPlugin(pluginName);
      if (
        plugin?.onPostback &&
        (await this.pluginLoader.isPluginEnabled(ctx.org.id, pluginName))
      ) {
        try {
          await plugin.onPostback(ctx);
        } catch (err) {
          logger.error(
            { plugin: pluginName, err },
            "Postback handler error",
          );
        }
        return;
      }
    }

    // Broadcast to all enabled plugins
    await this.broadcastToPlugins(ctx, "onPostback");
  }

  private async dispatchToPlugin(
    pluginName: string,
    ctx: HandlerContext,
  ): Promise<void> {
    const plugin = this.pluginLoader.getPlugin(pluginName);
    if (!plugin) return;

    const event = ctx.event;
    try {
      switch (event.type) {
        case "message":
          await plugin.onMessage?.(ctx);
          break;
        case "postback":
          await plugin.onPostback?.(ctx);
          break;
        case "follow":
          await plugin.onFollow?.(ctx);
          break;
        case "unfollow":
          await plugin.onUnfollow?.(ctx);
          break;
      }
    } catch (err) {
      logger.error({ plugin: pluginName, err }, "Plugin handler error");
    }
  }

  private async broadcastToPlugins(
    ctx: HandlerContext,
    handler: "onMessage" | "onFollow" | "onUnfollow" | "onPostback",
  ): Promise<void> {
    const enabledPlugins = await this.pluginLoader.getEnabledPlugins(
      ctx.org.id,
    );

    const results = await Promise.allSettled(
      enabledPlugins
        .filter((p) => p[handler])
        .map((p) => p[handler]!(ctx)),
    );

    for (const result of results) {
      if (result.status === "rejected") {
        logger.error({ handler, err: result.reason }, "Plugin broadcast error");
      }
    }
  }
}
