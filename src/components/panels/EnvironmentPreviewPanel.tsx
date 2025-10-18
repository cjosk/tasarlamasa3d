import clsx from 'clsx';
import { useMemo } from 'react';
import { useDesignStore } from '../../state/designStore';

type EnvironmentOption = {
  id: string;
  label: string;
  img: string;
  hdr: string;
};

const ENVIRONMENTS: readonly EnvironmentOption[] = [
  {
    id: 'studio',
    label: 'Studio',
    img: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/neon_photostudio.jpg',
    hdr: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/neon_photostudio_1k.hdr'
  },
  {
    id: 'gym',
    label: 'Gym',
    img: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/gym_entrance.jpg',
    hdr: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/gym_entrance_1k.hdr'
  },
  {
    id: 'office',
    label: 'Office',
    img: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/modern_office.jpg',
    hdr: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/modern_office_1k.hdr'
  },
  {
    id: 'club',
    label: 'Club',
    img: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/neon_club.jpg',
    hdr: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/neon_club_1k.hdr'
  },
  {
    id: 'kuafor',
    label: 'Kuaför',
    img: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/hairdresser_interior.jpg',
    hdr: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/hairdresser_interior_1k.hdr'
  }
] as const;

export const EnvironmentPreviewPanel = () => {
  const environment = useDesignStore((state) => state.environment);
  const setEnvironment = useDesignStore((state) => state.setEnvironment);

  const activeEnvironmentId = useMemo(() => {
    const match = ENVIRONMENTS.find((option) => option.hdr === environment);
    return match?.id ?? ENVIRONMENTS[0]?.id ?? 'studio';
  }, [environment]);

  const handleSelect = (option: EnvironmentOption) => {
    setEnvironment(option.hdr);
  };

  return (
    <div className="pointer-events-auto fixed bottom-5 left-5 z-40 flex gap-2 rounded-2xl border border-slate-700/60 bg-slate-900/70 p-2 shadow-[0_0_25px_rgba(0,0,0,0.5)] backdrop-blur-lg">
      {ENVIRONMENTS.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => handleSelect(option)}
          className={clsx(
            'h-14 w-14 overflow-hidden rounded-xl border transition-all duration-200 ease-out hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
            activeEnvironmentId === option.id
              ? 'border-neon-blue shadow-[0_0_18px_rgba(82,185,255,0.5)]'
              : 'border-slate-700 hover:border-slate-500'
          )}
          aria-label={`${option.label} ortamını seç`}
        >
          <img src={option.img} alt={option.label} className="h-full w-full object-cover" />
        </button>
      ))}
    </div>
  );
};
