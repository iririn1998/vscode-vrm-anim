import * as vscode from "vscode";

import { VrmEditorProvider } from "./vrmEditorProvider";

export function activate(context: vscode.ExtensionContext): void {
  const provider = new VrmEditorProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(VrmEditorProvider.viewType, provider, {
      webviewOptions: { retainContextWhenHidden: false },
      supportsMultipleEditorsPerDocument: false,
    }),
    vscode.commands.registerCommand(
      "vrmViewer.openPreview",
      async (uri?: vscode.Uri) => {
        const target = uri ?? vscode.window.activeTextEditor?.document.uri;

        if (!target || !target.path.toLowerCase().endsWith(".vrm")) {
          void vscode.window.showWarningMessage("VRMファイル(.vrm)を選択してください。");
          return;
        }

        await vscode.commands.executeCommand(
          "vscode.openWith",
          target,
          VrmEditorProvider.viewType,
        );
      },
    ),
    vscode.commands.registerCommand("vrmViewer.resetCamera", () => {
      provider.postToActiveViewer({ type: "viewer:resetCamera" });
    }),
    vscode.commands.registerCommand("vrmViewer.openWebviewPreview", () => {
      provider.openWebviewPreview();
    }),
  );
}

export function deactivate(): void {}
