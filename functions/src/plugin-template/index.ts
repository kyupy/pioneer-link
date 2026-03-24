/**
 * プラグインテンプレート
 *
 * 新しいプラグインを作るには:
 * 1. このディレクトリをコピーして functions/src/plugins/<プラグイン名>/ に配置
 * 2. 以下のテンプレートを編集
 * 3. functions/src/plugins/index.ts にインポートを追加
 * 4. PRを作成
 *
 * AIへの指示例（バイブコーディング用）:
 * 「pioneer-linkのプラグインテンプレートを使って、出欠管理プラグインを作ってください。
 *  /attendance コマンドで出欠確認を開始し、ボタンで出席/欠席を選べるようにしてください。
 *  データはFirestoreのattendanceサブコレクションに保存してください。」
 */
import type { PluginDefinition } from "../shared/types";

export const myPlugin: PluginDefinition = {
  name: "my-plugin", // ユニークな識別子（英数字とハイフン）
  version: "1.0.0",
  displayName: "My Plugin",
  description: "プラグインの説明をここに書く",

  // このプラグインが使うFirestoreサブコレクション名
  // organizations/{orgId}/ の下に作られる
  collections: [
    // "my-data",
  ],

  // スラッシュコマンド
  commands: [
    // {
    //   command: "/mycommand",
    //   description: "コマンドの説明",
    //   handler: async (ctx, args) => {
    //     await ctx.lineClient.replyMessage(
    //       (ctx.event as { replyToken: string }).replyToken,
    //       [{ type: "text", text: `引数: ${args}` }]
    //     );
    //   },
    // },
  ],

  // キーワードマッチ（正規表現または文字列）
  keywords: [
    // {
    //   pattern: /出欠|attendance/i,
    //   handler: async (ctx, _match) => {
    //     // キーワードにマッチした時の処理
    //   },
    // },
  ],

  // デフォルトのメッセージハンドラ（コマンド/キーワード/会話状態に
  // マッチしなかった場合のフォールバック）
  // defaultPriority が小さいほど優先度が高い
  // defaultPriority: 100,
  // onMessage: async (ctx, event) => {
  //   // フォールバック処理
  // },

  // 会話状態ハンドラ（マルチステップフロー用）
  // ctx.state.set("my-plugin", "step1", { someData: "value" }) で状態を設定
  // onStateMessage: async (ctx, state, event) => {
  //   switch (state) {
  //     case "step1":
  //       // ステップ1の処理
  //       await ctx.state.set("my-plugin", "step2");
  //       break;
  //     case "step2":
  //       // ステップ2の処理
  //       await ctx.state.clear();
  //       break;
  //   }
  // },

  // フォロー/アンフォローイベント
  // onFollow: async (ctx, event) => { },
  // onUnfollow: async (ctx, event) => { },

  // ポストバック（ボタン/クイックリプライ）
  // onPostback: async (ctx, event) => { },

  // イベントバス購読（他プラグインからのイベントを受信）
  subscriptions: [
    // {
    //   eventType: "some-event",
    //   handler: async ({ orgId, payload }) => {
    //     console.log(`Received event for org ${orgId}:`, payload);
    //   },
    // },
  ],
};
