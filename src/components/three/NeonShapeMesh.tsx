import { MutableRefObject, useEffect, useMemo, useRef, useState } from 'react';
import { CatmullRomCurve3, Group, MeshStandardMaterial, Vector3, Vector3Tuple } from 'three';
import { TransformControls, Text } from '@react-three/drei';
import { NeonShape } from '../../types/design';
import { useDesignStore } from '../../state/designStore';
import { useFrame, useThree } from '@react-three/fiber';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface NeonShapeMeshProps {
  shape: NeonShape;
  transformMode: 'translate' | 'rotate' | 'scale';
  orbitControlsRef: MutableRefObject<OrbitControlsImpl | null>;
}

const getColor = (color: string, intensity: number) => {
  const base = color.startsWith('#') ? color : `#${color}`;
  const material = new MeshStandardMaterial({
    color: '#0f172a',
    emissive: base,
    emissiveIntensity: intensity,
    toneMapped: false
  });
  return material;
};

const vectorTuple = (vector: { x: number; y: number; z: number }): Vector3Tuple => [
  vector.x,
  vector.y,
  vector.z
];

const MAX_NEON_HEIGHT = 0.72;

const createCurveForKind = (kind: NeonShape['kind']) => {
  switch (kind) {
    case 'v_shape': {
      const length = MAX_NEON_HEIGHT * 0.7;
      const width = 0.4;
      const points = [
        new Vector3(-width / 2, length / 2, 0),
        new Vector3(0, -length / 2 + 0.05, 0),
        new Vector3(width / 2, length / 3, 0)
      ];
      const curve = new CatmullRomCurve3(points, false, 'chordal');
      return { curve, tubularSegments: 48 } as const;
    }
    case 'single_peak': {
      const length = MAX_NEON_HEIGHT * 0.9;
      const width = 0.4;
      const points = [
        new Vector3(-width / 2, -length / 2, 0),
        new Vector3(0, length / 2, 0),
        new Vector3(width / 2, -length / 2, 0)
      ];
      const curve = new CatmullRomCurve3(points, false, 'chordal');
      return { curve, tubularSegments: 48 } as const;
    }
    case 'zigzag_m': {
      const length = MAX_NEON_HEIGHT * 0.9;
      const width = 0.5;
      const points = [
        new Vector3(-width, -length / 2, 0),
        new Vector3(-width / 2, length / 2, 0),
        new Vector3(0, -length / 2 + 0.05, 0),
        new Vector3(width / 2, length / 2, 0),
        new Vector3(width, -length / 2, 0)
      ];
      const curve = new CatmullRomCurve3(points, false, 'chordal');
      curve.tension = 0.4;
      return { curve, tubularSegments: 64 } as const;
    }
    default:
      return undefined;
  }
};

