# 🛡️ Production Tower Defense (本番環境防衛戦)

> **「金曜17:59の強制プッシュから本番環境を守り抜け！」**  
> GitHub、CI/CDパイプライン、デプロイワークフローをモチーフにした新感覚サイバー・タワーディフェンスゲーム。

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-green.svg)
![GitHub Pages Ready](https://img.shields.io/badge/Deploy-GitHub_Pages-blueviolet.svg)

---

## 🎮 ゲーム概要

開発者が次々とプッシュしてくるコードの波。その中には恐ろしいバグやセキュリティホールが潜んでいます。  
あなたはSRE（Site Reliability Engineer）として、CI/CDパイプラインに各種防衛モジュール（Linter, Unit Test, E2E, Reviewer, WAF）を配備し、本番サーバー（Production Core）の稼働率（SLA）を死守してください！

---

## 🚀 遊び方（ルール & 操作）

### 基本ルール
1. **クリア条件**: 全7ウェーブのバグを退治し、本番リリースを完遂する。
2. **敗北条件**: バグが本番サーバーに侵入し、**SLA（稼働率）が 0.0%** になると本番炎上でゲームオーバー。
3. **資金（Compute Budget）**: バグを撃破するとクラウド予算（$）を獲得。モジュールの新規配備やアップグレードに使用します。

### 防衛モジュール（タワー）一覧
| モジュール | コスト | 特徴 | ショートカット |
| :--- | :--- | :--- | :--- |
| **Linter / Prettier** | $60 | 超高速連射・小ダメージ。微細なタイポや構文エラーを素早く除去。 | `[1]` |
| **Unit Tester (Jest)** | $100 | バランス型DPS。緑のチェックマーク（`✓`）弾で安定攻撃。 | `[2]` |
| **E2E Test (Playwright)** | $180 | 範囲攻撃（AoE）。コンテナポッドを投下して密集したバグを一網打尽。 | `[3]` |
| **Senior Reviewer** | $120 | スロー付与レーザー。「LGTM...?」と敵の移動速度を大幅低下。 | `[4]` |
| **WAF & Security** | $220 | 高威力・貫通ビーム。耐久の高いメモリリークやボスを粉砕。 | `[5]` |

### 緊急プロトコル（必殺スキル）
* **`[R]` `git revert`**: 画面上の全バグをパイプラインの手前へタイムトラベル（ロールバック）！
* **`[H]` `Hotfix Deploy`**: 画面上の全バグに即座に 160 の大ダメージを与える緊急パッチ！
* **`[B]` `Blue/Green Failover`**: 6秒間、本番サーバーが無敵シールドに覆われ、SLA低下を完全に防ぐ！

### 便利なショートカット
* `[1]` 〜 `[5]`: モジュール選択
* `[Space]`: ポーズ / 再開
* `[Esc]`: 選択解除 / インスペクターを閉じる

---

## 💻 ローカルで遊ぶ方法

**外部ライブラリやNode.jsのインストールは一切不要です！**

1. このフォルダ内の `index.html` をダブルクリック（またはブラウザにドラッグ＆ドロップ）するだけで即座にプレイできます。
2. （VSCode等の Live Server やローカルサーバーをお使いの場合は `npx serve` や拡張機能で開いても快適に動作します）

---

## 🌐 GitHub Pages へのデプロイ手順

このリポジトリは GitHub Pages に1ステップでデプロイできるように設計されています。

### 方法 1: GitHub WebUIから直接デプロイ（最も簡単）
1. [GitHub](https://github.com/) で新規リポジトリを作成します（例: `production-tower-defense`）。
2. このフォルダの全ファイル（`index.html`, `css/`, `js/`, `.github/`）をアップロードします。
3. リポジトリの **Settings（設定）** ➔ **Pages** に移動します。
4. **Build and deployment** の **Source** で `GitHub Actions` を選択します。
5. プッシュと同時に自動で GitHub Actions が走り、数秒〜数十秒で公開URL（`https://<ユーザー名>.github.io/<リポジトリ名>/`）が発行されます！

### 方法 2: Git コマンドでプッシュ
```bash
git init
git add .
git commit -m "feat: initial commit of Production Tower Defense"
git branch -M main
git remote add origin https://github.com/<あなたのユーザー名>/<リポジトリ名>.git
git push -u origin main
```
プッシュが完了すると、同梱されている `.github/workflows/deploy.yml` が自動起動し、GitHub Pages に公開されます。

---

## 🛠️ 技術スタック
* **HTML5 Canvas 2D API**: 60fps スムーズアニメーション
* **Modern JavaScript (ES Modules)**: ビルドステップ不要
* **Web Audio API**: 外部オーディオファイル不要のレトロシンセサイザー内蔵
* **GitHub Actions**: 自動デプロイパイプライン
