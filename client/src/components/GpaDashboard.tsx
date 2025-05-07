import React, { useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceArea,
  CartesianGrid,
  Area,
} from "recharts";
import { motion } from "framer-motion";

/** ----------------------------------------------------------------------------
 * GPA DASHBOARD – 2025 "Sonoma" design rev.
 * A minimal, glass‑like card with a silky gradient chart line.
 * Matches Apple / OpenAI aesthetic: roomy, calm, focusses on data.
 *
 * 👉 Drop in Tailwind + shadcn/ui environment. Animates with Framer Motion.
 * ---------------------------------------------------------------------------*/

export interface Semester {
  id: string;
  term: string;
  yearLevel: "Freshman" | "Sophomore" | "Junior" | "Senior";
  gpa: number | null;
}

interface Props {
  semesters: Semester[];
}

const HIGH = "#4f46e5"; // indigo‑600
const AVG = "#0ea5e9"; // sky‑500
const LOW = "#64748b"; // slate‑500
const GRADIENT_FROM = "#4f46e5"; // same as HIGH
const GRADIENT_TO = "#0ea5e9"; // same as AVG

const GpaDashboard: React.FC<Props> = ({ semesters }) => {
  const [mode, setMode] = useState<"history" | "forecast">("history");

  const completed = useMemo(
    () => semesters.filter((s) => s.gpa !== null) as Required<Semester>[],
    [semesters]
  );
  const avgGpa = useMemo(() => {
    if (!completed.length) return 0;
    return completed.reduce((acc, s) => acc + (s.gpa || 0), 0) / completed.length;
  }, [completed]);

  const lastReal = completed[completed.length - 1]?.gpa ?? 0;

  // Generate future semesters for the forecast view
  const withForecast = useMemo(() => {
    // First, include all existing semesters with their completed data
    const result = semesters.map(s => {
      if (s.gpa !== null) {
        // Copy values so the forecast line joins history seamlessly
        return { ...s, avg: s.gpa, high: s.gpa, low: s.gpa };
      }
      // pending semester
      return {
        ...s,
        avg: lastReal,
        high: Math.min(4, lastReal + 0.3),
        low: Math.max(0, lastReal - 0.3),
      };
    });

    // If there are no completed semesters, just return the empty result
    if (!completed.length) return result;

    // Get the last semester to determine where to start generating future ones
    const lastSemester = semesters[semesters.length - 1];
    
    // Extract the term info to determine what comes next
    const lastTermText = lastSemester.term;
    let season = "Fall";
    let year = new Date().getFullYear();
    let yearLevel = lastSemester.yearLevel;
    
    // Try to extract season and year from the last term
    if (lastTermText.includes("Fall")) {
      season = "Spring";
      const match = lastTermText.match(/\d{4}/);
      if (match) year = parseInt(match[0]);
    } else if (lastTermText.includes("Spring")) {
      season = "Fall";
      const match = lastTermText.match(/\d{4}/);
      if (match) year = parseInt(match[0]);
    }
    
    // Get the index in the academic progression
    const levelOrder = ["Freshman", "Sophomore", "Junior", "Senior"] as const;
    let levelIndex = levelOrder.indexOf(yearLevel as any);
    if (levelIndex === -1) levelIndex = 0;
    
    // After Spring semester, advance to next year level
    if (season === "Fall" && levelIndex < levelOrder.length - 1) {
      levelIndex++;
    }

    // Configure forecast settings
    const classAverage = avgGpa;        // reuse what you've computed
    const horizon = 6;                 // # of future semesters
    let semesterCount = 0;
    
    // Generate future semesters until we reach Senior Spring
    while (!(yearLevel === "Senior" && season === "Spring")) {
      // Create the next semester
      const nextId = `forecast-${season}-${year}`;
      const nextTerm = `${season} ${year}`;
      const nextYearLevel = levelOrder[levelIndex] as "Freshman" | "Sophomore" | "Junior" | "Senior";
      
      // Calculate fraction of progress (0 to 1) through the forecast period
      const step = semesterCount / horizon;
      
      // Add to results with a trending forecast
      result.push({
        id: nextId,
        term: nextTerm,
        yearLevel: nextYearLevel,
        gpa: null,
        avg: lastReal + (classAverage - lastReal) * step,
        high: Math.min(4, lastReal + 0.4 - 0.1 * step),
        low: Math.max(0, lastReal - 0.4 + 0.1 * step),
      });
      
      semesterCount++;
      
      // Advance to next term
      if (season === "Fall") {
        season = "Spring";
      } else {
        season = "Fall";
        year++;
        // After Spring semester, advance to next year level
        if (levelIndex < levelOrder.length - 1) {
          levelIndex++;
        }
      }
      
      // Update year level for the loop condition
      yearLevel = levelOrder[levelIndex] as "Freshman" | "Sophomore" | "Junior" | "Senior";
      
      // Safety check to avoid infinite loops
      if (result.length > 20) break;
    }
    
    return result;
  }, [semesters, completed, lastReal]);

  const chartData = mode === "history" ? semesters : withForecast;

  return (
    <Card className="w-full max-w-4xl mx-auto backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border border-white/30 dark:border-slate-700/40 shadow-xl rounded-2xl pb-4">
      <CardHeader className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 p-6">
        <div>
          <h2 className="sr-only">GPA Overview</h2>
          <CardTitle className="text-3xl font-semibold tracking-tight">GPA Overview</CardTitle>
          <p className="text-muted-foreground text-sm">
            {mode === "history" ? "Historical performance by semester" : "Projected GPA confidence bands"}
          </p>
        </div>
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(v) => v && setMode(v as any)}
          className="border border-slate-300 dark:border-slate-700 rounded-full overflow-hidden backdrop-blur-sm"
        >
          <ToggleGroupItem className="px-4 py-1" value="history">
            History
          </ToggleGroupItem>
          <ToggleGroupItem className="px-4 py-1" value="forecast">
            Forecast
          </ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>

      <CardContent className="p-0">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="w-full h-[460px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 36, left: 12, bottom: 24 }}>

              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
              <XAxis
                dataKey="term"
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                padding={{ left: 10, right: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 4]}
                tickCount={5}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              />
              <Tooltip
                contentStyle={{ backdropFilter: "blur(6px)", background: "rgba(255,255,255,0.7)", borderRadius: 12, border: "none" }}
                labelFormatter={(term) => `Term: ${term}`}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: 16 }} />

              {/* Year shading */}
              {(["Freshman", "Sophomore", "Junior", "Senior"] as const).map((level) => {
                // Use the current mode's data for shading
                const currentData = mode === "history" ? semesters : withForecast;
                const indices = currentData
                  .map((s, i) => (s.yearLevel === level ? i : -1))
                  .filter((i) => i !== -1);
                if (!indices.length) return null;
                const [start, end] = [Math.min(...indices) - 0.5, Math.max(...indices) + 0.5];
                return (
                  <ReferenceArea
                    key={level}
                    x1={start}
                    x2={end}
                    strokeOpacity={0}
                    fillOpacity={0.04}
                    label={{ value: level, position: "insideTopLeft", dominantBaseline: "text-before-edge", fill: "var(--muted-foreground)", fontSize: 11 }}
                  />
                );
              })}

              {/* Lines */}
              {mode === "history" ? (
                <Line
                  type="monotone"
                  dataKey="gpa"
                  name="GPA"
                  stroke={GRADIENT_FROM}
                  strokeWidth={3}
                  strokeLinecap="round"
                  dot={{ r: 6, stroke: "white", strokeWidth: 2, fill: GRADIENT_FROM }}
                  isAnimationActive={false}
                />
              ) : (
                <>
                  {/* Area between high and low */}
                  <Area
                    type="monotone"
                    dataKey="high"
                    stackId="band"
                    fillOpacity={0.06}
                    stroke="transparent"
                    fill={HIGH}
                    activeDot={false}
                    connectNulls
                  />
                  <Area
                    type="monotone"
                    dataKey="low"
                    stackId="band"
                    fillOpacity={0}
                    stroke="transparent"
                    fill="#ffffff"
                    activeDot={false}
                    connectNulls
                  />
                
                  <Line
                    type="monotone"
                    dataKey="avg"
                    name="Avg Forecast"
                    stroke={AVG}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeDasharray="4 4"
                    dot={false}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="high"
                    name="High Possibility"
                    stroke={HIGH}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    dot={false}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="low"
                    name="Low Possibility"
                    stroke={"#475569"} 
                    strokeWidth={2}
                    strokeLinecap="round"
                    dot={false}
                    connectNulls
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default GpaDashboard;