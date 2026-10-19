import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { memo, Suspense, useEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react';
import {
  Bone, DoubleSide, FrontSide, Mesh, MeshStandardMaterial, Vector3, type Group, type Material, type Object3D,
} from 'three';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import type { Outfit } from '@/lib/casa3d/parcel';
import { PEOPLE, type PersonSpec } from '@/lib/casa3d/parcelShapes';
import {
  animatePerson, BODY, createPersonGeometries, REST, type JointName, type Joints, type PersonGeometries,
} from '@/lib/casa3d/people';
import { applyRetarget, createRetarget, MODEL_YAW } from '@/lib/casa3d/retarget';

const GLASS = 0xdff3d4, MINT = 0x4c9a3a, STRAW = 0x2e6b2e, STEEL = 0xbcb3a5;
const modelUrl = (spec: PersonSpec) => `/personas/${spec.id}.glb`;

interface FigureProps {
  spec: PersonSpec;
  g: PersonGeometries;
  mat: (color: number) => Material;
}

/**
 * Figura articulada: grupos por articulación que anima `animatePerson`. Con
 * `capsules` se ve hecha de cápsulas (mientras carga el modelo); si no, es el
 * esqueleto invisible que mueve al modelo realista (`children`).
 */
function Figure({ spec, g, mat, capsules, joints, root, children }: FigureProps & {
  capsules: boolean;
  joints: RefObject<Joints>;
  root: RefObject<Group | null>;
  children?: ReactNode;
}) {
  const rest = REST[spec.pose], o = spec.outfit;
  const bind = (name: JointName) => (el: Object3D | null) => {
    if (el) joints.current[name] = el;
  };
  const rot = (name: JointName) => rest.rot[name] ?? [0, 0, 0];
  const legTop = o.legs === 'bare' ? o.skin : o.bottom, legLow = o.legs === 'trousers' ? o.bottom : o.skin;
  const mesh = (geometry: keyof PersonGeometries, color: number) => capsules && (
    <mesh geometry={g[geometry]} material={mat(color)} castShadow receiveShadow />
  );
  const prop = (geometry: keyof PersonGeometries, color: number) => (
    <mesh geometry={g[geometry]} material={mat(color)} castShadow receiveShadow />
  );

  return (
    <group ref={root} position={spec.position} rotation-y={spec.rotationY}>
      <group ref={bind('body')} position-y={rest.hipY} rotation-z={rest.tilt}>
        {mesh('pelvis', o.bottom)}
        <group ref={bind('spine')} rotation={rot('spine')}>
          {mesh('torso', o.top)}
          {mesh('neck', o.skin)}
          <group ref={bind('head')} position-y={BODY.neck} rotation={rot('head')}>
            {mesh('head', o.skin)}
            {mesh('hair', o.hair)}
            {o.longHair && mesh('longHair', o.hair)}
            {o.beard && mesh('beard', o.hair)}
          </group>
          {([-1, 1] as const).map(s => {
            const sideName = s > 0 ? 'R' : 'L';
            return (
              <group key={s} ref={bind(`shoulder${sideName}`)} position={[0, BODY.shoulder, s * BODY.shoulderW]} rotation={rot(`shoulder${sideName}`)}>
                {mesh('upperArm', o.top)}
                <group ref={bind(`elbow${sideName}`)} position-y={-BODY.upperArm} rotation={rot(`elbow${sideName}`)}>
                  {mesh('forearm', o.skin)}
                  {s > 0 && spec.holding && (
                    <group ref={bind('handR')} position-y={-BODY.forearm}>
                      {capsules && (spec.holding === 'mojito' ? (
                        <>
                          {prop('glass', GLASS)}
                          {prop('mint', MINT)}
                          {prop('straw', STRAW)}
                        </>
                      ) : (
                        <>
                          {prop('spatulaHandle', STEEL)}
                          {prop('spatulaBlade', STEEL)}
                        </>
                      ))}
                    </group>
                  )}
                </group>
              </group>
            );
          })}
        </group>
        {([-1, 1] as const).map(s => {
          const sideName = s > 0 ? 'R' : 'L';
          return (
            <group key={s} ref={bind(`hip${sideName}`)} position-z={s * BODY.hipW} rotation={rot(`hip${sideName}`)}>
              {mesh('thigh', legTop)}
              <group ref={bind(`knee${sideName}`)} position-y={-BODY.thigh} rotation={rot(`knee${sideName}`)}>
                {mesh('shin', legLow)}
                <group position-y={-BODY.shin}>{mesh('foot', o.shoes)}</group>
              </group>
            </group>
          );
        })}
      </group>
      {children}
    </group>
  );
}

/** Figura de cápsulas: se ve mientras se descarga el modelo realista. */
function CapsulePerson(props: FigureProps) {
  const root = useRef<Group>(null);
  const joints = useRef<Joints>({});
  useFrame(({ clock }) => {
    if (root.current) animatePerson(props.spec, root.current, joints.current, clock.elapsedTime);
  });
  return <Figure {...props} capsules joints={joints} root={root} />;
}

/** Color de la ropa y el pelo: las texturas vienen en gris de media 0,5 (ver scripts/personas). */
const TINT: Record<string, (o: Outfit) => number> = {
  top: o => o.top, bikiniTop: o => o.top, bottom: o => o.bottom, bikiniBottom: o => o.bottom, hair: o => o.hair, beard: o => o.hair,
};
/** Pelo, cejas, pestañas y barba: recortes con alfa (sin mezcla, que se ordena mal). */
const CUTOUT = new Set(['hair', 'beard', 'eyebrows', 'eyelashes']);
/** Piel y ojos se ven por fuera; la ropa, por las dos caras (es de una sola capa). */
const ONE_SIDED = new Set(['skin', 'eyes']);

/** Copia del modelo con los materiales de esta persona. */
function dress(source: Object3D, outfit: Outfit) {
  const model = cloneSkinned(source);
  model.traverse(o => {
    if (!(o instanceof Mesh)) return;
    o.castShadow = o.receiveShadow = true;
    // Se dobla, se tumba y se sienta: el volumen del reposo no sirve para descartarlo.
    o.frustumCulled = false;
    const m = (o.material as MeshStandardMaterial).clone(), role = m.name;
    m.transparent = false;
    m.depthWrite = true;
    m.alphaTest = CUTOUT.has(role) ? 0.5 : 0;
    m.side = ONE_SIDED.has(role) ? FrontSide : DoubleSide;
    m.metalness = 0;
    m.roughness = role === 'eyes' ? 0.15 : role === 'skin' ? 0.55 : 0.8;
    const tint = TINT[role];
    if (tint) m.color.set(tint(outfit)).multiplyScalar(2);
    o.material = m;
  });
  return model;
}

const handPos = new Vector3(), handDir = new Vector3(), wrist = new Vector3();

/** Persona realista (MakeHuman) movida por su figura invisible; vaso o espátula en la mano. */
function RealPerson(props: FigureProps) {
  const { spec, g, mat } = props;
  const gltf = useGLTF(modelUrl(spec));
  const model = useMemo(() => dress(gltf.scene, spec.outfit), [gltf, spec.outfit]);
  const retarget = useMemo(() => createRetarget(model), [model]);
  const root = useRef<Group>(null);
  const joints = useRef<Joints>({});
  const props3d = useRef<Group>(null);
  const hand = useMemo(() => model.getObjectByName('hand_r') as Bone | undefined, [model]);
  useEffect(() => () => {
    model.traverse(o => { if (o instanceof Mesh) (o.material as Material).dispose(); });
  }, [model]);

  useFrame(({ clock }) => {
    if (!root.current) return;
    animatePerson(spec, root.current, joints.current, clock.elapsedTime);
    root.current.updateMatrixWorld(true);
    if (retarget) applyRetarget(retarget, joints.current);
    // Lo que lleva en la mano: en la palma del modelo, con el giro de la mano de la figura.
    const h = props3d.current, jh = joints.current.handR;
    if (h && hand && jh) {
      hand.getWorldPosition(wrist);
      handDir.copy(hand.children[0]?.getWorldPosition(handPos) ?? wrist).sub(wrist).normalize();
      h.position.copy(wrist).addScaledVector(handDir, 0.07);
      jh.getWorldQuaternion(h.quaternion);
    }
  });

  return (
    <>
      <Figure {...props} capsules={false} joints={joints} root={root}>
        <primitive object={model} rotation-y={MODEL_YAW} />
      </Figure>
      {spec.holding && (
        <group ref={props3d}>
          {spec.holding === 'mojito' ? (
            <>
              <mesh geometry={g.glass} material={mat(GLASS)} castShadow />
              <mesh geometry={g.mint} material={mat(MINT)} />
              <mesh geometry={g.straw} material={mat(STRAW)} />
            </>
          ) : (
            <>
              <mesh geometry={g.spatulaHandle} material={mat(STEEL)} castShadow />
              <mesh geometry={g.spatulaBlade} material={mat(STEEL)} castShadow />
            </>
          )}
        </group>
      )}
    </>
  );
}

/**
 * Gente en el patio, en movimiento: personas realistas (modelos MakeHuman con
 * esqueleto) que siguen las animaciones de las figuras articuladas. Mientras
 * se descargan se ven las figuras de cápsulas.
 */
export const People = memo(function People() {
  const g = useMemo(createPersonGeometries, []);
  const materials = useMemo(() => {
    const colors = new Set([GLASS, MINT, STRAW, STEEL, ...PEOPLE.flatMap(p => [p.outfit.skin, p.outfit.hair, p.outfit.top, p.outfit.bottom, p.outfit.shoes])]);
    return new Map([...colors].map(c => [c, new MeshStandardMaterial({ color: c, roughness: 0.7 })]));
  }, []);
  useEffect(() => () => {
    for (const geo of Object.values(g)) geo.dispose();
    for (const m of materials.values()) m.dispose();
  }, [g, materials]);
  const mat = (c: number) => materials.get(c)!;

  return (
    <>
      {PEOPLE.map(p => (
        <Suspense key={p.id} fallback={<CapsulePerson spec={p} g={g} mat={mat} />}>
          <RealPerson spec={p} g={g} mat={mat} />
        </Suspense>
      ))}
    </>
  );
});
