import { describe, it, expect, beforeEach, vi } from "vitest";
import { Router } from "../../src/core/router.js";
import type { PluginDefinition } from "../../src/shared/types.js";
import {
  createTestOrg,
  createTestUser,
  createTestMember,
  createTextMessageEvent,
  createFollowEvent,
  createPostbackEvent,
} from "../helpers/fixtures.js";

function createMockServices() {
  const user = createTestUser();
  const member = createTestMember();

  const userService = {
    upsertUser: vi.fn().mockResolvedValue(user),
    ensureMembership: vi.fn().mockResolvedValue(member),
  } as any;

  const stateService = {
    getActiveState: vi.fn().mockResolvedValue(null),
  } as any;

  const testPlugin: PluginDefinition = {
    name: "test-plugin",
    version: "1.0.0",
    onMessage: vi.fn().mockResolvedValue(undefined),
    onFollow: vi.fn().mockResolvedValue(undefined),
    onPostback: vi.fn().mockResolvedValue(undefined),
    commands: [
      {
        name: "/hello",
        description: "Say hello",
        handler: vi.fn().mockResolvedValue(undefined),
      },
    ],
    keywords: [
      {
        pattern: /^入部$/,
        handler: vi.fn().mockResolvedValue(undefined),
      },
    ],
  };

  const pluginLoader = {
    getPlugin: vi.fn().mockReturnValue(testPlugin),
    isPluginEnabled: vi.fn().mockResolvedValue(true),
    getEnabledPlugins: vi.fn().mockResolvedValue([testPlugin]),
  } as any;

  const lineClientFactory = {
    getClient: vi.fn().mockReturnValue({
      replyMessage: vi.fn().mockResolvedValue(undefined),
    }),
  } as any;

  return {
    userService,
    stateService,
    pluginLoader,
    lineClientFactory,
    testPlugin,
  };
}

describe("Router", () => {
  let services: ReturnType<typeof createMockServices>;
  let router: Router;
  const org = createTestOrg();

  beforeEach(() => {
    services = createMockServices();
    router = new Router(
      services.userService,
      services.stateService,
      services.pluginLoader,
      services.lineClientFactory,
    );
  });

  it("should dispatch command to matching plugin", async () => {
    const event = createTextMessageEvent("/hello world");
    await router.dispatch(org, event);

    expect(services.testPlugin.commands![0].handler).toHaveBeenCalledOnce();
    const callArgs = (services.testPlugin.commands![0].handler as any).mock
      .calls[0];
    expect(callArgs[1]).toEqual(["world"]);
  });

  it("should dispatch keyword to matching plugin", async () => {
    const event = createTextMessageEvent("入部");
    await router.dispatch(org, event);

    expect(services.testPlugin.keywords![0].handler).toHaveBeenCalledOnce();
  });

  it("should broadcast follow events to plugins", async () => {
    const event = createFollowEvent();
    await router.dispatch(org, event);

    expect(services.testPlugin.onFollow).toHaveBeenCalledOnce();
  });

  it("should dispatch postback with plugin param", async () => {
    const event = createPostbackEvent("plugin=test-plugin&action=confirm");
    await router.dispatch(org, event);

    expect(services.testPlugin.onPostback).toHaveBeenCalledOnce();
  });

  it("should route to active state plugin when mid-conversation", async () => {
    services.stateService.getActiveState.mockResolvedValue({
      plugin: "test-plugin",
      stateData: { step: "step2" },
    });

    const event = createTextMessageEvent("any text");
    await router.dispatch(org, event);

    expect(services.testPlugin.onMessage).toHaveBeenCalledOnce();
  });

  it("should broadcast onMessage for unmatched text", async () => {
    const event = createTextMessageEvent("random message");
    await router.dispatch(org, event);

    // Should call onMessage as fallback (broadcast)
    expect(services.testPlugin.onMessage).toHaveBeenCalledOnce();
  });

  it("should skip events without userId", async () => {
    const event = {
      type: "message",
      message: { type: "text", text: "test", id: "1", quoteToken: "q" },
      source: { type: "group", groupId: "G123" },
      timestamp: Date.now(),
      replyToken: "rt",
      mode: "active",
      webhookEventId: "e1",
      deliveryContext: { isRedelivery: false },
    } as any;

    await router.dispatch(org, event);

    expect(services.userService.upsertUser).not.toHaveBeenCalled();
  });
});
