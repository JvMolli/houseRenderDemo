/**
 * Figuras articuladas: cada segmento (muslo, brazo, cabeza...) cuelga de su
 * articulación, así una postura son solo giros y las animaciones los cambian
 * en cada frame. Las figuras miran a +X; un segmento que cuelga gira hacia
 * delante con ángulo positivo en Z, y uno que sube (tronco, cabeza) se echa
 * hacia atrás con ángulo positivo.
 */
import * as THREE from 'three';
import type { Pose } from './parcel';
import type { PersonSpec } from './parcelShapes';

/** Medidas del cuerpo (m). */
export const BODY = { thigh: 0.42, shin: 0.42, upperArm: 0.28, forearm: 0.27, neck: 0.52, shoulder: 0.44, shoulderW: 0.2, hipW: 0.1 };

export type JointName =
  | 'body' | 'spine' | 'head' | 'shoulderL' | 'shoulderR' | 'elbowL' | 'elbowR' | 'handR' | 'hipL' | 'hipR' | 'kneeL' | 'kneeR';
export type Joints = Partial<Record<JointName, THREE.Object3D>>;
type Rot = [number, number, number];

/** Postura de reposo: altura de las caderas, inclinación del cuerpo y giros de las articulaciones. */
export interface Rest { hipY: number; tilt: number; rot: Partial<Record<JointName, Rot>> }

export const REST: Record<Pose, Rest> = {
  standing: { hipY: 0.92, tilt: 0, rot: { head: [0, 0, -0.35], shoulderL: [0, 0, 0.5], elbowL: [0, 0, 0.9], shoulderR: [0, 0, 0.6], elbowR: [0, 0, 0.9] } },
  sitting: {
    hipY: 0.52, tilt: 0,
    rot: { spine: [0, 0, 0.08], hipL: [0, 0, Math.PI / 2], hipR: [0, 0, Math.PI / 2], kneeL: [0, 0, -Math.PI / 2], kneeR: [0, 0, -Math.PI / 2],
      shoulderR: [0, 0, 0.35], elbowR: [0, 0, 1.75], shoulderL: [0, 0, 0.3], elbowL: [0, 0, 0.9] },
  },
  // Boca arriba: el cuerpo se tumba con la cabeza hacia -X (la figura se gira luego 180°).
  lying: { hipY: 0.46, tilt: Math.PI / 2, rot: { head: [0, 0, 0.15] } },
  // Braza: casi horizontal boca abajo, cabeza levantada para respirar.
  swimming: { hipY: -0.15, tilt: -1.25, rot: { head: [0, 0, 0.9] } },
};

/** Geometrías compartidas por todas las figuras (crear una vez, liberar al desmontar). */
export function createPersonGeometries() {
  const cap = (r: number, len: number) => new THREE.CapsuleGeometry(r, len, 4, 10);
  const hang = (r: number, len: number) => cap(r, len - 2 * r * 0.6).translate(0, -len / 2, 0);
  return {
    pelvis: cap(0.11, 0.2).rotateX(Math.PI / 2),
    torso: cap(0.15, 0.22).scale(0.65, 1, 1.1).translate(0, 0.24, 0),
    neck: cap(0.05, 0.06).translate(0, 0.5, 0),
    head: new THREE.SphereGeometry(0.11, 16, 12).translate(0, 0.1, 0),
    hair: new THREE.SphereGeometry(0.118, 16, 12).scale(1, 0.85, 1).translate(-0.02, 0.125, 0),
    longHair: cap(0.085, 0.12).scale(1, 1, 1.3).translate(-0.09, 0.01, 0),
    upperArm: hang(0.05, BODY.upperArm),
    forearm: hang(0.04, BODY.forearm),
    thigh: hang(0.075, BODY.thigh),
    shin: hang(0.055, BODY.shin),
    foot: cap(0.045, 0.1).rotateZ(Math.PI / 2).translate(0.07, -0.03, 0),
    glass: new THREE.CylinderGeometry(0.035, 0.035, 0.12, 12).translate(0, 0.06, 0),
    mint: new THREE.SphereGeometry(0.025, 8, 6).translate(0, 0.12, 0),
    straw: new THREE.CylinderGeometry(0.004, 0.004, 0.1, 6).rotateZ(-0.25).translate(0.012, 0.14, 0),
    spatulaHandle: new THREE.CylinderGeometry(0.01, 0.01, 0.24, 6).translate(0, -0.12, 0),
    spatulaBlade: new THREE.BoxGeometry(0.09, 0.12, 0.01).translate(0, -0.29, 0),
  };
}
export type PersonGeometries = ReturnType<typeof createPersonGeometries>;

const smooth = (x: number) => x * x * (3 - 2 * x);
/** 0 → 1 → 0 suave durante `len` s cada `period` s. */
function pulse(t: number, period: number, len: number) {
  const u = ((t % period) + period) % period;
  if (u > len) return 0;
  return smooth(Math.sin(Math.PI * u / len) ** 2);
}

function setRot(o: THREE.Object3D | undefined, base: Rot | undefined, dx = 0, dy = 0, dz = 0) {
  if (!o) return;
  const [x, y, z] = base ?? [0, 0, 0];
  o.rotation.set(x + dx, y + dy, z + dz);
}

