"use client";
import React from "react";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  color,
}) => {
  return (
    <div className="bg-white col-span-1 rounded-xl h-[100px] p-4 shadow-sm border border-gray-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">
            {value}
          </p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span
                className={`text-xs font-medium ${
                  trend.isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {trend.value}% from last week
              </span>
            </div>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

interface DashboardStatisticsProps {
  stats: {
    pending: number;
    accepted: number;
    declined: number;
    outForDelivery: number;
    complete: number;
  };
}

const DashboardStatistics: React.FC<DashboardStatisticsProps> = ({ stats }) => {
  return (
    <div className="space-y-4 gap-1 2xl:grid hidden grid-cols-5 rounded-xl h-fit w-full">
      <StatCard
        title="Pending Requests"
        value={stats.pending}
        icon={<Clock className="w-6 h-6 text-orange-600" />}
        color="bg-orange-100"
      />
      <StatCard
        title="Accepted"
        value={stats.accepted}
        icon={<CheckCircle2 className="w-6 h-6 text-green-600" />}
        color="bg-green-100"
      />
      <StatCard
        title="Assigned For Pickup"
        value={stats.outForDelivery}
        icon={<Truck className="w-6 h-6 text-blue-600" />}
        color="bg-blue-100"
      />
      <StatCard
        title="Completed"
        value={stats.complete}
        icon={<CheckCircle2 className="w-6 h-6 text-gray-600" />}
        color="bg-gray-100"
      />
      <StatCard
        title="Declined"
        value={stats.declined}
        icon={<XCircle className="w-6 h-6 text-red-600" />}
        color="bg-red-100"
      />
    </div>
  );
};

export default DashboardStatistics;
