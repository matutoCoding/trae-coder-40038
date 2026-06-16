interface LevelGaugeProps {
  value: number;
  min?: number;
  max?: number;
  unit?: string;
  label?: string;
  height?: number;
  color?: string;
}

export default function LevelGauge({
  value,
  min = 0,
  max = 100,
  unit = '%',
  label,
  height = 200,
  color = '#0c8ef0',
}: LevelGaugeProps) {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <div className="flex flex-col items-center">
      {label && <p className="text-sm text-steel-400 mb-2">{label}</p>}
      <div
        className="relative w-16 bg-steel-800 rounded-lg border border-steel-600 overflow-hidden"
        style={{ height: `${height}px` }}
      >
        <div className="absolute inset-x-0 top-0 bottom-0 flex flex-col justify-between py-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-px bg-steel-600/50 mx-1"></div>
          ))}
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out"
          style={{
            height: `${percentage}%`,
            background: `linear-gradient(to top, ${color}, ${color}80)`,
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-1 animate-pulse"
            style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
          ></div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span className="font-mono text-lg font-bold text-white drop-shadow-lg">
              {value.toFixed(1)}
            </span>
            <span className="text-xs text-steel-200 ml-0.5">{unit}</span>
          </div>
        </div>
      </div>
      <div className="flex justify-between w-full mt-1 text-xs text-steel-500">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}
