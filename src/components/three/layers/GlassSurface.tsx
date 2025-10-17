import { GlassSettings } from '../../../types/design';
import { TABLE_DIMENSIONS } from './tableDimensions';

interface GlassSurfaceProps {
  glass: GlassSettings;
}

const { width, depth, glassWallThickness } = TABLE_DIMENSIONS;

export const GlassSurface = ({ glass }: GlassSurfaceProps) => {
  const height = Math.max(glass.thickness, 0.2);
  const wall = glassWallThickness;
  const topThickness = wall * 1.2;
  const enclosureY = height / 2;
  const postHeight = Math.max(height - topThickness * 1.2, 0.24);
  const postInsetX = width / 2 - 0.28;
  const postInsetZ = depth / 2 - 0.2;
  const postRadius = 0.035;

  return (
    <group position={[0, enclosureY, 0]} name="NeonTable_Glass">
      {/* Longitudinal walls */}
      <mesh position={[0, 0, depth / 2 + wall / 2]} castShadow>
        <boxGeometry args={[width + wall * 2, height, wall]} />
        <meshPhysicalMaterial
          color={glass.tint}
          transparent
          opacity={glass.opacity}
          roughness={glass.roughness * 0.6}
          metalness={0.15}
          reflectivity={0.85}
          transmission={0.98}
          clearcoat={0.8}
          clearcoatRoughness={0.18}
          thickness={0.6}
        />
      </mesh>
      <mesh position={[0, 0, -(depth / 2 + wall / 2)]} castShadow>
        <boxGeometry args={[width + wall * 2, height, wall]} />
        <meshPhysicalMaterial
          color={glass.tint}
          transparent
          opacity={glass.opacity}
          roughness={glass.roughness * 0.6}
          metalness={0.15}
          reflectivity={0.85}
          transmission={0.98}
          clearcoat={0.8}
          clearcoatRoughness={0.18}
          thickness={0.6}
        />
      </mesh>

      {/* Lateral walls */}
      <mesh position={[width / 2 + wall / 2, 0, 0]} castShadow>
        <boxGeometry args={[wall, height, depth + wall * 2]} />
        <meshPhysicalMaterial
          color={glass.tint}
          transparent
          opacity={glass.opacity}
          roughness={glass.roughness * 0.6}
          metalness={0.15}
          reflectivity={0.85}
          transmission={0.98}
          clearcoat={0.8}
          clearcoatRoughness={0.18}
          thickness={0.6}
        />
      </mesh>
      <mesh position={[-(width / 2 + wall / 2), 0, 0]} castShadow>
        <boxGeometry args={[wall, height, depth + wall * 2]} />
        <meshPhysicalMaterial
          color={glass.tint}
          transparent
          opacity={glass.opacity}
          roughness={glass.roughness * 0.6}
          metalness={0.15}
          reflectivity={0.85}
          transmission={0.98}
          clearcoat={0.8}
          clearcoatRoughness={0.18}
          thickness={0.6}
        />
      </mesh>

      {/* Tinted top cover */}
      <mesh position={[0, height / 2 + topThickness / 2, 0]} receiveShadow>
        <boxGeometry args={[width + wall * 2, topThickness, depth + wall * 2]} />
        <meshPhysicalMaterial
          color={glass.tint}
          transparent
          opacity={Math.min(glass.opacity + 0.1, 0.92)}
          roughness={glass.roughness * 0.4}
          metalness={0.25}
          reflectivity={0.95}
          transmission={0.92}
          clearcoat={1}
          clearcoatRoughness={0.1}
          thickness={0.8}
        />
      </mesh>

      {/* Slim supports to echo the reference neon table */}
      {[1, -1].flatMap((dirX) =>
        [1, -1].map((dirZ) => (
          <mesh
            key={`support-${dirX}-${dirZ}`}
            position={[postInsetX * dirX, -height / 2 + postHeight / 2, postInsetZ * dirZ]}
            castShadow
            receiveShadow
          >
            <cylinderGeometry args={[postRadius, postRadius * 0.8, postHeight, 18]} />
            <meshStandardMaterial color="#0b1729" metalness={0.3} roughness={0.55} />
          </mesh>
        ))
      )}

    </group>
  );
};
