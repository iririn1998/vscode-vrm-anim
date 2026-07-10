import "./style.css";
import type { SerializedError, ToExtension, ToWebview, VrmMeta } from "../extension/messages";
import { SceneManager } from "./sceneManager";
import { loadVrm } from "./vrmLoader";

declare function acquireVsCodeApi(): {
  postMessage(message: ToExtension): void;
  setState(state: unknown): void;
  getState(): unknown;
};

const vscode = acquireVsCodeApi();

const canvas = document.getElementById("viewer-canvas") as HTMLCanvasElement;
const overlay = document.getElementById("overlay") as HTMLDivElement;
const overlayMessage = document.getElementById("overlay-message") as HTMLDivElement;
const overlayProgress = document.getElementById("overlay-progress") as HTMLDivElement;
const overlayDetailWrap = document.getElementById("overlay-detail-wrap") as HTMLDetailsElement;
const overlayDetail = document.getElementById("overlay-detail") as HTMLPreElement;
const metaPanel = document.getElementById("meta-panel") as HTMLDivElement;

type Transfer = {
  transferId: string;
  fileName: string;
  sizeBytes: number;
  chunkCount: number;
  received: number;
  bytes: Uint8Array;
  offset: number;
};

let sceneManager: SceneManager | undefined;
let transfer: Transfer | undefined;

function showLoading(message: string, progress = ""): void {
  overlay.hidden = false;
  overlay.classList.remove("error");
  overlayMessage.textContent = message;
  overlayProgress.textContent = progress;
  overlayDetailWrap.hidden = true;
}

function showError(error: SerializedError): void {
  overlay.hidden = false;
  overlay.classList.add("error");
  overlayMessage.textContent = error.message;
  overlayProgress.textContent = "";
  if (error.detail) {
    overlayDetailWrap.hidden = false;
    overlayDetail.textContent = error.detail;
  } else {
    overlayDetailWrap.hidden = true;
  }
}

function hideOverlay(): void {
  overlay.hidden = true;
}

function reportError(error: SerializedError): void {
  showError(error);
  vscode.postMessage({ type: "viewer:error", error });
}

function showMeta(meta: VrmMeta, fileName: string): void {
  metaPanel.hidden = false;
  metaPanel.textContent = "";
  const rows: [string, string | undefined][] = [
    ["ファイル", fileName],
    ["名前", meta.name],
    ["作者", meta.authors],
    ["VRM", meta.version],
    ["ライセンス", meta.license],
  ];
  for (const [label, value] of rows) {
    if (!value) {
      continue;
    }
    const row = document.createElement("div");
    row.className = "meta-row";
    const labelEl = document.createElement("span");
    labelEl.className = "meta-label";
    labelEl.textContent = label;
    const valueEl = document.createElement("span");
    valueEl.textContent = value; // textContentのみ使用(XSS対策: 仕様書R8)
    row.append(labelEl, valueEl);
    metaPanel.append(row);
  }
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function isWebGLAvailable(): boolean {
  try {
    const testCanvas = document.createElement("canvas");
    return !!(testCanvas.getContext("webgl2") ?? testCanvas.getContext("webgl"));
  } catch {
    return false;
  }
}

async function onTransferComplete(t: Transfer): Promise<void> {
  if (t.offset !== t.sizeBytes) {
    reportError({
      code: "io_error",
      message: "モデルデータの転送が不完全です。タブを開き直してください。",
      detail: `received ${t.offset} / ${t.sizeBytes} bytes`,
    });
    return;
  }
  showLoading("モデルを解析中…");
  vscode.postMessage({ type: "viewer:binaryReceived", transferId: t.transferId });

  // ArrayBufferへ復元し、転送用参照を破棄(仕様書 §4.3)
  const buffer = t.bytes.buffer as ArrayBuffer;
  transfer = undefined;

  try {
    const { vrm, meta } = await loadVrm(buffer);
    sceneManager!.setVrm(vrm);
    hideOverlay();
    showMeta(meta, t.fileName);
    vscode.postMessage({ type: "viewer:modelLoaded", meta });
  } catch (e) {
    reportError({
      code: "invalid_vrm",
      message: "VRMモデルを読み込めませんでした。ファイルが破損しているか、非対応の形式です。",
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}

function onMessage(message: ToWebview): void {
  switch (message.type) {
    case "viewer:init": {
      transfer = {
        transferId: message.model.transferId,
        fileName: message.model.fileName,
        sizeBytes: message.model.sizeBytes,
        chunkCount: message.model.chunkCount,
        received: 0,
        bytes: new Uint8Array(message.model.sizeBytes),
        offset: 0,
      };
      sceneManager!.applyConfig(message.config);
      showLoading("モデルを転送中…", "0%");
      break;
    }
    case "viewer:binaryChunk": {
      if (!transfer || transfer.transferId !== message.transferId) {
        return;
      }
      const chunk = base64ToBytes(message.base64);
      transfer.bytes.set(chunk, transfer.offset);
      transfer.offset += chunk.length;
      transfer.received++;
      const percent = Math.floor((transfer.received / transfer.chunkCount) * 100);
      overlayProgress.textContent = `${percent}%`;
      break;
    }
    case "viewer:binaryEnd": {
      if (!transfer || transfer.transferId !== message.transferId) {
        return;
      }
      void onTransferComplete(transfer);
      break;
    }
    case "viewer:resetCamera":
      sceneManager?.resetCamera();
      break;
    case "viewer:showError":
      showError(message.error);
      break;
  }
}

function main(): void {
  if (!isWebGLAvailable()) {
    reportError({
      code: "webgl_unavailable",
      message:
        "WebGLが利用できないため、モデルを表示できません。GPUアクセラレーションの設定、またはリモート/仮想環境の制約を確認してください。",
    });
    return;
  }

  sceneManager = new SceneManager(canvas);
  sceneManager.start();

  canvas.addEventListener("dblclick", () => sceneManager?.resetCamera());

  window.addEventListener("message", (event: MessageEvent<ToWebview>) => onMessage(event.data));
  showLoading("読み込み中…");
  vscode.postMessage({ type: "viewer:ready" });
}

main();
