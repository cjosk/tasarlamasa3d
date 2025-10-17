export const TableSurface = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
    <circleGeometry args={[3, 64]} />
    <meshStandardMaterial
      color="#111827"
      roughness={0.6}
      metalness={0.1}
      envMapIntensity={0.3}
    />
  </mesh>
);
