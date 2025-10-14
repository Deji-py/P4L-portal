import React from "react";
import { Network, TrendingUp, Users, Layers } from "lucide-react";

function AggregatorDashboardCard() {
  return (
    <div
      className="relative overflow-hidden rounded-2xl  p-5 transition-all duration-300 hover:shadow-xl "
      style={{
        background: "oklch(0.5 0.12 155)",
        borderColor: "oklch(0.88 0.15 130)",
      }}
    >
      {/* Content */}
      <div className="relative z-10">
        {/* Icon Badge */}
        <div className="inline-flex items-center justify-center mb-4">
          <div
            className="relative p-3 rounded-xl shadow-lg"
            style={{
              background: "oklch(0.88 0.15 130)",
            }}
          >
            {/* Main Icon - Network representing aggregation */}
            <Network
              className="h-7 w-7"
              style={{ color: "oklch(0.35 0.08 155)" }}
              strokeWidth={2.5}
            />
          </div>
        </div>

        {/* Title */}
        <h3
          className="text-xl font-bold mb-2 tracking-tight"
          style={{ color: "oklch(0.99 0 0)" }}
        >
          Aggregator Dashboard
        </h3>

        {/* Description */}
        <p
          className="text-sm leading-relaxed mb-4  opacity-90"
          style={{ color: "oklch(0.99 0 0)" }}
        >
          Manage farmer networks, coordinate produce collections
        </p>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/20">
          <div className="text-center">
            <Users
              className="h-4 w-4 mx-auto mb-1 opacity-80"
              style={{ color: "oklch(0.99 0 0)" }}
            />
            <p
              className="text-xs font-semibold opacity-90"
              style={{ color: "oklch(0.99 0 0)" }}
            >
              Farmers
            </p>
          </div>
          <div className="text-center border-x border-white/20">
            <Layers
              className="h-4 w-4 mx-auto mb-1 opacity-80"
              style={{ color: "oklch(0.99 0 0)" }}
            />
            <p
              className="text-xs font-semibold opacity-90"
              style={{ color: "oklch(0.99 0 0)" }}
            >
              Collections
            </p>
          </div>
          <div className="text-center">
            <TrendingUp
              className="h-4 w-4 mx-auto mb-1 opacity-80"
              style={{ color: "oklch(0.99 0 0)" }}
            />
            <p
              className="text-xs font-semibold opacity-90"
              style={{ color: "oklch(0.99 0 0)" }}
            >
              Analytics
            </p>
          </div>
        </div>
      </div>

      {/* Corner Accent */}
      <div
        className="absolute top-0 right-0 w-20 h-20 opacity-20"
        style={{
          background:
            "radial-gradient(circle at top right, oklch(0.88 0.15 130) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

export default AggregatorDashboardCard;
