import { messagingApi } from "@line/bot-sdk";
import type { Organization, LineClientWrapper } from "../shared/types";

const clientCache = new Map<string, messagingApi.MessagingApiClient>();

function getOrCreateClient(org: Organization): messagingApi.MessagingApiClient {
  let client = clientCache.get(org.id);
  if (!client) {
    client = new messagingApi.MessagingApiClient({
      channelAccessToken: org.lineChannelAccessToken,
    });
    clientCache.set(org.id, client);
  }
  return client;
}

export function getLineClient(org: Organization): LineClientWrapper {
  const client = getOrCreateClient(org);

  return {
    async replyMessage(replyToken, messages) {
      await client.replyMessage({ replyToken, messages });
    },

    async pushMessage(to, messages) {
      await client.pushMessage({ to, messages });
    },

    async getProfile(userId) {
      const profile = await client.getProfile(userId);
      return {
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
      };
    },
  };
}
