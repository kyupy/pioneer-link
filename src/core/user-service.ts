import { eq, and } from "drizzle-orm";
import type { Database } from "../db/index.js";
import { users, orgMembers } from "../db/schema.js";
import type { User, OrgMember, Role } from "../shared/types.js";

export class UserService {
  constructor(private db: Database) {}

  async upsertUser(
    lineUserId: string,
    displayName?: string | null,
    pictureUrl?: string | null,
  ): Promise<User> {
    const existing = await this.db
      .select()
      .from(users)
      .where(eq(users.lineUserId, lineUserId))
      .limit(1);

    if (existing.length > 0) {
      // Update display name if changed
      if (displayName !== undefined) {
        await this.db
          .update(users)
          .set({ displayName, pictureUrl, updatedAt: new Date() })
          .where(eq(users.id, existing[0].id));
        return { ...existing[0], displayName, pictureUrl } as User;
      }
      return existing[0] as User;
    }

    const inserted = await this.db
      .insert(users)
      .values({ lineUserId, displayName, pictureUrl })
      .returning();

    return inserted[0] as User;
  }

  async ensureMembership(
    userId: string,
    orgId: string,
    defaultRole: Role = "member",
  ): Promise<OrgMember> {
    const existing = await this.db
      .select()
      .from(orgMembers)
      .where(and(eq(orgMembers.userId, userId), eq(orgMembers.orgId, orgId)))
      .limit(1);

    if (existing.length > 0) {
      return existing[0] as OrgMember;
    }

    const inserted = await this.db
      .insert(orgMembers)
      .values({ userId, orgId, role: defaultRole })
      .returning();

    return inserted[0] as OrgMember;
  }

  async getMembership(
    userId: string,
    orgId: string,
  ): Promise<OrgMember | null> {
    const rows = await this.db
      .select()
      .from(orgMembers)
      .where(and(eq(orgMembers.userId, userId), eq(orgMembers.orgId, orgId)))
      .limit(1);

    return (rows[0] as OrgMember) ?? null;
  }

  async setRole(userId: string, orgId: string, role: Role): Promise<void> {
    await this.db
      .update(orgMembers)
      .set({ role })
      .where(and(eq(orgMembers.userId, userId), eq(orgMembers.orgId, orgId)));
  }

  async listMembers(orgId: string): Promise<OrgMember[]> {
    const rows = await this.db
      .select()
      .from(orgMembers)
      .where(eq(orgMembers.orgId, orgId));

    return rows as OrgMember[];
  }

  async findByLineUserId(lineUserId: string): Promise<User | null> {
    const rows = await this.db
      .select()
      .from(users)
      .where(eq(users.lineUserId, lineUserId))
      .limit(1);

    return (rows[0] as User) ?? null;
  }
}
