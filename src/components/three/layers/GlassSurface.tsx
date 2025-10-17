import { GlassSettings } from '../../../types/design';

interface GlassSurfaceProps {
  glass: GlassSettings;
}

export const GlassSurface = ({ glass }: GlassSurfaceProps) => (
  <mesh position={[0, glass.thickness / 2 + 0.01, 0]} receiveShadow castShadow>
    <boxGeometry args={[6, glass.thickness, 6]} />
    <meshPhysicalMaterial
      color={glass.tint}
      transparent
      opacity={glass.opacity}
      metalness={0.2}
      roughness={glass.roughness}
      transmission={0.8}
      reflectivity={0.4}
      clearcoat={0.6}
      clearcoatRoughness={0.05}
      envMapIntensity={1.2}
    />
  </mesh>
);
