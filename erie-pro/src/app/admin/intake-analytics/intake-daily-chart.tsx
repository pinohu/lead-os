"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

interface DailyPoint {
  date: string; // YYYY-MM-DD
  total: number;
  completed: number;
}

export default function IntakeDailyChart({ data }: { data: DailyPoint[] }) {
  // Trim to MM-DD on the axis for legibility
  const points = data.map((p) => ({
    ...p,
    label: p.date.slice(5), // MM-DD
  }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip
            formatter={(value: unknown, name: unknown) => [String(value), String(name)]}
            labelFormatter={(label: unknown) => `Date: ${String(label)}`}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="total"
            name="Total conversations"
            stroke="#0ea5e9"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="completed"
            name="Completed"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
