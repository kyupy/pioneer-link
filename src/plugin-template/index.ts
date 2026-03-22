/**
 * プラグインテンプレート
 *
 * 使い方:
 * 1. このディレクトリをコピーして plugins/ 配下に配置
 * 2. name, version, description を変更
 * 3. 必要なハンドラーを実装
 *
 * 全てのハンドラーには HandlerContext が渡されます。
 * context.org.id でデータをスコープすることを忘れずに。
 */
import type { PluginDefinition, HandlerContext } from "../shared/types.js";

async function handleMessage(ctx: HandlerContext): Promise<void> {
  // テキストメッセージの処理例
  if (ctx.event.type !== "message" || ctx.event.message.type !== "text") {
    return;
  }

  const text = ctx.event.message.text;

  if (ctx.replyToken) {
    await ctx.lineClient.replyMessage({
      replyToken: ctx.replyToken,
      messages: [{ type: "text", text: `Echo: ${text}` }],
    });
  }
}

const plugin: PluginDefinition = {
  name: "template",
  version: "0.1.0",
  description: "プラグインテンプレート",

  // LINE メッセージハンドラー
  onMessage: handleMessage,

  // コマンド登録例
  commands: [
    {
      name: "/template",
      description: "テンプレートコマンド",
      handler: async (ctx, _args) => {
        if (ctx.replyToken) {
          await ctx.lineClient.replyMessage({
            replyToken: ctx.replyToken,
            messages: [
              { type: "text", text: "テンプレートプラグインです" },
            ],
          });
        }
      },
    },
  ],

  // キーワードトリガー例
  keywords: [
    {
      pattern: /^テンプレート$/,
      handler: async (ctx, _match) => {
        if (ctx.replyToken) {
          await ctx.lineClient.replyMessage({
            replyToken: ctx.replyToken,
            messages: [{ type: "text", text: "キーワードに反応しました" }],
          });
        }
      },
    },
  ],

  // ライフサイクル
  async onLoad() {
    console.log("Template plugin loaded");
  },
};

export default plugin;
