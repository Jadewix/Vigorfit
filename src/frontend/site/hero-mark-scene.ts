import {
  Box3,
  CanvasTexture,
  DirectionalLight,
  EquirectangularReflectionMapping,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  NeutralToneMapping,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";
import { STLLoader } from "three/addons/loaders/STLLoader.js";

/**
 * The three.js half of HeroMark: one mesh, a camera and the lights, and
 * nothing that knows about scrolling. The component owns the angle and asks
 * for a frame; this module only draws the one it is given.
 *
 * It is its own module so that the component can load it with `import()`.
 * three.js is the heaviest thing on the landing page by far, and this way it
 * arrives after the page is up rather than in front of the headline.
 */
export type MarkScene = {
  /** Draw one frame with the mark turned `yaw` radians about its upright. */
  draw(yaw: number): void;
  /** Match the drawing buffer to the canvas's current CSS box. */
  resize(): void;
  dispose(): void;
};

/**
 * The logo red — `--logo-red` in globals.css, kept in step by hand. The
 * user's call, over a deeper #9c0a2c that sat quieter behind the headline:
 * it is the mark, so it wears the mark's colour.
 */
const LOGO_RED = "#e30241";

/**
 * @param stl The studio's STL, exactly as supplied — public/hero-mark.stl.
 */
export function createMarkScene(canvas: HTMLCanvasElement, stl: ArrayBuffer): MarkScene {
  // Throws where WebGL is unavailable. The caller treats that as "no mark",
  // which for a decoration behind the headline is the right failure.
  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setClearColor(0x000000, 0);
  // three prints the driver's shader log whenever it is non-empty, and ANGLE
  // on Windows fills it with harmless precision warnings, which would land in
  // every Windows visitor's console. Kept on in development, where a real
  // compile error has to be seen.
  renderer.debug.checkShaderErrors = process.env.NODE_ENV !== "production";
  renderer.outputColorSpace = SRGBColorSpace;
  // Neutral rather than ACES: ACES pulls a saturated red toward orange in
  // its highlights, and the one thing this object must be is the logo red.
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new Scene();

  const pmrem = new PMREMGenerator(renderer);
  const studio = studioTexture();
  const environment = pmrem.fromEquirectangular(studio).texture;
  studio.dispose();
  pmrem.dispose();
  scene.environment = environment;

  // Key from the upper left, as the hero's ground light suggests; a sage rim
  // from behind so the edge still reads when the face turns away; a weak
  // fill so the side walls never go fully black at the quarter turn.
  const key = new DirectionalLight(0xfff4ec, 2.4);
  key.position.set(-3, 4, 5);
  const rim = new DirectionalLight(0x97b08c, 3.2);
  rim.position.set(4, 1.5, -4);
  const fill = new DirectionalLight(0xdfe8d8, 0.5);
  fill.position.set(3, -1, 4);
  scene.add(key, rim, fill);

  // The file's own triangles and the file's own face normals, untouched:
  // nothing is welded, rounded or re-shaded.
  const geometry = new STLLoader().parse(stl);
  const material = new MeshPhysicalMaterial({
    // Front side, the default, because this STL faces outward (its signed
    // volume is positive). The previous file was inside-out and needed
    // BackSide; if a replacement ever renders as a hollow mould of the logo,
    // check the sign of its volume before anything else.
    color: LOGO_RED,
    roughness: 0.55,
    metalness: 0,
    // A lacquer coat over the red: the coat takes the environment's hard
    // panels as highlights while the red underneath stays red, where a
    // single glossy layer washes the whole face toward white at grazing
    // angles.
    clearcoat: 0.35,
    clearcoatRoughness: 0.45,
    envMapIntensity: 1.1,
  });
  const mark = new Mesh(geometry, material);

  // Fit the model to the camera with the mesh's transform rather than by
  // editing its vertices: centred on the origin, longest half-side 1 unit.
  // The STL is in whatever units it was exported in; the scene is framed for 2.
  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox ?? new Box3();
  const size = bounds.getSize(new Vector3());
  const scale = 2 / Math.max(size.x, size.y, size.z);
  mark.scale.setScalar(scale);
  mark.position.copy(bounds.getCenter(new Vector3())).multiplyScalar(-scale);

  // Two levels: the mark turns about its own upright inside `spin`, and the
  // camera sits a little above so the top edge shows as it turns.
  const spin = new Group();
  spin.add(mark);
  scene.add(spin);

  const camera = new PerspectiveCamera(22, 1, 0.1, 50);
  camera.position.set(0, 0.7, 6.4);
  camera.lookAt(0, 0, 0);

  return {
    draw(yaw) {
      spin.rotation.y = yaw;
      renderer.render(scene, camera);
    },
    resize() {
      const w = Math.max(canvas.clientWidth, 1);
      const h = Math.max(canvas.clientHeight, 1);
      // Capped at 2: a third device pixel on a phone buys nothing on an
      // object drawn behind the type at a fifth of its strength.
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      environment.dispose();
      // Not forceContextLoss(): in development React mounts effects twice on
      // the same canvas, and a lost context would leave the second mount
      // drawing into nothing.
      renderer.dispose();
    },
  };
}

/**
 * The reflections: a dark studio with hard-edged bright panels, drawn to a
 * canvas rather than shipped as an HDR. The same recipe as the dumbbell's
 * render (scripts/hero-dumbbell/), for the same reason — a gloss only reads
 * as gloss when it has sharp things to reflect against a mostly dark room.
 */
function studioTexture(): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const g = c.getContext("2d")!;

  const sky = g.createLinearGradient(0, 0, 0, 512);
  sky.addColorStop(0, "#2b332a");
  sky.addColorStop(0.48, "#131a13");
  sky.addColorStop(0.52, "#0b100c");
  sky.addColorStop(1, "#040604");
  g.fillStyle = sky;
  g.fillRect(0, 0, 1024, 512);

  const panel = (x: number, y: number, w: number, h: number, colour: string) => {
    g.save();
    g.filter = "blur(6px)";
    g.fillStyle = colour;
    g.fillRect(x, y, w, h);
    g.restore();
  };
  panel(150, 40, 420, 120, "#ffffff"); // key panel, upper left
  panel(700, 70, 120, 300, "#eef3e8"); // tall side panel
  panel(880, 150, 46, 190, "#97b08c"); // sage kicker, the brand colour
  panel(0, 250, 1024, 8, "#7f8f78"); // horizon line

  const texture = new CanvasTexture(c);
  texture.mapping = EquirectangularReflectionMapping;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
