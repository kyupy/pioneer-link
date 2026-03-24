import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { orgDb } from "../shared/db";
import type { ConversationState, StateAccessor } from "../shared/types";

function stateDocId(orgId: string, userId: string): string {
  return `${orgId}_${userId}`;
}

export function stateAccessor(orgId: string, userId: string): StateAccessor {
  const docRef = orgDb(orgId).collection("conversationStates").doc(stateDocId(orgId, userId));

  return {
    async get(): Promise<ConversationState | null> {
      const doc = await docRef.get();
      if (!doc.exists) return null;

      const data = doc.data() as ConversationState;

      // Auto-expire stale states
      if (data.expiresAt && data.expiresAt.toMillis() < Timestamp.now().toMillis()) {
        await docRef.delete();
        return null;
      }

      return data;
    },

    async set(pluginName: string, state: string, data?: Record<string, unknown>): Promise<void> {
      await docRef.set({
        orgId,
        userId,
        pluginName,
        state,
        data: data ?? {},
        updatedAt: FieldValue.serverTimestamp(),
      });
    },

    async clear(): Promise<void> {
      await docRef.delete();
    },
  };
}
