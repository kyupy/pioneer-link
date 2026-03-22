import { eq } from "drizzle-orm";
import type { Database } from "../db/index.js";
import { organizations } from "../db/schema.js";
import type { Organization } from "../shared/types.js";

interface CacheEntry {
  org: Organization;
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export class TenantResolver {
  private cache = new Map<string, CacheEntry>();

  constructor(private db: Database) {}

  async resolve(lineChannelId: string): Promise<Organization | null> {
    // Check cache
    const cached = this.cache.get(lineChannelId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.org;
    }

    // DB lookup
    const rows = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.lineChannelId, lineChannelId))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    const org = rows[0] as Organization;
    this.cache.set(lineChannelId, {
      org,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return org;
  }

  invalidate(lineChannelId: string): void {
    this.cache.delete(lineChannelId);
  }

  invalidateAll(): void {
    this.cache.clear();
  }
}
