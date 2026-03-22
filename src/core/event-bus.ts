import { EventEmitter } from "node:events";
import pino from "pino";

const logger = pino({ name: "event-bus" });

export class EventBus {
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(100);
  }

  emit(orgId: string, eventName: string, payload: unknown): void {
    const scoped = `${orgId}:${eventName}`;
    logger.debug({ orgId, eventName }, "Event emitted");
    this.emitter.emit(scoped, orgId, payload);
  }

  on(
    orgId: string,
    eventName: string,
    handler: (orgId: string, payload: unknown) => void,
  ): void {
    const scoped = `${orgId}:${eventName}`;
    this.emitter.on(scoped, handler);
  }

  onAny(
    eventName: string,
    handler: (orgId: string, payload: unknown) => void,
  ): void {
    // Listen for an event across all orgs by storing the handler
    // This requires plugins to register per-org, so we provide a helper
    this.emitter.on(eventName, handler);
  }

  off(orgId: string, eventName: string, handler: Function): void {
    const scoped = `${orgId}:${eventName}`;
    this.emitter.off(scoped, handler as (...args: unknown[]) => void);
  }

  removeAllListeners(): void {
    this.emitter.removeAllListeners();
  }
}
