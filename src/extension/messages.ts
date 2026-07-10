// 拡張ホスト⇔Webview間メッセージ型定義(仕様書 §4.4 のalphaサブセット)

export type SerializedError = {
  code:
    | "webgl_unavailable"
    | "invalid_vrm"
    | "invalid_vrma"
    | "unsupported_version"
    | "file_too_large"
    | "io_error"
    | "unknown";
  message: string; // ユーザー向け
  detail?: string; // 開発者向け。機密情報は含めない
};

export type ViewerConfig = {
  background: string;
  showGrid: boolean;
  showAxes: boolean;
  lightIntensity: number;
};

export type BinaryTransferMeta = {
  transferId: string;
  target: "model" | "animation";
  fileName: string;
  sizeBytes: number;
  chunkCount: number;
};

export type VrmMeta = {
  name?: string;
  authors?: string;
  version?: string; // VRM仕様バージョン("0.x" / "1.0")
  license?: string;
};

// Extension → Webview
export type ToWebview =
  | { type: "viewer:init"; model: BinaryTransferMeta; config: ViewerConfig }
  | { type: "viewer:binaryChunk"; transferId: string; index: number; base64: string }
  | { type: "viewer:binaryEnd"; transferId: string }
  | { type: "viewer:resetCamera" }
  | { type: "viewer:showError"; error: SerializedError };

// Webview → Extension
export type ToExtension =
  | { type: "viewer:ready" }
  | { type: "viewer:binaryReceived"; transferId: string }
  | { type: "viewer:modelLoaded"; meta: VrmMeta }
  | { type: "viewer:error"; error: SerializedError };
