import type { WebhookEvent, MessageEvent, FollowEvent, UnfollowEvent, PostbackEvent } from "@line/bot-sdk";
import type { messagingApi } from "@line/bot-sdk";
import type { Timestamp, DocumentReference, CollectionReference } from "firebase-admin/firestore";

// === Database Document Types ===

export interface Organization {
  id: string;
  name: string;
  lineChannelId: string;
  lineChannelSecret: string;
  lineChannelAccessToken: string;
  enabledPlugins: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface User {
  lineUserId: string;
  displayName: string | null;
  pictureUrl: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type MemberRole = "owner" | "admin" | "member";

export interface OrgMember {
  userId: string;
  role: MemberRole;
  joinedAt: Timestamp;
}

export interface ConversationState {
  orgId: string;
  userId: string;
  pluginName: string;
  state: string;
  data: Record<string, unknown>;
  updatedAt: Timestamp;
  expiresAt?: Timestamp;
}

export interface OrgConnection {
  id: string;
  fromOrgId: string;
  toOrgId: string;
  type: string;
  permissions: string[];
  status: "pending" | "active" | "revoked";
  createdAt: Timestamp;
}

// === Plugin System Types ===

export interface PluginContext {
  orgId: string;
  org: Organization;
  userId: string;
  user: User;
  member: OrgMember;
  event: WebhookEvent;
  lineClient: LineClientWrapper;
  db: OrgScopedDb;
  state: StateAccessor;
  eventBus: EventBusAccessor;
}

export interface PluginDefinition {
  name: string;
  version: string;
  displayName: string;
  description?: string;

  commands?: CommandDef[];
  keywords?: KeywordDef[];
  defaultPriority?: number;

  onMessage?: (ctx: PluginContext, event: MessageEvent) => Promise<void>;
  onPostback?: (ctx: PluginContext, event: PostbackEvent) => Promise<void>;
  onFollow?: (ctx: PluginContext, event: FollowEvent) => Promise<void>;
  onUnfollow?: (ctx: PluginContext, event: UnfollowEvent) => Promise<void>;
  onStateMessage?: (ctx: PluginContext, state: string, event: MessageEvent) => Promise<void>;

  onEnable?: (orgId: string) => Promise<void>;
  onDisable?: (orgId: string) => Promise<void>;

  subscriptions?: EventSubscription[];
  collections?: string[];
}

export interface CommandDef {
  command: string;
  description: string;
  handler: (ctx: PluginContext, args: string) => Promise<void>;
}

export interface KeywordDef {
  pattern: RegExp | string;
  handler: (ctx: PluginContext, match: RegExpMatchArray | string) => Promise<void>;
}

export interface EventSubscription {
  eventType: string;
  handler: (ctx: { orgId: string; payload: unknown }) => Promise<void>;
}

// === Service Interfaces ===

export interface OrgScopedDb {
  orgRef: DocumentReference;
  collection(name: string): CollectionReference;
  doc(collection: string, docId: string): DocumentReference;
}

export interface StateAccessor {
  get(): Promise<ConversationState | null>;
  set(pluginName: string, state: string, data?: Record<string, unknown>): Promise<void>;
  clear(): Promise<void>;
}

export interface EventBusAccessor {
  emit(eventType: string, payload: unknown): Promise<void>;
}

export interface LineClientWrapper {
  replyMessage(replyToken: string, messages: messagingApi.Message[]): Promise<void>;
  pushMessage(to: string, messages: messagingApi.Message[]): Promise<void>;
  getProfile(userId: string): Promise<{ displayName: string; pictureUrl?: string }>;
}
