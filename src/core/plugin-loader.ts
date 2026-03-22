import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { eq, and } from "drizzle-orm";
import pino from "pino";
import type { Database } from "../db/index.js";
import { orgPlugins } from "../db/schema.js";
import type { PluginDefinition } from "../shared/types.js";
import type { EventBus } from "./event-bus.js";

const logger = pino({ name: "plugin-loader" });

export class PluginLoader {
  private plugins = new Map<string, PluginDefinition>();

  constructor(
    private db: Database,
    private eventBus: EventBus,
  ) {}

  async discoverAndLoad(pluginsDir: string): Promise<void> {
    let entries: string[];
    try {
      const dirEntries = await readdir(pluginsDir, { withFileTypes: true });
      entries = dirEntries
        .filter((e) => e.isDirectory())
        .map((e) => e.name);
    } catch {
      logger.info("No plugins directory found, skipping plugin loading");
      return;
    }

    for (const dir of entries) {
      try {
        const modulePath = join(pluginsDir, dir, "index.js");
        const mod = await import(modulePath);
        const plugin: PluginDefinition = mod.default ?? mod.plugin;

        if (!plugin || !plugin.name || !plugin.version) {
          logger.warn({ dir }, "Invalid plugin definition, skipping");
          continue;
        }

        this.plugins.set(plugin.name, plugin);

        // Register event subscriptions
        if (plugin.subscribe) {
          for (const sub of plugin.subscribe) {
            // Subscriptions will be registered per-org when events are emitted
            logger.debug(
              { plugin: plugin.name, event: sub.event },
              "Plugin event subscription registered",
            );
          }
        }

        if (plugin.onLoad) {
          await plugin.onLoad();
        }

        logger.info(
          { name: plugin.name, version: plugin.version },
          "Plugin loaded",
        );
      } catch (err) {
        logger.error({ dir, err }, "Failed to load plugin");
      }
    }
  }

  getPlugin(name: string): PluginDefinition | undefined {
    return this.plugins.get(name);
  }

  getAllPlugins(): PluginDefinition[] {
    return Array.from(this.plugins.values());
  }

  async isPluginEnabled(orgId: string, pluginName: string): Promise<boolean> {
    const rows = await this.db
      .select()
      .from(orgPlugins)
      .where(
        and(
          eq(orgPlugins.orgId, orgId),
          eq(orgPlugins.pluginName, pluginName),
          eq(orgPlugins.enabled, true),
        ),
      )
      .limit(1);

    return rows.length > 0;
  }

  async getEnabledPlugins(orgId: string): Promise<PluginDefinition[]> {
    const rows = await this.db
      .select()
      .from(orgPlugins)
      .where(
        and(eq(orgPlugins.orgId, orgId), eq(orgPlugins.enabled, true)),
      );

    return rows
      .map((r) => this.plugins.get(r.pluginName))
      .filter((p): p is PluginDefinition => p !== undefined);
  }
}
