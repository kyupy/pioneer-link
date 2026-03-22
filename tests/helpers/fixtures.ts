import type { WebhookEvent } from "@line/bot-sdk";
import type { Organization, User, OrgMember } from "../../src/shared/types.js";

export function createTestOrg(
  overrides: Partial<Organization> = {},
): Organization {
  return {
    id: "org-test-001",
    name: "テスト団体",
    slug: "test-org",
    lineChannelId: "channel-001",
    lineChannelSecret: "test-secret-key",
    lineChannelAccessToken: "test-access-token",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

export function createTestOrg2(
  overrides: Partial<Organization> = {},
): Organization {
  return {
    id: "org-test-002",
    name: "テスト団体2",
    slug: "test-org-2",
    lineChannelId: "channel-002",
    lineChannelSecret: "test-secret-key-2",
    lineChannelAccessToken: "test-access-token-2",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

export function createTestUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-test-001",
    lineUserId: "U1234567890abcdef",
    displayName: "テストユーザー",
    pictureUrl: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

export function createTestMember(
  overrides: Partial<OrgMember> = {},
): OrgMember {
  return {
    id: "member-test-001",
    userId: "user-test-001",
    orgId: "org-test-001",
    role: "member",
    joinedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

export function createTextMessageEvent(
  text: string,
  userId = "U1234567890abcdef",
): WebhookEvent {
  return {
    type: "message",
    message: {
      type: "text",
      id: "msg-001",
      text,
      quoteToken: "quote-token",
    },
    timestamp: Date.now(),
    source: { type: "user", userId },
    replyToken: "reply-token-001",
    mode: "active",
    webhookEventId: "event-001",
    deliveryContext: { isRedelivery: false },
  } as WebhookEvent;
}

export function createFollowEvent(
  userId = "U1234567890abcdef",
): WebhookEvent {
  return {
    type: "follow",
    timestamp: Date.now(),
    source: { type: "user", userId },
    replyToken: "reply-token-002",
    mode: "active",
    webhookEventId: "event-002",
    deliveryContext: { isRedelivery: false },
  } as WebhookEvent;
}

export function createPostbackEvent(
  data: string,
  userId = "U1234567890abcdef",
): WebhookEvent {
  return {
    type: "postback",
    postback: { data },
    timestamp: Date.now(),
    source: { type: "user", userId },
    replyToken: "reply-token-003",
    mode: "active",
    webhookEventId: "event-003",
    deliveryContext: { isRedelivery: false },
  } as WebhookEvent;
}
