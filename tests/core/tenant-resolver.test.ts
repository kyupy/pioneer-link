import { describe, it, expect, beforeEach, vi } from "vitest";
import { TenantResolver } from "../../src/core/tenant-resolver.js";
import { createTestOrg, createTestOrg2 } from "../helpers/fixtures.js";

// Mock database
function createMockDb(orgs: ReturnType<typeof createTestOrg>[]) {
  return {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockImplementation(() => {
            // Simulate finding by lineChannelId
            const channelId =
              mockDb._lastChannelId as string;
            const found = orgs.filter(
              (o) => o.lineChannelId === channelId,
            );
            return Promise.resolve(found);
          }),
        }),
      }),
    }),
    _lastChannelId: null as string | null,
  };
}

let mockDb: ReturnType<typeof createMockDb>;

// Override the where function to capture the channelId
function createTrackedMockDb(orgs: ReturnType<typeof createTestOrg>[]) {
  const db = {
    select: () => ({
      from: () => ({
        where: (condition: unknown) => {
          // Extract channelId from condition string representation
          return {
            limit: () => {
              return Promise.resolve(
                orgs.filter((o) => {
                  // Simple mock: check all orgs
                  return true;
                }).slice(0, 1)
              );
            },
          };
        },
      }),
    }),
  };
  return db;
}

describe("TenantResolver", () => {
  it("should resolve org by channelId", async () => {
    const org = createTestOrg();
    // Simple mock that always returns the org for any query
    const db = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([org]),
          }),
        }),
      }),
    } as any;

    const resolver = new TenantResolver(db);
    const result = await resolver.resolve("channel-001");

    expect(result).toEqual(org);
  });

  it("should return null for unknown channelId", async () => {
    const db = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([]),
          }),
        }),
      }),
    } as any;

    const resolver = new TenantResolver(db);
    const result = await resolver.resolve("unknown");

    expect(result).toBeNull();
  });

  it("should cache resolved orgs", async () => {
    const org = createTestOrg();
    const selectFn = vi.fn().mockReturnValue({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([org]),
        }),
      }),
    });
    const db = { select: selectFn } as any;

    const resolver = new TenantResolver(db);

    // First call hits DB
    await resolver.resolve("channel-001");
    // Second call should use cache
    await resolver.resolve("channel-001");

    expect(selectFn).toHaveBeenCalledTimes(1);
  });

  it("should invalidate cache", async () => {
    const org = createTestOrg();
    const selectFn = vi.fn().mockReturnValue({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([org]),
        }),
      }),
    });
    const db = { select: selectFn } as any;

    const resolver = new TenantResolver(db);

    await resolver.resolve("channel-001");
    resolver.invalidate("channel-001");
    await resolver.resolve("channel-001");

    expect(selectFn).toHaveBeenCalledTimes(2);
  });
});
