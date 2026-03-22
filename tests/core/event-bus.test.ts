import { describe, it, expect, beforeEach, vi } from "vitest";
import { EventBus } from "../../src/core/event-bus.js";

describe("EventBus", () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  it("should emit and receive events within same org", () => {
    const handler = vi.fn();
    eventBus.on("org-1", "member:joined", handler);

    eventBus.emit("org-1", "member:joined", { userId: "u1" });

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith("org-1", { userId: "u1" });
  });

  it("should not leak events across orgs", () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    eventBus.on("org-1", "member:joined", handler1);
    eventBus.on("org-2", "member:joined", handler2);

    eventBus.emit("org-1", "member:joined", { userId: "u1" });

    expect(handler1).toHaveBeenCalledOnce();
    expect(handler2).not.toHaveBeenCalled();
  });

  it("should support multiple handlers for same event", () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    eventBus.on("org-1", "member:joined", handler1);
    eventBus.on("org-1", "member:joined", handler2);

    eventBus.emit("org-1", "member:joined", { userId: "u1" });

    expect(handler1).toHaveBeenCalledOnce();
    expect(handler2).toHaveBeenCalledOnce();
  });

  it("should unregister handlers with off()", () => {
    const handler = vi.fn();
    eventBus.on("org-1", "test", handler);

    eventBus.off("org-1", "test", handler);
    eventBus.emit("org-1", "test", {});

    expect(handler).not.toHaveBeenCalled();
  });

  it("should handle different event names independently", () => {
    const joinHandler = vi.fn();
    const leftHandler = vi.fn();

    eventBus.on("org-1", "member:joined", joinHandler);
    eventBus.on("org-1", "member:left", leftHandler);

    eventBus.emit("org-1", "member:joined", {});

    expect(joinHandler).toHaveBeenCalledOnce();
    expect(leftHandler).not.toHaveBeenCalled();
  });

  it("should clean up all listeners with removeAllListeners()", () => {
    const handler = vi.fn();
    eventBus.on("org-1", "test", handler);
    eventBus.on("org-2", "test", handler);

    eventBus.removeAllListeners();
    eventBus.emit("org-1", "test", {});
    eventBus.emit("org-2", "test", {});

    expect(handler).not.toHaveBeenCalled();
  });
});
