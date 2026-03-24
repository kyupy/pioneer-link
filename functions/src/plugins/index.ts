import type { PluginDefinition } from "../shared/types";
import { echoPlugin } from "./echo";

export const plugins: PluginDefinition[] = [echoPlugin];
