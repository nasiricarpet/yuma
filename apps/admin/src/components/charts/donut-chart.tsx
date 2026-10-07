'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

export type DonutChartDatum = {
  name: string;
  value: number;
  color?: string;
};

export type DonutChartProps = {
  data: DonutChartDatum[];
  height?: number;
  formatValue?: (value: number) => string;
};

const DEFAULT_COLORS = [
  '#7c3aed',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#64748b',
];

export function DonutChart({
  data,
  height = 240,
  formatValue,
}: DonutChartProps) {
  const withColors = data.map((d, i) => ({
    ...d,
    color: d.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
  }));

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <ResponsiveContainer width="100%" height={height} className="max-w-[240px]">
        <PieChart>
          <Pie
            data={withColors}
            dataKey="value"
            nameKey="name"
            innerRadius={56}
            outerRadius={84}
            paddingAngle={2}
            stroke="none"
          >
            {withColors.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--popover))',
              color: 'hsl(var(--popover-foreground))',
              direction: 'rtl',
            }}
            formatter={(value) =>
              formatValue ? formatValue(value as number) : String(value)
            }
          />
        </PieChart>
      </ResponsiveContainer>

      <ul className="space-y-2">
        {withColors.map((entry) => (
          <li key={entry.name} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="mr-auto font-medium">
              {formatValue ? formatValue(entry.value) : entry.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
