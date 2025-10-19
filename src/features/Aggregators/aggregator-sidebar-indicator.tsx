import {
  Network,
  TrendingUp,
  Users,
  Layers,
  Package,
  BarChart3,
  Truck,
} from "lucide-react";

function AggregatorDashboardCard({
  role,
}: {
  role: "aggregator" | "bulk_trader";
}) {
  if (!role) return null;

  const config = {
    aggregator: {
      icon: Network,
      title: "Aggregator Dashboard",
      description: "Manage farmer networks, coordinate produce collections",
      bgColor: "oklch(0.5 0.12 155)", // Teal/cyan
      accentColor: "oklch(0.88 0.15 130)",
      iconBgColor: "oklch(0.88 0.15 130)",
      iconColor: "oklch(0.35 0.08 155)",
      textColor: "oklch(0.99 0 0)", // White text
      borderColor: "oklch(0.5 0.12 155)",
      stats: [
        { icon: Users, label: "Farmers" },
        { icon: Layers, label: "Collections" },
        { icon: TrendingUp, label: "Analytics" },
      ],
    },
    bulk_trader: {
      icon: Package,
      title: "Bulk Trader Dashboard",
      description: "Track inventory, manage orders, optimize distribution",
      bgColor: "oklch(0.88 0.15 130)", // Secondary (lime green)
      accentColor: "oklch(0.5 0.12 155)", // Primary (teal)
      iconBgColor: "oklch(0.5 0.12 155)", // Primary for icon background
      iconColor: "oklch(0.99 0 0)", // Primary foreground (white)
      textColor: "oklch(0.35 0.08 155)", // Secondary foreground (dark teal)
      borderColor: "oklch(0.5 0.12 155/ 0.2)",
      stats: [
        { icon: Package, label: "Inventory" },
        { icon: Truck, label: "Orders" },
        { icon: BarChart3, label: "Reports" },
      ],
    },
  };

  const currentConfig = config[role];
  const IconComponent = currentConfig?.icon;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 transition-all duration-300  "
      style={{
        background: currentConfig.bgColor,
      }}
    >
      {/* Content */}
      <div className="relative z-10">
        {/* Icon Badge */}
        <div className="inline-flex items-center justify-center mb-4">
          <div
            className="relative p-3 rounded-xl shadow-lg"
            style={{
              background: currentConfig.iconBgColor,
            }}
          >
            <IconComponent
              className="h-7 w-7"
              style={{ color: currentConfig.iconColor }}
              strokeWidth={2.5}
            />
          </div>
        </div>

        {/* Title */}
        <h3
          className="text-xl font-bold mb-2 tracking-tight"
          style={{ color: currentConfig.textColor }}
        >
          {currentConfig.title}
        </h3>

        {/* Description */}
        <p
          className="text-sm leading-relaxed mb-4 opacity-90"
          style={{ color: currentConfig.textColor }}
        >
          {currentConfig.description}
        </p>

        {/* Quick Stats Row */}
        <div
          className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/20"
          style={{ borderTopColor: currentConfig.borderColor }}
        >
          {currentConfig.stats.map((stat, index) => {
            const StatIcon = stat.icon;
            const isMiddle = index === 1;
            return (
              <div
                key={stat.label}
                className={`text-center ${
                  isMiddle ? "border-x border-white/20" : ""
                }`}
                style={{
                  borderColor: isMiddle ? currentConfig.borderColor : "",
                }}
              >
                <StatIcon
                  className="h-4 w-4 mx-auto mb-1 opacity-80"
                  style={{ color: currentConfig.textColor }}
                />
                <p
                  className="text-xs font-semibold opacity-90"
                  style={{ color: currentConfig.textColor }}
                >
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Corner Accent */}
      <div
        className="absolute top-0 right-0 w-20 h-20 opacity-20"
        style={{
          background: `radial-gradient(circle at top right, ${currentConfig.accentColor} 0%, transparent 70%)`,
        }}
      />
    </div>
  );
}

export default AggregatorDashboardCard;
