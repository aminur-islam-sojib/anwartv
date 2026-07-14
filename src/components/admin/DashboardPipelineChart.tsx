"use client";

import { Pie, PieChart, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface PipelineChartProps {
  data: { status: string; label: string; count: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  draft: "var(--chart-1)",
  in_review: "var(--chart-2)",
  scheduled: "var(--chart-3)",
  published: "var(--chart-4)",
  archived: "var(--chart-5)",
};

const chartConfig = {
  count: { label: "আর্টিকেল সংখ্যা" },
  draft: { label: "ড্রাফট", color: "var(--chart-1)" },
  in_review: { label: "পর্যালোচনায়", color: "var(--chart-2)" },
  scheduled: { label: "শিডিউলড", color: "var(--chart-3)" },
  published: { label: "প্রকাশিত", color: "var(--chart-4)" },
  archived: { label: "আর্কাইভড", color: "var(--chart-5)" },
} satisfies ChartConfig;

export default function DashboardPipelineChart({ data }: PipelineChartProps) {
  const chartData = data
    .filter((d) => d.count > 0) // hide empty slices, cleaner donut
    .map((d) => ({
      ...d,
      fill: STATUS_COLORS[d.status] || "var(--chart-1)",
    }));

  if (chartData.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-10">
        কোনো আর্টিকেল ডেটা নেই।
      </p>
    );
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square max-h-[280px]"
    >
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Pie
          data={chartData}
          dataKey="count"
          nameKey="label"
          innerRadius={60}
          strokeWidth={4}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey="label" />}
          className="-translate-y-2 flex-wrap gap-2 *:basis-1/3 *:justify-center"
        />
      </PieChart>
    </ChartContainer>
  );
}