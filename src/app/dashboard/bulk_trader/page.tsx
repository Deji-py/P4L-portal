/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AggregatorRequestCard from "@/features/Bulk-Foods/dashboard/aggregator-request-card";
import DashboardTabFilter from "@/features/Bulk-Foods/dashboard/dashboard-tab-filter";
import DispatchAssignmentSheet from "@/features/Bulk-Foods/dashboard/dispatch-assignment-sheet";
import { useRouter, useSearchParams } from "next/navigation";
import { Bike, Loader2 } from "lucide-react";

import { toast } from "sonner";
import DashboardStatistics from "@/features/Bulk-Foods/dashboard/bulk-food-statistics";
import useProfile from "@/hooks/useProfile";
import AvatarGroupMax from "@/components/avatar-group";
import { Button } from "@/components/ui/button";
import ecolog_logo from "../../../../public/png/ecolog-logo.png";
import ecolog_image from "../../../../public/png/ecolog-image.png";
import Image from "next/image";
import ViewAllRidersDialog from "@/features/Bulk-Foods/dashboard/viewall-riders-dialog";
import { useBulkFoodRequests } from "@/hooks/bulk-traders/useBulkFoodRequests";
import { useInventory } from "@/hooks/bulk-traders/useInventory";

const dispatch_statistics = [
  {
    title: "Assigned",
    value: 10,
  },
  {
    title: "Available",
    value: 10,
  },
  {
    title: "Unavailable",
    value: 10,
  },
];

