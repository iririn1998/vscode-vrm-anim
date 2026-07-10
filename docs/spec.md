このファイルはコミットしないでください。

# VS Code拡張機能「VRM Viewer & Animator」仕様・開発計画書

- 版数: v0.6(alpha/betaスコープ反映ドラフト)
- 初版作成日: 2026-07-07
- 最終更新日: 2026-07-09
- ステータス: v1.0-alphaを「VRM表示 + アニメーション再生」、v1.0-betaを「VS Code内で利用可能なLLMとの会話」までに定義した計画案。未確定事項は「■要決定」として明記

---

## 1. 概要

### 1.1 目的

VS Codeのエディタ上でVRMモデル(`.vrm`)を安全に表示し、VRM Animation(`.vrma`)を再生できる拡張機能を開発し、VS Code Marketplace / Open VSX等で一般配布する。

v1.0-alphaでは**モデル閲覧・アニメーション確認に特化した読み取り専用ビューア**を先に成立させる。v1.0-betaではVS Code内で利用可能なLLMを使ったキャラクター会話を追加し、外部APIキー方式のAI連携は正式版以降の拡張候補として扱う。

### 1.2 提供価値

| 対象ユーザー | 提供価値 |
|---|---|
| VRMモデル制作者 | Blender / VRoid Studio等からエクスポートしたモデルを、エディタを離れずに即座に確認できる |
| VTuber / ゲーム開発者 | リポジトリ内のVRMアセットのプレビュー・アニメーション検証ができる |
| 一般ユーザー | 将来的に、作業中のお供としてマスコット表示や会話機能へ拡張できる |

### 1.3 プロダクト形態とリリース順

| バージョン | 位置付け | 内容 |
|---|---|---|
| v1.0-alpha | 検証版 | `.vrm`表示と`.vrma`アニメーション再生まで。表示・再生の互換性、パフォーマンス、破損ファイル時のエラー表示を確認 |
| v1.0-beta | 会話MVP | alphaの内容に加え、VS Code内で利用可能なLLM(`vscode.lm`)を使ってキャラクターと会話できるところまで。詳細は §10 を参照 |
| v1.0 | 主軸 | alpha/betaの機能を安定化し、表情・環境・スクリーンショット等の基本UXと配布品質を整えた正式版 |
| v1.1 | 拡張 | コンパニオンモード強化(サイドバー/パネル常駐、アイドルモーション、省電力) |
| v1.2以降 | 拡張 | 外部APIキー方式のマルチプロバイダAI、ローカルLLM、発展的な会話機能 |

> 方針: v1.0-betaでは会話に必要な簡易コンパニオン/チャットパネルのみを含める。サイドバー常駐、アイドルモーション、省電力などの本格的なコンパニオンモード強化はv1.1以降に分離する。

---

## 2. スコープ定義

### 2.1 v1.0-alpha スコープ(In)

- `.vrm`ファイル(VRM 0.x / VRM 1.0)のCustom Editorでの表示
- カメラ操作(回転・パン・ズーム / OrbitControls)
- `.vrma`(VRM Animation)ファイルの読み込みと再生
- 再生コントロール(再生 / 一時停止 / 停止 / シーク / ループ / 速度変更)
- モデル情報の最小表示(タイトル、作者、VRMバージョン等)
- 破損VRM / 非対応VRMA / WebGL非対応時のエラー表示
- Webview再生成時の最小状態復元(カメラ位置、再生状態)

### 2.2 v1.0-beta スコープ(In)

- alphaの全機能
- VS Code Language Model API(`vscode.lm`)を利用したチャットMVP
- チャットUI(コンパニオンパネルまたは専用Webview Panel)
- 応答のストリーミング表示と中断
- キャラクターのペルソナ設定
- 応答テキスト中の表情タグによる Expression 連動
- 会話履歴(セッション内のみ保持)
- LLM未利用/未同意/クォータ超過時のエラー表示

### 2.3 v1.0 正式版スコープ(In)

- alpha/beta機能の安定化
- 表情(Expression / BlendShape)の一覧表示と手動切り替え
- モデル情報の表示(タイトル、作者、ライセンス、利用許諾、VRMバージョン等)
- ライト・背景色の簡易調整
- グリッド・軸表示のトグル
- スクリーンショット(PNG書き出し)
- Webview再生成時の状態復元(カメラ位置、再生状態、UI設定)

### 2.4 v1.x 拡張スコープ(Out of v1.0)

- コンパニオンモード強化(サイドバー/パネル常駐、アイドルモーション自動再生)
- Mixamo FBXアニメーションのリターゲット再生
- 複数モデルの同時表示・比較
- ボーン構造のツリー表示・選択ハイライト
- 物理(SpringBone)パラメータの可視化・調整
- テーマ連動(VS Codeテーマに合わせた背景)
- 外部APIキー方式のAIチャット(Anthropic / OpenAI / Google等のマルチプロバイダ対応)
- ローカルLLM(Ollama / LM Studio / OpenAI互換エンドポイント)対応

### 2.5 非スコープ(やらないこと)

- VRMモデルの編集・保存(ビューアに徹する)
- VRM以外のフォーマット(FBX / glTF単体等)の汎用ビューア化
- ネットワーク経由のモデル取得(セキュリティ・ライセンス上のリスク回避)
- モデルデータ・メタデータ・利用状況のテレメトリ送信

> 注: alphaでは外部通信を行わない。betaのLLM会話は、ユーザー操作を起点にVS Code Language Model APIへ要求する場合のみ通信が発生し得る。拡張自身はAPIキーや独自の外部AI接続先を持たない。詳細は §10.6 を参照。

---

## 3. 機能仕様

### 3.1 ビューアモード(Custom Editor)

| ID | 機能 | 詳細 | 完了条件 |
|---|---|---|---|
| F-01 | VRM表示 | `.vrm`をクリックまたは「Reopen With」からCustom Editorで開く。`CustomReadonlyEditorProvider`で実装(読み取り専用) | VRM 0.x / 1.0の代表モデルが表示できる |
| F-02 | バージョン対応 | VRM 0.x / 1.0 を自動判別して表示。内部差異はローダー層で吸収 | バージョン不明時はクラッシュせず明示エラー |
| F-03 | カメラ操作 | OrbitControls。ダブルクリックまたはコマンドでモデルにフォーカスリセット | マウス/トラックパッド/キーボード操作に対応 |
| F-04 | アニメーション読込 | ツールバー/コマンドから`.vrma`を選択。WebviewへのD&DはM3で検証後に有効化 | 非対応ファイルで明示エラー |
| F-05 | 再生制御 | 再生/一時停止/停止/シークバー/ループON-OFF/速度(0.25x〜2x) | 状態がUIと同期する |
| F-06 | 表情制御 | Expressionプリセット(happy, angry, sad, relaxed, surprised等)+カスタムをスライダー操作 | 存在しない表情は非表示またはdisabled |
| F-07 | メタ情報表示 | サイドパネルにVRMメタ情報(名前・作者・ライセンス・利用許諾)を表示 | ライセンス情報欠落時も表示が崩れない |
| F-08 | 環境設定 | 背景色、ライト強度、グリッド表示、軸表示、床表示 | 設定変更が即時反映される |
| F-09 | スクリーンショット | 現在のビューをPNGで保存(保存ダイアログ経由) | 透過背景ON/OFFを選べる |
| F-10 | 状態保持 | Webview側の`acquireVsCodeApi().setState/getState`と拡張側のドキュメント単位状態で復元 | タブ切替・Webview再生成後に復元できる |
| F-11 | エラー表示 | WebGL非対応、破損VRM、VRMA不一致、サイズ過大等をユーザー向けに表示 | 技術詳細は折りたたみ表示し、ログには機密情報を出さない |

### 3.2 コンパニオン/チャットパネル(v1.0-beta〜v1.1予定・参考仕様)

