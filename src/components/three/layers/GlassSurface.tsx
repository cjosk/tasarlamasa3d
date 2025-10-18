import { GlassSettings } from '../../../types/design';
import {
  selectTableHeights,
  selectTableProfile,
  useDesignStore
} from '../../../state/designStore';

interface GlassSurfaceProps {
  glass: GlassSettings;
}

export const GlassSurface = ({ glass }: GlassSurfaceProps) => {
  const profile = useDesignStore(selectTableProfile);
  const heights = useDesignStore(selectTableHeights);

  const wall = profile.glassWallThickness;
  const enclosureHeight = Math.max(heights.glassHeight, 0.12);
  const topThickness = Math.max(0.008, 0.006 + glass.thickness * 0.004);
  const wallHeight = Math.max(enclosureHeight - topThickness, 0.1);
  const baseLipHeight = wall * 0.75;

  return (
    <group position={[0, heights.glassBaseY, 0]} name="NeonTable_Glass">
      {/* Smoked glass base lip */}
      <mesh position={[0, baseLipHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[profile.width + wall * 2.4, baseLipHeight, profile.depth + wall * 2.4]} />
        <meshPhysicalMaterial
          color={glass.tint}
          transparent
          opacity={Math.min(glass.opacity + 0.1, 0.85)}
          roughness={glass.roughness * 0.5}
          metalness={0.2}
          reflectivity={0.9}
          transmission={0.65}
          clearcoat={0.6}
          clearcoatRoughness={0.18}
          thickness={0.4}
        />
      </mesh>

      {/* Longitudinal walls */}
      <mesh position={[0, wallHeight / 2 + baseLipHeight, profile.depth / 2 + wall / 2]} castShadow>
        <boxGeometry args={[profile.width + wall * 2, wallHeight, wall]} />
        <meshPhysicalMaterial
          color={glass.tint}
          transparent
          opacity={glass.opacity}
          roughness={glass.roughness * 0.6}
          metalness={0.15}
          reflectivity={0.85}
          transmission={0.94}
          clearcoat={0.85}
          clearcoatRoughness={0.16}
          thickness={0.6}
        />
      </mesh>
      <mesh position={[0, wallHeight / 2 + baseLipHeight, -(profile.depth / 2 + wall / 2)]} castShadow>
        <boxGeometry args={[profile.width + wall * 2, wallHeight, wall]} />
        <meshPhysicalMaterial
          color={glass.tint}
          transparent
          opacity={glass.opacity}
          roughness={glass.roughness * 0.6}
          metalness={0.15}
          reflectivity={0.85}
          transmission={0.94}
          clearcoat={0.85}
          clearcoatRoughness={0.16}
          thickness={0.6}
        />
      </mesh>

      {/* Lateral walls */}
      <mesh position={[profile.width / 2 + wall / 2, wallHeight / 2 + baseLipHeight, 0]} castShadow>
        <boxGeometry args={[wall, wallHeight, profile.depth + wall * 2]} />
        <meshPhysicalMaterial
          color={glass.tint}
          transparent
          opacity={glass.opacity}
          roughness={glass.roughness * 0.6}
          metalness={0.15}
          reflectivity={0.85}
          transmission={0.94}
          clearcoat={0.85}
          clearcoatRoughness={0.16}
          thickness={0.6}
        />
      </mesh>
      <mesh position={[-(profile.width / 2 + wall / 2), wallHeight / 2 + baseLipHeight, 0]} castShadow>
        <boxGeometry args={[wall, wallHeight, profile.depth + wall * 2]} />
        <meshPhysicalMaterial
          color={glass.tint}
          transparent
          opacity={glass.opacity}
          roughness={glass.roughness * 0.6}
          metalness={0.15}
          reflectivity={0.85}
          transmission={0.94}
          clearcoat={0.85}
          clearcoatRoughness={0.16}
          thickness={0.6}
        />
      </mesh>

      {/* Tinted top cover */}
      <mesh position={[0, wallHeight + baseLipHeight + topThickness / 2, 0]} receiveShadow>
        <boxGeometry args={[profile.width + wall * 2, topThickness, profile.depth + wall * 2]} />
        <meshPhysicalMaterial
          color={glass.tint}
          transparent
          opacity={Math.min(glass.opacity + 0.2, 0.92)}
          roughness={glass.roughness * 0.4}
          metalness={0.25}
          reflectivity={0.95}
          transmission={0.9}
          clearcoat={1}
          clearcoatRoughness={0.1}
          thickness={0.75}
        />
      </mesh>
    </group>
  );
};
