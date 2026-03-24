import type { EventBusAccessor } from "../shared/types";

interface Subscriber {
  pluginName: string;
  handler: (ctx: { orgId: string; payload: unknown }) => Promise<void>;
}

const subscriptions = new Map<string, Subscriber[]>();

export function subscribe(
  eventType: string,
  pluginName: string,
  handler: (ctx: { orgId: string; payload: unknown }) => Promise<void>
): void {
  const subs = subscriptions.get(eventType) ?? [];
  subs.push({ pluginName, handler });
  subscriptions.set(eventType, subs);
}

export async function emit(orgId: string, eventType: string, payload: unknown): Promise<void> {
  const subs = subscriptions.get(eventType) ?? [];

  for (const sub of subs) {
    try {
      await sub.handler({ orgId, payload });
    } catch (err) {
      console.error(`Event bus error [${eventType}] in plugin [${sub.pluginName}]:`, err);
    }
  }
}

export function eventBusAccessor(orgId: string): EventBusAccessor {
  return {
    emit: (eventType: string, payload: unknown) => emit(orgId, eventType, payload),
  };
}
