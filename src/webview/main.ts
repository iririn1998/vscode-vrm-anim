declare const acquireVsCodeApi: () => {
  postMessage(message: { type: string }): void;
};

const vscode = acquireVsCodeApi();
const statusMessage = document.querySelector<HTMLParagraphElement>("#status-message");

window.addEventListener("message", (event: MessageEvent<{ type: string; fileName?: string }>) => {
  const message = event.data;

  if (message.type === "viewer:init" && message.fileName && statusMessage) {
    statusMessage.textContent = "Hello World";
  }

  if (message.type === "viewer:resetCamera" && statusMessage) {
    statusMessage.textContent = "カメラのリセットは3Dビューア実装後に利用できます。";
  }
});

vscode.postMessage({ type: "viewer:ready" });