| ID | 機能 | 詳細 |
|---|---|---|
| F-20 | パネル表示 | コマンド`VRM: Open Companion`または`VRM AI: Open Chat Companion`でWebview Panelを開く |
| F-21 | モデル指定 | 設定`vrmViewer.companion.modelPath`で表示モデルを指定 |
| F-22 | アイドルモーション | 指定した`.vrma`をループ再生。複数指定時はランダム切替 |
| F-23 | 省電力 | 非フォーカス時はFPSを5〜10に制限(設定可) |
| F-24 | チャットMVP | v1.0-betaではVS Code Language Model APIを使ったチャット入力・履歴・ストリーミング応答を提供 |

### 3.3 コマンド・設定(contributes)

#### コマンド(v1.0)

| コマンドID | 表示名 | 概要 |
|---|---|---|
| `vrmViewer.openPreview` | `VRM: Open Preview` | アクティブな`.vrm`をビューアで開く |
| `vrmViewer.loadAnimation` | `VRM: Load Animation` | アクティブなビューアへ`.vrma`を読み込む |
| `vrmViewer.takeScreenshot` | `VRM: Take Screenshot` | アクティブなビューアのスクリーンショットを保存 |
| `vrmViewer.resetCamera` | `VRM: Reset Camera` | カメラをモデル全体が見える位置へ戻す |
| `vrmViewer.clearViewerState` | `VRM: Clear Viewer State` | ドキュメント単位の保存状態を破棄する |

#### 設定項目(v1.0)

| キー | 型 | 既定値 | 説明 |
|---|---|---|---|
| `vrmViewer.defaultBackground` | string | `#2d2d30` | ビューアの背景色 |
| `vrmViewer.transparentScreenshot` | boolean | `false` | スクリーンショット背景を透過する |
| `vrmViewer.showGrid` | boolean | `true` | グリッド表示 |
| `vrmViewer.showAxes` | boolean | `true` | XYZ軸表示 |
| `vrmViewer.lightIntensity` | number | `1.0` | 環境ライト/キーライトの基準強度 |
| `vrmViewer.maxFps` | number | `60` | 描画FPS上限 |
| `vrmViewer.inactiveFps` | number | `10` | 非アクティブ時FPS |
| `vrmViewer.antialiasing` | boolean | `true` | アンチエイリアス |
| `vrmViewer.modelSizeWarningMb` | number | `100` | 読み込み前に警告するモデルサイズ(MB)。0で無効 |
| `vrmViewer.retainContextWhenHidden` | boolean | `false` | Webview非表示時もコンテキストを保持する。メモリ増加のため既定OFF |

#### package.json contribution 方針

- `contributes.customEditors` に `viewType: "vrmViewer.viewer"` を定義し、`selector: [{ "filenamePattern": "*.vrm" }]` を指定する。
- `priority` は初期値 `default` とし、他拡張との競合が多い場合は `option` へ変更できるようM0で確認する。
- `activationEvents` は `onCustomEditor:vrmViewer.viewer` を必須とする。VS Code 1.74以降では`contributes.commands`に定義したコマンドは自動的にアクティベーション対象になるため、`onCommand:*`は互換性や明示性が必要な場合のみ追加する。
- メニュー項目はファイル拡張子が`.vrm`の場合のみ表示し、ビューア操作コマンドはアクティブなVRMビューアがある場合のみ有効化する。

---

## 4. 技術仕様

### 4.1 技術スタック

| 領域 | 採用技術 | 理由 / 注意 |
|---|---|---|
| 言語 | TypeScript | VS Code拡張の標準 |
| 拡張API | VS Code Extension API(engines: `^1.85.0`以上を初期目安) | Custom Editor / Webview等の現行APIを安定利用するため |
| 対象環境 | VS Code Desktop(ローカル/Remote SSH/WSL/Dev Container) | v1.0ではWeb拡張(`vscode.dev`等)非対応。Web対応は別途検証 |
| 3D描画 | Three.js(バージョン固定) | `@pixiv/three-vrm`の対応バージョンにピン留め |
| VRM | `@pixiv/three-vrm` | VRM 0.x / 1.0両対応のデファクト |
| VRMA | `@pixiv/three-vrm-animation` | VRM Animation対応 |
| Webview UI | 素のTypeScript + HTML/CSS | v1.0 UIは小規模なため、React等は導入しない |
| ビルド | tsdown(2エントリ: extension / webview) | 高速・VSIX同梱が容易 |
| Lint/Format | ESLint + Prettier | 標準構成 |
| テスト | vitest(ロジック)+ `@vscode/test-electron`(統合) | 拡張ホスト/Custom Editorの最低限を自動検証 |
| CI/CD | GitHub Actions | ビルド・テスト・VSIX作成・公開 |

> 注意: Three.jsと`@pixiv/three-vrm`はバージョン互換が厳密。`package.json`で両方を固定バージョンにし、更新は互換確認の上で行う。

### 4.2 アーキテクチャ

```text
┌─────────────────────────────────────────────┐
│ Extension Host (Node.js)                     │
│  ├─ extension.ts        … activate/コマンド登録 │
│  ├─ VrmEditorProvider   … CustomReadonlyEditor │
│  ├─ VrmDocument         … URI/メタ/状態の単位    │
│  ├─ FileService         … workspace.fsで読込/保存 │
│  ├─ ConfigService       … 設定監視・反映         │
│  └─ MessageRouter       … Webviewとの通信仲介    │
└───────────────┬─────────────────────────────┘
                │ postMessage (双方向)
┌───────────────┴─────────────────────────────┐
│ Webview (ブラウザ環境 / WebGL)                 │
│  ├─ main.ts             … 初期化・メッセージ受信  │
│  ├─ SceneManager        … Three.jsシーン管理     │
│  ├─ VrmLoader           … ArrayBuffer→VRM解析   │
│  ├─ AnimationController … VRMA再生・ミキシング    │
│  ├─ ExpressionController… 表情制御              │
│  ├─ StateStore          … setState/getState     │
│  └─ UiOverlay           … ツールバー/パネルUI    │
└─────────────────────────────────────────────┘
```

### 4.3 ファイル読み込みフロー

Webviewにワークスペース全体の読み取り権限を与えないため、モデル/アニメーションの読み込みは拡張ホスト経由を基本とする。またVS Code Webviewの`postMessage`はJSONシリアライズ可能なデータを前提にするため、v1.0の初期案では**base64チャンク転送**を採用し、`connect-src 'none'`を維持する。

1. Custom Editorの`openCustomDocument`でVRMのURIを受領し、`VrmDocument`を作成
2. `resolveCustomEditor`でWebview HTMLを設定し、`viewer:ready`受信後に拡張側が`vscode.workspace.fs.readFile(uri)`でバイナリ取得
3. 拡張側で`Uint8Array`をbase64へ変換し、一定サイズ(初期案: 512KB〜1MB)に分割して`viewer:binaryChunk`で送信
4. Webview側でチャンクを結合し、`Uint8Array` / `ArrayBuffer`へ復元して`GLTFLoader + VRMLoaderPlugin`でパース
5. パース完了後、Webview側は転送用文字列/バッファ参照を破棄し、拡張側も不要なキャッシュを保持しない

#### 大容量モデル対策

- `vrmViewer.modelSizeWarningMb`を超える場合、読み込み前に警告を出す。
- 既定ではハード上限を設けず、ユーザー承認後に読み込む。ただしM0でクラッシュするサイズが判明した場合は上限を追加する。
- base64は約33%のサイズ増加があるため、50MB+モデルではメモリ・時間をM0で必ず計測する。
- JSON/base64転送で実用上の問題が出る場合のみ、`asWebviewUri + fetch`方式を再評価する。この場合は`connect-src ${webview.cspSource}`が必要になる可能性があるため、外部通信を許可しないこと、`localResourceRoots`を対象ファイルまたは必要最小ディレクトリに限定すること、ワークスペース全体をWebviewへ不用意に公開しないことを条件にする。

### 4.4 メッセージプロトコル(拡張⇔Webview)

