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
export class VrmEditorProvider
  implements vscode.CustomReadonlyEditorProvider<VrmDocument>, vscode.WebviewViewProvider
{
  public static readonly viewType = "vrmViewer.viewer";
  public static readonly sidebarViewType = "vrmViewer.sidebar";

  private readonly webviews = new Map<string, vscode.WebviewPanel>();
  private sidebarWebview: vscode.Webview | undefined;

  public constructor(private readonly extensionUri: vscode.Uri) {}

  public openCustomDocument(uri: vscode.Uri): VrmDocument {
    return new VrmDocument(uri);
  }

  public resolveCustomEditor(document: VrmDocument, panel: vscode.WebviewPanel): void {
    this.configureWebview(panel.webview);

    const documentKey = document.uri.toString();
    this.webviews.set(documentKey, panel);

    panel.onDidDispose(() => {
      if (this.webviews.get(documentKey) === panel) {
        this.webviews.delete(documentKey);
      }
    });

    this.registerMessageHandler(panel.webview, basename(document.uri));
  }

  public resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.configureWebview(webviewView.webview);
    this.sidebarWebview = webviewView.webview;
    this.registerMessageHandler(webviewView.webview, "VRM Viewer");

    webviewView.onDidDispose(() => {
      if (this.sidebarWebview === webviewView.webview) {
        this.sidebarWebview = undefined;
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

    if (this.sidebarWebview) {
      void this.sidebarWebview.postMessage(message);
    }
  }

  private configureWebview(webview: vscode.Webview): void {
    webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "dist", "webview")],
    };
    webview.html = this.getHtml(webview);
  }

  private registerMessageHandler(webview: vscode.Webview, fileName: string): void {
    webview.onDidReceiveMessage((message: ViewerMessage) => {
      if (message.type === "viewer:ready") {
        void webview.postMessage({
          type: "viewer:init",
          fileName,
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
