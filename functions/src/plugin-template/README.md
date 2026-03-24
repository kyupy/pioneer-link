# プラグイン開発ガイド

## クイックスタート

1. このディレクトリをコピー:
   ```bash
   cp -r functions/src/plugin-template functions/src/plugins/my-plugin
   ```

2. `index.ts` を編集してプラグインを実装

3. `functions/src/plugins/index.ts` にインポートを追加:
   ```typescript
   import { myPlugin } from "./my-plugin";
   // plugins配列に追加
   export const plugins: PluginDefinition[] = [echoPlugin, myPlugin];
   ```

4. PRを作成

## プラグインができること

| 機能 | 説明 | 例 |
|------|------|----|
| コマンド | `/command args` 形式 | `/echo hello` |
| キーワード | テキスト内の文字列/正規表現マッチ | 「出欠」を含むメッセージ |
| 会話状態 | マルチステップのやり取り | 入部フォーム（名前→学部→確認） |
| イベントバス | プラグイン間通信 | 入部完了イベント→歓迎メッセージ |
| Firestore | テナントスコープのデータ保存 | `ctx.db.collection("attendance")` |

## PluginContext（ctx）の中身

```typescript
ctx.orgId       // テナントID
ctx.org         // Organization ドキュメント
ctx.userId      // LINE ユーザーID
ctx.user        // User ドキュメント
ctx.member      // OrgMember（ロール情報含む）
ctx.event       // LINE Webhook イベント
ctx.lineClient  // LINE APIラッパー（replyMessage, pushMessage, getProfile）
ctx.db          // テナントスコープのFirestore（ctx.db.collection("xxx")）
ctx.state       // 会話状態アクセサ（get, set, clear）
ctx.eventBus    // イベントバス（emit）
```

## 注意事項

- `ctx.db` は自動的にテナントスコープ。他団体のデータにはアクセスできない
- `ctx.state.set()` は現在の会話状態を上書きする（1ユーザー1状態）
- `replyToken` は1回しか使えない。2回目以降は `pushMessage` を使う
- `collections` に使うサブコレクション名を宣言しておくとドキュメント化になる

## バイブコーディングのコツ

AIに指示する時は以下を含めると良い:
- どんなコマンドやキーワードに反応するか
- どんなデータをFirestoreに保存するか
- マルチステップフローがあるか
- 他のプラグインと連携する必要があるか
