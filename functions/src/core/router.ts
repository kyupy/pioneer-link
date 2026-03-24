import type { WebhookEvent, MessageEvent, FollowEvent, UnfollowEvent, PostbackEvent } from "@line/bot-sdk";
import type { Organization, User, OrgMember, PluginContext } from "../shared/types";
import { orgDb } from "../shared/db";
import { getLineClient } from "./line-client";
import { stateAccessor } from "./state-service";
import { eventBusAccessor } from "./event-bus";
import { getPlugin, getEnabledPlugins, isPluginEnabledForOrg } from "./plugin-loader";

function isMessageEvent(event: WebhookEvent): event is MessageEvent {
  return event.type === "message";
}

function isFollowEvent(event: WebhookEvent): event is FollowEvent {
  return event.type === "follow";
}

function isUnfollowEvent(event: WebhookEvent): event is UnfollowEvent {
  return event.type === "unfollow";
}

function isPostbackEvent(event: WebhookEvent): event is PostbackEvent {
  return event.type === "postback";
}

function isTextMessage(event: MessageEvent): boolean {
  return event.message.type === "text";
}

function buildContext(
  org: Organization,
  user: User,
  member: OrgMember,
  event: WebhookEvent
): PluginContext {
  const userId = user.lineUserId;
  return {
    orgId: org.id,
    org,
    userId,
    user,
    member,
    event,
    lineClient: getLineClient(org),
    db: orgDb(org.id),
    state: stateAccessor(org.id, userId),
    eventBus: eventBusAccessor(org.id),
  };
}

export async function route(
  event: WebhookEvent,
  org: Organization,
  user: User,
  member: OrgMember
): Promise<void> {
  const userId = user.lineUserId;
  const state = stateAccessor(org.id, userId);
  const currentState = await state.get();

  // 1. Active conversation state
  if (currentState && isPluginEnabledForOrg(org, currentState.pluginName)) {
    const plugin = getPlugin(currentState.pluginName);
    if (plugin?.onStateMessage && isMessageEvent(event)) {
      const ctx = buildContext(org, user, member, event);
      await plugin.onStateMessage(ctx, currentState.state, event);
      return;
    }
  }

  // Handle follow events
  if (isFollowEvent(event)) {
    for (const plugin of getEnabledPlugins(org)) {
      if (plugin.onFollow) {
        const ctx = buildContext(org, user, member, event);
        await plugin.onFollow(ctx, event);
      }
    }
    return;
  }

  // Handle unfollow events
  if (isUnfollowEvent(event)) {
    for (const plugin of getEnabledPlugins(org)) {
      if (plugin.onUnfollow) {
        const ctx = buildContext(org, user, member, event);
        await plugin.onUnfollow(ctx, event);
      }
    }
    return;
  }

  // Handle postback events
  if (isPostbackEvent(event)) {
    for (const plugin of getEnabledPlugins(org)) {
      if (plugin.onPostback) {
        const ctx = buildContext(org, user, member, event);
        await plugin.onPostback(ctx, event);
      }
    }
    return;
  }

  // Only text messages trigger command/keyword/default routing
  if (!isMessageEvent(event) || !isTextMessage(event)) return;

  const text = "text" in event.message ? (event.message as { text: string }).text : "";

  // 2. Command match
  for (const plugin of getEnabledPlugins(org)) {
    for (const cmd of plugin.commands ?? []) {
      if (text.startsWith(cmd.command + " ") || text === cmd.command) {
        const args = text.slice(cmd.command.length).trim();
        const ctx = buildContext(org, user, member, event);
        await cmd.handler(ctx, args);
        return;
      }
    }
  }

  // 3. Keyword match
  for (const plugin of getEnabledPlugins(org)) {
    for (const kw of plugin.keywords ?? []) {
      const match =
        typeof kw.pattern === "string"
          ? text.includes(kw.pattern)
            ? kw.pattern
            : null
          : text.match(kw.pattern);
      if (match) {
        const ctx = buildContext(org, user, member, event);
        await kw.handler(ctx, match);
        return;
      }
    }
  }

  // 4. Default fallback (lowest defaultPriority wins)
  const fallback = getEnabledPlugins(org)
    .filter((p) => p.onMessage)
    .sort((a, b) => (a.defaultPriority ?? 999) - (b.defaultPriority ?? 999))[0];

  if (fallback?.onMessage) {
    const ctx = buildContext(org, user, member, event);
    await fallback.onMessage(ctx, event);
  }
}
