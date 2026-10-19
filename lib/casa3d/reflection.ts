/**
 * Reflejo plano para el modo videojuego (suelo pulido y agua): la escena se
 * pinta a una textura desde la cámara reflejada en un plano horizontal y el
 * material la suma a su luz con Fresnel (Schlick). La textura queda en HDR
 * lineal, igual que la escena antes del tonemapping, y el desenfoque sale de
 * sus mipmaps. La cámara reflejada recorta lo que queda bajo el plano
 * (proyección oblicua, como el Reflector de three).
 */
import * as THREE from 'three';

/**
 * Capa de lo que solo sale en los reflejos: el techo del piso, que en la
 * maqueta no se pinta (se ve desde arriba) pero sin él el suelo reflejaría el cielo.
 */
export const REFLECTION_LAYER = 1;

export interface ReflectionOptions {
  /** Altura del plano (m, mundo). */
  y: number;
  /** Reflectancia a incidencia normal (0,04 baldosa, 0,02 agua). */
  f0: number;
  /** Multiplica el reflejo. */
  strength: number;
  /** Nivel de mipmap: 0 = espejo, 2-3 = pulido satinado. */
  blur: number;
  /** Desplazamiento del reflejo por el relieve del material (ondas del agua). */
  distortion: number;
  /** En materiales transparentes, opacidad hacia 1 con el Fresnel. */
  fresnelAlpha?: boolean;
}

export interface Reflection {
  options: ReflectionOptions;
  target: THREE.WebGLRenderTarget;
  camera: THREE.PerspectiveCamera;
  uniforms: {
    tReflect: { value: THREE.Texture };
    reflectMatrix: { value: THREE.Matrix4 };
    reflectStrength: { value: number };
  };
}

export function createReflection(options: ReflectionOptions): Reflection {
  const target = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter,
  });
  const camera = new THREE.PerspectiveCamera();
  camera.layers.enable(REFLECTION_LAYER);
  return {
    options,
    target,
    camera,
    uniforms: { tReflect: { value: target.texture }, reflectMatrix: { value: new THREE.Matrix4() }, reflectStrength: { value: options.strength } },
  };
}

/** Sustituye el shader del material por uno con reflejo (queda hasta `unpatchReflection`). */
export function patchReflection(material: THREE.MeshStandardMaterial, r: Reflection) {
  const { f0, blur, distortion, fresnelAlpha } = r.options;
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, r.uniforms);
    shader.vertexShader = 'uniform mat4 reflectMatrix;\nvarying vec4 vReflectUv;\n' + shader.vertexShader.replace(
      '#include <project_vertex>',
      '#include <project_vertex>\nvReflectUv = reflectMatrix * modelMatrix * vec4( transformed, 1.0 );',
    );
    shader.fragmentShader = 'uniform sampler2D tReflect;\nuniform float reflectStrength;\nvarying vec4 vReflectUv;\n' + shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      `{
        float rF = ${f0.toFixed(3)} + ${(1 - f0).toFixed(3)} * pow( 1.0 - saturate( dot( normal, normalize( vViewPosition ) ) ), 5.0 );
        vec2 rUv = vReflectUv.xy / vReflectUv.w + ( normal.xy - nonPerturbedNormal.xy ) * ${distortion.toFixed(3)};
        outgoingLight += textureLod( tReflect, rUv, ${blur.toFixed(2)} ).rgb * rF * reflectStrength;
        ${fresnelAlpha ? 'diffuseColor.a = mix( diffuseColor.a, 1.0, rF );' : ''}
      }
      #include <opaque_fragment>`,
    );
  };
  material.customProgramCacheKey = () => `reflect-${f0}-${blur}-${distortion}-${!!fresnelAlpha}`;
  material.needsUpdate = true;
}

export function unpatchReflection(material: THREE.MeshStandardMaterial) {
  material.onBeforeCompile = THREE.Material.prototype.onBeforeCompile;
  material.customProgramCacheKey = THREE.Material.prototype.customProgramCacheKey;
  material.needsUpdate = true;
}

const BIAS = new THREE.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
const v = new THREE.Vector3(), look = new THREE.Vector3(), rot = new THREE.Quaternion();
const plane = new THREE.Plane(), clip = new THREE.Vector4(), q = new THREE.Vector4();

/**
 * Coloca la cámara reflejada y la matriz de proyección del reflejo. Devuelve
 * false si la cámara está por debajo del plano (entonces no se ve el reflejo).
 */
export function updateReflection(r: Reflection, camera: THREE.PerspectiveCamera): boolean {
  const { y } = r.options, cam = r.camera;
  camera.getWorldPosition(v);
  if (v.y <= y + 0.01) return false;
  camera.getWorldDirection(look).add(v);
  cam.position.set(v.x, 2 * y - v.y, v.z);
  cam.up.set(0, 1, 0).applyQuaternion(camera.getWorldQuaternion(rot));
  cam.up.y = -cam.up.y;
  cam.lookAt(look.x, 2 * y - look.y, look.z);
  cam.far = camera.far;
  cam.updateMatrixWorld();
  cam.projectionMatrix.copy(camera.projectionMatrix);
  r.uniforms.reflectMatrix.value.copy(BIAS).multiply(cam.projectionMatrix).multiply(cam.matrixWorldInverse);

  // Plano cercano oblicuo: recorta lo que queda por debajo del plano.
  plane.set(new THREE.Vector3(0, 1, 0), -y).applyMatrix4(cam.matrixWorldInverse);
  clip.set(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant);
  const p = cam.projectionMatrix.elements;
  q.set((Math.sign(clip.x) + p[8]) / p[0], (Math.sign(clip.y) + p[9]) / p[5], -1, (1 + p[10]) / p[14]);
  clip.multiplyScalar(2 / clip.dot(q));
  p[2] = clip.x; p[6] = clip.y; p[10] = clip.z + 1; p[14] = clip.w;
  cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
  return true;
}
