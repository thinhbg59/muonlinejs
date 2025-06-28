import { UniversalCamera, HighlightLayer } from '../libs/babylon/exports';
import {
  Color3,
  Color4,
  DirectionalLight,
  Engine,
  HemisphericLight,
  PointerEventTypes,
  Scene,
  Vector3,
} from '../libs/babylon/exports';
import { addInspectorForScene } from '../libs/babylon/utils';
import { EventBus } from '../libs/eventBus';

const CLICK_TO_MOVE_MAX_TIME_DELTA = 150;

export class TestScene extends Scene {
  defaultCamera: UniversalCamera;

  readonly hl: HighlightLayer;

  constructor(engine: Engine) {
    super(engine);

    const camera = new UniversalCamera(
      'UniversalCamera',
      new Vector3(0, 10, 0),
      this
    );

    this.hl = new HighlightLayer('hl1', this, {
      isStroke: true,
      alphaBlendingMode: 1,
    });

    this.hl.innerGlow = false;

    camera.rotation.y = -Math.PI / 4;
    camera.rotation.x = Math.PI / 4.5; // vertical

    camera.speed = 0.2;
    camera.angularSensibility = 4000;
    camera.minZ = 0.1;
    camera.maxZ = 5000;
    camera.position.set(135, 10, 130);

    camera.attachControl();

    this.fogEnabled = false;
    this.fogStart = 1;
    this.fogEnd = 25;

    camera.keysUp.push(87);
    camera.keysLeft.push(65);
    camera.keysDown.push(83);
    camera.keysRight.push(68);

    this.defaultCamera = camera;

    this.skipFrustumClipping = true;

    this.autoClearDepthAndStencil = true;
    this.autoClear = true;

    this.clearColor = new Color4(0, 0, 0, 1);
    this.ambientColor = new Color3(1, 1, 1);

    addInspectorForScene(this);

    const light2 = new DirectionalLight(
      'DirectionalLight2',
      new Vector3(0, 1, -2),
      this
    );
    light2.intensity = 3;

    const light3 = new HemisphericLight('light', new Vector3(0, 1, 0), this);
    light3.intensity = 1;

    let time = 0;

    this.onPointerObservable.add(ev => {
      if (ev.type === PointerEventTypes.POINTERDOWN) {
        time = Date.now();
      }
      if (ev.type === PointerEventTypes.POINTERUP) {
        const diff = Date.now() - time;

        if (ev.pickInfo) {
          const point = ev.pickInfo.pickedPoint;

          if (
            point &&
            ev.pickInfo.pickedMesh?.metadata?.terrain &&
            diff < CLICK_TO_MOVE_MAX_TIME_DELTA
          ) {
            EventBus.emit('groundPointClicked', { point });
          }
        }
      }
    });
  }
}
