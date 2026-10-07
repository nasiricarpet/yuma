'use client';

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type BarChartDatum = {
  label: string;
  value: number;
};

export type BarChartProps = {
  data: BarChartDatum[];
  color?: string;
  height?: number;
  formatValue?: (value: number) => string;
};

export function BarChart({
  data,
  color = 'var(--chart-2, #0ea5e9)',
  height = 240,
  formatValue,
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          reversed
          tick={{ fontSize: 12 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          orientation="right"
          width={48}
          tick={{ fontSize: 12 }}
          tickFormatter={formatValue}
        />
        <Tooltip
          cursor={{ fill: 'hsl(var(--muted))' }}
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
        <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} maxBarSize={48} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
