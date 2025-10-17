import { useMemo } from 'react';
import { TABLE_DIMENSIONS, TABLE_BASE_BOTTOM_Y, TABLE_GROUND_Y } from './tableDimensions';

const {
  width,
  depth,
  baseThickness,
  innerSurfaceThickness,
  frameInset,
  legHeight,
  legRadius,
  legInset
} = TABLE_DIMENSIONS;

export const TableSurface = () => {
  const legData = useMemo(() => {
    const halfWidth = width / 2 - legInset;
    const halfDepth = depth / 2 - legInset;
    const centerY = TABLE_BASE_BOTTOM_Y - legHeight / 2;
    return [
      { x: halfWidth, y: centerY, z: halfDepth },
      { x: halfWidth, y: centerY, z: -halfDepth },
      { x: -halfWidth, y: centerY, z: halfDepth },
      { x: -halfWidth, y: centerY, z: -halfDepth }
    ];
  }, []);

  const bevelGeometries = useMemo(
    () => ({
      plinth: [width + frameInset, baseThickness, depth + frameInset] as [number, number, number],
      mirror: [width, innerSurfaceThickness, depth] as [number, number, number],
      recess: [width - frameInset, innerSurfaceThickness / 2, depth - frameInset] as [number, number, number]
    }),
    []
  );

  return (
    <group name="NeonTable_Base">
      {/* Deep charcoal plinth */}
      <mesh
        position={[0, TABLE_BASE_BOTTOM_Y + baseThickness / 2, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={bevelGeometries.plinth} />
        <meshStandardMaterial
          color="#04070a"
          metalness={0.45}
          roughness={0.85}
          envMapIntensity={0.3}
        />
      </mesh>

      {/* Polished mirrored surface where neon lives */}
      <mesh position={[0, -innerSurfaceThickness / 2, 0]} receiveShadow>
        <boxGeometry args={bevelGeometries.mirror} />
        <meshStandardMaterial
          color="#030305"
          metalness={0.95}
          roughness={0.08}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* Subtle recessed frame to keep neon contained */}
      <mesh position={[0, -innerSurfaceThickness, 0]} receiveShadow>
        <boxGeometry args={bevelGeometries.recess} />
        <meshStandardMaterial color="#050912" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Structural steel legs */}
      {legData.map(({ x, y, z }, index) => (
        <mesh key={`leg-${index}`} position={[x, y, z]} castShadow receiveShadow>
          <cylinderGeometry args={[legRadius, legRadius, legHeight, 24]} />
          <meshStandardMaterial color="#050608" metalness={0.25} roughness={0.7} />
        </mesh>
      ))}

      {/* Floating casters */}
      {legData.map(({ x, z }, index) => (
        <mesh key={`caster-${index}`} position={[x, TABLE_GROUND_Y - 0.04, z]} receiveShadow>
          <torusGeometry args={[0.11, 0.025, 16, 32]} />
          <meshStandardMaterial color="#1f2937" metalness={0.55} roughness={0.35} />
        </mesh>
      ))}

      {/* Warm textile floor pad to ground the composition */}
      <mesh
        position={[0, TABLE_GROUND_Y - 0.06, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[width * 2.6, depth * 2.6]} />
        <meshStandardMaterial color="#3b3328" roughness={0.95} metalness={0.05} />
      </mesh>
    </group>
  );
};
