import React from 'react';
import { cn } from '@/lib/utils';

export interface ActivityDay {
    date: string;
    success: number;
    error: number;
    total: number;
}

interface ActivityBarChartProps {
    data: ActivityDay[];
    height?: number;
    className?: string;
    showLegend?: boolean;
    compact?: boolean;
}

/**
 * Lightweight pure-SVG activity bar chart. No external chart library needed.
 * Renders a stacked bar chart with success (green) / error (red) segments.
 */
export const ActivityBarChart: React.FC<ActivityBarChartProps> = ({
    data,
    height = 120,
    className,
    showLegend = true,
    compact = false,
}) => {
    const maxVal = Math.max(...data.map(d => d.total), 1);
    const barCount = data.length;
    const svgWidth = 100; // percentage-based via viewBox
    const gap = 4;
    const barWidth = (svgWidth - gap * (barCount + 1)) / barCount;

    return (
        <div className={cn('w-full', className)}>
            <svg
                viewBox={`0 0 100 40`}
                preserveAspectRatio="none"
                className="w-full"
                style={{ height }}
                aria-label="Activity chart"
            >
                <defs>
                    <linearGradient id="successGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#16a34a" stopOpacity="0.7" />
                    </linearGradient>
                    <linearGradient id="errorGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#dc2626" stopOpacity="0.7" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="0.5" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Grid lines */}
                {[0.25, 0.5, 0.75, 1].map((frac) => (
                    <line
                        key={frac}
                        x1="0" y1={40 - frac * 36}
                        x2="100" y2={40 - frac * 36}
                        stroke="currentColor"
                        strokeOpacity="0.06"
                        strokeWidth="0.3"
                    />
                ))}

                {data.map((day, i) => {
                    const x = gap + i * (barWidth + gap);
                    const totalH = (day.total / maxVal) * 36;
                    const successH = day.total > 0 ? (day.success / day.total) * totalH : 0;
                    const errorH = totalH - successH;

                    return (
                        <g key={i}>
                            {/* Empty bar background */}
                            <rect
                                x={x} y={4} width={barWidth} height={36}
                                rx="1" fill="currentColor" fillOpacity="0.04"
                            />
                            {/* Error portion (bottom) */}
                            {errorH > 0.2 && (
                                <rect
                                    x={x}
                                    y={40 - errorH}
                                    width={barWidth}
                                    height={errorH}
                                    rx="0.8"
                                    fill="url(#errorGrad)"
                                    filter="url(#glow)"
                                />
                            )}
                            {/* Success portion (top) */}
                            {successH > 0.2 && (
                                <rect
                                    x={x}
                                    y={40 - totalH}
                                    width={barWidth}
                                    height={successH}
                                    rx="0.8"
                                    fill="url(#successGrad)"
                                    filter="url(#glow)"
                                />
                            )}
                        </g>
                    );
                })}
            </svg>

            {/* X-axis labels */}
            {!compact && (
                <div className="flex justify-between mt-1 px-[2px]">
                    {data.map((day, i) => (
                        <span key={i} className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wide text-center" style={{ width: `${100 / barCount}%` }}>
                            {day.date}
                        </span>
                    ))}
                </div>
            )}

            {/* Legend */}
            {showLegend && (
                <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-sm bg-green-500" />
                        <span className="text-[10px] font-semibold text-muted-foreground">Success</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-sm bg-red-500" />
                        <span className="text-[10px] font-semibold text-muted-foreground">Error</span>
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * Spark-line style mini chart for compact spaces (e.g. stat cards)
 */
export const SparkLine: React.FC<{ data: number[]; color?: string; className?: string }> = ({
    data,
    color = '#6366f1',
    className
}) => {
    const max = Math.max(...data, 1);
    const points = data.map((v, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 40 - (v / max) * 36;
        return `${x},${y}`;
    }).join(' ');

    const areaPoints = `0,40 ${points} 100,40`;

    return (
        <svg
            viewBox="0 0 100 40"
            preserveAspectRatio="none"
            className={cn('w-full', className)}
            aria-hidden="true"
        >
            <defs>
                <linearGradient id={`sparkGrad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon
                points={areaPoints}
                fill={`url(#sparkGrad-${color.replace('#', '')})`}
            />
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
        </svg>
    );
};

/**
 * Donut / ring chart for showing a single percentage value.
 */
export const RingChart: React.FC<{
    value: number; // 0-100
    size?: number;
    strokeWidth?: number;
    color?: string;
    label?: string;
    className?: string;
}> = ({ value, size = 80, strokeWidth = 8, color = '#22c55e', label, className }) => {
    const r = (size - strokeWidth) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (value / 100) * circ;

    return (
        <div className={cn('flex flex-col items-center gap-1', className)}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Background ring */}
                <circle
                    cx={size / 2} cy={size / 2} r={r}
                    fill="none"
                    stroke="currentColor"
                    strokeOpacity="0.08"
                    strokeWidth={strokeWidth}
                />
                {/* Value arc */}
                <circle
                    cx={size / 2} cy={size / 2} r={r}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
                <text
                    x={size / 2} y={size / 2}
                    textAnchor="middle" dominantBaseline="central"
                    fontSize={size / 5}
                    fontWeight="800"
                    fill="currentColor"
                >
                    {value}%
                </text>
            </svg>
            {label && <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</span>}
        </div>
    );
};
