import * as vscode from "vscode";
import { VrmDocument } from "./vrmDocument";
import type { BinaryTransferMeta, ToExtension, ToWebview, ViewerConfig } from "./messages";

const CHUNK_SIZE = 1024 * 1024; // 1MB(base64化前のバイナリサイズ)

export class VrmEditorProvider implements vscode.CustomReadonlyEditorProvider<VrmDocument> {
  public static readonly viewType = "vrmViewer.viewer";

  private readonly webviews = new Map<string, vscode.WebviewPanel>();

  constructor(private readonly context: vscode.ExtensionContext) {}

  openCustomDocument(uri: vscode.Uri): VrmDocument {
    return new VrmDocument(uri);
  }

  async resolveCustomEditor(document: VrmDocument, panel: vscode.WebviewPanel): Promise<void> {
    panel.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, "dist", "webview")],
    };
    panel.webview.html = this.getHtml(panel.webview);

    const key = document.uri.toString();
    this.webviews.set(key, panel);
    panel.onDidDispose(() => {
      if (this.webviews.get(key) === panel) {
        this.webviews.delete(key);
      }
    });

    panel.webview.onDidReceiveMessage(async (message: ToExtension) => {
      switch (message.type) {
        case "viewer:ready":
          await this.sendModel(document, panel);
          break;
        case "viewer:error":
          void vscode.window.showErrorMessage(`VRM Viewer: ${message.error.message}`);
          break;
        case "viewer:modelLoaded":
        case "viewer:binaryReceived":
          break;
      }
    });
  }

  /** アクティブなVRMビューアのWebviewへメッセージを送る(コマンド用) */
  postToActiveViewer(message: ToWebview): void {
    for (const panel of this.webviews.values()) {
      if (panel.active) {
        void panel.webview.postMessage(message);
        return;
      }
    }
  }

  private async sendModel(document: VrmDocument, panel: vscode.WebviewPanel): Promise<void> {
    const post = (message: ToWebview) => panel.webview.postMessage(message);
    let bytes: Uint8Array;
    try {
      bytes = await vscode.workspace.fs.readFile(document.uri);
    } catch (e) {
      await post({
        type: "viewer:showError",
        error: {
          code: "io_error",
          message: "ファイルを読み込めませんでした。",
          detail: e instanceof Error ? e.message : String(e),
        },
      });
      return;
    }

    const transferId = `model-${Date.now()}`;
    const chunkCount = Math.max(1, Math.ceil(bytes.byteLength / CHUNK_SIZE));
    const meta: BinaryTransferMeta = {
      transferId,
      target: "model",
      fileName: basename(document.uri),
      sizeBytes: bytes.byteLength,
      chunkCount,
    };

    await post({ type: "viewer:init", model: meta, config: this.getConfig() });

    for (let i = 0; i < chunkCount; i++) {
      const chunk = bytes.subarray(i * CHUNK_SIZE, Math.min((i + 1) * CHUNK_SIZE, bytes.byteLength));
      await post({
        type: "viewer:binaryChunk",
        transferId,
        index: i,
        base64: Buffer.from(chunk).toString("base64"),
      });
    }
    await post({ type: "viewer:binaryEnd", transferId });
  }

  private getConfig(): ViewerConfig {
    const cfg = vscode.workspace.getConfiguration("vrmViewer");
    return {
      background: cfg.get<string>("defaultBackground", "#2d2d30"),
      showGrid: cfg.get<boolean>("showGrid", true),
      showAxes: cfg.get<boolean>("showAxes", true),
      lightIntensity: cfg.get<number>("lightIntensity", 1.0),
    };
  }

  private getHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "dist", "webview", "main.js"),
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "dist", "webview", "main.css"),
    );
    const nonce = getNonce();

    return /* html */ `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'none';
    img-src ${webview.cspSource} blob: data:;
    script-src 'nonce-${nonce}';
    style-src ${webview.cspSource};
    font-src ${webview.cspSource};
    connect-src 'none';
  " />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="${styleUri}" />
  <title>VRM Viewer</title>
</head>
<body>
  <canvas id="viewer-canvas" aria-label="VRM model viewer"></canvas>
  <div id="overlay" role="status">
    <div id="overlay-message">読み込み中…</div>
    <div id="overlay-progress"></div>
    <details id="overlay-detail-wrap" hidden>
      <summary>技術詳細</summary>
      <pre id="overlay-detail"></pre>
    </details>
  </div>
  <div id="meta-panel" hidden></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function basename(uri: vscode.Uri): string {
  const path = uri.path;
  return path.slice(path.lastIndexOf("/") + 1);
}

function getNonce(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let nonce = "";
  for (let i = 0; i < 32; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}
