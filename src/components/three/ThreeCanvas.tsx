import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html } from '@react-three/drei';
import { Suspense, useMemo } from 'react';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { NeonShapeMesh } from './NeonShapeMesh';
import { useDesignStore, selectCurrentDesign } from '../../state/designStore';
import { GlassSurface } from './layers/GlassSurface';
import { TableSurface } from './layers/TableSurface';
import { useDesignContext } from '../../providers/DesignProvider';

export const ThreeCanvas = () => {
  const { canvasRef } = useDesignContext();
  const design = useDesignStore(selectCurrentDesign);
  const performance = useDesignStore((state) => state.performance);
  const transformMode = useDesignStore((state) => state.transformMode);
  const shapes = design.shapes;

  const bloomConfig = useMemo(
    () => ({
      intensity: performance === 'high' ? 1.4 : 0.4,
      luminanceThreshold: 0.2,
      luminanceSmoothing: 0.9
    }),
    [performance]
  );

  return (
    <div ref={canvasRef} className="relative h-full w-full">
      <Canvas
        shadows
        camera={{ position: [6, 6, 6], fov: 45, near: 0.1, far: 100 }}
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
      >
        <color attach="background" args={[0.05, 0.08, 0.16]} />
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[6, 10, 4]}
          intensity={0.6}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <Suspense
          fallback={
            <Html center>
              <div className="rounded-full border border-slate-700/80 bg-slate-900/80 px-4 py-2 text-xs text-slate-400">
                Loading scene…
              </div>
            </Html>
          }
        >
          <group position={[0, 0, 0]}>
            <TableSurface />
            {design.glass.enabled && <GlassSurface glass={design.glass} />}
            {shapes.map((shape) => (
              <NeonShapeMesh key={shape.id} shape={shape} transformMode={transformMode} />
            ))}
          </group>
          <ContactShadows position={[0, -0.001, 0]} opacity={0.5} scale={10} blur={2} far={10} />
          <Environment preset="city" />
          <OrbitControls
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={(2 * Math.PI) / 3}
            minDistance={2}
            maxDistance={12}
            enableDamping
            dampingFactor={0.1}
          />
          {performance === 'high' && (
            <EffectComposer multisampling={4} autoClear>
              <Bloom
                intensity={bloomConfig.intensity}
                luminanceThreshold={bloomConfig.luminanceThreshold}
                luminanceSmoothing={bloomConfig.luminanceSmoothing}
              />
            </EffectComposer>
          )}
        </Suspense>
      </Canvas>
    </div>
  );
};