export const NeonShapeMesh = ({ shape, transformMode, orbitControlsRef }: NeonShapeMeshProps) => {
  const group = useRef<Group | null>(null);
  const [attachedObject, setAttachedObject] = useState<Group | null>(null);
  const selectShape = useDesignStore((state) => state.selectShape);
  const updateShape = useDesignStore((state) => state.updateShape);
  const selectedId = useDesignStore((state) => state.history.present.selectedId);
  const { camera } = useThree();
  const isSelected = selectedId === shape.id;

  useEffect(() => {
    if (!isSelected && orbitControlsRef.current) {
      orbitControlsRef.current.enabled = true;
    }
    return () => {
      if (orbitControlsRef.current) {
        orbitControlsRef.current.enabled = true;
      }
    };
  }, [isSelected, orbitControlsRef]);

  useEffect(() => {
    if (!group.current) return;
    group.current.position.set(...shape.position);
    group.current.rotation.set(...shape.rotation);
    group.current.scale.set(...shape.scale);
  }, [shape.position, shape.rotation, shape.scale]);

  const material = useMemo(
    () => (shape.kind === 'text' ? null : getColor(shape.color, shape.intensity)),
    [shape.color, shape.intensity, shape.kind]
  );

  useEffect(() => {
    if (!material) return;
    return () => material.dispose();
  }, [material]);

  const neonCurve = useMemo(() => createCurveForKind(shape.kind), [shape.kind]);
  const neonRadius = useMemo(() => Math.max(shape.thickness / 4, 0.01), [shape.thickness]);

  useFrame(({ clock }) => {
    if (!material) return;
    const base = shape.intensity;
    const flicker = shape.animated ? Math.sin(clock.elapsedTime * 3) * 0.3 : 0;
    material.emissiveIntensity = base + flicker + shape.glowRadius * 0.2;
  });

  useEffect(() => {
    if (!isSelected) return;
    const current = group.current;
    if (!current) return;
    const handle = () => {
      updateShape(shape.id, {
        position: vectorTuple(current.position),
        rotation: vectorTuple(current.rotation),
        scale: vectorTuple(current.scale)
      });
    };
    return () => handle();
  }, [isSelected, shape.id, updateShape]);

  const renderGeometry = () => {
    switch (shape.kind) {
      case 'v_shape':
      case 'single_peak':
      case 'zigzag_m':
        if (!material || !neonCurve) {
          return null;
        }
        return (
          <mesh castShadow receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
            <tubeGeometry
              key={`${shape.kind}-${shape.thickness.toFixed(3)}`}
              args={[neonCurve.curve, neonCurve.tubularSegments, neonRadius, 18, false]}
            />
            <primitive object={material} attach="material" />
          </mesh>
        );
      case 'text':
        return (
          <Text
            fontSize={0.4}
            color={shape.color}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.03}
            outlineColor={shape.color}
            outlineOpacity={0.4 + shape.glowRadius * 0.1}
          >
            {shape.text}
          </Text>
        );
      case 'svg':
        return material ? <SvgShape path={shape.svgPath ?? ''} material={material} /> : null;
      default:
        return null;
    }
  };

  return (
    <>
      <group
        ref={(instance) => {
          if (!instance) {
            group.current = null;
            setAttachedObject(null);
            return;
          }
          group.current = instance;
          setAttachedObject((prev) => (prev === instance ? prev : instance));
        }}
        onPointerDown={(event) => {
          event.stopPropagation();
          selectShape(shape.id);
        }}
        onPointerMissed={(event) => {
          if (event.type === 'pointerdown') {
            selectShape(undefined);
          }
        }}
      >
        {renderGeometry()}
      </group>
      {isSelected && attachedObject && (
        <TransformControls
          object={attachedObject}
          mode={transformMode}
          camera={camera}
          enabled
          onPointerDown={() => {
            if (orbitControlsRef.current) {
              orbitControlsRef.current.enabled = false;
            }
          }}
          onPointerUp={() => {
            if (orbitControlsRef.current) {
              orbitControlsRef.current.enabled = true;
            }
          }}
          onPointerMissed={() => {
            if (orbitControlsRef.current) {
              orbitControlsRef.current.enabled = true;
            }
          }}
          onObjectChange={() => {
            if (!group.current) return;
            updateShape(shape.id, {
              position: vectorTuple(group.current.position),
              rotation: vectorTuple(group.current.rotation),
              scale: vectorTuple(group.current.scale)
            });
          }}
        />
      )}
    </>
  );
};

interface SvgShapeProps {
  path: string;
  material: MeshStandardMaterial;
}

const SvgShape = ({ path, material }: SvgShapeProps) => {
  const group = useRef<Group | null>(null);

  const shapes = useMemo(() => {
    if (!path) return [];
    const loader = new SVGLoader();
    const data = loader.parse(path);
    return data.paths.flatMap((svgPath) => svgPath.toShapes(true));
  }, [path]);

  return (
    <group ref={group} scale={0.008} rotation={[-Math.PI / 2, 0, 0]}>
      {shapes.map((shape, index) => (
        <mesh key={index} position={[0, 0, 0]}>
          <shapeGeometry args={[shape]} />
          <primitive object={material} attach="material" />
        </mesh>
      ))}
    </group>
  );
};
