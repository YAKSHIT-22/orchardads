'use client';

import { Line, LineChart, ResponsiveContainer } from 'recharts';
import { cn } from '../cn';
import type { StatTone } from './tool-kit';

const SPARK_COLOR: Record<StatTone, string> = {
  neutral: 'var(--ink-faint)',
  positive: 'var(--applied)',
  attention: 'var(--attention)',
  risk: 'var(--risk)',
  iris: 'var(--iris)',
};

/** A small inline trend line for a StatTile - no axes, no grid, just shape.
 *  Pass real time-series data only; omit the prop entirely rather than
 *  fabricate a trend when no data has synced yet. */
export function Sparkline({
  data,
  tone = 'iris',
  className,
}: {
  data: number[];
  tone?: StatTone;
  className?: string;
}) {
  const points = data.map((v, i) => ({ i, v }));
  return (
    <div className={cn('h-6 w-16 shrink-0', className)} aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 2, right: 1, bottom: 2, left: 1 }}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={SPARK_COLOR[tone]}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
