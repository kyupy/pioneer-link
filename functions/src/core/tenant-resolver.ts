import { db } from "../shared/db";
import type { Organization } from "../shared/types";

interface CacheEntry {
  org: Organization;
  fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function resolveOrg(channelId: string): Promise<Organization | null> {
  const now = Date.now();
  const cached = cache.get(channelId);

  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.org;
  }

  const snapshot = await db
    .collection("organizations")
    .where("lineChannelId", "==", channelId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const org: Organization = { id: doc.id, ...doc.data() } as Organization;

  cache.set(channelId, { org, fetchedAt: now });

  return org;
}
