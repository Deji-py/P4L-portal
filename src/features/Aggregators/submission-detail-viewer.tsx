/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  User,
  Package,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  Phone,
  Calendar,
  Droplets,
  Warehouse,
  Users,
  Headset,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Submission } from "@/hooks/aggregators/useSubmissions";

interface SubmissionDetailsSheetProps {
  open: boolean;
  onClose: () => void;
  submission: Submission | null;
}

const InfoRow = ({
  icon: Icon,
  label,
  value,
  className = "",
}: {
  icon: any;
  label: string;
  value: string | number;
  className?: string;
}) => (
  <div className={`flex items-start gap-2 ${className}`}>
    <Icon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900 truncate">{value}</p>
    </div>
  </div>
);

const SubmissionDetailsSheet: React.FC<SubmissionDetailsSheetProps> = ({
  open,
  onClose,
  submission,
}) => {
  if (!submission) return null;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "inspected":
        return <CheckCircle className="h-4 w-4" />;
      case "assigned":
        return <Package className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    const configs = {
      approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
      rejected: "bg-rose-50 text-rose-700 border-rose-200",
      pending: "bg-amber-50 text-amber-700 border-amber-200",
      inspected: "bg-blue-50 text-blue-700 border-blue-200",
      assigned: "bg-purple-50 text-purple-700 border-purple-200",
    };

    const config =
      configs[statusLower as keyof typeof configs] ||
      "bg-gray-50 text-gray-700 border-gray-200";

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${config}`}
      >
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const totalQuantity =
    submission.produce?.reduce((sum, item) => sum + (item.quantity || 0), 0) ||
    0;
  const totalValue =
    submission.produce?.reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0),
      0
    ) || 0;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl p-6 overflow-y-auto">
        <SheetHeader className="space-y-3 pb-4 border-b">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <SheetTitle className="text-xl font-semibold">
                Submission Details
              </SheetTitle>
              <SheetDescription className="text-xs">
                Request ID: #{submission.id}
              </SheetDescription>
            </div>
            {getStatusBadge(submission.status)}
          </div>
        </SheetHeader>

        <div className="space-y-4 py-4">
          {/* Quick Summary Cards */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <p className="text-xs text-blue-600 mb-1">Proceeds</p>
              <p className="text-lg font-bold text-blue-900">
                {submission.produce.length || 0}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-100">
              <p className="text-xs text-green-600 mb-1">Quantity</p>
              <p className="text-lg font-bold text-green-900">
                {totalQuantity}
              </p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
              <p className="text-xs text-amber-600 mb-1">Value</p>
              <p className="text-lg font-bold text-amber-900">
                ₦{(totalValue / 1000).toFixed(0)}k
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
              <p className="text-xs text-purple-600 mb-1">Score</p>
              <p className="text-lg font-bold text-purple-900">
                {submission.score || 0}%
              </p>
            </div>
          </div>

          {/* Farm & Farmer Info Combined */}
          <section className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-green-600" />
              <h3 className="text-sm font-semibold text-gray-900">
                Farm Details
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="col-span-2">
                <p className="text-xs text-gray-500">Farm Name</p>
                <p className="text-sm font-semibold text-gray-900">
                  {submission.farmer_info?.farm_cluster_name || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Size</p>
                <p className="text-sm font-medium text-gray-900">
                  {submission.farmer_info?.farm_size || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Years Active</p>
                <p className="text-sm font-medium text-gray-900">
                  {submission.farmer_info?.years_of_operation || "N/A"}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500">Main Crops</p>
                <p className="text-sm font-medium text-gray-900">
                  {submission.farmer_info?.main_crops || "N/A"}
                </p>
              </div>
              {submission.farmer_info?.farming_type &&
                submission.farmer_info.farming_type.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 mb-1.5">Farming Type</p>
                    <div className="flex flex-wrap gap-1.5">
                      {submission.farmer_info.farming_type.map((type, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded border border-green-200"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </section>

          {/* Farmer Contact */}
          <section className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">
                Farmer Information
              </h3>
            </div>
            <div className="space-y-2.5">
              <InfoRow
                icon={User}
                label="Name"
                value={submission.farmer_info?.full_name || "Unknown"}
              />
              <InfoRow
                icon={Phone}
                label="Contact"
                value={submission.farmer_info?.contact_information || "N/A"}
              />
              <div className="grid grid-cols-2 gap-3">
                <InfoRow
                  icon={MapPin}
                  label="State"
                  value={submission.farmer_info?.state || "N/A"}
                />
                <InfoRow
                  icon={MapPin}
                  label="LGA"
                  value={submission.farmer_info?.local_gov_area || "N/A"}
                />
              </div>
            </div>
          </section>

          {/* Produce Details - Compact */}
          {submission.produce && submission.produce.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-semibold text-gray-900">
                  Produce Items
                </h3>
              </div>
              <div className="space-y-2">
                {submission.produce.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900">
                        {item.product_name || "Unknown Product"}
                      </p>
                      <span className="text-xs text-gray-500">
                        {formatDate(submission.submitted_at)}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-gray-500">Quantity</p>
                        <p className="font-semibold text-gray-900">
                          {item.quantity || 0} {item.unit_measure || ""}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Unit Price</p>
                        <p className="font-semibold text-gray-900">
                          ₦{item.unit_price?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total</p>
                        <p className="font-semibold text-gray-900">
                          ₦
                          {(
                            (item.quantity || 0) * (item.unit_price || 0)
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {/* Per-item Inspection Details */}
                    {(item.accepted !== null ||
                      item.rejected !== null ||
                      item.score !== null) && (
                      <div className="grid grid-cols-3 gap-2 text-xs mt-2 pt-2 border-t">
                        {item.score !== null && (
                          <div>
                            <p className="text-gray-500">Score</p>
                            <p className="font-semibold text-gray-900">
                              {item.score}%
                            </p>
                          </div>
                        )}
                        {item.accepted !== null && (
                          <div>
                            <p className="text-gray-500">Accepted</p>
                            <p className="font-semibold text-green-600">
                              {item.accepted}
                            </p>
                          </div>
                        )}
                        {item.rejected !== null && (
                          <div>
                            <p className="text-gray-500">Rejected</p>
                            <p className="font-semibold text-rose-600">
                              {item.rejected}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Inspection Results - Summary */}
          {(submission.status === "inspected" ||
            submission.status === "approved" ||
            submission.status === "assigned") &&
            (submission.score !== null ||
              submission.farmer_info?.support_needed_areas) && (
              <section className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <h3 className="text-sm font-semibold text-gray-900">
                    Inspection Summary
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Overall Score</p>
                    <p className="text-xl font-bold text-gray-900">
                      {submission.score || 0}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Request Status</p>
                    <p className="text-sm font-semibold capitalize text-gray-900">
                      {submission.status}
                    </p>
                  </div>
                </div>
                {submission.inspection_date && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-500 mb-1">
                      Inspection Date & Time
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {submission.inspection_date}
                      {submission.inspection_time &&
                        ` at ${submission.inspection_time}`}
                    </p>
                  </div>
                )}
              </section>
            )}

          {/* Additional Details - Compact */}
          <section className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Additional Information
            </h3>
            <div className="space-y-2.5">
              {submission.farmer_info?.irrigation_methods_used && (
                <InfoRow
                  icon={Droplets}
                  label="Irrigation"
                  value={submission.farmer_info.irrigation_methods_used}
                />
              )}
              {submission.farmer_info?.post_harvest_facilities_available && (
                <InfoRow
                  icon={Warehouse}
                  label="Post-Harvest Facilities"
                  value={
                    submission.farmer_info.post_harvest_facilities_available
                  }
                />
              )}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <InfoRow
                  icon={Users}
                  label="Cooperative Member"
                  value={
                    submission.farmer_info?.is_cooperative_member ? "Yes" : "No"
                  }
                />
                <InfoRow
                  icon={Headset}
                  label="Extension Service"
                  value={
                    submission.farmer_info?.has_extension_service_access
                      ? "Yes"
                      : "No"
                  }
                />
              </div>
            </div>
          </section>

          {/* Support Needed Areas */}
          {submission.farmer_info?.support_needed_areas &&
            submission.farmer_info.support_needed_areas.length > 0 && (
              <section className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  Support Needed
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {submission.farmer_info.support_needed_areas.map(
                    (area, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded border border-blue-200"
                      >
                        {area}
                      </span>
                    )
                  )}
                </div>
              </section>
            )}

          {/* Submission Timestamp */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="h-3.5 w-3.5" />
              <span>Submitted</span>
            </div>
            <span className="text-xs font-medium text-gray-700">
              {formatDate(submission.submitted_at)}
            </span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SubmissionDetailsSheet;
