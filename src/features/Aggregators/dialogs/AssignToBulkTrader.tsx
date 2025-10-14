import BulkFoodIcon from "@/components/icon/BulkFoodIcon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Check, Leaf, Package, AlertCircle } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { Submission } from "@/hooks/aggregators/useSubmissions";
import { useBulkTrader } from "@/hooks/aggregators/useBultraders";

type AssignToBulkTraderProps = {
  open: boolean;
  onClose: () => void;
  submission: Submission;
  aggregatorId: number;
};

function AssignToBulkTrader({
  open,
  onClose,
  submission,
  aggregatorId,
}: AssignToBulkTraderProps) {
  const [selectedBulkTraderId, setSelectedBulkTraderId] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const localGovArea = submission?.farmer_info?.local_gov_area || "";
  const state = submission?.farmer_info?.state || "";

  const {
    bulkTraders,
    bulkTradersLoading,
    bulkTradersError,
    isAssigning,
    assignSuccess,
    handleAssignBulkTrader,
  } = useBulkTrader(localGovArea, state);

  useEffect(() => {
    if (assignSuccess) {
      setShowSuccess(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [assignSuccess]);

  const handleFinish = () => {
    if (!selectedBulkTraderId) return;

    handleAssignBulkTrader(
      submission.id,
      parseInt(selectedBulkTraderId),
      aggregatorId
    );
  };

  const selectedTrader = bulkTraders?.find(
    (trader) => trader.id.toString() === selectedBulkTraderId
  );

  const totalValue =
    submission?.produce?.reduce(
      (sum, p) => sum + (p.unit_price || 0) * (p.quantity || 0),
      0
    ) || 0;

  const totalQuantity =
    submission?.produce?.reduce((sum, p) => sum + (p.quantity || 0), 0) || 0;

  const formatNaira = (amount: number): string => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleDone = () => {
    setShowSuccess(false);
    setSelectedBulkTraderId("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogHeader>
        <DialogTitle className="sr-only">Assign to Bulk Trader</DialogTitle>
      </DialogHeader>
      <DialogContent
        showCloseButton={false}
        className="w-full !max-w-4xl max-h-[90vh] overflow-y-auto p-0"
      >
        {showSuccess ? (
          <div className="w-full h-[400px] flex flex-col items-center justify-center bg-white p-6">
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-12 h-12 text-green-700" strokeWidth={3} />
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Successful
                </h2>
                <p className="text-gray-600">
                  You have successfully assigned <br />
                  <span className="font-semibold">
                    {submission?.farmer_info?.farm_cluster_name || "Farm"}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold">
                    {selectedTrader?.business_name || "Bulk Trader"}
                  </span>
                </p>
              </div>
              <Button
                onClick={handleDone}
                className="bg-green-700 hover:bg-green-800 text-white px-8 py-2 rounded-md"
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-12 h-[400px] gap-0">
            {/* Left Section */}
            <div className="col-span-7 p-6 bg-white">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <Button
                  size="icon"
                  onClick={onClose}
                  variant="ghost"
                  className="h-8 w-8"
                  disabled={isAssigning}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <BulkFoodIcon />
              </div>

              {/* Content */}
              <div className="space-y-6">
                <div>
                  {/* Select Dropdown */}
                  <h2 className="text-lg mb-2 font-semibold text-gray-800">
                    Choose Bulk Trader
                  </h2>
                  <Select
                    value={selectedBulkTraderId}
                    onValueChange={setSelectedBulkTraderId}
                    disabled={isAssigning || bulkTradersLoading}
                  >
                    <SelectTrigger className="w-full border-gray-300 text-gray-600">
                      <SelectValue
                        placeholder={
                          bulkTradersLoading
                            ? "Loading bulk traders..."
                            : bulkTradersError
                            ? "Error loading traders"
                            : "Select bulk trader -"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {bulkTraders && bulkTraders.length > 0 ? (
                          bulkTraders.map((trader) => (
                            <SelectItem
                              key={trader.id}
                              value={trader.id.toString()}
                            >
                              {trader.business_name || "Unnamed Business"}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No bulk traders available in {localGovArea || state}
                          </SelectItem>
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  {bulkTradersError && (
                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg mt-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>
                        Failed to load bulk traders. Please try again.
                      </span>
                    </div>
                  )}
                </div>

                {/* Finish Button */}
                <Button
                  onClick={handleFinish}
                  disabled={
                    !selectedBulkTraderId || isAssigning || bulkTradersLoading
                  }
                  className="w-full bg-green-700 hover:bg-green-800 text-white py-2 rounded-md text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAssigning ? "Assigning..." : "Finish"}
                </Button>

                {/* Farm Info Card */}
                <div className="mt-8 gap-3 flex justify-between items-center bg-accent/30 p-4 rounded-lg border border-accent">
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[rgba(143,198,69,0.2)]">
                      <Leaf className="text-green-700" size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {submission?.farmer_info?.farm_cluster_name ||
                          "Unknown Farm"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {submission?.farmer_info?.local_gov_area || "N/A"},{" "}
                        {submission?.farmer_info?.state || "Nigeria"}
                      </p>
                    </div>
                  </div>
                  <div className="text-xl text-end text-primary font-bold">
                    <div className="flex items-center justify-end gap-1">
                      <Package size={18} />
                      <p>{totalQuantity}</p>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground/70">
                      @ {formatNaira(totalValue)} total
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Image */}
            <div className="col-span-5 relative bg-gray-100">
              <Image
                layout="fill"
                objectFit="cover"
                src={
                  "https://images.unsplash.com/photo-1601171762590-72f42972b01c?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                }
                alt="Farm with truck"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default AssignToBulkTrader;
