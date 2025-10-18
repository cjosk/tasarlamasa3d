import clsx from 'clsx';

export const NEON_PALETTE = [
  '#FFF3C8',
  '#FF42A1',
  '#FF3E30',
  '#FFF500',
  '#52B9FF',
  '#0017A5',
  '#4DFF6E',
  '#551D95',
  '#FFD21E'
] as const;

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export const ColorPicker = ({ value, onChange }: ColorPickerProps) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 rounded-3xl border border-slate-700/70 bg-slate-900/80 p-4">
      {NEON_PALETTE.map((color) => {
        const isActive = value.toLowerCase() === color.toLowerCase();
        const glowShadow = `0 0 12px ${color}80, 0 0 24px ${color}40`;
        return (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            style={{
              backgroundColor: color,
              boxShadow: isActive
                ? `${glowShadow}, 0 0 0 4px rgba(15,23,42,0.9), 0 0 0 6px ${color}`
                : glowShadow
            }}
            className={clsx(
              'h-12 w-12 rounded-full transition-transform duration-150 ease-micro',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
              'hover:scale-105 active:scale-95'
            )}
            aria-label={`Select ${color} neon`}
            data-color={color}
          >
            <span className="sr-only">{color}</span>
          </button>
        );
      })}
    </div>
  );
};