/** Mueve una figura en el instante t (s). `root` es el grupo con posición y giro. */
export function animatePerson(p: PersonSpec, root: THREE.Object3D, j: Joints, time: number) {
  const t = time + p.phase, r = REST[p.pose].rot;
  switch (p.activity) {
    case 'grill': {
      // Da la vuelta a la comida con la espátula y de vez en cuando mira al patio.
      const flip = Math.sin(t * 3);
      setRot(j.shoulderR, r.shoulderR, 0, 0, 0.2 * flip);
      setRot(j.elbowR, r.elbowR, 0, 0, 0.35 * Math.sin(t * 3 + 0.8));
      const look = pulse(t, 9, 3);
      setRot(j.head, r.head, 0, 0.9 * look, 0.35 * look);
      setRot(j.spine, r.spine, 0.03 * Math.sin(t * 1.5), 0.15 * look, 0);
      break;
    }
    case 'sunbathe': {
      // Respira y mece la rodilla doblada.
      setRot(j.spine, r.spine, 0, 0, 0.015 * Math.sin(t * 1.6));
      setRot(j.hipR, r.hipR, 0.12 * Math.sin(t * 0.7) - 0.05, 0, 0.6);
      setRot(j.kneeR, r.kneeR, 0, 0, -1.2);
      setRot(j.head, r.head, 0, 0.25 * Math.sin(t * 0.25), 0);
      break;
    }
    case 'sunbatheArm': {
      // Gira la cabeza hacia la piscina y de vez en cuando se lleva la mano a la cara.
      setRot(j.spine, r.spine, 0, 0, 0.015 * Math.sin(t * 1.4));
      setRot(j.head, r.head, 0, 0.5 * Math.sin(t * 0.3), 0);
      const raise = pulse(t, 8, 3);
      setRot(j.shoulderR, r.shoulderR, 0, 0, 2.4 * raise);
      setRot(j.elbowR, r.elbowR, 0, 0, 1.9 * raise);
      break;
    }
    case 'swim': {
      // Braza dando vueltas a la piscina.
      if (p.lap) {
        const R = (p.lap.rx + p.lap.rz) / 2, w = 0.45 / R, a = t * w;
        const x = p.lap.center[0] + p.lap.rx * Math.cos(a), z = p.lap.center[1] + p.lap.rz * Math.sin(a);
        const dx = -p.lap.rx * Math.sin(a), dz = p.lap.rz * Math.cos(a);
        root.position.set(x, p.position[1] + 0.03 * Math.sin(t * 4.2), z);
        root.rotation.y = Math.atan2(-dz, dx);
      }
      const c = t * 4.2, sweep = 0.5 + 0.5 * Math.sin(c);
      setRot(j.shoulderL, r.shoulderL, 0.2 + 0.8 * sweep, 0, 2.9 - 1.1 * sweep);
      setRot(j.shoulderR, r.shoulderR, -0.2 - 0.8 * sweep, 0, 2.9 - 1.1 * sweep);
      setRot(j.elbowL, r.elbowL, 0, 0, 0.9 * sweep);
      setRot(j.elbowR, r.elbowR, 0, 0, 0.9 * sweep);
      const kick = 0.5 + 0.5 * Math.sin(c + 2);
      setRot(j.hipL, r.hipL, 0.3 * kick, 0, 0.5 * kick);
      setRot(j.hipR, r.hipR, -0.3 * kick, 0, 0.5 * kick);
      setRot(j.kneeL, r.kneeL, 0, 0, -1.4 * kick);
      setRot(j.kneeR, r.kneeR, 0, 0, -1.4 * kick);
      break;
    }
    case 'sip': {
      // Charla (cabeza y mano izquierda) y cada 7 s un sorbo de mojito.
      const sip = pulse(t, 7, 2.2);
      setRot(j.shoulderR, r.shoulderR, 0, 0, 0.75 * sip);
      setRot(j.elbowR, r.elbowR, 0, 0, 0.7 * sip);
      setRot(j.head, r.head, 0, 0.15 * Math.sin(t * 0.8), 0.06 * Math.sin(t * 2.3) + 0.3 * sip);
      setRot(j.shoulderL, r.shoulderL, 0, 0, 0.25 * pulse(t + 3, 5, 1.5));
      setRot(j.elbowL, r.elbowL, 0, 0, 0.6 * pulse(t + 3, 5, 1.5));
      if (j.handR) j.handR.userData.tilt = 0.7 * sip;
      break;
    }
  }
  // Mano derecha: el vaso sigue derecho (salvo al beber) y la espátula apunta a la parrilla.
  if (j.handR) {
    const arm = (j.spine?.rotation.z ?? 0) + (j.shoulderR?.rotation.z ?? 0) + (j.elbowR?.rotation.z ?? 0);
    const aim = p.holding === 'spatula' ? 1.35 + 0.25 * Math.sin(t * 3) : (j.handR.userData.tilt ?? 0);
    j.handR.rotation.z = aim - arm;
  }
}