```typescript
type SerializedError = {
  code:
    | "webgl_unavailable"
    | "invalid_vrm"
    | "invalid_vrma"
    | "unsupported_version"
    | "file_too_large"
    | "io_error"
    | "unknown";
  message: string;        // ユーザー向け
  detail?: string;        // 開発者向け。機密情報は含めない
};

type ViewerConfig = {
  background: string;
  transparentScreenshot: boolean;
  showGrid: boolean;
  showAxes: boolean;
  lightIntensity: number;
  maxFps: number;
  inactiveFps: number;
  antialiasing: boolean;
};

type ViewerState = {
  camera?: { position: [number, number, number]; target: [number, number, number] };
  animation?: { fileName?: string; time: number; playing: boolean; loop: boolean; speed: number };
  expressions?: Record<string, number>;
  ui?: { sidePanelOpen: boolean };
};

type BinaryTransferMeta = {
  transferId: string;
  target: "model" | "animation";
  fileName: string;
  uri?: string;              // 表示/復元用。ログには不用意に出さない
  sizeBytes: number;
  chunkCount: number;
};

// Extension → Webview
type ToWebview =
  | { type: "viewer:init"; model: BinaryTransferMeta; config: ViewerConfig; state?: ViewerState }
  | { type: "viewer:loadAnimation"; animation: BinaryTransferMeta }
  | { type: "viewer:binaryChunk"; transferId: string; index: number; base64: string }
  | { type: "viewer:binaryEnd"; transferId: string; sha256?: string }
  | { type: "viewer:updateConfig"; config: Partial<ViewerConfig> }
  | { type: "viewer:requestScreenshot" }
  | { type: "viewer:showError"; error: SerializedError };

// Webview → Extension
type ToExtension =
  | { type: "viewer:ready" }
  | { type: "viewer:requestOpenAnimation" }
  | { type: "viewer:binaryReceived"; transferId: string }
  | { type: "viewer:requestBinaryRetry"; transferId: string; missingIndexes: number[] }
  | { type: "viewer:modelLoaded"; meta: VrmMeta; stats?: { triangleCount?: number; materialCount?: number; textureCount?: number } }
  | { type: "viewer:stateChanged"; state: ViewerState }
  | { type: "viewer:screenshot"; dataUrl: string; suggestedFileName?: string }
  | { type: "viewer:error"; error: SerializedError };
```

- メッセージ種別には接頭辞`viewer:`を付け、将来の`chat:`メッセージと衝突しないようにする。
- `viewer:binaryChunk`はJSONシリアライズ可能なbase64文字列のみを運ぶ。`ArrayBuffer`や`Uint8Array`を直接送る設計にはしない。
- チャンク欠落・順序入れ替わりに備え、`transferId` / `index` / `chunkCount`で検証し、必要に応じて再送要求する。
- スクリーンショット保存は必ず拡張ホスト側で`showSaveDialog`→`workspace.fs.writeFile`の順に行う。保存前後にVRMメタ情報のライセンス確認導線を表示できるようにする。
- エラーの`detail`にはファイルパスや個人情報を過剰に含めない。

### 4.5 セキュリティ / CSP

Webviewには厳格なCSPを設定する。

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'none';
  img-src ${webview.cspSource} blob: data:;
  script-src 'nonce-${nonce}';
  style-src ${webview.cspSource} 'nonce-${nonce}';
  font-src ${webview.cspSource};
  connect-src 'none';
