import * as vscode from "vscode";

export class VrmDocument implements vscode.CustomDocument {
  constructor(public readonly uri: vscode.Uri) {}

  dispose(): void {
    // alphaでは保持リソースなし
  }
}
