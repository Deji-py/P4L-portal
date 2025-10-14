import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import clsx from "clsx";
import { Phone, PlusSquare, User2, Leaf, Calendar, MapPin } from "lucide-react";
import React, { useState, useMemo } from "react";
import AssignToBulkTrader from "./AssignToBulkTrader";
import { Submission } from "@/hooks/aggregators/useSubmissions";


type ProceedsViewerProps = {
  open: boolean;
  onClose: () => void;
  submission: Submission;
  aggregatorId: number;
};

const COLOR_PALETTE = [
  "bg-blue-500",
  "bg-red-500",
  "bg-green-500",
  "bg-orange-400",
  "bg-purple-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-yellow-500",
  "bg-indigo-500",
  "bg-teal-500",
];

const formatNaira = (amount: number): string => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatNairaShort = (amount: number): string => {
  if (amount >= 1000000) {
    return "₦" + (amount / 1000000).toFixed(1) + "M";
  }
  if (amount >= 1000) {
    return "₦" + (amount / 1000).toFixed(1) + "K";
  }
  return formatNaira(amount);
};

function ProceedsViewer({ open, onClose, submission, aggregatorId }: ProceedsViewerProps) {
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  const handleAssign = () => {
    setShowAssignDialog(true);
  };

  // Memoize color assignment to avoid recalculation on every render
  const getProductColor = useMemo(() => {
    const colorMap: Record<number, string> = {};
    submission?.produce?.forEach((product) => {
      colorMap[product.id] =
        COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
    });
    return colorMap;
  }, [submission?.produce]);

  const totalValue = submission?.produce?.reduce(
    (sum, p) => sum + (p.unit_price || 0) * (p.quantity || 0),
    0
  ) || 0;

  const totalQuantity = submission?.produce?.reduce(
    (sum, p) => sum + (p.quantity || 0),
    0
  ) || 0;

  const farmerInfo = submission?.farmer_info;
  const products = submission?.produce || [];
  const isAssigned = submission?.status === "assigned";

  return (
    <>
      <AssignToBulkTrader
        open={showAssignDialog}
        onClose={() => setShowAssignDialog(false)}
        submission={submission}
        aggregatorId={aggregatorId}
      />
      <Dialog open={open} onOpenChange={(open) => (!open ? onClose() : null)}>
        <DialogHeader>
          <DialogTitle className="sr-only">Proceeds Viewer</DialogTitle>
        </DialogHeader>
        <DialogContent
          showCloseButton={false}
          className="w-[95vw] sm:w-full !max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6"
        >
          <div className="space-y-3 sm:space-y-4">
            {/* Farm Info Section */}
            <div className="rounded-xl sm:rounded-2xl ring-2 sm:ring-4 ring-primary/10 border-primary/40 border bg-gradient-to-b from-[#f5f5f5] to-accent p-3 sm:p-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Left: Farm Details */}
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-lg bg-[rgba(143,198,69,0.2)]">
                    <Leaf className="text-green-700" size={20} />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold line-clamp-1">
                      {farmerInfo?.farm_cluster_name || "Unknown Farm"}
                    </h3>
                    <p className="text-xs sm:text-sm opacity-50">
                      {farmerInfo?.local_gov_area || "N/A"}, {farmerInfo?.state || "Nigeria"}
                    </p>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2 pt-1 sm:pt-2 text-xs font-semibold">
                    <div className="flex items-center gap-2 opacity-70">
                      <MapPin size={14} className="flex-shrink-0" />
                      <span className="truncate">
                        {farmerInfo?.local_gov_area || "Location not specified"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 opacity-70">
                      <Calendar size={14} className="flex-shrink-0" />
                      <span className="truncate">
                        Submission: {new Date(submission?.submitted_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: User & Action */}
                <div className="flex flex-col justify-between gap-3 sm:gap-4">
                  <div>
                    <p className="mb-2 sm:mb-3 text-xs font-semibold opacity-60">
                      FARMER DETAILS
                    </p>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <Avatar className="h-9 w-9 sm:h-10 sm:w-10 border border-primary flex-shrink-0">
                        <AvatarFallback className="text-xs sm:text-sm">
                          {farmerInfo?.full_name?.substring(0, 2).toUpperCase() || "N/A"}
                        </AvatarFallback>
                        <AvatarImage src="" alt="Farmer" />
                      </Avatar>
                      <div className="space-y-0.5 sm:space-y-1 text-sm min-w-0 flex-1">
                        <div className="flex items-center gap-2 font-semibold">
                          <User2 size={14} className="flex-shrink-0" />
                          <span className="truncate">{farmerInfo?.full_name || "Unknown"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs opacity-75">
                          <Phone size={12} className="flex-shrink-0" />
                          <span className="truncate">{farmerInfo?.contact_information || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={handleAssign}
                    disabled={isAssigned}
                    className="w-full py-2.5 sm:py-3 gap-2 text-sm"
                  >
                    {isAssigned ? "Already Assigned" : "Assign to Bulk Trader"}
                    <PlusSquare size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Products Table */}
            <div className="rounded-xl sm:rounded-2xl bg-[#f5f5f5] p-3 sm:p-5">
              <h3 className="mb-3 sm:mb-4 text-xs sm:text-sm font-semibold">Product Breakdown</h3>
              
              {/* Desktop Table Header */}
              <div className="hidden md:grid grid-cols-6 gap-3 sm:gap-4 rounded-lg bg-gray-200 p-2.5 sm:p-3 text-xs font-bold mb-2">
                <div>Product</div>
                <div className="text-center">Quantity</div>
                <div className="text-center">Unit</div>
                <div className="text-right">Unit Price</div>
                <div className="text-right">Total</div>
                <div className="text-center">Status</div>
              </div>

              <div className="space-y-2">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="rounded-lg bg-white p-3 sm:p-3"
                  >
                    {/* Mobile Layout */}
                    <div className="md:hidden space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={clsx(
                              "h-3 w-3 rounded-full flex-shrink-0",
                              getProductColor[product.id]
                            )}
                          ></div>
                          <span className="font-semibold text-sm">{product.product_name}</span>
                        </div>
                        <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                          Verified
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Quantity:</span>
                          <span className="font-semibold ml-1">{product.quantity} {product.unit_measure}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Unit Price:</span>
                          <span className="font-semibold ml-1">{formatNairaShort(product.unit_price || 0)}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500">Total:</span>
                          <span className="font-bold ml-1">{formatNaira((product.unit_price || 0) * (product.quantity || 0))}</span>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:grid grid-cols-6 gap-3 sm:gap-4 items-center text-sm">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={clsx(
                            "h-3 w-3 rounded-full flex-shrink-0",
                            getProductColor[product.id]
                          )}
                        ></div>
                        <span className="font-semibold truncate">{product.product_name}</span>
                      </div>
                      <div className="text-center font-semibold">
                        {product.quantity}
                      </div>
                      <div className="text-center text-opacity-75">
                        {product.unit_measure}
                      </div>
                      <div className="text-right font-semibold">
                        {formatNaira(product.unit_price || 0)}
                      </div>
                      <div className="text-right font-bold">
                        {formatNaira((product.unit_price || 0) * (product.quantity || 0))}
                      </div>
                      <div className="text-center">
                        <span className="inline-block rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                          Verified
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Row */}
              <div className="mt-3 sm:mt-4 rounded-lg bg-gradient-to-r from-primary/20 to-accent p-3 sm:p-4">
                <div className="flex items-center justify-between md:grid md:grid-cols-6 md:gap-4 font-bold text-sm">
                  <div className="md:col-span-3">TOTAL</div>
                  <div className="text-right md:text-right">
                    {formatNaira(totalValue)}
                  </div>
                  <div className="hidden md:block md:col-span-2"></div>
                </div>
                <div className="mt-2 md:hidden text-xs text-gray-600">
                  Total Items: {products.length} ({totalQuantity} units)
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 rounded-xl sm:rounded-2xl bg-gray-50 p-3 sm:p-5 text-xs">
              <div>
                <p className="font-semibold text-gray-700 mb-1">Farm Size</p>
                <p className="text-gray-600">{farmerInfo?.farm_size || "N/A"}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700 mb-1">
                  Farming Type
                </p>
                <p className="text-gray-600">
                  {farmerInfo?.farming_type?.join(", ") || "N/A"}
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-700 mb-1">
                  Main Crops
                </p>
                <p className="text-gray-600 line-clamp-2">{farmerInfo?.main_crops || "N/A"}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700 mb-1">
                  Years of Operation
                </p>
                <p className="text-gray-600">
                  {farmerInfo?.years_of_operation || "N/A"}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="font-semibold text-gray-700 mb-1">
                  Cooperative Member
                </p>
                <p className="text-gray-600">
                  {farmerInfo?.is_cooperative_member ? "Yes" : "No"}
                </p>
              </div>
            </div>

            {/* Status Badge */}
            {isAssigned && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3 sm:p-4 text-center">
                <p className="text-xs sm:text-sm font-semibold text-green-700">
                  ✓ This submission has been assigned to a bulk trader
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default React.memo(ProceedsViewer);