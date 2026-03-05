interface ZoomSliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
}

export default function ZoomSlider({ min, max, step = 0.1, value, onChange }: ZoomSliderProps) {
  return (
    <div className="flex items-center gap-2 px-3">
      <span className="text-white/70 text-xs font-medium w-6 text-center">
        {min.toFixed(0)}×
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #0DAADB ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.3) 0%)`,
        }}
      />
      <span className="text-white/70 text-xs font-medium w-6 text-center">
        {max.toFixed(0)}×
      </span>
    </div>
  );
}
