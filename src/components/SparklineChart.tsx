import { LineChart, Line, ResponsiveContainer } from "recharts";

interface Props {
  data: number[];
  positive: boolean;
  height?: number;
}

export function SparklineChart({ data, positive, height = 32 }: Props) {
  // Sample down to ~30 points for performance
  const sampled = data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 30)) === 0);
  const chartData = sampled.map((price, i) => ({ i, price }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="price"
          stroke={positive ? "hsl(160, 60%, 45%)" : "hsl(0, 65%, 55%)"}
          strokeWidth={1.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
