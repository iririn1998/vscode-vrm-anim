import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { VRM } from "@pixiv/three-vrm";
import type { ViewerConfig } from "../extension/messages";

export class SceneManager {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;
  readonly controls: OrbitControls;

  private readonly clock = new THREE.Clock();
  private grid?: THREE.GridHelper;
  private axes?: THREE.AxesHelper;
  private currentVrm?: VRM;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 1.3, 2.5);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.target.set(0, 1.0, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.update();

    window.addEventListener("resize", () => this.onResize());
  }

  applyConfig(config: ViewerConfig): void {
    this.scene.background = new THREE.Color(config.background);

    this.scene.children
      .filter((c) => c instanceof THREE.Light)
      .forEach((c) => this.scene.remove(c));
    const ambient = new THREE.AmbientLight(0xffffff, 0.6 * config.lightIntensity);
    const key = new THREE.DirectionalLight(0xffffff, 1.2 * config.lightIntensity);
    key.position.set(1, 2, 2);
    this.scene.add(ambient, key);

    if (this.grid) {
      this.scene.remove(this.grid);
      this.grid = undefined;
    }
    if (config.showGrid) {
      this.grid = new THREE.GridHelper(10, 20, 0x555555, 0x3a3a3a);
      this.scene.add(this.grid);
    }

    if (this.axes) {
      this.scene.remove(this.axes);
      this.axes = undefined;
    }
    if (config.showAxes) {
      this.axes = new THREE.AxesHelper(0.5);
      this.scene.add(this.axes);
    }
  }

  setVrm(vrm: VRM): void {
    if (this.currentVrm) {
      this.scene.remove(this.currentVrm.scene);
    }
    this.currentVrm = vrm;
    this.scene.add(vrm.scene);
    this.resetCamera();
  }

  /** モデル全体が収まる位置へカメラを戻す */
  resetCamera(): void {
    const vrm = this.currentVrm;
    if (!vrm) {
      return;
    }
    const box = new THREE.Box3().setFromObject(vrm.scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const height = Math.max(size.y, 0.5);
    const fitDistance = height / (2 * Math.tan((this.camera.fov * Math.PI) / 360));

    this.controls.target.copy(center);
    this.camera.position.set(center.x, center.y, center.z + fitDistance * 1.4);
    this.controls.update();
  }

  start(): void {
    this.renderer.setAnimationLoop(() => {
      const delta = this.clock.getDelta();
      this.currentVrm?.update(delta);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    });
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