">
```

- ビューア/alpha機能ではローカルファイル取得に`fetch`を使わないため、Webviewからの外部通信(`connect-src 'none'`)を遮断し、モデルデータが外部送信されないことを保証する。
- テクスチャ生成に必要な`blob:` / `data:`のみ画像ソースとして許可する。
- スクリプトとスタイルはnonce付きの同梱バンドルのみ許可し、インラインイベントハンドラは使わない。
- `localResourceRoots`は拡張同梱の`dist/webview`と`media`配下に限定し、ワークスペースルートは含めない。
- VRMメタ情報内のURLは自動取得しない。ユーザーが明示的にクリックした場合のみVS Code API経由で外部ブラウザを開く。

### 4.6 パフォーマンス要件

| 項目 | 目標値 / 方針 |
|---|---|
| 小型モデル(<5MB)の初回表示 | 1秒台を目標 |
| 中型モデル(〜20MB)の初回表示 | 3秒以内を目標 |
| 大型モデル(50MB+) | 読み込み中UIを表示し、フリーズと誤認されないようにする。base64転送の実測次第で警告文言を調整 |
| アニメーション再生 | 60fps維持を目標。低性能環境ではFPS上限/PixelRatio制限で安定性優先 |
| 非アクティブ時 | FPS制限で描画負荷を明確に低下させる |
| VSIXサイズ | v1.0は5MB以下を目標。ただしThree.js/three-vrmの実測によりM0で再評価 |
| メモリ | パース後に転送用バッファを即時解放。`retainContextWhenHidden`は既定OFF |

### 4.7 Workspace Trust / リモート環境

- alphaのビューア/アニメーション機能はコード実行・外部通信を行わないため、可能であればWorkspace Trustの制限モードでも動作させる。
- betaのAIチャット機能はユーザー操作を起点にVS Code Language Model APIを利用する。制限モードや環境制約で利用できない場合は、チャットのみ無効化し理由と回避策を表示する。
- Remote SSH / WSL / Dev Containerでは、`workspace.fs.readFile`の遅延と大容量転送の体感がローカルと異なるため、M3の手動テスト対象に含める。
- VS Code Web(`vscode.dev`等)はv1.0非対応とし、対応する場合はWeb拡張化、ファイルアクセス、WebGL、依存ライブラリの再検証を別途行う。

### 4.8 アクセシビリティ / UX要件

- 主要操作(再生/停止、カメラリセット、スクリーンショット)はコマンドパレットから実行可能にする。
- UIボタンには`aria-label`を付与する。
- VS Codeのライト/ダーク/ハイコントラストテーマで最低限の視認性を確認する。
- ローディング、パースエラー、WebGL非対応の状態を明示する。
- WebGL非対応環境(リモート/仮想環境含む)では復旧のヒントを表示する。

### 4.9 プロジェクト構成

```text
vscode-vrm-anim/
├─ src/
│  ├─ extension/
│  │  ├─ extension.ts
│  │  ├─ vrmEditorProvider.ts
│  │  ├─ vrmDocument.ts
│  │  ├─ fileService.ts
│  │  ├─ configService.ts
│  │  └─ messages.ts          # 型定義(共有)
│  └─ webview/
│     ├─ main.ts
│     ├─ sceneManager.ts
│     ├─ vrmLoader.ts
│     ├─ animationController.ts
│     ├─ expressionController.ts
│     ├─ stateStore.ts
│     └─ ui/
├─ media/                      # アイコン等
├─ dist/                       # ビルド成果物
├─ test/
├─ tsdown.config.mts
├─ package.json
└─ README.md
```

---

## 5. 開発計画

### 5.1 マイルストーン

| フェーズ | 期間目安 | ゴール |
|---|---|---|
| **M0: 技術検証(PoC)** | 1週間 | Webview内でThree.js + three-vrmが動作し、固定VRMが表示できる。CSP・JSON/base64チャンク転送・バンドル構成の実現性を確認 |
| **M1: ビューアMVP** | 2週間 | Custom Editorで任意の`.vrm`を開ける。カメラ操作、メタ情報表示、エラーハンドリング |
| **M2: アニメーション/alpha** | 2週間 | `.vrma`読込・再生制御一式(F-04〜F-05)。v1.0-alphaとして「VRM表示 + アニメーション再生」を配布可能にする |
| **M3: 品質・UX** | 1.5週間 | alphaフィードバック反映、状態保持、FPS制限、スクリーンショット、設定項目、大容量モデル検証、アクセシビリティ確認 |
| **M4: LLM会話/beta** | 1.5週間 | VS Code Language Model API(`vscode.lm`)でキャラクターと会話できるチャットMVPを実装し、v1.0-betaとして配布 |
| **M5: 配布準備/正式公開** | 1週間 | ドキュメント、アイコン、Marketplace素材、CI/CD、ライセンス確認、v1.0正式公開 |

合計目安: 約8〜9週間(1人開発・実働ベース)

### 5.2 各フェーズの完了条件(Definition of Done)

**M0(最重要・リスク潰し)**
- [ ] tsdown 2エントリ構成でビルドが通る
- [ ] CSP設定下でVRoidサンプルモデルが表示される
- [ ] VRM 0.x と 1.0 の両方で表示確認
- [ ] 50MBモデルの転送・表示が破綻しないことを確認
- [ ] JSON/base64チャンク転送時のメモリ増加量を計測し、`asWebviewUri + fetch`方式の要否を判断

**M1**
- [ ] `.vrm`ダブルクリックで開ける(Custom Editor登録)
- [ ] 破損ファイル・非VRM glTFで適切なエラー表示
- [ ] メタ情報(ライセンス含む)がパネルに表示される
- [ ] 複数エディタグループで同一VRMを開いた場合に破綻しない

**M2**
- [ ] VRMAの再生・一時停止・停止・シーク・ループ・速度変更が動作
- [ ] ヒューマノイドボーン欠損モデルでもクラッシュしない
- [ ] VRMAとVRMの互換性がない場合に明示エラーを出す
- [ ] v1.0-alphaとして、VRM表示とアニメーション再生を確認できるVSIXを作成できる

**M3**
- [ ] タブ切替→復帰で状態が保持される
- [ ] 非アクティブ時にCPU/GPU使用率が明確に低下する
- [ ] 表情スライダーが機能する
- [ ] Windows / macOS / Linux で動作確認
- [ ] ハイコントラストテーマとキーボード操作の最低限確認

**M4**
- [ ] `vscode.lm.selectChatModels()`で利用可能なモデルを取得し、未利用時は明示エラーを出す
- [ ] ユーザー操作を起点にLLM利用同意・モデル選択・チャット送信を行える
- [ ] 応答のストリーミング表示、中断、履歴クリアが動作する
- [ ] ユーザー入力・ペルソナ・必要最小限の履歴以外をLLMへ送信しない
- [ ] v1.0-betaとして、VS Code内LLMで会話できるVSIXを作成できる

**M5**
- [ ] README(英日)、CHANGELOG、スクリーンショット/GIF完備
- [ ] `vsce package`が警告なしで通る
- [ ] GitHub ActionsでタグpushからVSIX自動生成
- [ ] 依存ライブラリと同梱素材のライセンス表記が完了

### 5.3 テスト計画

| 種別 | 対象 | 手段 |
|---|---|---|
| 単体 | メッセージルーティング、状態管理、設定変換、エラー分類 | vitest |
| 統合 | Custom Editor起動、ファイル読込、コマンド実行 | `@vscode/test-electron` |
| 手動 | 描画品質、多様なモデル、GPU/OS差異 | テストマトリクス(下記) |
| パフォーマンス | 読み込み時間、FPS、メモリ | 開発者ツール/OSモニタでM0/M3に計測 |

**手動テストマトリクス(モデルバリエーション)**
- VRM 0.x / VRM 1.0
- 小型(<5MB) / 中型(〜20MB) / 大型(50MB+) / 警告閾値超過
- SpringBoneあり/なし、表情あり/なし
- VRoid Studio製 / Blender + VRMアドオン製
- 破損ファイル、拡張子偽装(.vrmだが中身が別物)
- WebGL無効/低性能GPU/リモート環境(SSH / WSL / Dev Container)
- Workspace Trust有効/制限モード

---

## 6. 配布計画

### 6.1 配布チャネル

| チャネル | 対象 | 備考 |
|---|---|---|
| VS Code Marketplace | VS Code本体ユーザー | Azure DevOps Publisher登録が必要 |
| Open VSX Registry | VSCodium / Cursor等 | Eclipse Foundationアカウントで公開 |
| GitHub Releases | 手動インストール派 | VSIX直添付 |

### 6.2 公開準備チェックリスト

- [ ] Publisher名・拡張ID(例: `<publisher>.vrm-viewer`)の決定 ■要決定
- [ ] 拡張アイコン(128x128)、Marketplaceバナー
- [ ] README: 機能GIF、対応フォーマット、既知の制限、プライバシー方針(alphaは外部通信なし、betaのAIチャット有効時はVS Code内LLMへ送信される内容を §10.6 に従い書き分け)
- [ ] LICENSE(MIT想定 ■要決定)
- [ ] 依存ライブラリのライセンス表記(Three.js: MIT、`@pixiv/three-vrm`: MIT)
- [ ] サンプルVRMを同梱する場合はライセンス確認(同梱しない方針を推奨。READMEでVRoid Hub等の入手先を案内)
- [ ] telemetryは実装しない(方針として明記)
- [ ] `capabilities.untrustedWorkspaces`の方針を決定し、制限モードでの動作/非動作をREADMEに明記

### 6.3 バージョニング・リリース運用

- SemVer準拠。v1.0正式公開前に`1.0.0-alpha.N`→`1.0.0-beta.N`→`1.0.0`の順でリリースする。
- alphaはGitHub Releases中心の検証版とし、VRM表示とアニメーション再生の互換性確認を主目的にする。
- betaはVS Code内で利用可能なLLMとの会話MVPを追加する版とし、外部APIキー方式のAI連携は含めない。
- タグ例: `v1.0.0-alpha.1`, `v1.0.0-beta.1`, `v1.0.0`
- リリースフロー: タグpush → GitHub Actions → VSIX生成 → 手動確認 → 必要に応じてプリリリース公開(Marketplaceは`vsce publish --pre-release`、Open VSXは公開時点のCLI仕様を確認) → 正式版で`vsce publish` / `ovsx publish`
- Three.js / three-vrm の更新はマイナーリリースで対応(互換テスト必須)

---

## 7. リスクと対策

| # | リスク | 影響 | 対策 |
|---|---|---|---|
| R1 | Three.jsとthree-vrmのバージョン非互換 | ビルド不能・描画崩れ | バージョン固定。更新はM0相当の検証を再実施 |
| R2 | 大容量モデルでWebviewがメモリ不足 | クラッシュ | サイズ警告、転送後バッファ解放、M0で上限値検証 |
| R3 | CSP制約でテクスチャ非表示 | 主要機能不全 | M0でblob/data許可を含め検証。必要最小限のCSP緩和に留める |
| R4 | `retainContextWhenHidden`によるメモリ常駐 | エディタ全体が重くなる | `setState/getState`による復元方式を優先し、常駐保持は設定でオプトイン |
| R5 | VRM仕様の将来変更(VRM 1.x拡張) | 表示不能モデルの発生 | three-vrmの追従に依存。エラー時は可能な範囲でメタ情報表示にフォールバック |
| R6 | Marketplace審査・命名衝突 | 公開遅延 | 早期にPublisher登録と名前確保 |
| R7 | GPU非搭載/リモート環境(SSH, Codespaces) | WebGL不可 | WebGL非対応検出時に明示的なエラーメッセージ表示 |
| R8 | VRMメタ情報・ファイル名に悪意ある文字列 | XSS/表示崩れ | Webview表示時にHTMLエスケープし、`innerHTML`を避ける |
| R9 | D&Dファイル読み込みの挙動差 | アニメーション読込失敗 | v1.0必須導線はVS CodeのOpenDialogにし、D&DはM3で検証後に有効化 |
| R10 | JSON/base64転送によるメモリ・時間オーバーヘッド | 大型モデルで遅延/クラッシュ | チャンクサイズをM0で調整。問題が大きい場合のみ`asWebviewUri + fetch`へ切替検討 |
| R11 | スクリーンショット利用がVRMライセンス条件に抵触 | 利用者トラブル | 保存時/READMEで「モデルのライセンス・許諾を確認する」導線を用意し、メタ情報を確認しやすくする |

---

## 8. 未決事項一覧(■要決定)

| # | 項目 | 選択肢 | 推奨 / 現方針 |
|---|---|---|---|
| D1 | 拡張名・Publisher名 | — | 早期決定が必要(名前確保) |
| D2 | ライセンス | MIT / Apache-2.0 | MIT |
| D3 | Three.js / three-vrm の正確なバージョン | リリース時点の互換版 | M0で固定し、以後Dependabot等の自動更新は無効または手動承認 |
| D4 | モデルサイズ警告/上限 | 警告のみ / 警告+ハード上限 | 初期は警告のみ。M0実測で再判断 |
| D5 | サンプルVRMの同梱 | 同梱しない / ライセンス確認済みモデルのみ同梱 | 同梱しない |
| D6 | Custom Editor priority | `default` / `option` | `default`で開始し競合状況を確認 |
| D7 | Mixamoリターゲット対応時期 | v1.x / 対応しない | 外部AI/ローカルLLM等の優先度と競合しない時期に再検討 |
| D8 | バイナリ転送方式 | JSON/base64チャンク / `asWebviewUri + fetch` | 初期はJSON/base64チャンク。M0実測で再判断 |
| D9 | Workspace Trust対応 | 制限モード対応 / 信頼済みのみ | alphaのビューア機能は制限モード対応を目指す。betaのAIチャットは`vscode.lm`利用可否を確認し、不可ならチャットのみ無効化 |

---

## 9. 次のアクション

1. D1〜D3の決定(特にD1は名前確保のため最優先)
2. M0(PoC)の着手: tsdown構成 → Custom Editor登録 → 固定モデル表示 → CSP/JSON転送検証
3. テスト用VRMモデルセットの収集(バージョン・サイズ別)
4. Publisher登録(Azure DevOps / Open VSX)
5. READMEにプライバシー方針(alphaは外部通信なし、betaのAIチャットはVS Code内LLMへ送信、テレメトリなし)を先に記載

---

## 10. AIチャット仕様(v1.0-beta以降)

> このセクションは、コンパニオンモード上のキャラクター対話機能に関する詳細仕様を定義する。

### 10.1 概要

#### 10.1.1 目的

コンパニオン/チャットパネル上のVRMキャラクターが、ユーザーのチャット入力に対して自然言語で応答する機能を提供する。v1.0-betaでは**VS Code内で利用可能なLLM(Language Model API / `vscode.lm`)専用**として設計し、外部APIキー方式やローカルLLM互換エンドポイントへの直接接続は将来検討とする。

> 方針変更: v1.0-betaでは、APIキーを拡張側で管理する方式ではなく、VS Codeが提供するLanguage Model APIを優先する。利用可能なモデル、同意フロー、クォータはVS Code側の状態に従う。

#### 10.1.2 提供価値

| 対象ユーザー | 提供価値 |
|---|---|
| 一般ユーザー | 作業のお供が「見た目」だけでなく「対話相手」になる。雑談・質問・励まし |
| 開発者 | コーディング中の軽い質問をエディタから離れず、好きなキャラクターに聞ける |
| VRMモデル制作者 | 自作キャラに人格(ペルソナ)を設定し、表情連動を含めた動作確認ができる |

#### 10.1.3 基本方針

1. **明示的オプトイン**: `vrmViewer.ai.enabled`の既定値は`false`。ユーザー操作なしにLLMモデル選択やチャット送信を行わない。
2. **VS Code内LLM優先**: v1.0-betaでは`vscode.lm.selectChatModels()`で取得できるモデルのみを利用する。拡張側でAPIキー、課金代行、独自プロキシは扱わない。
3. **利用可能性に防御的**: VS Code内でLLMが利用できない、ユーザー同意がない、クォータ制限がある場合は、機能不可の理由と回避策を表示する。
4. **将来の外部/ローカルLLM対応**: Anthropic / OpenAI / Google / Ollama / LM Studio / OpenAI互換エンドポイントは、同じ抽象化レイヤー上のプロバイダとしてv1.2以降に追加できる設計にする。
5. **Webview隔離**: LLM呼び出しは拡張ホスト(Node.js)側のみに閉じ、WebviewのCSPは`connect-src 'none'`を維持する。
6. **キャラクター連動**: 応答内容に応じて表情(Expression)や待機モーションが変化し、「キャラクターが答えている」体験を作る。
7. **プライバシー最小化**: 送信対象はユーザーが入力したチャット本文、ペルソナ、必要最小限の会話履歴のみ。ワークスペースのコード/ファイル/VRMモデルデータは自動送信しない。
8. **ワークスペース設定による自動通信を防止**: LLM利用や将来の接続先設定は、ワークスペースにコミットされた設定だけで勝手に有効にならないようにする。

---

### 10.2 スコープ定義

#### 10.2.1 フェーズ分割

| フェーズ | 内容 | 対応バージョン目安 |
|---|---|---|
| **AI-Beta: VS Code内LLM対応** | `vscode.lm`対応。チャットUI、ストリーミング表示、表情連動、ペルソナ設定 | v1.0-beta |
| **AI-1: 外部クラウドAPI対応** | APIキーによる Anthropic / OpenAI / Google 対応。BYOK、プロバイダ/モデル選択、使用量表示 | v1.2以降 |
| **AI-2: ローカルLLM対応** | Ollama / LM Studio / その他OpenAI互換エンドポイント対応。ベースURL設定 | v1.3以降 |
| **AI-3: 発展機能(参考)** | リップシンク、音声合成(TTS)読み上げ、会話履歴の永続化・検索、ツール使用(エディタ操作) | v1.4以降で検討 |

前提: v1.0-betaのAIチャットは、簡易コンパニオン/チャットパネル上に構築する。ビューアモード(Custom Editor)への直接組み込みは将来検討とする。

#### 10.2.2 AI-Beta スコープ(In)

- チャットUI(コンパニオンパネル内、キャラクター表示の下部にチャット欄)
- VS Code Language Model API(`vscode.lm`)によるモデル選択
- 応答のストリーミング表示と中断
- キャラクターのペルソナ設定(Language Model APIの制約に応じてプロンプト先頭へ組み込む)
- 応答テキスト中の表情タグによる Expression 連動
- 会話履歴(セッション内のみ保持。ウィンドウを閉じると消える)
- エラー処理(モデル未提供、ユーザー同意なし、クォータ制限、ネットワーク断、中断)
- ワークスペースのコード/ファイル内容を自動でプロンプトに含めない安全な送信経路

#### 10.2.3 非スコープ(やらないこと)

- v1.0-betaでの外部APIキー発行・課金代行・プロキシ運用
- v1.0-betaでのAnthropic / OpenAI / Google等への直接接続
- v1.0-betaでのOllama / LM Studio / OpenAI互換エンドポイント対応
- ワークスペースのコード・ファイル内容の自動送信(明示的に貼り付けた内容のみ送信対象)
- VRMモデルデータ・テクスチャ・メタ情報のLLMへの送信
- テレメトリ・会話ログの外部収集(方針として実装しない)
- エディタ操作/ファイル編集などのツール実行(AI-3以降で別途オプトイン設計)

---

### 10.3 機能仕様

#### 10.3.1 チャット機能

| ID | 機能 | 詳細 | 完了条件 |
|---|---|---|---|
| F-30 | チャットUI | コンパニオンパネル下部に入力欄+履歴表示。Markdownは安全設定でレンダリング | HTMLは無効化/サニタイズし、コードブロックが表示できる |
| F-31 | ストリーミング表示 | 応答をチャンク単位で逐次表示。生成中は中断ボタンを表示 | 中断時にUIと履歴が不整合にならない |
| F-32 | VS Code LLMモデル選択 | `vscode.lm.selectChatModels()`で利用可能なモデルを取得し、チャットUIまたはQuickPickで選択 | モデル未提供・未同意時は理由と導線を表示 |
| F-33 | ペルソナ設定 | キャラクターの人格・口調をプロンプト先頭の指示として設定(`vrmViewer.ai.persona`) | 空欄時は内蔵プリセットを使用 |
| F-34 | 表情連動 | 応答に含まれる表情タグ(後述)を拡張ホスト側でパースし、Webviewへ表情イベントを送る | タグは表示テキストから除去される |
| F-35 | 会話履歴管理 | セッション内で履歴保持。「クリア」ボタンでリセット。コンテキスト長超過時は古い履歴から切り詰め | `maxHistoryMessages`が反映される |
| F-36 | エラー表示 | モデル未提供 / ユーザー同意なし / クォータ制限 / ネットワークエラー等を吹き出し内に表示 | 次に取れる行動が分かる |
| F-37 | LLM利用同意導線 | モデル一覧取得・チャット送信はユーザー操作を起点に行い、VS Codeの同意/認証ダイアログに委ねる | 拡張はAPIキーを保持しない |
| F-38 | 使用状況表示 | VS Code APIから取得できる範囲でモデル名・制限・エラー種別を表示 | 取得不能な場合は非表示でエラーにしない |

#### 10.3.2 表情連動の仕組み(F-34)

ペルソナ指示の一部として、応答の感情を軽量タグで表現するようモデルに指示する。VS Code Language Model APIでsystem message相当の指定が使えない場合は、最初のUserメッセージにこの指示を含める。

```text
応答の冒頭または感情が変わる箇所に [happy] [sad] [angry] [surprised] [relaxed] [neutral] のいずれかのタグを付けてください。
タグは文章の意味を変えず、ユーザーには表示されません。
```

- **パース場所は拡張ホスト側**とする。LLMから届いた生チャンクを`ChatController`が受け取り、`EmotionTagParser`でタグと表示テキストを分離する。
- Webviewには、タグ除去済みの`chat:chunk`と、表情変更用の`chat:emotion`のみ送る。
- Webview側は`chat:emotion`を受けて、対応するVRM Expressionプリセットへクロスフェード(0.3秒程度)する。
- モデルがタグを出力しなかった場合は`neutral`を維持する(フォールバック。エラーにしない)。
- ストリーミング中はタグが分割チャンクで届く可能性があるため、拡張ホスト側で短いバッファを保持してタグ閉じ(`]`)まで待つ。
- 未知タグや壊れたタグは通常テキストとして扱うか除去する。クラッシュさせない。

> レビュー修正: 旧版では§10.3.2が「Webview側パース」、§10.5.2が「拡張側パース」と矛盾していたため、セキュリティとプロトコル整理を優先して**拡張ホスト側パース**に統一した。

#### 10.3.3 コマンド・設定(contributes 追加分)

##### コマンド

AI関連コマンドは、`vscode.lm`のモデル一覧取得やチャット送信の前に`vrmViewer.ai.enabled`を確認する。無効な場合は、送信対象(チャット本文・ペルソナ・必要最小限の履歴)に関する短い説明を表示し、ユーザーが明示的に有効化した後でのみ処理する。

| コマンドID | 表示名 | 概要 |
|---|---|---|
| `vrmViewer.ai.openChat` | `VRM AI: Open Chat Companion` | チャット付きコンパニオンパネルを開く |
| `vrmViewer.ai.clearHistory` | `VRM AI: Clear Chat History` | 会話履歴のクリア |
| `vrmViewer.ai.selectModel` | `VRM AI: Select VS Code LLM Model` | `vscode.lm`で利用可能なモデルを取得しQuickPickで変更 |
| `vrmViewer.ai.setApiKey` | `VRM AI: Set API Key` | v1.2以降の外部プロバイダ用。v1.0-betaでは使用しない |
| `vrmViewer.ai.clearApiKey` | `VRM AI: Clear API Key` | v1.2以降の外部プロバイダ用。v1.0-betaでは使用しない |
| `vrmViewer.ai.selectProvider` | `VRM AI: Select Provider` | v1.2以降の外部プロバイダ/ローカルLLM用。v1.0-betaでは`vscode-lm`固定 |

##### 設定項目

| キー | 型 | 既定値 | 説明 |
|---|---|---|---|
| `vrmViewer.ai.enabled` | boolean | `false` | AI機能の有効化(オプトイン) |
| `vrmViewer.ai.provider` | string | `"vscode-lm"` | v1.0-betaでは`vscode-lm`固定。v1.2以降で`anthropic` / `openai` / `google` / `ollama` / `openai-compatible`を追加 |
| `vrmViewer.ai.model` | string | `""` | VS Code LLMモデルIDまたは選択結果。空欄時はモデル選択UIで決定 |
| `vrmViewer.ai.persona` | string | 内蔵プリセット | キャラクターのペルソナ(プロンプト先頭の指示) |
| `vrmViewer.ai.maxHistoryMessages` | number | `20` | LLMに送る履歴の最大メッセージ数 |
| `vrmViewer.ai.maxOutputTokens` | number | `1024` | 1応答あたりの最大出力トークン目安 |
| `vrmViewer.ai.requestTimeoutMs` | number | `60000` | 1リクエストのタイムアウト |
| `vrmViewer.ai.baseUrl` | string | `""` | v1.2以降: ローカルLLM/互換APIのエンドポイントURL |

> v1.0-betaではAPIキーを扱わない。v1.2以降に外部プロバイダを追加する場合も、APIキーは設定項目にしない(誤ってsettings.jsonにコミットされる事故を防ぐ)。保存する場合は`SecretStorage`のみ。

##### 設定スコープと安全な有効化

- `vrmViewer.ai.enabled`は`workspace.getConfiguration().inspect()`で設定スコープを判定する。ユーザー/マシン設定が無効で、ワークスペース設定だけが有効な場合は、初回送信またはモデル一覧取得前に確認ダイアログを出す。
- `provider` / `model` / `persona`はワークスペース設定を許容できるが、利用モデルが変わる場合はUIに表示してから送信する。
- v1.2以降で`vrmViewer.ai.baseUrl`を追加利用する場合、`localhost` / `127.0.0.1` / `::1`以外を指す接続先はユーザーが明示的に承認するまで接続しない。
- `persona`にワークスペース固有の口調プリセットを置くことは許容するが、ファイル内容を自動で読み込んでプロンプトへ追加しない。

---

### 10.4 プロバイダ抽象化レイヤー

#### 10.4.1 対応プロバイダ

| フェーズ | プロバイダ | 接続方式 | モデル選択方針 | 備考 |
|---|---|---|---|---|
| AI-Beta | VS Code Language Model API | `vscode.lm` | `selectChatModels()`で動的取得。未提供時はチャット不可理由を表示 | APIキー不要。ユーザー同意・クォータ・利用可能モデルはVS Code側に従う |
| AI-1 | Anthropic | 公式SDKまたはHTTPS fetch | 公式のモデル一覧APIで動的取得。失敗時はリリース時に確認した静的リストへフォールバック | v1.2以降。ストリーミング対応。APIバージョンヘッダを実装側で管理 |
| AI-1 | OpenAI | 公式SDKまたはHTTPS fetch | 公式のモデル一覧APIで動的取得。チャット用途に適したモデルをフィルタ | v1.2以降。Responses API / Chat Completions等の差異はProvider内で吸収 |
| AI-1 | Google | 公式SDK `@google/genai` またはHTTPS fetch | 公式のモデル一覧APIで動的取得 | v1.2以降。SDKのサイズをAI-M0で計測 |
| AI-2 | Ollama | ローカルHTTP APIまたはOpenAI互換API | ローカルモデル一覧APIで取得 | v1.3以降。APIキー不要。原則`localhost`通信のみ |
| AI-2 | LM Studio / その他 | OpenAI互換API(`baseUrl`指定) | OpenAI互換のモデル一覧APIまたは自由入力 | v1.3以降。`openai-compatible`プロバイダとして汎用対応 |

> レビュー修正: 旧版の「既定モデル(2026-07時点)」には、モデルIDが短期間で変わる/廃止されるリスクがあり、特定IDの断定も不正確になり得るため削除した。実装では「動的取得 + リリース時更新の静的フォールバック + 自由入力」を採用する。

#### 10.4.2 既定モデルの決定ルール

1. v1.0-betaでは`vscode.lm.selectChatModels()`の結果を取得し、`vrmViewer.ai.model`が一致すればそれを使用する。
2. 未設定または一致しない場合、ユーザーにモデル選択QuickPickを表示する。
3. 利用可能なモデルが0件の場合は、VS Code内LLMが利用できない旨と必要な設定/拡張/同意の確認導線を表示する。
4. v1.2以降の外部プロバイダでは、`listModels()`の結果からプロバイダ実装が持つ`defaultCandidate`に一致するモデルを選ぶ。
5. 外部プロバイダのモデル一覧取得に失敗した場合は、リリース時点で検証済みの静的フォールバックリストと自由入力を提示する。
6. 静的フォールバックリストは`src/extension/ai/providerDefaults.ts`等に隔離し、リリース前チェックリストで公式ドキュメント/APIに照らして更新する。

#### 10.4.3 インターフェース設計

全プロバイダを共通インターフェースに正規化する。プロバイダ固有のパラメータ差異(ストリーミング形式、usage形式、サンプリングパラメータ、拒否応答等)は各実装内で吸収する。

```typescript
type ProviderId = "vscode-lm" | "anthropic" | "openai" | "google" | "ollama" | "openai-compatible";

