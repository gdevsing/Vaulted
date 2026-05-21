"use client";

import { useTheme } from "@/app/layout";

export default function Sparkline({ data, color, height = 40, width = 120 }) {
  const { theme } = useTheme();
  if (!data || data.length < 2) return null;

  const values = data.map(d => d.value || d);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * height * 0.85 - height * 0.075;
    return `${x},${y}`;
  });

  const polyline = pts.join(" ");
  const firstPt = pts[0].split(",");
  const lastPt  = pts[pts.length - 1].split(",");

  const fillPath = `M ${firstPt[0]},${height} L ${polyline.replace(/,/g, " L ").split(" L ").map(p => p).join(" L ")} L ${lastPt[0]},${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`sg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#sg-${color.replace("#","")})`} />
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle cx={lastPt[0]} cy={lastPt[1]} r="3" fill={color} />
    </svg>
  );
}