function BulkTraderDashboard() {
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [dispatchSheetOpen, setDispatchSheetOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(
    null
  );
  const [viewAllRidersDialogOpen, setViewAllRidersDialogOpen] = useState(false);
  const [inventoryCheckMap, setInventoryCheckMap] = useState<
    Record<string, boolean>
  >({});

  const router = useRouter();
  const { profile } = useProfile("bulk_traders");

  const bulkTraderId = profile?.id;

  const currentTab = searchParams.get("tab") || "pending";
  const itemsPerPage = 10;

  const {
    requests,
    totalCount,
    requestCounts,
    requestsLoading,
    isUpdatingStatus,
    isAssigningDispatch,
    handleUpdateStatus,
    handleAssignDispatch,
    handleScoreProduce,
  } = useBulkFoodRequests(bulkTraderId, currentTab, currentPage, itemsPerPage);

  const { addRequestToInventory, checkRequestInInventory, isAddingRequest } =
    useInventory(bulkTraderId);

  // Check which requests are already in inventory
  useEffect(() => {
    const checkInventoryStatus = async () => {
      if (!bulkTraderId || !requests.length) return;

      const checks: Record<string, boolean> = {};

      for (const request of requests) {
        if (request.status === "complete" && request.farmer_request_id) {
          const farmerId = request.farmer_requests?.farmer_id;
          if (farmerId) {
            const isInInventory = await checkRequestInInventory(
              bulkTraderId,
              farmerId,
              request.farmer_request_id
            );
            checks[`${farmerId}-${request.farmer_request_id}`] = isInInventory;
          }
        }
      }

      setInventoryCheckMap(checks);
    };

    checkInventoryStatus();
  }, [requests, bulkTraderId, checkRequestInInventory]);

  const handleAccept = (id: number) => {
    handleUpdateStatus(id, "accepted");
    toast.success("Request Accepted", {
      description: "The request has been accepted successfully.",
    });
    router.push(`/dashboard/bulk_trader/?tab=accepted`);
  };

  const handleDecline = (id: number) => {
    handleUpdateStatus(id, "declined");
    toast.error("Request Declined", {
      description: "The request has been declined.",
    });
  };

  const handleOpenDispatchSheet = (id: number) => {
    setSelectedRequestId(id);
    setDispatchSheetOpen(true);
  };

  const handleDispatchAssignment = (requestId: number, dispatchId: number) => {
    handleAssignDispatch(requestId, dispatchId);
    toast.success("Dispatch Assigned", {
      description: "Dispatch rider has been assigned successfully.",
    });
    setDispatchSheetOpen(false);
    router.push(`/dashboard/bulk_trader/?tab=out_for_delivery`);
  };

  const handleTrackRider = () => {
    router.push(`/dashboard/bulk_trader/tracking/1`);
  };

  const handleAddToInventory = async (
    farmerRequestId: number,
    farmerId: number,
    aggregatorId: number
  ) => {
    if (!bulkTraderId) {
      toast.error("Error", {
        description: "Bulk trader ID not found",
      });
      return;
    }

    try {
      const result = await addRequestToInventory({
        bulk_trader_id: bulkTraderId,
        farmer_request_id: farmerRequestId,
        aggregator_id: aggregatorId,
      });

      if (result.success) {
        toast.success("Added to Inventory", {
          description: result.message,
        });
        // Update the inventory check map
        setInventoryCheckMap((prev) => ({
          ...prev,
          [`${farmerId}-${farmerRequestId}`]: true,
        }));

        router.push(`/dashboard/bulk_trader/inventory`);
      } else {
        toast.error("Failed to Add", {
          description: result.message,
        });
      }
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to add items to inventory",
      });
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="py-3 px-3 sm:px-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row py-2 px-3 sm:px-6 sticky top-12 z-10 bg-white items-start sm:items-center gap-3 justify-between flex-wrap w-full mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border border-primary">
            <AvatarImage src={undefined} />
            <AvatarFallback>SD</AvatarFallback>
          </Avatar>
          <div className="text-sm">
            <p className="font-semibold text-base">{profile?.business_name}</p>
            <p className="opacity-70 text-xs sm:text-sm">
              {profile?.local_gov_area} LGA, {profile?.state}
            </p>
          </div>
        </div>
        <div className="w-full sm:w-auto overflow-x-auto">
          <DashboardTabFilter counts={requestCounts} />
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 w-full gap-4 flex-1">
        {/* Requests List */}
        <div className="lg:col-span-8 2xl:col-span-9 p-3 sm:p-6 rounded-2xl border-2 border-dashed max-h-[calc(100vh-200px)] overflow-hidden overflow-y-auto">
          <DashboardStatistics
            stats={{
              pending: requestCounts?.pending || 0,
              accepted: requestCounts?.accepted || 0,
              declined: requestCounts?.declined || 0,
              outForDelivery: requestCounts?.out_for_delivery || 0,
              complete: requestCounts?.complete || 0,
            }}
          />
          {requestsLoading ? (
            <div className="flex items-center mt-4 justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-20 mt-4">
              <p className="text-gray-500 text-lg">No requests found</p>
              <p className="text-gray-400 text-sm mt-2">
                {currentTab === "pending"
                  ? "You don't have any pending requests at the moment."
                  : `No ${currentTab.replace("_", " ")} requests.`}
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 mt-4 xl:grid-cols-2 2xl:grid-cols-2">
                {requests.map((request) => {
                  const farmerId = request.farmer_requests?.farmer_id;
                  const inventoryKey =
                    farmerId && request.farmer_request_id
                      ? `${farmerId}-${request.farmer_request_id}`
                      : "";
                  const isInInventory = inventoryKey
                    ? inventoryCheckMap[inventoryKey]
                    : false;

                  return (
                    <AggregatorRequestCard
                      onScoreProduce={handleScoreProduce}
                      qualityScore={request.score}
                      key={request.id}
                      id={request.id}
                      company={
                        request.aggregators?.business_name || "Unknown Company"
                      }
                      location={`${request.aggregators?.local_gov_area}, ${request.aggregators?.state}`}
                      date={new Date(request.created_at).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                      items={
                        request.farmer_produce?.map((produce) => ({
                          name: produce.product_name,
                          quantity: produce.quantity,
                          unit_measure: produce.unit_measure,
                        })) || []
                      }
                      status={request.status as any}
                      farmerId={farmerId}
                      farmerRequestId={request.farmer_request_id as number}
                      aggregatorId={request.aggregator_id as number}
                      onAccept={handleAccept}
                      onDecline={handleDecline}
                      onTrackRider={handleTrackRider}
                      onAssignDispatch={handleOpenDispatchSheet}
                      onAddToInventory={handleAddToInventory}
                      isLoading={isUpdatingStatus || isAssigningDispatch}
                      isAddingToInventory={isAddingRequest}
                      isInInventory={isInInventory}
                    />
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Dispatch statistics */}
        <div className="lg:col-span-4 2xl:col-span-3 bg-[#f5f5f5] flex flex-col max-h-[calc(100vh-200px)] rounded-2xl overflow-hidden ">
          <div className=" grid grid-cols-1  space-y-4 ">
            <div className=" flex justify-between  items-center p-4 border-b text-gray-500">
              <Bike />
              <p className="text-sm font-semibold text-gray-900">
                Total Riders
              </p>
              <p className="text-xs text-gray-500">100</p>
            </div>
          </div>

          {/* Total Riders */}
          {dispatch_statistics.map((stat, index) => (
            <div
              key={index}
              className=" flex justify-between  items-center p-4 border-b text-gray-500"
            >
              <AvatarGroupMax />
              <p className="text-sm font-semibold  flex items-center felx- text-gray-900">
                {stat.title}
                <span className=" w-1 h-1 ring-4 ring-green-600/30 bg-green-700 ml-2 rounded-full"></span>
              </p>
              <p className="text-xs text-gray-500">{stat.value}</p>
            </div>
          ))}

          <div className=" p-6 flex-1  flex flex-col py-5 justify-center items-center">
            <Button
              onClick={() => setViewAllRidersDialogOpen(true)}
              variant={"secondary"}
              className="!bg-[#FD5202] ring-4 ring-[#FD5202]/40 w-full text-white"
            >
              View All Riders
            </Button>

            <div className=" p-4 gap-4  mt-4 flex-1 flex  flex-col justify-center items-center ">
              <Image
                src={ecolog_logo}
                alt="ecolog-image"
                width={200}
                height={200}
                className="w-[100px] "
              />

              <Image
                src={ecolog_image}
                alt="ecolog-image"
                width={300}
                height={300}
                className="w-full h-full flex-1"
              />
            </div>
          </div>
        </div>
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

      <ViewAllRidersDialog
        open={viewAllRidersDialogOpen}
        onOpenChange={setViewAllRidersDialogOpen}
        // localGovArea={profile?.local_gov_area}
      />
    </div>
  );
}

export default BulkTraderDashboard;
