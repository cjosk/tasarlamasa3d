import { useEffect, useMemo, useRef, useState } from 'react';
import { Group, MeshStandardMaterial, Vector3Tuple } from 'three';
import { TransformControls, Text } from '@react-three/drei';
import { NeonShape } from '../../types/design';
import { useDesignStore } from '../../state/designStore';
import { useFrame, useThree } from '@react-three/fiber';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

interface NeonShapeMeshProps {
  shape: NeonShape;
  transformMode: 'translate' | 'rotate' | 'scale';
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

export const NeonShapeMesh = ({ shape, transformMode }: NeonShapeMeshProps) => {
  const group = useRef<Group>(null);
  const [target, setTarget] = useState<Group | null>(null);
  const selectShape = useDesignStore((state) => state.selectShape);
  const updateShape = useDesignStore((state) => state.updateShape);
  const selectedId = useDesignStore((state) => state.history.present.selectedId);
  const { camera } = useThree();
  const isSelected = selectedId === shape.id;

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
      case 'line':
        return (
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[shape.thickness / 4, shape.thickness / 4, 2, 32]} />
            {material && <primitive object={material} attach="material" />}
          </mesh>
        );
      case 'circle':
        return (
          <mesh castShadow receiveShadow>
            <torusGeometry args={[1, shape.thickness / 3, 16, 100]} />
            {material && <primitive object={material} attach="material" />}
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
            toneMapped={false}
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
    <group
      ref={(instance) => {
        if (instance) {
          group.current = instance;
          setTarget(instance);
        }
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
      {isSelected && target && (
        <TransformControls
          object={target}
          mode={transformMode}
          camera={camera}
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
    </group>
  );
};

interface SvgShapeProps {
  path: string;
  material: MeshStandardMaterial;
}

const SvgShape = ({ path, material }: SvgShapeProps) => {
  const group = useRef<Group>(null);

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
