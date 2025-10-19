/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";
import { Loader2, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AggregatorRequestCard from "./aggregator-request-card";
import DispatchAssignmentSheet from "./dispatch-assignment-sheet";
import { toast } from "sonner";
import { useBulkFoodRequests } from "@/hooks/bulk-traders/useBulkFoodRequests";

interface AggregatorRequestsProps {
  bulkTraderId: number;
  status?: string;
  currentPage?: number;
  itemsPerPage?: number;
}

const AggregatorRequests: React.FC<AggregatorRequestsProps> = ({
  bulkTraderId,
  status = "pending",
  currentPage = 1,
  itemsPerPage = 10,
}) => {
  const [dispatchSheetOpen, setDispatchSheetOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(
    null
  );
  const [sortBy, setSortBy] = useState<"date" | "items">("date");

  const {
    requests,
    totalCount,
    requestsLoading,
    isUpdatingStatus,
    isAssigningDispatch,
    handleUpdateStatus,
    handleAssignDispatch,
  } = useBulkFoodRequests(bulkTraderId, status, currentPage, itemsPerPage);

  const handleAccept = (id: number) => {
    handleUpdateStatus(id, "accepted");
    toast.success("Request Accepted", {
      description: "You can now assign a dispatch rider to this order.",
      duration: 3000,
    });
  };

  const handleDecline = (id: number) => {
    handleUpdateStatus(id, "declined");
    toast.error("Request Declined", {
      description: "The aggregator will be notified.",
      duration: 3000,
    });
  };

  const handleOpenDispatchSheet = (id: number) => {
    setSelectedRequestId(id);
    setDispatchSheetOpen(true);
  };

  const handleDispatchAssignment = (requestId: number, dispatchId: number) => {
    handleAssignDispatch(requestId, dispatchId);
    toast.success("Dispatch Assigned Successfully", {
      description: "Redirecting to tracking page...",
      duration: 2000,
    });
    setDispatchSheetOpen(false);
  };

  // Sort requests
  const sortedRequests = [...requests].sort((a, b) => {
    if (sortBy === "date") {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else {
      const aItems = a.farmer_produce?.length || 0;
      const bItems = b.farmer_produce?.length || 0;
      return bItems - aItems;
    }
  });

  if (requestsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-green-600 mb-4" />
        <p className="text-gray-500">Loading requests...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Filter className="w-10 h-10 text-gray-400" />
        </div>
        <p className="text-gray-500 text-lg font-medium">No requests found</p>
        <p className="text-gray-400 text-sm mt-2">
          {status === "pending"
            ? "You don't have any pending requests at the moment."
            : `No ${status.replace("_", " ")} requests available.`}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Sort Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            Showing {requests.length} of {totalCount} requests
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Sort by:</span>
          <Select
            value={sortBy}
            onValueChange={(value: any) => setSortBy(value)}
          >
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Latest First</SelectItem>
              <SelectItem value="items">Most Items</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Requests Grid */}
      <div className="grid gap-4 xl:grid-cols-2">
        {sortedRequests.map((request) => (
          <AggregatorRequestCard
            key={request.id}
            id={request.id}
            company={request.aggregators?.business_name || "Unknown Company"}
            location={`${request.aggregators?.local_gov_area || "Unknown"}, ${
              request.aggregators?.state || "Unknown"
            }`}
            date={new Date(request.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
            items={
              request.farmer_produce?.map((produce) => ({
                name: produce.product_name,
                quantity: produce.quantity,
                unit_measure: produce.unit_measure,
              })) || []
            }
            status={request.status as any}
            onAccept={handleAccept}
            onDecline={handleDecline}
            onAssignDispatch={handleOpenDispatchSheet}
            isLoading={isUpdatingStatus || isAssigningDispatch}
          />
        ))}
      </div>

      {/* Dispatch Assignment Sheet */}
      {selectedRequestId && (
        <DispatchAssignmentSheet
          open={dispatchSheetOpen}
          onOpenChange={setDispatchSheetOpen}
          requestId={selectedRequestId}
          onAssign={handleDispatchAssignment}
          isAssigning={isAssigningDispatch}
        />
      )}
    </>
  );
};

export default AggregatorRequests;
