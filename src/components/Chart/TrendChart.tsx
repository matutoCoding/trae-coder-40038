import { useEffect, useRef } from 'react';

interface TrendChartProps {
  data: { time: number; value: number }[];
  color?: string;
  height?: number;
  yMin?: number;
  yMax?: number;
  showGrid?: boolean;
  unit?: string;
  label?: string;
}

export default function TrendChart({
  data,
  color = '#0c8ef0',
  height = 180,
  yMin,
  yMax,
  showGrid = true,
  unit = '',
  label,
}: TrendChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const chartHeight = height - 30;
    const padding = { top: 20, right: 10, bottom: 20, left: 10 };
    const chartWidth = width - padding.left - padding.right;

    ctx.clearRect(0, 0, width, height);

    const values = data.map((d) => d.value);
    const minVal = yMin ?? Math.min(...values) - 10;
    const maxVal = yMax ?? Math.max(...values) + 10;
    const range = maxVal - minVal || 1;

    if (showGrid) {
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.3)';
      ctx.lineWidth = 1;

      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
      }
    }

    const gradient = ctx.createLinearGradient(0, padding.top, 0, chartHeight + padding.top);
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(1, color + '05');

    ctx.beginPath();
    ctx.moveTo(padding.left, chartHeight + padding.top);

    data.forEach((point, i) => {
      const x = padding.left + (i / (data.length - 1)) * chartWidth;
      const y =
        padding.top + chartHeight - ((point.value - minVal) / range) * chartHeight;
      if (i === 0) {
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.lineTo(width - padding.right, chartHeight + padding.top);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    data.forEach((point, i) => {
      const x = padding.left + (i / (data.length - 1)) * chartWidth;
      const y =
        padding.top + chartHeight - ((point.value - minVal) / range) * chartHeight;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    const lastPoint = data[data.length - 1];
    const lastX = width - padding.right;
    const lastY =
      padding.top + chartHeight - ((lastPoint.value - minVal) / range) * chartHeight;

    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(maxVal.toFixed(0) + unit, padding.left - 5, padding.top + 4);
    ctx.fillText(minVal.toFixed(0) + unit, padding.left - 5, chartHeight + padding.top);

    if (label) {
      ctx.fillStyle = '#64748b';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(label, width - padding.right, height - 5);
    }
  }, [data, color, height, yMin, yMax, showGrid, unit, label]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: `${height}px` }}
      className="w-full"
    />
  );
}
