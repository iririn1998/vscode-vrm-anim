import { defineConfig } from "tsdown";

const bundledWebviewDependencies = [/^three(\/.*)?$/, /^@pixiv\/three-vrm(\/.*)?$/];

export default defineConfig([
  {
    name: "extension",
    entry: {
      extension: "src/extension/extension.ts",
    },
    outDir: "dist",
    platform: "node",
    format: "cjs",
    target: "es2022",
    fixedExtension: false,
    hash: false,
    deps: {
      neverBundle: ["vscode"],
    },
    outputOptions: {
      entryFileNames: "extension.js",
    },
  },
  {
    name: "webview",
    entry: {
      main: "src/webview/main.ts",
    },
    outDir: "dist/webview",
    platform: "browser",
    format: "iife",
    globalName: "VrmViewerWebview",
    target: "es2022",
    hash: false,
    deps: {
      alwaysBundle: bundledWebviewDependencies,
      onlyBundle: false,
    },
    css: {
      fileName: "main.css",
      splitting: false,
    },
    outputOptions: {
      entryFileNames: "main.js",
    },
  },
]);
