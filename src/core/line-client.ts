import { messagingApi } from "@line/bot-sdk";
import type { Organization } from "../shared/types.js";

export class LineClientFactory {
  private clients = new Map<string, messagingApi.MessagingApiClient>();

  getClient(org: Organization): messagingApi.MessagingApiClient {
    const existing = this.clients.get(org.id);
    if (existing) return existing;

    const client = new messagingApi.MessagingApiClient({
      channelAccessToken: org.lineChannelAccessToken,
    });
    this.clients.set(org.id, client);
    return client;
  }

  invalidate(orgId: string): void {
    this.clients.delete(orgId);
  }

  invalidateAll(): void {
    this.clients.clear();
  }
}
