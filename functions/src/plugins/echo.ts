import type { PluginDefinition } from "../shared/types";

export const echoPlugin: PluginDefinition = {
  name: "echo",
  version: "1.0.0",

  async handle(ctx) {
    if (ctx.event.type !== "message" || ctx.event.message.type !== "text") {
      return false;
    }
    const text = ctx.event.message.text;
    await ctx.lineClient.replyMessage(ctx.event.replyToken, [
      { type: "text", text: `Echo: ${text}` },
    ]);
    return true;
  },
};
