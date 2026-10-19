import { useFrame, useThree } from '@react-three/fiber';
import { Bloom, BrightnessContrast, EffectComposer, N8AO, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { useEffect, useMemo, useRef } from 'react';
import {
  Color, Mesh, PMREMGenerator, Scene, ShapeGeometry, SphereGeometry, SRGBColorSpace, type Material, type Object3D, type WebGLRenderTarget,
} from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { addMetricUV1, planShape, rectPoints, setPlanarUV } from '@/lib/casa3d/geometry';
import type { Materials } from '@/lib/casa3d/materials';
import { LEVELS } from '@/lib/casa3d/parcel';
import { applyPbr, disposePbr, loadPbr, pbrMaterials, type PbrSet } from '@/lib/casa3d/pbr';
import { GROUND, GROUND_RECT, TERRAIN_HALF } from '@/lib/casa3d/plan';
import { applyQuality, createQuality, disposeQuality, setReflections, type Quality } from '@/lib/casa3d/quality';
import { lerpHex, type SunState } from '@/lib/casa3d/sun';
import { OX, OZ, S } from '@/lib/casa3d/units';
import { useMaterials } from './MaterialsContext';
import { Reflections } from './Reflections';

/** El cielo de three emite mucho: se atenúa para que no blanquee la imagen a mediodía. */
const SKY_GAIN = 0.55;

/**
 * Cielo atmosférico (Sky de three) en una esfera, por debajo del plano lejano,
 * con nubes escasas y tenues y su brillo atenuado.
 */
function makeSky(radius: number, sunDisc = true) {
  const box = new Sky();
  box.geometry.dispose();
  const material = box.material;
  material.uniforms.skyGain = { value: SKY_GAIN };
  material.fragmentShader = 'uniform float skyGain;\n' + material.fragmentShader
    .replace('gl_FragColor = vec4( texColor, 1.0 );', 'gl_FragColor = vec4( texColor * skyGain, 1.0 );');
  const sky = new Mesh(new SphereGeometry(1, 32, 16), material);
  sky.scale.setScalar(radius);
  sky.frustumCulled = false;
  const u = material.uniforms;
  u.turbidity.value = 4;
  u.rayleigh.value = 1.2;
  u.mieCoefficient.value = 0.004;
  u.mieDirectionalG.value = 0.8;
  u.cloudCoverage.value = 0.18;
  u.cloudDensity.value = 0.25;
  u.showSunDisc.value = sunDisc ? 1 : 0;
  return sky;
}

/** Exposición de la cámara: más baja con el sol alto, más alta al amanecer, al atardecer y de noche. */
const exposureFor = (sun: SunState) => 1.15 - 0.3 * sun.k;

/** Bruma a lo lejos: color del horizonte de día y de noche (hex sRGB) y distancias (m). */
const FOG = { day: 0xc9d4de, night: 0x10141c, near: 30, far: 110 };

/** Cielo visible: sigue a la cámara y sus nubes se desplazan despacio. */
function SkyDome({ sun }: { sun: SunState }) {
  const sky = useMemo(() => makeSky(100), []);
  useEffect(() => { sky.material.uniforms.sunPosition.value.set(...sun.dir); }, [sky, sun]);
  useEffect(() => () => { sky.geometry.dispose(); sky.material.dispose(); }, [sky]);
  useFrame(({ camera, clock }) => {
    sky.position.copy(camera.position);
    sky.material.uniforms.time.value = clock.elapsedTime;
  });
  return <primitive object={sky} />;
}

/**
 * Campo seco hasta el horizonte alrededor del terreno de 44 m (con su hueco),
 * con su mismo material y el mismo mapeado: las texturas siguen sin corte.
 */
function Terrain() {
  const m = useMaterials();
  const geometry = useMemo(() => {
    const half = GROUND.size / 2;
    const [cx, cz] = [OX + GROUND.position[0] * S, OZ + GROUND.position[2] * S], big = TERRAIN_HALF * S;
    const outer = [cx - big, cz - big, cx + big, cz + big] as const;
    return setPlanarUV(
      new ShapeGeometry(planShape(rectPoints(outer), [rectPoints(GROUND_RECT)])),
      GROUND.position[0] - half, -GROUND.position[2] - half, GROUND.size,
    );
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} material={m.ground} rotation-x={-Math.PI / 2}
      position-y={LEVELS.outside + GROUND.position[1]} receiveShadow />
  );
}

/** UV en metros (canal 1) para las geometrías que llevan textura fotografiada. */
function addPbrUVs(scene: Object3D, materials: Materials) {
  const pbr = pbrMaterials(materials);
  const uses = (m: Material | Material[]) => (Array.isArray(m) ? m : [m]).some(x => pbr.has(x));
  scene.traverse(o => { if (o instanceof Mesh && uses(o.material)) addMetricUV1(o.geometry); });
}

/**
 * Modo videojuego: texturas fotografiadas (madera, telas, yeso, césped,
 * pavimentos, asfalto), barniz en la pintura del coche y la moto, brillo de
 * tela, reflejo del cielo en los que lo llevan, reflejos planos en el suelo y
 * la piscina, cielo con nubes, campo hasta el horizonte con bruma, agua con
 * ondas y posprocesado (oclusión ambiental, bloom suave, tonemapping neutro
 * con exposición según el sol, antialiasing y viñeta). Apagado, la escena
 * queda como el original.
 */
export function GameMode({ on, sun }: { on: boolean; sun: SunState }) {
  const materials = useMaterials();
  const gl = useThree(s => s.gl);
  const scene = useThree(s => s.scene);
  const quality = useRef<Quality | null>(null);
  const pbr = useRef<Promise<PbrSet> | null>(null);
  const envTarget = useRef<WebGLRenderTarget | null>(null);
  // Cielo sin disco solar para los reflejos (el sol ya lo pone la luz direccional)
  const env = useMemo(() => {
    const sky = makeSky(10, false), scene = new Scene();
    scene.add(sky);
    return { pmrem: new PMREMGenerator(gl), sky, scene };
  }, [gl]);
  const fogColor = useMemo(() => new Color().setRGB(...lerpHex(FOG.night, FOG.day, sun.kd), SRGBColorSpace), [sun.kd]);

  // Al activar: relieves generados al momento y, en cuanto se descargan, las
  // texturas fotografiadas. Al desactivar se deshace en orden inverso.
  useEffect(() => {
    if (!on) return;
    const anisotropy = gl.capabilities.getMaxAnisotropy();
    const q = quality.current ??= createQuality(materials, anisotropy);
    applyQuality(materials, q, true);
    addPbrUVs(scene, materials);
    let live = true, set: PbrSet | null = null;
    (pbr.current ??= loadPbr(materials, anisotropy)).then(s => {
      if (!live) return;
      set = s;
      applyPbr(s, true);
      addPbrUVs(scene, materials);
    }).catch(e => console.warn('Texturas del modo videojuego no disponibles', e));
    return () => {
      live = false;
      if (set) applyPbr(set, false);
      applyQuality(materials, q, false);
    };
  }, [on, materials, gl, scene]);

  // Reflejos: se regeneran del cielo cada vez que se mueve el sol.
  useEffect(() => {
    if (!on) { setReflections(materials, null); return; }
    env.sky.material.uniforms.sunPosition.value.set(...sun.dir);
    const rt = env.pmrem.fromScene(env.scene, 0, 0.1, 100);
    setReflections(materials, rt.texture);
    envTarget.current?.dispose();
    envTarget.current = rt;
  }, [on, sun, env, materials]);

  useEffect(() => {
    if (!on) return;
    const prev = gl.toneMappingExposure;
    gl.toneMappingExposure = exposureFor(sun);
    return () => { gl.toneMappingExposure = prev; };
  }, [on, sun, gl]);

  useEffect(() => () => {
    pbr.current?.then(disposePbr, () => {});
    setReflections(materials, null);
    envTarget.current?.dispose();
    env.pmrem.dispose();
    env.sky.geometry.dispose();
    env.sky.material.dispose();
    if (!quality.current) return;
    applyQuality(materials, quality.current, false);
    disposeQuality(quality.current);
    quality.current = null;
  }, [materials, env]);

  // Ondas de la piscina
  useFrame((_, dt) => {
    const w = quality.current?.water;
    if (on && w) { w.offset.x += dt * 0.03; w.offset.y += dt * 0.017; }
  });

  if (!on) return null;
  return (
    <>
      <fog attach="fog" args={[fogColor, FOG.near, FOG.far]} />
      <SkyDome sun={sun} />
      <Terrain />
      <Reflections />
      <EffectComposer multisampling={0}>
        <N8AO halfRes quality="medium" aoRadius={1} distanceFalloff={1} intensity={2} />
        <Bloom mipmapBlur luminanceThreshold={2.5} luminanceSmoothing={0.3} intensity={0.4} />
        <ToneMapping mode={ToneMappingMode.NEUTRAL} />
        <BrightnessContrast contrast={0.06} />
        <SMAA />
        <Vignette offset={0.3} darkness={0.25} />
      </EffectComposer>
    </>
  );
}
