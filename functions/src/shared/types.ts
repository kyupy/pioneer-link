import type { WebhookEvent } from "@line/bot-sdk";
import type { messagingApi } from "@line/bot-sdk";
import type { Timestamp, DocumentReference, CollectionReference } from "firebase-admin/firestore";

// === Database ===

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

// === Plugin System ===

export interface PluginContext {
  orgId: string;
  org: Organization;
  event: WebhookEvent;
  lineClient: LineClientWrapper;
  db: OrgScopedDb;
}

export interface PluginDefinition {
  name: string;
  version: string;
  /** Handle an event. Return true if handled (stops propagation to later plugins). */
  handle: (ctx: PluginContext) => Promise<boolean>;
}

// === Service Interfaces ===

export interface OrgScopedDb {
  orgRef: DocumentReference;
  collection(name: string): CollectionReference;
  doc(collection: string, docId: string): DocumentReference;
}

export interface LineClientWrapper {
  replyMessage(replyToken: string, messages: messagingApi.Message[]): Promise<void>;
  pushMessage(to: string, messages: messagingApi.Message[]): Promise<void>;
  getProfile(userId: string): Promise<{ displayName: string; pictureUrl?: string }>;
}
