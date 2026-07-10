import * as vscode from "vscode";

type ViewerMessage =
  | { type: "viewer:ready" }
  | { type: "viewer:resetCamera" }
  | { type: "viewer:init"; fileName: string };

class VrmDocument implements vscode.CustomDocument {
  public constructor(public readonly uri: vscode.Uri) {}

  public dispose(): void {}
}

/** Read-only custom editor that hosts the VRM viewer Webview. */
export class VrmEditorProvider implements vscode.CustomReadonlyEditorProvider<VrmDocument> {
  public static readonly viewType = "vrmViewer.viewer";

  private readonly webviews = new Map<string, vscode.WebviewPanel>();
  private readonly previewWebviews = new Set<vscode.WebviewPanel>();

  public constructor(private readonly extensionUri: vscode.Uri) {}

  public openCustomDocument(uri: vscode.Uri): VrmDocument {
    return new VrmDocument(uri);
  }

  public resolveCustomEditor(document: VrmDocument, panel: vscode.WebviewPanel): void {
    panel.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "dist", "webview")],
    };
    panel.webview.html = this.getHtml(panel.webview);

    const documentKey = document.uri.toString();
    this.webviews.set(documentKey, panel);

    panel.onDidDispose(() => {
      if (this.webviews.get(documentKey) === panel) {
        this.webviews.delete(documentKey);
      }
    });

    panel.webview.onDidReceiveMessage((message: ViewerMessage) => {
      if (message.type === "viewer:ready") {
        void panel.webview.postMessage({
          type: "viewer:init",
          fileName: basename(document.uri),
        } satisfies ViewerMessage);
      }
    });
  }

  public postToActiveViewer(message: ViewerMessage): void {
    for (const panel of this.webviews.values()) {
      if (panel.active) {
        void panel.webview.postMessage(message);
        return;
      }
    }

    for (const panel of this.previewWebviews) {
      if (panel.active) {
        void panel.webview.postMessage(message);
        return;
      }
    }
  }

  /** Opens the Webview shell without requiring a VRM file. */
  public openWebviewPreview(): void {
    const panel = vscode.window.createWebviewPanel(
      "vrmViewer.preview",
      "VRM Viewer Preview",
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "dist", "webview")],
      },
    );

    panel.webview.html = this.getHtml(panel.webview);
    this.previewWebviews.add(panel);

    panel.onDidDispose(() => this.previewWebviews.delete(panel));
    panel.webview.onDidReceiveMessage((message: ViewerMessage) => {
      if (message.type === "viewer:ready") {
        void panel.webview.postMessage({
          type: "viewer:init",
          fileName: "Webview Preview",
        } satisfies ViewerMessage);
      }
    });
  }

  private getHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "dist", "webview", "main.js"),
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "dist", "webview", "main.css"),
    );
    const nonce = createNonce();

    return /* html */ `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} blob: data:; script-src 'nonce-${nonce}'; style-src ${webview.cspSource}; font-src ${webview.cspSource}; connect-src 'none';" />
  <link rel="stylesheet" href="${styleUri}" />
  <title>VRM Viewer</title>
</head>
<body>
  <main class="viewer" aria-label="VRM model viewer">
    <canvas id="viewer-canvas" aria-label="VRMモデル表示領域"></canvas>
    <section class="status-card" aria-live="polite">
      <h1>Hello World</h1>
      <p id="status-message">Webview を準備しています…</p>
    </section>
  </main>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function basename(uri: vscode.Uri): string {
  const segments = uri.path.split("/");
  return segments.at(-1) ?? uri.path;
}

function createNonce(): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(
    { length: 32 },
    () => characters[Math.floor(Math.random() * characters.length)],
  ).join("");
}
