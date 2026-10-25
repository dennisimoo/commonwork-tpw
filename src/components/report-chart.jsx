import { BarChart, Bar, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { fmt, fmtRange } from "./controls";
export const monthLabel = (month) =>
  new Date(month + "-01T00:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
const config = {
  participants: { label: "Began", color: "var(--foreground)" },
  completions: { label: "Completed", color: "var(--foreground)" },
};
export default function ReportChart({ months, metric }) {
  const data = months.map((month) => ({
    ...month,
    [metric]: month[
      metric === "participants" ? "knownParticipants" : "knownCompletions"
    ]
      ? month[metric]
      : null,
  }));
  const max = Math.max(1, ...data.map((d) => d[metric] || 0)),
    step = 840 / Math.max(1, data.length);
  return (
    <>
      <ChartContainer config={config} className="report-live-chart">
        <BarChart
          accessibilityLayer
          data={data}
          margin={{ top: 12, right: 8, bottom: 4, left: -20 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            minTickGap={20}
            tickFormatter={monthLabel}
          />
          <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                labelFormatter={(month) =>
                  new Date(month + "-01T00:00:00Z").toLocaleDateString(
                    "en-US",
                    { month: "long", year: "numeric", timeZone: "UTC" },
                  )
                }
                formatter={(value, name, item) => (
                  <div className="flex flex-col gap-1">
                    <span>
                      {config[metric].label}:{" "}
                      <strong>
                        {fmtRange(
                          value,
                          item.payload[
                            metric === "participants"
                              ? "participantsMax"
                              : "completionsMax"
                          ],
                        )}
                      </strong>
                    </span>
                    <span className="text-muted-foreground">
                      {item.payload.records}{" "}
                      {item.payload.records === 1 ? "report" : "reports"}
                    </span>
                    {item.payload[
                      metric === "participants"
                        ? "knownParticipants"
                        : "knownCompletions"
                    ] < item.payload.records && (
                      <span className="text-muted-foreground">
                        {item.payload.records -
                          item.payload[
                            metric === "participants"
                              ? "knownParticipants"
                              : "knownCompletions"
                          ]}{" "}
                        missing{" "}
                        {item.payload.records -
                          item.payload[
                            metric === "participants"
                              ? "knownParticipants"
                              : "knownCompletions"
                          ] ===
                        1
                          ? "count"
                          : "counts"}
                      </span>
                    )}
                  </div>
                )}
              />
            }
          />
          <Bar
            dataKey={metric}
            fill={`var(--color-${metric})`}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ChartContainer>
      <svg
        className="report-print-chart"
        viewBox="0 0 900 330"
        role="img"
        aria-label={`${config[metric].label} by start month`}
      >
        <title>{config[metric].label} by course start month</title>
        <text x="40" y="20" fontSize="18" fill="#222">
          {config[metric].label} by course start month
        </text>
        <line x1="40" x2="880" y1="205" y2="205" stroke="#aaa" />
        {data.map((d, i) => {
          const height = (160 * (d[metric] || 0)) / max,
            x = 40 + i * step;
          return (
            <g key={d.month}>
              <rect
                x={x + step * 0.2}
                y={205 - height}
                width={step * 0.6}
                height={height}
                fill="#202020"
                rx="3"
              />
              <text
                x={x + step / 2}
                y={Math.min(193, 197 - height)}
                textAnchor="middle"
                fontSize="14"
                fill="#222"
              >
                {d[metric] == null ? "—" : fmt(d[metric])}
              </text>
              {(i % Math.max(1, Math.ceil(data.length / 8)) === 0 ||
                i === data.length - 1) && (
                <text
                  x={x + step / 2}
                  y="240"
                  textAnchor="end"
                  transform={`rotate(-35 ${x + step / 2} 240)`}
                  fontSize="15"
                  fill="#555"
                >
                  {monthLabel(d.month)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </>
  );
}
