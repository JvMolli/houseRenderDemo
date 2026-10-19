import { useFrame } from '@react-three/fiber';
import { memo, useEffect, useMemo, useRef } from 'react';
import { MeshStandardMaterial, type Group, type Material, type Object3D } from 'three';
import { PEOPLE, type PersonSpec } from '@/lib/casa3d/parcelShapes';
import {
  animatePerson, BODY, createPersonGeometries, REST, type JointName, type Joints, type PersonGeometries,
} from '@/lib/casa3d/people';

const GLASS = 0xdff3d4, MINT = 0x4c9a3a, STRAW = 0x2e6b2e, STEEL = 0xbcb3a5;

interface PersonProps {
  spec: PersonSpec;
  g: PersonGeometries;
  mat: (color: number) => Material;
}

/** Una figura articulada; se anima en cada frame. */
function Person({ spec, g, mat }: PersonProps) {
  const root = useRef<Group>(null);
  const joints = useRef<Joints>({});
  const rest = REST[spec.pose], o = spec.outfit;
  const bind = (name: JointName) => (el: Object3D | null) => {
    if (el) joints.current[name] = el;
  };
  const rot = (name: JointName) => rest.rot[name] ?? [0, 0, 0];
  const legTop = o.legs === 'bare' ? o.skin : o.bottom, legLow = o.legs === 'trousers' ? o.bottom : o.skin;

  useFrame(({ clock }) => {
    if (root.current) animatePerson(spec, root.current, joints.current, clock.elapsedTime);
  });

  const mesh = (geometry: keyof PersonGeometries, color: number) => (
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
                      {spec.holding === 'mojito' ? (
                        <>
                          {mesh('glass', GLASS)}
                          {mesh('mint', MINT)}
                          {mesh('straw', STRAW)}
                        </>
                      ) : (
                        <>
                          {mesh('spatulaHandle', STEEL)}
                          {mesh('spatulaBlade', STEEL)}
                        </>
                      )}
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
    </group>
  );
}

/** Gente en el patio, en movimiento. Geometrías y materiales compartidos. */
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

  return <>{PEOPLE.map((p, i) => <Person key={i} spec={p} g={g} mat={mat} />)}</>;
});
