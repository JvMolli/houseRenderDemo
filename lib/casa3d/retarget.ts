/**
 * Lleva el movimiento de una figura articulada (people.ts, invisible) a un
 * modelo con esqueleto (MakeHuman, rig «game_engine»). En cada frame el
 * modelo vuelve a su postura de reposo y cada hueso se gira lo justo para
 * apuntar como el segmento de la figura: muslo de cadera a rodilla, brazo de
 * hombro a codo... Pelvis y cabeza copian además la orientación de la figura.
 * El modelo mira a +Z (glTF); dentro de la figura, que mira a +X, va girado
 * MODEL_YAW alrededor de Y.
 */
import * as THREE from 'three';
import { BODY, type Joints } from './people';

export const MODEL_YAW = Math.PI / 2;

const BONES = [
  'pelvis', 'spine_01', 'neck_01', 'head',
  'thigh_l', 'calf_l', 'foot_l', 'thigh_r', 'calf_r', 'foot_r',
  'upperarm_l', 'lowerarm_l', 'hand_l', 'upperarm_r', 'lowerarm_r', 'hand_r',
] as const;
type BoneName = typeof BONES[number];

export interface Retarget {
  bones: Record<BoneName, THREE.Bone>;
  /** Giro local de reposo de cada hueso que se toca. */
  rest: Map<THREE.Bone, THREE.Quaternion>;
  /** Orientación de pelvis y cabeza respecto a la figura en postura neutra. */
  pelvisRel: THREE.Quaternion;
  headRel: THREE.Quaternion;
  /** De la mitad de las caderas a la pelvis, en el marco de la figura. */
  pelvisOffset: THREE.Vector3;
}

const yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), MODEL_YAW);

/** Prepara el retargeting de un modelo recién cargado (en su postura de reposo, sin girar). */
export function createRetarget(model: THREE.Object3D): Retarget | null {
  const bones = {} as Record<BoneName, THREE.Bone>;
  for (const name of BONES) {
    const b = model.getObjectByName(name);
    if (!(b instanceof THREE.Bone)) return null;
    bones[name] = b;
  }
  model.updateMatrixWorld(true);
  const inModel = (o: THREE.Object3D) => {
    const m = new THREE.Matrix4().copy(model.matrixWorld).invert().multiply(o.matrixWorld);
    const p = new THREE.Vector3(), q = new THREE.Quaternion();
    m.decompose(p, q, new THREE.Vector3());
    return { p, q };
  };
  const pelvis = inModel(bones.pelvis), head = inModel(bones.head);
  const hips = inModel(bones.thigh_l).p.add(inModel(bones.thigh_r).p).multiplyScalar(0.5);
  return {
    bones,
    rest: new Map(BONES.map(n => [bones[n], bones[n].quaternion.clone()])),
    pelvisRel: yaw.clone().multiply(pelvis.q),
    headRel: yaw.clone().multiply(head.q),
    pelvisOffset: pelvis.p.sub(hips).applyQuaternion(yaw),
  };
}

const va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3(), vd = new THREE.Vector3();
const qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), qc = new THREE.Quaternion(), qBody = new THREE.Quaternion();

/** Pone el hueso con giro de mundo `world` (y, si se da, posición de mundo). */
function setWorld(bone: THREE.Bone, world: THREE.Quaternion, position?: THREE.Vector3) {
  const parent = bone.parent!;
  bone.quaternion.copy(parent.getWorldQuaternion(qc).invert().multiply(world));
  if (position) bone.position.copy(parent.worldToLocal(vd.copy(position)));
  bone.updateMatrixWorld(true);
}

/** Gira `bone` lo mínimo para que el tramo hasta `child` apunte en la dirección `dir` (mundo). */
function aim(bone: THREE.Bone, child: THREE.Object3D, dir: THREE.Vector3) {
  const from = child.getWorldPosition(va).sub(bone.getWorldPosition(vb)).normalize();
  qa.setFromUnitVectors(from, vc.copy(dir).normalize());
  setWorld(bone, qa.multiply(bone.getWorldQuaternion(qb)));
}

const p1 = new THREE.Vector3(), p2 = new THREE.Vector3(), p3 = new THREE.Vector3();
const local = (o: THREE.Object3D | undefined, y: number, out: THREE.Vector3) => (o ? o.localToWorld(out.set(0, y, 0)) : out.set(0, 0, 0));

/** Copia la postura de la figura (con sus matrices ya actualizadas) al modelo. */
export function applyRetarget(r: Retarget, j: Joints) {
  const { bones: b } = r;
  if (!j.body || !j.head) return;
  for (const [bone, q] of r.rest) bone.quaternion.copy(q);

  // Pelvis: orientación del cuerpo de la figura y caderas en sus caderas.
  const bodyQ = j.body.getWorldQuaternion(qBody);
  const pelvisAt = j.body.getWorldPosition(p1).add(vb.copy(r.pelvisOffset).applyQuaternion(bodyQ));
  setWorld(b.pelvis, qb.copy(bodyQ).multiply(r.pelvisRel), pelvisAt);

  // Tronco hacia el cuello de la figura y cabeza con su misma orientación.
  aim(b.spine_01, b.neck_01, local(j.head, 0, p2).sub(j.body.getWorldPosition(p1)));
  setWorld(b.head, j.head.getWorldQuaternion(qb).multiply(r.headRel));

  const limb = (top: THREE.Object3D | undefined, mid: THREE.Object3D | undefined, len: number,
    upper: THREE.Bone, lower: THREE.Bone, end: THREE.Bone) => {
    if (!top || !mid) return;
    const a = top.getWorldPosition(p1), m = mid.getWorldPosition(p2), e = local(mid, -len, p3);
    aim(upper, lower, vd.copy(m).sub(a));
    aim(lower, end, vd.copy(e).sub(m));
  };
  limb(j.hipL, j.kneeL, BODY.shin, b.thigh_l, b.calf_l, b.foot_l);
  limb(j.hipR, j.kneeR, BODY.shin, b.thigh_r, b.calf_r, b.foot_r);
  limb(j.shoulderL, j.elbowL, BODY.forearm, b.upperarm_l, b.lowerarm_l, b.hand_l);
  limb(j.shoulderR, j.elbowR, BODY.forearm, b.upperarm_r, b.lowerarm_r, b.hand_r);
}