type ChatErrorKind =
  | "auth"
  | "rate_limit"
  | "network"
  | "timeout"
  | "bad_request"
  | "model_not_found"
  | "refusal"
  | "unknown";

interface ModelInfo {
  id: string;
  label?: string;
  provider: ProviderId;
  deprecated?: boolean;
  contextWindow?: number;
  supportsStreaming?: boolean;
  defaultCandidate?: boolean;
}

interface ChatProvider {
  readonly id: ProviderId;
  readonly requiresApiKey: boolean;
  listModels(signal?: AbortSignal): Promise<ModelInfo[]>;
  chat(req: ChatRequest): AsyncIterable<ChatChunk>;
}

interface ChatRequest {
  model: string;
  system: string; // ペルソナ + 表情タグ指示。vscode-lmではUserメッセージへ合成する場合がある
  messages: { role: "user" | "assistant"; content: string }[];
  maxOutputTokens: number;
  signal: AbortSignal;
}

type ChatChunk =
  | { type: "text"; delta: string }
  | { type: "done"; usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number } }
  | { type: "error"; kind: ChatErrorKind; message: string; retryAfterMs?: number };
```

- 実装は`src/extension/ai/providers/`配下に1プロバイダ1ファイル。v1.0-betaでは`VscodeLmProvider`のみ必須とする。
- 外部SDKはv1.2以降のプロバイダ選択時に動的`import()`する案を第一候補とし、VSIXサイズと起動時間をAI-M0で計測する。
- SDKが重い、またはバンドルが複雑になる場合は、軽量な`fetch`直叩き実装へ切り替える。
- ローカルLLM(AI-2)は`OpenAICompatibleProvider`を1つ実装し、Ollama / LM Studioは`baseUrl`プリセットとして扱う。

#### 10.4.4 APIキー管理

- v1.0-betaの`vscode-lm`プロバイダではAPIキーを保存しない。
- v1.2以降の外部プロバイダでは、`vscode.ExtensionContext.secrets`(SecretStorage)にプロバイダ別のキー(`vrmViewer.ai.apiKey.<provider>`)で保存する。
- キーはWebviewへ一切渡さない(LLM/API呼び出しは拡張ホスト側のみ。§10.5参照)。
- キー削除コマンドと、無効キー検出時(401)の再設定導線を用意する。
- ログ、エラー詳細、分析イベントにAPIキーやAuthorizationヘッダを出力しない。
- SecretStorageに保存したキーはプロバイダID単位で管理し、プロバイダ切替時に別プロバイダへ誤送信しない。
- AI-2のOllamaなどAPIキー不要のプロバイダでは、キー設定導線を表示しない。

---

### 10.5 アーキテクチャ

#### 10.5.1 通信経路の設計判断(重要)

本仕様書 §4.5ではWebviewのCSPを`connect-src 'none'`とし、モデルデータの外部送信がないことを保証している。**この保証を維持するため、LLM呼び出しはWebviewではなく拡張ホスト(Node.js)側で行う。**

- WebviewのCSPは変更しない(`connect-src 'none'`のまま)。
- Webviewはチャット入力を`postMessage`で拡張へ送り、拡張が`vscode.lm`または将来のProviderを呼び、タグ除去済み応答チャンクを`postMessage`でWebviewへ流す。
- v1.0-betaではAPIキー、プロバイダSDK、独自HTTP通信を持たない。
- v1.2以降に外部Providerを追加する場合も、APIキー、プロバイダSDK、HTTP通信は拡張ホスト内に閉じる。
- プロキシ設定が必要な環境では、VS Code / Node側のプロキシ設定に追従できるかAI-M0で検証する。

```text
┌─────────────────────────────────────────────────────────┐
│ Extension Host (Node.js)                                 │
│  ├─ ChatController       … 会話状態・履歴・中断管理        │
│  ├─ ProviderRegistry     … ChatProvider の解決            │
│  ├─ providers/           … vscode-lm / future providers   │
│  ├─ EmotionTagParser     … 生テキストから表情タグを分離     │
│  ├─ HistoryTrimmer       … 履歴切り詰め                   │
│  └─ SecretStorage        … 将来Provider用APIキー           │
└─────────────────┬───────────────────────────────────────┘
                  │ postMessage(タグ除去済みチャット差分)
