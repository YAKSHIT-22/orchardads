'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { cn } from '../cn';
import { CHART } from './tool-kit';

export type TrendSeries = { key: string; label: string; color?: string };

const RAMP = [CHART.a, CHART.b, CHART.c];

/** Full-width area/line chart on the neutral cyan/teal ramp. When `data` is
 *  empty or omitted it renders the same dashed "no data yet" shell as
 *  ChartPlaceholder, so a tool can drop this in before a live series exists
 *  and get real charting for free once one is wired. */
export function TrendChart({
  data,
  xKey,
  series,
  height = 220,
  emptyLabel = 'Chart renders once enough data has synced',
  className,
}: {
  data?: Record<string, number | string>[];
  xKey: string;
  series: TrendSeries[];
  height?: number;
  emptyLabel?: string;
  className?: string;
}) {
  if (!data || data.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-1 rounded-md border border-dashed border-rule bg-paper-sunk',
          className,
        )}
        style={{ height }}
      >
        <span className="font-ui text-[12px] text-ink-faint">{emptyLabel}</span>
      </div>
    );
  }
  return (
    <div className={cn('rounded-md border border-rule bg-paper p-3', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis
            dataKey={xKey}
            stroke={CHART.axis}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis stroke={CHART.axis} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={38} />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: '1px solid var(--rule)',
              fontSize: 12,
              background: 'var(--paper)',
            }}
          />
          {series.map((s, i) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color ?? RAMP[i % RAMP.length]}
              fill={s.color ?? RAMP[i % RAMP.length]}
              fillOpacity={0.12}
              strokeWidth={1.75}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
