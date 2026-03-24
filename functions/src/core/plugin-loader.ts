import type { Organization, PluginDefinition } from "../shared/types";
import { subscribe } from "./event-bus";

const pluginRegistry = new Map<string, PluginDefinition>();

export function loadPlugins(pluginList: PluginDefinition[]): void {
  for (const plugin of pluginList) {
    pluginRegistry.set(plugin.name, plugin);

    for (const sub of plugin.subscriptions ?? []) {
      subscribe(sub.eventType, plugin.name, sub.handler);
    }
  }
}

export function getPlugin(name: string): PluginDefinition | undefined {
  return pluginRegistry.get(name);
}

export function getAllPlugins(): PluginDefinition[] {
  return Array.from(pluginRegistry.values());
}

export function isPluginEnabledForOrg(org: Organization, pluginName: string): boolean {
  return org.enabledPlugins.includes(pluginName);
}

export function getEnabledPlugins(org: Organization): PluginDefinition[] {
  return getAllPlugins().filter((p) => isPluginEnabledForOrg(org, p.name));
}
