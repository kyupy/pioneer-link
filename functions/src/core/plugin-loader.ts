import type { Organization, PluginDefinition } from "../shared/types";

const registry = new Map<string, PluginDefinition>();

export function loadPlugins(pluginList: PluginDefinition[]): void {
  for (const plugin of pluginList) {
    registry.set(plugin.name, plugin);
  }
}

export function getEnabledPlugins(org: Organization): PluginDefinition[] {
  return org.enabledPlugins
    .map((name) => registry.get(name))
    .filter((p): p is PluginDefinition => p !== undefined);
}
