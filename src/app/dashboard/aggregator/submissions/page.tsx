/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { TrendingUp, Clock, ClipboardCheck, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import SubmissionTable from "@/features/Aggregators/submission/submission-table";
import { Submission, useSubmissions } from "@/hooks/aggregators/useSubmissions";
import { useProfileStore } from "@/store/profile.store";
import useProfile from "@/hooks/useProfile";
import { useStatistics } from "@/hooks/aggregators/useStatistics";

const formatNaira = (amount: number): string => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

function SubmissionsPage() {
  const profile = useProfileStore((state) => state.profile);
  const { profile: serverProfile } = useProfile("aggregators");

  const aggregatorId = profile?.id || serverProfile?.id;

  const { submissions, submissionsLoading } = useSubmissions(aggregatorId);
  const { statistics, isLoading: statisticsLoading } =
    useStatistics(aggregatorId);

  // Calculate total value from submissions
  const totalValue =
    submissions?.reduce((sum, submission) => {
      // Assuming each submission has a value property, adjust as needed
      const value = (submission as any).total_value || 0;
      return sum + value;
    }, 0) || 0;

  const data = [
    {
      name: "Total Submissions",
      value: statisticsLoading ? "..." : statistics?.totalSubmissions || 0,
      icon: <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />,
    },
    {
      name: "Pending Inspection",
      value: statisticsLoading ? "..." : statistics?.pendingInspection || 0,
      icon: <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />,
    },
    {
      name: "Inspected",
      value: statisticsLoading ? "..." : statistics?.inspected || 0,
      icon: (
        <ClipboardCheck className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
      ),
    },
    {
      name: "Total Value",
      value: statisticsLoading ? "..." : formatNaira(totalValue),
      icon: <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Stats Grid Section */}
      <div className="w-full border-b">
        <div className="p-3 sm:p-4 md:p-5 lg:p-6 space-y-4 sm:space-y-6">
          <div className="flex flex-col gap-4">
            {/* Stats Grid */}
            <div className="border border-primary/30 ring-4 ring-primary/10 inline-grid grid-cols-1 gap-px rounded-xl bg-border sm:grid-cols-2 lg:grid-cols-4 w-full min-w-max sm:min-w-full">
              {data.map((stat, index) => {
                const isFirst = index === 0;
                const isLast = index === data.length - 1;
                const isMobileRowStart = index % 2 === 0;
                const isMobileRowEnd = (index + 1) % 2 === 0;

                return (
                  <Card
                    key={stat.name}
                    className={cn(
                      "rounded-none border-0 shadow-none py-0 w-full",
                      // Desktop layout
                      "lg:rounded-none",
                      isFirst && "lg:rounded-l-xl",
                      isLast && "lg:rounded-r-xl",
                      // Tablet layout
                      "sm:rounded-none",
                      isMobileRowStart && "sm:rounded-l-xl",
                      isMobileRowEnd && "sm:rounded-r-xl",
                      // Mobile layout
                      "rounded-none",
                      isFirst && "rounded-t-xl",
                      isLast && "rounded-b-xl"
                    )}
                  >
                    <CardContent className="flex flex-col gap-2 sm:gap-3 p-3 sm:p-4 md:p-5 lg:p-6">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-xs sm:text-sm font-medium text-muted-foreground leading-tight max-w-[120px] sm:max-w-none">
                          {stat.name}
                        </div>
                        <div className="flex-shrink-0">{stat.icon}</div>
                      </div>
                      <div className="w-full text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground break-words">
                        {stat.value}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Submission Table Section */}
      <div className="p-3 sm:p-4 md:p-5 lg:p-6">
        <SubmissionTable
          loading={submissionsLoading}
          data={submissions as Submission[]}
        />
      </div>
    </div>
  );
}

export default SubmissionsPage;
