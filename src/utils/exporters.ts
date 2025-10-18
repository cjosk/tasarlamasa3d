import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

export const exportSceneToGlb = (element: HTMLElement) =>
  new Promise<Blob>((resolve, reject) => {
    const exporter = new GLTFExporter();
    const canvas = element.querySelector('canvas');
    const scene = (canvas as any)?.__r3f?.root?.store?.getState()?.scene;

    if (!scene) {
      reject(new Error('Scene not available for export'));
      return;
    }

    exporter.parse(
      scene,
      (result) => {
        if (result instanceof ArrayBuffer) {
          resolve(new Blob([result], { type: 'model/gltf-binary' }));
        } else {
          const json = JSON.stringify(result);
          resolve(new Blob([json], { type: 'model/gltf+json' }));
        }
      },
      (error) => reject(error),
      { binary: true }
    );
  });
