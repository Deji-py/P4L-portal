import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateDisplayTime } from "@/lib/utils";
import clsx from "clsx";
import {
  Phone,
  User2,
  Leaf,
  Calendar,
  MapPin,
  Package,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import React, { useState, useMemo } from "react";

interface FarmerProduce {
  id: number;
  submission_date: string;
  quantity: number | null;
  unit_measure: string | null;
  unit_price: number | null;
  product_name: string | null;
  request_id: number | null;
}

interface Farmer {
  id: number;
  user_id: string | null;
  full_name: string | null;
  farm_cluster_name: string | null;
  contact_information: string | null;
  state: string | null;
  farm_size: string | null;
  farming_type: string[] | null;
  main_crops: string | null;
  seasonal_calendar: string | null;
  monthly_output: string | null;
  irrigation_methods_used: string | null;
  post_harvest_facilities_available: string | null;
  ownership_type: string[] | null;
  land_tenure_status: string[] | null;
  is_cooperative_member: boolean | null;
  has_extension_service_access: boolean | null;
  support_needed_areas: string[] | null;
  support_needed_other: string | null;
  created_at: string | null;
  years_of_operation: string | null;
  local_gov_area: string | null;
}

interface Submission {
  id: number;
  submitted_at: string;
  aggregator_id: number | null;
  status: "pending" | "approved" | "rejected" | string;
  score: number | null;
  accepted: number | null;
  rejected: number | null;
  farmer_id: number | null;
  no_of_proceeds: number | null;
  farmer_info: Farmer;
  produce: FarmerProduce[];
}

type ProduceCheckViewerProps = {
  open: boolean;
  onClose: () => void;
  data?: Submission;
  onApprove?: (
    requestId: number,
    selectionDate: string,
    selectionTime: string
  ) => void;
  onReject?: (requestId: number, reason: string) => void;
  isUpdating?: boolean;
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

const REJECTION_REASONS = [
  "Quality below standard",
  "Quantity mismatch",
  "Not currently accepting",
  "Price not competitive",
  "Storage capacity full",
  "Product not in demand",
  "Failed inspection criteria",
  "Documentation incomplete",
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

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
};

function ProduceCheckViewer({
  open,
  onClose,
  data,
  onApprove,
  onReject,
  isUpdating = false,
}: ProduceCheckViewerProps) {
  const [showScheduler, setShowScheduler] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showApprovalSuccess, setShowApprovalSuccess] = useState(false);
  const [showRejectionSuccess, setShowRejectionSuccess] = useState(false);
  const [approvalDetails, setApprovalDetails] = useState({
    date: "",
    time: "",
  });
  const [finalRejectionReason, setFinalRejectionReason] = useState("");

  const farmer = data?.farmer_info;
  const produces = data?.produce || [];

  const getProductColor = useMemo(() => {
    const colorMap: Record<number, string> = {};
    produces.forEach((product, index) => {
      colorMap[product.id] = COLOR_PALETTE[index % COLOR_PALETTE.length];
    });
    return colorMap;
  }, [produces]);

  const totalValue = produces.reduce((sum, p) => {
    const price = p.unit_price || 0;
    const quantity = p.quantity || 0;
    return sum + price * quantity;
  }, 0);

  const totalQuantity = produces.reduce((sum, p) => sum + (p.quantity || 0), 0);

  const handleAccept = () => {
    if (!data || !onApprove) return;
    setShowScheduler(true);
  };

  const handleReject = () => {
    setShowRejectDialog(true);
  };

  const handleScheduleConfirm = () => {
    if (!selectedDate || !selectedTime) {
      alert("Please select both date and time");
      return;
    }
    if (!data || !onApprove) return;

    setApprovalDetails({ date: selectedDate, time: selectedTime });
    onApprove(data.id, selectedDate, updateDisplayTime(selectedTime));
    setShowScheduler(false);
    setShowApprovalSuccess(true);
  };

  const handleRejectConfirm = () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }
    if (!data || !onReject) return;

    setFinalRejectionReason(rejectionReason);
    onReject(data.id, rejectionReason);
    setShowRejectDialog(false);
    setShowRejectionSuccess(true);
  };

  const handleReasonChipClick = (reason: string) => {
    setRejectionReason((prev) => {
      if (prev.trim()) {
        return prev + "; " + reason;
      }
      return reason;
    });
  };

  const today = new Date().toISOString().split("T")[0];

  const handleClose = () => {
    setShowApprovalSuccess(false);
    setShowRejectionSuccess(false);
    setSelectedDate("");
    setSelectedTime("");
    setRejectionReason("");
    setApprovalDetails({ date: "", time: "" });
    setFinalRejectionReason("");
    onClose();
  };

  const isInspectionToday = approvalDetails.date === today;

  // Show approval success screen
  if (showApprovalSuccess) {
    return (
      <Dialog
        open={open}
        onOpenChange={(open) => (!open ? handleClose() : null)}
      >
        <DialogHeader>
          <DialogTitle className="sr-only">Approval Confirmation</DialogTitle>
        </DialogHeader>
        <DialogContent
          showCloseButton={false}
          className="w-full !max-w-md max-h-[90vh] overflow-y-auto"
        >
          <div className="text-center space-y-4 py-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="text-green-600" size={40} />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-green-600">
                Request Approved!
              </h2>
              <p className="text-gray-600 text-sm">
                Successfully approved request from
              </p>
              <p className="font-bold text-lg">{farmer?.full_name}</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2 text-left">
              <div className="flex items-start gap-2">
                <Calendar className="text-green-600 mt-0.5" size={18} />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-green-700 uppercase mb-0.5">
                    Inspection Scheduled
                  </p>
                  <p className="text-sm font-bold">
                    {new Date(approvalDetails.date).toLocaleDateString(
                      "en-NG",
                      {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      }
                    )}
                  </p>
                  <p className="text-sm font-semibold">
                    {updateDisplayTime(approvalDetails.time)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <p className="text-xs font-semibold text-blue-700 uppercase mb-2">
                Next Steps
              </p>
              <ul className="space-y-1.5 text-sm text-gray-700">
                <li className="flex gap-2">
                  <span className="text-blue-600 font-bold">1.</span>
                  <span>Farmer receives notification</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600 font-bold">2.</span>
                  <span>Farmer brings produce</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600 font-bold">3.</span>
                  <span>You conduct inspection</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600 font-bold">4.</span>
                  <span>Finalize purchase</span>
                </li>
              </ul>
            </div>

            <Button
              onClick={handleClose}
              className="w-full py-5 text-base font-semibold"
            >
              {isInspectionToday ? "Start Inspection" : "Got it!"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show rejection success screen
  if (showRejectionSuccess) {
    return (
      <Dialog
        open={open}
        onOpenChange={(open) => (!open ? handleClose() : null)}
      >
        <DialogHeader>
          <DialogTitle className="sr-only">Rejection Confirmation</DialogTitle>
        </DialogHeader>
        <DialogContent
          showCloseButton={false}
          className="w-full !max-w-md max-h-[90vh] overflow-y-auto"
        >
          <div className="text-center space-y-4 py-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="text-red-600" size={40} />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-red-600">
                Request Rejected
              </h2>
              <p className="text-gray-600 text-sm">Rejected request from</p>
              <p className="font-bold text-lg">{farmer?.full_name}</p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2 text-left">
              <p className="text-xs font-semibold text-red-700 uppercase">
                Rejection Reason
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {finalRejectionReason}
              </p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-left">
              <p className="text-xs font-semibold text-orange-700 uppercase mb-2">
                Next Steps
              </p>
              <ul className="space-y-1.5 text-sm text-gray-700">
                <li className="flex gap-2">
                  <span className="text-orange-600 font-bold">1.</span>
                  <span>Farmer receives notification with feedback</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-orange-600 font-bold">2.</span>
                  <span>Farmer can review and address concerns</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-orange-600 font-bold">3.</span>
                  <span>Farmer may submit improved request later</span>
                </li>
              </ul>
            </div>

            <Button
              onClick={handleClose}
              className="w-full py-5 text-base font-semibold bg-gray-600 hover:bg-gray-700"
            >
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      {/* Scheduler Dialog */}
      <Dialog open={showScheduler} onOpenChange={setShowScheduler}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Clock className="text-primary" />
              Schedule Inspection
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-4">
            <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-blue-600 mt-0.5" size={20} />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Schedule a visit</p>
                  <p className="text-xs opacity-80">
                    Pick a date and time for the farmer to bring their produce
                    for inspection
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Inspection Date
                </label>
                <input
                  type="date"
                  min={today}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={isUpdating}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Inspection Time
                </label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => {
                    setSelectedTime(e.target.value);
                  }}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={isUpdating}
                />
              </div>

              <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                <p className="font-semibold mb-1">
                  Farmer will be notified via:
                </p>
                <p>
                  • SMS to {farmer?.contact_information || "+2348123456789"}
                </p>
                <p>• In-app notification</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowScheduler(false)}
                disabled={isUpdating}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleScheduleConfirm}
                disabled={isUpdating}
                className="flex-1 gap-2"
              >
                {isUpdating ? "Approving..." : "Confirm & Approve"}
                <CheckCircle size={18} />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-red-600">
              <XCircle />
              Reject Produce Request
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-4">
            <div className="rounded-lg bg-red-50 p-4 border border-red-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-600 mt-0.5" size={20} />
                <div className="text-sm text-red-800">
                  <p className="font-semibold mb-1">Are you sure?</p>
                  <p className="text-xs opacity-80">
                    This action will notify the farmer that their produce
                    request has been rejected. Please provide a clear reason.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Reason for Rejection
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this produce request is being rejected..."
                className="w-full h-24 rounded-lg border border-gray-300 px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                disabled={isUpdating}
              />
            </div>

            <div>
              <p className="text-xs font-semibold mb-2 text-gray-600">
                QUICK REASONS (click to add)
              </p>
              <div className="flex flex-wrap gap-2">
                {REJECTION_REASONS.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => handleReasonChipClick(reason)}
                    disabled={isUpdating}
                    className="px-3 py-1.5 text-xs font-medium rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectionReason("");
                }}
                disabled={isUpdating}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRejectConfirm}
                disabled={isUpdating}
                className="flex-1 gap-2 bg-red-600 hover:bg-red-700"
              >
                {isUpdating ? "Rejecting..." : "Confirm Rejection"}
                <XCircle size={18} />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Dialog */}
      <Dialog open={open} onOpenChange={(open) => (!open ? onClose() : null)}>
        <DialogHeader>
          <DialogTitle className="sr-only">Produce Quick Check</DialogTitle>
        </DialogHeader>
        <DialogContent
          showCloseButton={false}
          className="w-full !max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          <div className="space-y-4">
            {/* Farm Info Section */}
            <div className="rounded-2xl ring-4 ring-primary/10 border-primary/40 border bg-gradient-to-b from-[#f5f5f5] to-accent p-5">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[rgba(143,198,69,0.2)]">
                    <Leaf className="text-green-700" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">
                      {farmer?.farm_cluster_name || "Farm Name"}
                    </h3>
                    <p className="text-sm opacity-50">
                      {farmer?.state}, Nigeria
                    </p>
                  </div>
                  <div className="space-y-2 pt-2 text-xs font-semibold">
                    <div className="flex items-center gap-2 opacity-70">
                      <MapPin size={14} />
                      <span>{farmer?.local_gov_area || "Location"}</span>
                    </div>
                    <div className="flex items-center gap-2 opacity-70">
                      <Calendar size={14} />
                      <span>
                        Submission Date:{" "}
                        {data ? formatDate(data.submitted_at) : "Date"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-4">
                  <div>
                    <p className="mb-3 text-xs font-semibold opacity-60">
                      FARMER DETAILS
                    </p>
                    <div className="flex items-end gap-4">
                      <Avatar className="h-10 w-10 border border-primary">
                        <AvatarFallback>
                          {farmer?.full_name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${farmer?.id}`}
                          alt="Farmer"
                        />
                      </Avatar>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 font-semibold">
                          <User2 size={16} />
                          <span>{farmer?.full_name || "Farmer Name"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs opacity-75">
                          <Phone size={14} />
                          <span>
                            {farmer?.contact_information || "+234xxxxxxxxxx"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={handleAccept}
                      disabled={isUpdating}
                      className="py-3 gap-2 bg-green-600 hover:bg-green-700"
                    >
                      Accept
                      <CheckCircle size={18} />
                    </Button>
                    <Button
                      onClick={handleReject}
                      disabled={isUpdating}
                      variant="destructive"
                      className="py-3 gap-2 ring-4 ring-red-500/30"
                    >
                      Reject
                      <XCircle size={18} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-blue-600 border-dashed bg-blue-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package size={16} className="text-blue-600" />
                  <p className="text-xs font-semibold text-blue-600 uppercase">
                    Total Items
                  </p>
                </div>
                <p className="text-2xl font-bold">{totalQuantity}</p>
              </div>
              <div className="rounded-lg border border-primary/60 border-dashed bg-accent/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} className="text-green-600" />
                  <p className="text-xs font-semibold text-green-600 uppercase">
                    Total Value
                  </p>
                </div>
                <p className="text-2xl font-bold">
                  {formatNairaShort(totalValue)}
                </p>
              </div>
              <div className="rounded-lg border border-orange-600 border-dashed bg-orange-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={16} className="text-orange-600" />
                  <p className="text-xs font-semibold text-orange-600 uppercase">
                    Status
                  </p>
                </div>
                <p className="text-2xl font-bold text-orange-600 capitalize">
                  {data?.status || "Pending"}
                </p>
              </div>
            </div>

            {/* Products Table */}
            <div className="rounded-2xl bg-[#f5f5f5] p-5">
              <h3 className="mb-4 text-sm font-semibold">Product Breakdown</h3>
              <div className="space-y-2">
                <div className="hidden grid-cols-6 gap-4 rounded-lg bg-gray-200 p-3 text-xs font-bold md:grid">
                  <div>Product</div>
                  <div className="text-center">Quantity</div>
                  <div className="text-center">Unit</div>
                  <div className="text-right">Unit Price</div>
                  <div className="text-right">Total</div>
                  <div className="text-center">Status</div>
                </div>
                {produces.length > 0 ? (
                  produces.map((product) => (
                    <div
                      key={product.id}
                      className="grid grid-cols-6 gap-4 items-center rounded-lg bg-white p-3 text-sm"
                    >
                      <div className="flex items-center gap-3 col-span-2 md:col-span-1">
                        <div
                          className={clsx(
                            "h-3 w-3 rounded-full",
                            getProductColor[product.id]
                          )}
                        ></div>
                        <span className="font-semibold">
                          {product.product_name || "Product"}
                        </span>
                      </div>
                      <div className="text-center font-semibold">
                        {product.quantity || 0}
                      </div>
                      <div className="text-center text-opacity-75">
                        {product.unit_measure || "unit"}
                      </div>
                      <div className="text-right font-semibold">
                        {formatNaira(product.unit_price || 0)}
                      </div>
                      <div className="text-right font-bold">
                        {formatNaira(
                          (product.unit_price || 0) * (product.quantity || 0)
                        )}
                      </div>
                      <div className="text-center">
                        <span className="inline-block rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                          Verified
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No produce data available
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-lg bg-gradient-to-r from-primary/20 to-accent p-4">
                <div className="grid grid-cols-6 gap-4 items-center font-bold text-sm">
                  <div className="col-span-3">TOTAL</div>
                  <div className="text-right">{formatNaira(totalValue)}</div>
                  <div className="col-span-2"></div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-3 rounded-2xl bg-gray-50 p-5 text-xs">
              <div>
                <p className="font-semibold text-gray-700 mb-1">Farm Size</p>
                <p className="text-gray-600">{farmer?.farm_size || "N/A"}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700 mb-1">
                  Registration ID
                </p>
                <p className="text-gray-600">FARM-{farmer?.id}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700 mb-1">Main Crops</p>
                <p className="text-gray-600">{farmer?.main_crops || "N/A"}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700 mb-1">
                  Contact Address
                </p>
                <p className="text-gray-600">
                  {farmer?.local_gov_area}, {farmer?.state}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default React.memo(ProduceCheckViewer);
