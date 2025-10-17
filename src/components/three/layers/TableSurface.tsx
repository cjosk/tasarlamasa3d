import { useMemo } from 'react';
import {
  selectTableHeights,
  selectTableProfile,
  useDesignStore
} from '../../../state/designStore';

export const TableSurface = () => {
  const profile = useDesignStore(selectTableProfile);
  const heights = useDesignStore(selectTableHeights);

  const geometries = useMemo(
    () => ({
      base: [profile.width, profile.baseThickness, profile.depth] as [number, number, number],
      mirror: [
        profile.width - profile.frameInset * 0.25,
        profile.innerSurfaceThickness,
        profile.depth - profile.frameInset * 0.25
      ] as [number, number, number],
      recess: [
        profile.width - profile.frameInset,
        profile.innerSurfaceThickness * 0.6,
        profile.depth - profile.frameInset
      ] as [number, number, number],
      trim: [
        profile.width + profile.frameInset * 0.35,
        profile.baseThickness * 0.18,
        profile.depth + profile.frameInset * 0.35
      ] as [number, number, number]
    }),
    [profile]
  );

  const baseCenterY = profile.baseThickness / 2;
  const trimY = profile.baseThickness - geometries.trim[1] / 2;
  const mirrorCenterY = heights.baseTopY + profile.innerSurfaceThickness / 2;
  const recessY = heights.baseTopY + profile.innerSurfaceThickness;

  return (
    <group name="NeonTable_Base">
      {/* Ground contact pad to softly receive shadows */}
      <mesh
        position={[0, heights.groundY - 0.0005, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[profile.width * 2.4, profile.depth * 2.4]} />
        <meshStandardMaterial color="#1a1f2b" roughness={0.95} metalness={0.05} />
      </mesh>

      {/* Sculpted base block resting on the floor */}
      <mesh position={[0, baseCenterY, 0]} castShadow receiveShadow>
        <boxGeometry args={geometries.base} />
        <meshStandardMaterial
          color="#05090f"
          metalness={0.25}
          roughness={0.82}
          envMapIntensity={0.15}
        />
      </mesh>

      {/* Low-profile chamfer that echoes the real neon table silhouette */}
      <mesh position={[0, trimY, 0]} receiveShadow>
        <boxGeometry args={geometries.trim} />
        <meshStandardMaterial color="#0b1625" metalness={0.35} roughness={0.6} />
      </mesh>

      {/* Polished black mirror surface for neon reflections */}
      <mesh position={[0, mirrorCenterY, 0]} receiveShadow>
        <boxGeometry args={geometries.mirror} />
        <meshStandardMaterial
          color="#020307"
          metalness={0.96}
          roughness={0.06}
          envMapIntensity={1.3}
        />
      </mesh>

      {/* Subtle recess to cradle the neon tubes */}
      <mesh position={[0, recessY, 0]} receiveShadow>
        <boxGeometry args={geometries.recess} />
        <meshStandardMaterial color="#070d18" metalness={0.45} roughness={0.45} />
      </mesh>
    </group>
  );
};
