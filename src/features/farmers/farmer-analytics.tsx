"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  description?: string;
}

export function AnalyticsCard({
  title,
  value,
  change,
  icon,
  description,
}: AnalyticsCardProps) {
  const getTrendIcon = () => {
    if (!change || change === 0) return <Minus className="h-3 w-3" />;
    return change > 0 ? (
      <TrendingUp className="h-3 w-3" />
    ) : (
      <TrendingDown className="h-3 w-3" />
    );
  };

  const getTrendColor = () => {
    if (!change || change === 0) return "text-muted-foreground";
    return change > 0 ? "text-green-600" : "text-red-600";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {change !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs mt-2 ${getTrendColor()}`}
          >
            {getTrendIcon()}
            <span>{Math.abs(change)}% from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
