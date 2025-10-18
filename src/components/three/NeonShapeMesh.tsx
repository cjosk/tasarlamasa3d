import { MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Group, MeshStandardMaterial, Shape as ThreeShape, Vector3, Vector3Tuple } from 'three';
import { TransformControls, Text } from '@react-three/drei';
import { NeonShape } from '../../types/design';
import { useDesignStore, selectMovementLimits, selectTableHeights } from '../../state/designStore';
import { useFrame, useThree } from '@react-three/fiber';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { OrbitControls as OrbitControlsImpl, TransformControls as TransformControlsClass } from 'three-stdlib';
import { createNeonCurve } from './neonCurves';

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
  (material as any).glowRadius = 1;
  (material as any).glowIntensity = 1;
  return material;
};

const vectorTuple = (vector: { x: number; y: number; z: number }): Vector3Tuple => [
  vector.x,
  vector.y,
  vector.z
];

const yawTuple = (rotation: { y: number }): Vector3Tuple => [Math.PI, rotation.y, 0];

const clampValue = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const TEXT_FONT_SIZE = 0.4;

export const NeonShapeMesh = ({ shape, transformMode, orbitControlsRef }: NeonShapeMeshProps) => {
  const group = useRef<Group | null>(null);
  const [attachedObject, setAttachedObject] = useState<Group | null>(null);
  const transformRef = useRef<TransformControlsClass | null>(null);
  const focusTargetRef = useRef(new Vector3());
  const pendingFocusRef = useRef(false);
  const worldPositionRef = useRef(new Vector3());
  const selectShape = useDesignStore((state) => state.selectShape);
  const updateShape = useDesignStore((state) => state.updateShape);
  const setTransforming = useDesignStore((state) => state.setTransforming);
  const selectedId = useDesignStore((state) => state.history.present.selectedId);
  const tableHeights = useDesignStore(selectTableHeights);
  const movementLimits = useDesignStore(selectMovementLimits);
  const { camera } = useThree();
  const isSelected = selectedId === shape.id;
  const limitX = movementLimits.x;
  const limitZ = movementLimits.z;
  const surfaceY = tableHeights.neonSurfaceY;

  const clampPositionTuple = useCallback(
    (vector: { x: number; y: number; z: number }): Vector3Tuple => [
      clampValue(vector.x, -limitX, limitX),
      surfaceY,
      clampValue(vector.z, -limitZ, limitZ)
    ],
    [limitX, limitZ, surfaceY]
  );

  useEffect(() => {
    const controls = transformRef.current;
    if (!controls) return;

    const handleDragChange = (event: any) => {
      const isDragging = Boolean(event?.value);
      setTransforming(isDragging);
    };

    const handleDragStart = () => {
      setTransforming(true);
    };

    const handleDragEnd = () => {
      setTransforming(false);
    };

    (controls as any).addEventListener('dragging-changed', handleDragChange);
    (controls as any).addEventListener('mouseDown', handleDragStart);
    (controls as any).addEventListener('mouseUp', handleDragEnd);
    (controls as any).addEventListener('touchStart', handleDragStart);
    (controls as any).addEventListener('touchEnd', handleDragEnd);

    return () => {
      (controls as any).removeEventListener('dragging-changed', handleDragChange);
      (controls as any).removeEventListener('mouseDown', handleDragStart);
      (controls as any).removeEventListener('mouseUp', handleDragEnd);
      (controls as any).removeEventListener('touchStart', handleDragStart);
      (controls as any).removeEventListener('touchEnd', handleDragEnd);
      setTransforming(false);
    };
  }, [setTransforming]);

  const queueFocus = () => {
    if (!group.current) return;
    group.current.updateMatrixWorld();
    group.current.getWorldPosition(worldPositionRef.current);
    focusTargetRef.current.copy(worldPositionRef.current);
    pendingFocusRef.current = true;
  };

  useEffect(() => {
    if (isSelected) {
      queueFocus();
    }
  }, [isSelected]);

  useEffect(() => {
    if (!group.current) return;
    const [px, , pz = 0] = shape.position;
    const nextPosition = clampPositionTuple({ x: px, y: surfaceY, z: pz });
    group.current.position.set(...nextPosition);
    group.current.rotation.set(Math.PI, shape.rotation[1] ?? 0, 0);
    group.current.scale.set(shape.scale[0], shape.scale[1], shape.scale[2]);
  }, [shape.position, shape.rotation, shape.scale, clampPositionTuple]);

  const material = useMemo(
    () => (shape.kind === 'text' ? null : getColor(shape.color, shape.intensity)),
    [shape.color, shape.intensity, shape.kind]
  );

  useEffect(() => {
    if (!material) return;
    return () => material.dispose();
  }, [material]);

  const neonCurve = useMemo(() => createNeonCurve(shape.kind), [shape.kind]);
  const neonRadius = useMemo(() => Math.max(shape.thickness / 2, 0.003), [shape.thickness]);

  useFrame(({ clock }) => {
    if (group.current) {
      const { position, rotation } = group.current;
      const clampedX = clampValue(position.x, -limitX, limitX);
      const clampedZ = clampValue(position.z, -limitZ, limitZ);
      if (Math.abs(position.x - clampedX) > 1e-4) {
        position.x = clampedX;
      }
      if (Math.abs(position.y - surfaceY) > 1e-4) {
        position.y = surfaceY;
      }
      if (Math.abs(position.z - clampedZ) > 1e-4) {
        position.z = clampedZ;
      }
      if (Math.abs(rotation.x - Math.PI) > 1e-4) {
        rotation.x = Math.PI;
      }
      if (Math.abs(rotation.z) > 1e-4) {
        rotation.z = 0;
      }
    }

    if (pendingFocusRef.current && orbitControlsRef.current) {
      const controls = orbitControlsRef.current;
      controls.target.lerp(focusTargetRef.current, 0.18);
      controls.update();
      if (controls.target.distanceToSquared(focusTargetRef.current) < 1e-5) {
        controls.target.copy(focusTargetRef.current);
        controls.update();
        pendingFocusRef.current = false;
      }
    }
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
        current.rotation.x = Math.PI;
        current.rotation.z = 0;
        updateShape(shape.id, {
          position: clampPositionTuple(current.position),
          rotation: yawTuple(current.rotation),
          scale: vectorTuple(current.scale)
        });
      };
    return () => handle();
  }, [isSelected, shape.id, updateShape]);

  const renderGeometry = () => {
    switch (shape.kind) {
      case 'sharp_triangle':
      case 'deep_v_shape':
      case 'smooth_n_curve':
      case 'sharp_m_shape':
        if (!material || !neonCurve) {
          return null;
        }
        return (
          <mesh castShadow receiveShadow>
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
            fontSize={TEXT_FONT_SIZE}
            color={shape.color}
            anchorX="center"
            anchorY="top"
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

  const showXHandle = transformMode !== 'rotate';
  const showYHandle = transformMode === 'rotate';
  const showZHandle = transformMode !== 'rotate';

  return (
    <>
      <group
        ref={(instance) => {
          if (!instance) {
            group.current = null;
            setAttachedObject(null);
            pendingFocusRef.current = false;
            return;
          }
          group.current = instance;
          setAttachedObject((prev) => (prev === instance ? prev : instance));
        }}
        onPointerDown={(event) => {
          event.stopPropagation();
          selectShape(shape.id);
          queueFocus();
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
          ref={(instance) => {
            transformRef.current = instance;
          }}
          object={attachedObject}
          mode={transformMode}
          camera={camera}
          enabled
          showX={showXHandle}
          showY={showYHandle}
          showZ={showZHandle}
          onObjectChange={() => {
            if (!group.current) return;
            group.current.rotation.x = Math.PI;
            group.current.rotation.z = 0;
            updateShape(shape.id, {
              position: clampPositionTuple(group.current.position),
              rotation: yawTuple(group.current.rotation),
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

  const { shapes, offsetY } = useMemo<{ shapes: ThreeShape[]; offsetY: number }>(() => {
    if (!path) {
      return { shapes: [], offsetY: 0 };
    }
    const loader = new SVGLoader();
    const data = loader.parse(path);
    const svgShapes = data.paths.flatMap((svgPath) => svgPath.toShapes(true));

    let minY = Infinity;
    svgShapes.forEach((shape) => {
      const points = shape.getPoints();
      points.forEach((point) => {
        if (point.y < minY) minY = point.y;
      });
    });

    const offset = Number.isFinite(minY) ? -minY : 0;

    return { shapes: svgShapes, offsetY: offset };
  }, [path]);

  return (
    <group ref={group} scale={0.008} position={[0, 0, 0]}>
      {shapes.map((shape, index) => (
        <mesh key={index} position={[0, offsetY, 0]}>
          <shapeGeometry args={[shape]} />
          <primitive object={material} attach="material" />
        </mesh>
      ))}
    </group>
  );
};
