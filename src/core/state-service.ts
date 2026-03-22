import { eq, and } from "drizzle-orm";
import type { Database } from "../db/index.js";
import { conversationStates } from "../db/schema.js";
import type { ConversationState } from "../shared/types.js";

export class StateService {
  constructor(private db: Database) {}

  async getState(
    userId: string,
    orgId: string,
    plugin: string,
    stateKey = "default",
  ): Promise<ConversationState | null> {
    const rows = await this.db
      .select()
      .from(conversationStates)
      .where(
        and(
          eq(conversationStates.userId, userId),
          eq(conversationStates.orgId, orgId),
          eq(conversationStates.plugin, plugin),
          eq(conversationStates.stateKey, stateKey),
        ),
      )
      .limit(1);

    return (rows[0] as ConversationState) ?? null;
  }

  async setState(
    userId: string,
    orgId: string,
    plugin: string,
    stateData: Record<string, unknown>,
    stateKey = "default",
  ): Promise<void> {
    const existing = await this.getState(userId, orgId, plugin, stateKey);

    if (existing) {
      await this.db
        .update(conversationStates)
        .set({ stateData, updatedAt: new Date() })
        .where(eq(conversationStates.id, existing.id));
    } else {
      await this.db
        .insert(conversationStates)
        .values({ userId, orgId, plugin, stateKey, stateData });
    }
  }

  async clearState(
    userId: string,
    orgId: string,
    plugin: string,
    stateKey = "default",
  ): Promise<void> {
    await this.db
      .delete(conversationStates)
      .where(
        and(
          eq(conversationStates.userId, userId),
          eq(conversationStates.orgId, orgId),
          eq(conversationStates.plugin, plugin),
          eq(conversationStates.stateKey, stateKey),
        ),
      );
  }

  async getActiveState(
    userId: string,
    orgId: string,
  ): Promise<ConversationState | null> {
    const rows = await this.db
      .select()
      .from(conversationStates)
      .where(
        and(
          eq(conversationStates.userId, userId),
          eq(conversationStates.orgId, orgId),
        ),
      );

    // Find the most recently updated state that has meaningful data
    const active = rows
      .filter((r) => {
        const data = r.stateData as Record<string, unknown>;
        return data && Object.keys(data).length > 0 && data.step != null;
      })
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );

    return (active[0] as ConversationState) ?? null;
  }
}