┌─────────────────┴───────────────────────────────────────┐
│ Webview (CSP: connect-src 'none')                         │
│  ├─ ChatUi              … 入力欄・履歴・安全なMarkdown表示 │
│  └─ ExpressionController… chat:emotionをVRM表情へ反映      │
└─────────────────────────────────────────────────────────┘
```

#### 10.5.2 メッセージプロトコル(追加分)

```typescript
// Webview → Extension
type ToExtensionAi =
  | { type: "chat:send"; requestId: string; text: string }
  | { type: "chat:abort"; requestId: string }
  | { type: "chat:clear" }
  | { type: "chat:listModels"; provider: ProviderId };

// Extension → Webview
type ToWebviewAi =
  | { type: "chat:started"; requestId: string }
  | { type: "chat:chunk"; requestId: string; delta: string }       // 表情タグ除去済み
  | { type: "chat:emotion"; requestId: string; emotion: EmotionId }
  | { type: "chat:done"; requestId: string; usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number } }
  | { type: "chat:error"; requestId?: string; kind: ChatErrorKind; message: string; retryAfterMs?: number }
  | { type: "chat:models"; provider: ProviderId; models: ModelInfo[] };

type EmotionId = "happy" | "sad" | "angry" | "surprised" | "relaxed" | "neutral";
```

- `requestId`で同時送信/中断/遅延チャンクを識別する。v1.0-betaではUI上の同時生成は1件に制限してもよいが、プロトコルは将来拡張に耐える形にする。
- Webviewに届く`chat:chunk`は表示可能なテキストのみとし、タグや内部メタ情報は含めない。
- `chat:error`の`message`はユーザー向けに整形し、APIキーやHTTPヘッダを含めない。

#### 10.5.3 会話履歴と切り詰め

- 履歴は拡張ホスト側`ChatController`がメモリ保持(v1.0-betaでは永続化しない)。
- LLM送信時は直近`maxHistoryMessages`件に切り詰める。ペルソナ指示は常に先頭に付与する。
- プロバイダごとの正確なトークン推定はv1.0-betaでは必須にしない。まずはメッセージ数上限と`maxOutputTokens`でクォータ/コスト上振れを抑える。
- persona / 表情タグ指示を固定し、履歴を末尾に追記する構造にすることで、プロンプトキャッシュが効く将来Providerではコスト削減が見込める。
- 履歴クリア時はUI履歴と拡張ホスト側履歴の両方をリセットする。

---

### 10.6 セキュリティ・プライバシー

| 項目 | 方針 |
|---|---|
| オプトイン | `vrmViewer.ai.enabled: false`が既定。有効化+ユーザー操作までLLM呼び出しを行わない。ワークスペース設定だけで有効化された場合は送信前に確認する |
| 送信データ | ユーザーが入力したチャットテキスト+ペルソナ+必要最小限の履歴のみ。VRMモデルデータ・ワークスペースのファイルは送信しない |
| VS Code内LLM | v1.0-betaではVS Code Language Model APIを使う。送信後の扱い、利用可能モデル、同意、クォータはVS Code/利用中のモデル提供元の仕様に従う |
| APIキー | v1.0-betaでは扱わない。v1.2以降に外部Providerを追加する場合もSecretStorageのみとし、Webview、ログ、エラーメッセージ、テレメトリへ出力しない |
| 設定スコープ | `inspect()`でユーザー/ワークスペース値を判定し、ワークスペース値だけで有効化・利用モデル/通信先変更される場合は明示確認する |
| Webview | CSP変更なし。キー・LLM通信ともにWebviewへ露出しない |
| Markdown | HTML無効化またはサニタイズを必須にし、モデル応答によるXSSを防ぐ。画像の自動読み込みは無効化する |
| README明記 | 「AI機能を有効にした場合のみ、VS Code内で選択されたLLMへチャット内容が送信される」ことをプライバシー方針に追記 |
| プロバイダ規約 | 送信後の取り扱いはVS Code/利用モデル提供元の規約・データ利用ポリシーに従うため、ユーザーに確認を促す |
| モデル応答の拒否 | VS Code内LLMまたは将来Provider側のセーフティ機構による応答拒否は`error.kind: "refusal"`として穏当な文言で表示 |
| 将来のツール使用 | ファイル読取/エディタ操作はv1.0-betaでは実装しない。導入する場合は別設定で明示オプトインにする |

---

### 10.7 リスクと対策

| # | リスク | 影響 | 対策 |
|---|---|---|---|
| RA-1 | VS Code内LLMが利用できない/未同意/クォータ超過 | betaチャット不能 | モデル未提供時の明示エラー、設定導線、AIなしでもビューア機能を使える設計 |
| RA-2 | Language Model APIや利用可能モデルの仕様変更 | チャット不能 | `VscodeLmProvider`で局所化。モデルIDはユーザー変更可能にし、利用可能モデル一覧を毎回取得 |
| RA-3 | 表情タグをモデルが出力しない/崩れた形式で出力 | 表情連動の不発 | neutralフォールバック。タグ形式はプロンプトで例示。パース失敗はエラーにしない |
| RA-4 | ユーザーのLLMクォータ/コスト意識不足 | 想定外の利用量増加 | 取得可能な使用量表示、履歴切り詰め、`maxOutputTokens`既定値を保守的に設定 |
| RA-5 | 「外部通信なし」の既存訴求との矛盾 | ユーザーの信頼低下 | alphaは外部通信なし、betaはVS Code内LLM利用時のみ送信、とREADME/Marketplace説明を書き分ける(§10.6) |
| RA-6 | VS Code内LLMの応答品質・速度のばらつき | 体験劣化 | タイムアウトとストリーミング表示で体感を担保。品質は利用モデルに依存する旨を明記 |
| RA-7 | モデル応答MarkdownによるXSS | セキュリティ事故 | HTML無効化/サニタイズ、`innerHTML`の直接使用禁止、CSP維持 |
| RA-8 | LLMエラー詳細や将来のAPIキーのログ漏洩 | 秘密情報漏洩 | ログ出力時にヘッダ/キー/詳細をマスクし、`detail`に含めないテストを追加 |
| RA-9 | 中断後に遅延チャンクが届く | UI/履歴不整合 | `requestId`とAbortControllerで破棄判定。中断済みIDのチャンクは無視 |
| RA-10 | ワークスペース設定により意図しないモデル/将来URLへ接続する | プライバシー/SSRFリスク | `enabled`/`model`/将来の`baseUrl`のワークスペース値は送信前確認。ローカルLLMは既定でlocalhostのみ許可 |
| RA-11 | Markdown内の外部画像・リンクで意図しない通信/誘導が起きる | プライバシー低下 | 画像読み込みは無効化。リンクは表示のみまたは確認後に`openExternal` |

---

### 10.8 未決事項一覧(■要決定)

| # | 項目 | 選択肢 | 推奨 / 現方針 |
|---|---|---|---|
| DA-1 | ビューアモードへのチャット搭載 | コンパニオン/チャットパネル専用 / ビューアにも搭載 | v1.0-betaはパネル専用。ビューア搭載は将来検討 |
| DA-2 | 表情連動の方式 | テキストタグ / 構造化出力・ツール呼び出し | betaはタグ方式(VS Code内LLMと将来Providerで共通化しやすい) |
| DA-3 | タグのパース場所 | 拡張ホスト側 / Webview側 | 拡張ホスト側(本版で統一) |
| DA-4 | 外部Provider SDK同梱方式 | 全同梱 / 動的import / fetch直叩き | v1.2以降に判断。第一候補は動的import |
| DA-5 | モデル一覧の取得 | `vscode.lm`動的取得 / 外部models API / 静的リスト+自由入力 | betaは`vscode.lm`動的取得。外部Providerは動的+フォールバック+自由入力 |
| DA-6 | `vscode.lm`(VS Code内LLM)対応 | betaに含める / 将来検討 / 対応しない | v1.0-betaに含める |
| DA-7 | 会話履歴の永続化 | しない / workspaceState保存 | v1.0-betaではしない |
| DA-8 | Markdownライブラリ | markdown-it / micromark / 自前最小実装 | 安全設定とサイズをAI-M0で比較 |
| DA-9 | ローカルLLM接続のCSP表現 | Webviewは接続しない / localhostのみ許可 | v1.3以降もWebviewは接続しない。拡張ホストから接続 |
| DA-10 | AI設定のスコープ | ユーザー設定のみ / ワークスペース設定も許可 / 値ごとに制御 | `enabled`/`baseUrl`はユーザー/マシン優先、persona等はワークスペース許可 |

---

### 10.9 マイルストーン(AI-Beta)

| フェーズ | 期間目安 | ゴール |
|---|---|---|
| **AI-B0: `vscode.lm`技術検証** | 0.5週間 | `selectChatModels()`でモデル取得。未提供・未同意・クォータ制限の挙動を確認 |
| **AI-B1: チャットMVP** | 0.5週間 | チャットUI、履歴、エラー処理、中断。`VscodeLmProvider`をProvider抽象化レイヤーへ接続 |
| **AI-B2: キャラクター連動** | 0.5週間 | 表情タグ連動、ペルソナ設定、タグ除去済みストリーミング表示 |
| **AI-B3: 品質・リリース** | 0.5週間 | README・プライバシー方針更新、長文・モデル未提供・中断後チャンクの検証。v1.0-betaとして配布 |

外部クラウドAPI(BYOK)とローカルLLMは、v1.0-beta後のv1.2以降で別マイルストーンとして扱う。

---

### 10.10 リリース前チェックリスト(AI機能)

- [ ] README / Marketplace説明に、AI機能はオプトインであり、VS Code内で選択されたLLMへチャット内容が送信されることを明記
- [ ] v1.0-betaではAPIキーをsettings.json、ログ、Webviewメッセージのいずれにも出さないことを確認
- [ ] `vscode.lm.selectChatModels()`が0件の場合でも、分かりやすいエラーと導線を表示することを確認
- [ ] 利用モデルIDをリリース直前に固定断定せず、利用可能モデルの動的取得を優先することを確認
- [ ] Markdown HTML無効化/サニタイズのテストを追加
- [ ] 401/429/タイムアウト/ネットワーク断/中断のUIを確認
- [ ] `connect-src 'none'`を維持したままAIチャットが動作することを確認
- [ ] ワークスペース設定で`enabled`/`model`/将来の`baseUrl`が指定された場合でも、送信前確認なしにLLM呼び出しや外部通信をしないことを確認
- [ ] Markdown内の外部画像が読み込まれず、リンクは確認後にのみ外部ブラウザで開くことを確認
