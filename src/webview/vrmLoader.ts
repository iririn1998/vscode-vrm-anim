import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRM, VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import type { VrmMeta } from "../extension/messages";

export type LoadedVrm = {
  vrm: VRM;
  meta: VrmMeta;
};

export async function loadVrm(buffer: ArrayBuffer): Promise<LoadedVrm> {
  const loader = new GLTFLoader();
  loader.register((parser) => new VRMLoaderPlugin(parser));

  const gltf = await loader.parseAsync(buffer, "");
  const vrm = gltf.userData.vrm as VRM | undefined;
  if (!vrm) {
    throw new VrmParseError("このファイルにはVRM拡張が含まれていません。");
  }

  // VRM 0.xモデルは-Z向きのため、+Z(カメラ側)へ回転して差異を吸収する
  VRMUtils.rotateVRM0(vrm);
  VRMUtils.removeUnnecessaryVertices(gltf.scene);
  VRMUtils.combineSkeletons(gltf.scene);

  return { vrm, meta: extractMeta(vrm) };
}

export class VrmParseError extends Error {}

function extractMeta(vrm: VRM): VrmMeta {
  const meta = vrm.meta;
  if (meta.metaVersion === "1") {
    return {
      name: meta.name,
      authors: meta.authors?.join(", "),
      version: "1.0",
      license: meta.licenseUrl,
    };
  }
  return {
    name: meta.title,
    authors: meta.author,
    version: "0.x",
    license: meta.licenseName,
  };
}
