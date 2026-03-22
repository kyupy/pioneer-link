import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  jsonb,
  unique,
  index,
} from "drizzle-orm/pg-core";

// ── organizations ──
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  lineChannelId: text("line_channel_id").notNull().unique(),
  lineChannelSecret: text("line_channel_secret").notNull(),
  lineChannelAccessToken: text("line_channel_access_token").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── users ──
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  lineUserId: text("line_user_id").notNull().unique(),
  displayName: text("display_name"),
  pictureUrl: text("picture_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── org_members ──
export const orgMembers = pgTable(
  "org_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    role: text("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("org_members_user_org_unique").on(t.userId, t.orgId),
    index("org_members_org_id_idx").on(t.orgId),
  ],
);

// ── org_plugins ──
export const orgPlugins = pgTable(
  "org_plugins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    pluginName: text("plugin_name").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    config: jsonb("config").notNull().default({}),
  },
  (t) => [
    unique("org_plugins_org_plugin_unique").on(t.orgId, t.pluginName),
    index("org_plugins_org_enabled_idx").on(t.orgId, t.enabled),
  ],
);

// ── conversation_states ──
export const conversationStates = pgTable(
  "conversation_states",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    plugin: text("plugin").notNull(),
    stateKey: text("state_key").notNull().default("default"),
    stateData: jsonb("state_data").notNull().default({}),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("conversation_states_unique").on(
      t.userId,
      t.orgId,
      t.plugin,
      t.stateKey,
    ),
    index("conversation_states_user_org_idx").on(t.userId, t.orgId),
  ],
);

// ── org_connections ──
export const orgConnections = pgTable(
  "org_connections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fromOrgId: uuid("from_org_id")
      .notNull()
      .references(() => organizations.id),
    toOrgId: uuid("to_org_id")
      .notNull()
      .references(() => organizations.id),
    scope: text("scope").notNull(),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("org_connections_from_to_scope_unique").on(
      t.fromOrgId,
      t.toOrgId,
      t.scope,
    ),
  ],
);
