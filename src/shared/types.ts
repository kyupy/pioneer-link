import type { Hono } from "hono";
import type { WebhookEvent } from "@line/bot-sdk";
import type { messagingApi } from "@line/bot-sdk";

// ── Role & Status Enums ──

export const ROLES = ["newcomer", "member", "staff", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const CONNECTION_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "revoked",
] as const;
export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];

export const CONNECTION_SCOPES = [
  "knowledge",
  "events",
  "members",
] as const;
export type ConnectionScope = (typeof CONNECTION_SCOPES)[number];

// ── Core Entity Types ──

export interface Organization {
  id: string;
  name: string;
  slug: string;
  lineChannelId: string;
  lineChannelSecret: string;
  lineChannelAccessToken: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  lineUserId: string;
  displayName: string | null;
  pictureUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrgMember {
  id: string;
  userId: string;
  orgId: string;
  role: Role;
  joinedAt: Date;
}

export interface OrgPlugin {
  id: string;
  orgId: string;
  pluginName: string;
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface ConversationState {
  id: string;
  userId: string;
  orgId: string;
  plugin: string;
  stateKey: string;
  stateData: Record<string, unknown>;
  updatedAt: Date;
}

export interface OrgConnection {
  id: string;
  fromOrgId: string;
  toOrgId: string;
  scope: ConnectionScope;
  status: ConnectionStatus;
  createdAt: Date;
}

// ── Handler Context ──

export interface HandlerContext {
  org: Organization;
  user: User;
  membership: OrgMember;
  event: WebhookEvent;
  lineClient: messagingApi.MessagingApiClient;
  replyToken: string | null;
}

// ── Plugin Definition ──

export interface PluginCommand {
  name: string;
  description: string;
  handler: (ctx: HandlerContext, args: string[]) => Promise<void>;
}

export interface PluginKeyword {
  pattern: RegExp;
  handler: (ctx: HandlerContext, match: RegExpMatchArray) => Promise<void>;
}

export interface PluginSchedule {
  cron: string;
  handler: (orgId: string) => Promise<void>;
}

export interface PluginEventSubscription {
  event: string;
  handler: (orgId: string, payload: unknown) => Promise<void>;
}

export interface PluginDefinition {
  name: string;
  version: string;
  description?: string;

  // LINE event handlers
  onMessage?: (ctx: HandlerContext) => Promise<void>;
  onFollow?: (ctx: HandlerContext) => Promise<void>;
  onUnfollow?: (ctx: HandlerContext) => Promise<void>;
  onPostback?: (ctx: HandlerContext) => Promise<void>;

  // Command registration
  commands?: PluginCommand[];

  // Keyword triggers
  keywords?: PluginKeyword[];

  // Event bus subscriptions
  subscribe?: PluginEventSubscription[];

  // Scheduled tasks
  schedules?: PluginSchedule[];

  // Admin API routes
  adminRoutes?: Hono;

  // LIFF routes
  liffRoutes?: Hono;

  // Lifecycle
  onLoad?: () => Promise<void>;
  onUnload?: () => Promise<void>;
}
