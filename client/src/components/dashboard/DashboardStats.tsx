import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Stat {
  label: string;
  value: string | number;
}

interface DashboardStatsProps {
  stats: Stat[];
  isLoading?: boolean;
}

const isZeroValue = (value: string | number) => {
  if (typeof value === "number") return value === 0;
  const numericValue = Number.parseFloat(value.replace("%", "").trim());
  return Number.isFinite(numericValue) && numericValue === 0;
};

export default function DashboardStats({ stats, isLoading = false }: DashboardStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(3)].map((_, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p
              className={`text-2xl font-bold mt-1 ${isZeroValue(stat.value) ? "text-blue-600" : "text-foreground"}`}
            >
              {stat.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
