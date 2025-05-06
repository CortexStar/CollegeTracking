import { useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

interface Props {
  semesters: { id: string; name: string; gpa: number }[];
}

/** Very‑minimal GPA trend line that auto‑resizes */
export default function GpaTrend({ semesters }: Props) {
  // Keep data stable between renders
  const data = useMemo(
    () =>
      semesters.map((s, i) => ({
        /* x */ idx: i + 1,
        /* y */ gpa: +s.gpa.toFixed(2),
        label: s.name,
      })),
    [semesters]
  );

  if (data.length <= 1) return null; // hide until at least 2 points

  return (
    <div className="w-full h-48 sm:h-56 lg:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          {/* --- minimalist axes --- */}
          <XAxis
            dataKey="idx"
            tickFormatter={(v, i) => data[i].label}
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 4]}
            ticks={[0, 1, 2, 3, 4]}
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          {/* --- simple monotone line --- */}
          <Line
            type="monotone"
            dataKey="gpa"
            stroke="currentColor"
            strokeWidth={2}
            dot={{ r: 3 }}
            isAnimationActive={false}
          />
          {/* subtle hover label */}
          <Tooltip
            contentStyle={{
              background: "rgba(0,0,0,0.75)",
              border: "none",
              borderRadius: "0.375rem",
              color: "#fff",
              fontSize: "0.75rem",
            }}
            labelFormatter={(_, idx) => data[idx].label}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
