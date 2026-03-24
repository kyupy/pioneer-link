import type { PluginDefinition } from "../shared/types";

export const echoPlugin: PluginDefinition = {
  name: "echo",
  version: "1.0.0",
  displayName: "Echo",
  description: "Echoes back any message. For testing.",

  commands: [
    {
      command: "/echo",
      description: "Echo back the provided text",
      handler: async (ctx, args) => {
        await ctx.lineClient.replyMessage(
          (ctx.event as { replyToken: string }).replyToken,
          [{ type: "text", text: args || "Usage: /echo <text>" }]
        );
      },
    },
  ],

  defaultPriority: 999,

  onMessage: async (ctx, event) => {
    if (event.message.type === "text") {
      const text = (event.message as { type: "text"; text: string }).text;
      await ctx.lineClient.replyMessage(event.replyToken, [
        { type: "text", text: `Echo: ${text}` },
      ]);
    }
  },
};
