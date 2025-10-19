"use client";
import React, { useState } from "react";
import {
  Package,
  ChevronDown,
  Truck,
  Clock,
  CheckCircle2,
  Archive,
  Star,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OrderItem {
  name: string;
  quantity: number;
  unit_measure?: string;
}

interface AggregatorRequestCardProps {
  id: number;
  company: string;
  location: string;
  date: string;
  items: OrderItem[];
  status: "pending" | "accepted" | "declined" | "out_for_delivery" | "complete";
  farmerId?: number;
  farmerRequestId?: number;
  aggregatorId?: number;
  onAccept?: (id: number) => void;
  onDecline?: (id: number) => void;
  onAssignDispatch?: (id: number) => void;
  onTrackRider?: (id: number) => void;
  onAddToInventory?: (
    requestId: number,
    farmerId: number,
    aggregatorId: number
  ) => void;
  onScoreProduce?: (requestId: number, score: number) => void;
  isLoading?: boolean;
  isAddingToInventory?: boolean;
  isInInventory?: boolean;
  qualityScore?: number | null;
}

const StatusTimeline = ({ status }: { status: string }) => {
  const steps = [
    { label: "Accepted", value: "accepted", icon: CheckCircle2 },
    { label: "Preparing", value: "preparing", icon: Package },
    { label: "Assigned For Pickup", value: "out_for_delivery", icon: Truck },
    { label: "Complete", value: "complete", icon: CheckCircle2 },
  ];

  const currentStepIndex = steps.findIndex((step) => step.value === status);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="px-4 py-3 bg-white border-t">
      <div className="mb-3">
        <Progress value={progress} className="h-2" />
      </div>
      <div className="flex justify-between items-center">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <div key={step.value} className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isActive
                    ? isCurrent
                      ? "bg-primary text-white"
                      : "bg-green-100 text-primary"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={`text-xs ${
                  isActive ? "text-gray-900 font-medium" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ScoreProduceDialog = ({
  isOpen,
  onOpenChange,
  currentScore,
  onSubmit,
  isSubmitting,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentScore: number;
  onSubmit: (score: number) => void;
  isSubmitting: boolean;
}) => {
  const [score, setScore] = useState(currentScore);

  const getScoreColor = (value: number) => {
    if (value >= 80) return "text-green-600";
    if (value >= 60) return "text-yellow-600";
    if (value >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreLabel = (value: number) => {
    if (value >= 90) return "Excellent";
    if (value >= 80) return "Very Good";
    if (value >= 70) return "Good";
    if (value >= 60) return "Fair";
    if (value >= 40) return "Below Average";
    return "Poor";
  };

  const handleSubmit = () => {
    onSubmit(score);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Score Produce Quality
          </DialogTitle>
          <DialogDescription>
            Rate the quality of produce received (1-100)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Score Display */}
          <div className="text-center">
            <div className={`text-5xl font-bold ${getScoreColor(score)}`}>
              {score}
            </div>
            <div className={`text-sm font-medium mt-1 ${getScoreColor(score)}`}>
              {getScoreLabel(score)}
            </div>
          </div>

          {/* Slider */}
          <div className="space-y-3">
            <Label htmlFor="score-slider">Adjust Score</Label>
            <Slider
              id="score-slider"
              min={1}
              max={100}
              step={1}
              value={[score]}
              onValueChange={(value) => setScore(value[0])}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 (Poor)</span>
              <span>100 (Excellent)</span>
            </div>
          </div>

          {/* Number Input */}
          <div className="space-y-2">
            <Label htmlFor="score-input">Or enter directly</Label>
            <Input
              id="score-input"
              type="number"
              min={1}
              max={100}
              value={score}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 1 && value <= 100) {
                  setScore(value);
                }
              }}
              className="w-full"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Submitting..." : "Submit Score"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AggregatorRequestCard: React.FC<AggregatorRequestCardProps> = ({
  id,
  company,
  location,
  date,
  items,
  status,
  farmerId,
  farmerRequestId,
  aggregatorId,
  onAccept,
  onDecline,
  onAssignDispatch,
  onTrackRider,
  onAddToInventory,
  onScoreProduce,
  isLoading = false,
  isAddingToInventory = false,
  isInInventory = false,
  qualityScore = null,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isScoreDialogOpen, setIsScoreDialogOpen] = useState(false);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);

  const displayedItems = items.slice(0, 5);
  const hasMoreItems = items.length > 5;

  const showTimeline = ["accepted", "out_for_delivery", "complete"].includes(
    status
  );
  const showActions = status === "pending";
  const showAssignDispatch = status === "accepted";
  const showTrackRider = status === "out_for_delivery";
  const showAddToInventory = status === "complete" && !isInInventory;
  const showScoring =
    (status === "complete" || isInInventory) && onScoreProduce;

  const getStatusDisplay = (status: string) => {
    if (status === "out_for_delivery") {
      return "ASSIGNED FOR PICKUP";
    }
    return status.replace("_", " ").toUpperCase();
  };

  const handleAddToInventory = () => {
    if (onAddToInventory && farmerRequestId && farmerId && aggregatorId) {
      onAddToInventory(farmerRequestId, farmerId, aggregatorId);
    }
  };

  const handleScoreSubmit = async (score: number) => {
    if (!onScoreProduce || !farmerRequestId || !farmerId) return;

    setIsSubmittingScore(true);
    try {
      await onScoreProduce(farmerRequestId, score);
    } finally {
      setIsSubmittingScore(false);
    }
  };

  const getScoreColor = (value: number) => {
    if (value >= 80) return "bg-green-100 text-green-700 border-green-200";
    if (value >= 60) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    if (value >= 40) return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  return (
    <div className="w-full h-fit bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
      {/* Header Section */}
      <div className="flex items-center justify-between p-3 sm:p-4 bg-white border-b">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Company Logo */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-accent rounded-xl flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
          </div>

          {/* Company Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 leading-tight truncate">
                {company}
              </h3>
              <div className="bg-gray-100 px-2 py-0.5 pb-1.5 rounded-full text-gray-700 text-xs font-medium">
                aggregator
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 mt-0.5 truncate">
              {location}
            </p>
          </div>
        </div>

        {/* Date and Status */}
        <div className="flex flex-col items-end gap-1 ml-2">
          <div className="flex gap-0.5">
            {[...Array(3)].map((_, i) => (
              <Package
                key={i}
                className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600"
                strokeWidth={2}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">{date}</span>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex justify-between px-3 sm:px-4 pt-2 w-full items-center text-sm text-muted-foreground">
        <div className="flex items-center gap-2 flex-wrap">
          {status !== "pending" && (
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                status === "accepted"
                  ? "bg-green-100 text-green-700"
                  : status === "declined"
                  ? "bg-red-100 text-red-700"
                  : status === "out_for_delivery"
                  ? "bg-blue-100 text-blue-700"
                  : status === "complete"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {status === "out_for_delivery" ? (
                <Truck className="w-3 h-3" />
              ) : status === "complete" ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <Clock className="w-3 h-3" />
              )}
              {getStatusDisplay(status)}
            </span>
          )}
          {isInInventory && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
              <Archive className="w-3 h-3" />
              IN INVENTORY
            </span>
          )}
          {qualityScore !== null && qualityScore !== undefined && (
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getScoreColor(
                qualityScore
              )}`}
            >
              <Star className="w-3 h-3 fill-current" />
              Quality: {qualityScore}/100
            </span>
          )}
        </div>

        <p className="whitespace-nowrap">
          Batch-ID: FR-{farmerId}-{farmerRequestId}
        </p>
      </div>

      {/* Items List */}
      <div className="relative bg-gray-50">
        <div className="py-2">
          <div className="space-y-0">
            {displayedItems.map((item: OrderItem, index: number) => (
              <div
                key={index}
                className="flex p-4 py-2 border-t items-center justify-between"
              >
                <span className="text-sm sm:text-base text-gray-900 truncate mr-2">
                  {item.name}
                </span>
                <span className="text-sm sm:text-base text-gray-900 font-medium whitespace-nowrap">
                  {item.quantity} {item.unit_measure || "units"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Fade overlay */}
        {hasMoreItems && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none"></div>
        )}

        {/* View All Button */}
        {hasMoreItems && (
          <div className="flex justify-center pb-3 pt-1 bg-gray-50">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <button className="text-sm font-medium flex items-center gap-1 transition-colors hover:text-primary">
                  View All ({items.length})
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>All Items</DialogTitle>
                  <DialogDescription>
                    {company} - {items.length} items
                  </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                  <div className="space-y-0">
                    {items.map((item: OrderItem, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                      >
                        <span className="text-sm sm:text-base text-gray-900">
                          {item.name}
                        </span>
                        <span className="text-sm sm:text-base text-gray-900 font-medium">
                          {item.quantity} {item.unit_measure || "units"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Timeline for tracking */}
      {showTimeline && <StatusTimeline status={status} />}

      {/* Action Buttons */}
      {showActions && (
        <div className="flex gap-3 p-3 sm:p-4 bg-white">
          <Button
            variant="secondary"
            onClick={() => onDecline?.(id)}
            disabled={isLoading}
            className="flex-1 bg-red-400 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white ring-4 ring-red-600/20 font-semibold text-sm sm:text-base py-2.5 sm:py-3 rounded-lg transition-all duration-200"
          >
            {isLoading ? "Processing..." : "Decline"}
          </Button>
          <Button
            onClick={() => onAccept?.(id)}
            disabled={isLoading}
            className="flex-1 bg-green-700 hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-lime-300 font-semibold text-sm sm:text-base py-2.5 sm:py-3 rounded-lg transition-all duration-200"
          >
            {isLoading ? "Processing..." : "Accept"}
          </Button>
        </div>
      )}

      {/* Assign Dispatch Button */}
      {showAssignDispatch && (
        <div className="p-3 sm:p-4 bg-white border-t">
          <Button
            onClick={() => onAssignDispatch?.(id)}
            disabled={isLoading}
            className="w-full disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm sm:text-base py-2.5 sm:py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Truck className="w-5 h-5" />
            {isLoading ? "Processing..." : "Assign Dispatch"}
          </Button>
        </div>
      )}

      {/* Track Rider Button */}
      {showTrackRider && (
        <div className="p-3 sm:p-4 bg-muted/60 border-t">
          <Button
            onClick={() => onTrackRider?.(id)}
            disabled={isLoading}
            variant={"secondary"}
            className="!bg-[#FD5202] ring-4 ring-[#FD5202]/40 w-full text-white"
          >
            <Truck className="w-5 h-5 animate-pulse" />
            {isLoading ? "Loading..." : "Track Rider"}
          </Button>
        </div>
      )}

      {/* Add to Inventory and Score Actions */}
      {(showAddToInventory || showScoring) && (
        <div className="p-3 sm:p-4 bg-muted/50 border-t space-y-3">
          {showAddToInventory && (
            <Button
              onClick={handleAddToInventory}
              disabled={
                isAddingToInventory ||
                !farmerRequestId ||
                !farmerId ||
                !aggregatorId
              }
              className="w-full disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm sm:text-base py-2.5 sm:py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Archive className="w-5 h-5" />
              {isAddingToInventory
                ? "Adding to Inventory..."
                : "Add to Inventory"}
            </Button>
          )}

          {showScoring && (
            <>
              <Button
                onClick={() => setIsScoreDialogOpen(true)}
                disabled={!farmerRequestId || !farmerId}
                variant="outline"
                className="w-full border border-yellow-400 bg-white hover:bg-yellow-50 text-yellow-700 font-semibold text-sm sm:text-base py-2.5 sm:py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Star className="w-5 h-5" />
                {qualityScore !== null && qualityScore !== undefined
                  ? "Update Quality Score"
                  : "Score Produce Quality"}
              </Button>

              <ScoreProduceDialog
                isOpen={isScoreDialogOpen}
                onOpenChange={setIsScoreDialogOpen}
                currentScore={qualityScore || 75}
                onSubmit={handleScoreSubmit}
                isSubmitting={isSubmittingScore}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AggregatorRequestCard;
