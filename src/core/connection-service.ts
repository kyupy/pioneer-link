import { eq, and, or } from "drizzle-orm";
import type { Database } from "../db/index.js";
import { orgConnections } from "../db/schema.js";
import type {
  OrgConnection,
  ConnectionScope,
  ConnectionStatus,
} from "../shared/types.js";

export class ConnectionService {
  constructor(private db: Database) {}

  async requestConnection(
    fromOrgId: string,
    toOrgId: string,
    scope: ConnectionScope,
  ): Promise<OrgConnection> {
    const inserted = await this.db
      .insert(orgConnections)
      .values({ fromOrgId, toOrgId, scope, status: "pending" })
      .returning();

    return inserted[0] as OrgConnection;
  }

  async updateStatus(
    connectionId: string,
    status: ConnectionStatus,
  ): Promise<void> {
    await this.db
      .update(orgConnections)
      .set({ status })
      .where(eq(orgConnections.id, connectionId));
  }

  async getConnections(orgId: string): Promise<OrgConnection[]> {
    const rows = await this.db
      .select()
      .from(orgConnections)
      .where(
        or(
          eq(orgConnections.fromOrgId, orgId),
          eq(orgConnections.toOrgId, orgId),
        ),
      );

    return rows as OrgConnection[];
  }

  async canAccess(
    fromOrgId: string,
    toOrgId: string,
    scope: ConnectionScope,
  ): Promise<boolean> {
    const rows = await this.db
      .select()
      .from(orgConnections)
      .where(
        and(
          eq(orgConnections.fromOrgId, fromOrgId),
          eq(orgConnections.toOrgId, toOrgId),
          eq(orgConnections.scope, scope),
          eq(orgConnections.status, "approved"),
        ),
      )
      .limit(1);

    return rows.length > 0;
  }
}
