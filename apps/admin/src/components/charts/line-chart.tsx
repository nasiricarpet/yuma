'use client';

import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type LineChartDatum = {
  label: string;
  value: number;
};

export type LineChartProps = {
  data: LineChartDatum[];
  color?: string;
  height?: number;
  formatValue?: (value: number) => string;
};

export function LineChart({
  data,
  color = 'var(--chart-1, #7c3aed)',
  height = 240,
  formatValue,
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
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
          cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
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
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
