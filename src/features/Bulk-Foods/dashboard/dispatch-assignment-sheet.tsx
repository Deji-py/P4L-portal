"use client";
import React, { useState, useEffect } from "react";
import { Truck, MapPin, User, Phone, Search, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import ecolog_logo from "../../../../public/png/ecolog-logo.png";

interface Dispatch {
  id: number;
  name: string;
  phone: string;
  vehicle_type: string;
  vehicle_number: string;
  distance_km: number;
  status: "available" | "busy" | "offline";
  rating: number;
  completedDeliveries: number;
  location: string;
}

interface DispatchAssignmentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: number;
  onAssign: (requestId: number, dispatchId: number) => void;
  onUnassign?: (requestId: number) => void;
  isAssigning?: boolean;
}

// Assignment Status Dialog Component
const AssignmentStatusDialog = ({
  dispatch,
  status,
  countdown,
  onTryAgain,
  onNextRider,
  onClose,
}: {
  dispatch: Dispatch;
  status: "waiting" | "declined" | "accepted";
  countdown: number;
  onTryAgain: () => void;
  onNextRider: () => void;
  onClose: () => void;
}) => {
  const getAvatarStyle = () => {
    if (status === "declined") {
      return "grayscale";
    }
    return "";
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-sm w-full p-6 relative">
        {/* Confetti background for success */}
        {status === "accepted" && (
          <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
            {[...Array(25)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  backgroundColor: [
                    "#FFD700",
                    "#FFA500",
                    "#98D8C8",
                    "#F7CAC9",
                    "#92A8D1",
                  ][Math.floor(Math.random() * 5)],
                  animationDelay: `${Math.random() * 2}s`,
                  opacity: 0.6,
                }}
              />
            ))}
          </div>
        )}

        {/* Close button */}
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Content */}
        <div className="flex flex-col items-center text-center space-y-4 mt-2">
          {/* Avatar */}
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center ${
              status === "accepted"
                ? "bg-gray-100 ring-4 ring-orange-600"
                : status === "declined"
                ? "bg-gray-200"
                : "bg-gray-100 ring-4 ring-orange-600"
            } ${getAvatarStyle()}`}
          >
            <User
              className={`w-12 h-12 ${
                status === "accepted"
                  ? "text-green-600"
                  : status === "declined"
                  ? "text-gray-600"
                  : "text-gray-600"
              }`}
            />
          </div>

          {/* Name and Location */}
          <div>
            <h2 className="text-xl font-bold text-gray-900">{dispatch.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{dispatch.location}</p>
          </div>

          {/* Status Message */}
          {status === "waiting" && (
            <div className="space-y-2">
              <p className="text-base text-gray-900">
                Waiting For Rider to Accept Orders
              </p>
              <p className="text-md font-medium  text-green-600">
                {Math.floor(countdown / 60)}:
                {(countdown % 60).toString().padStart(2, "0")} sec
              </p>
            </div>
          )}

          {status === "declined" && (
            <>
              <div>
                <p className="text-base font-semibold text-gray-900">
                  Oops!! Rider is not available or has declined
                </p>
              </div>
              <div className="flex gap-2 w-full pt-2">
                <Button
                  onClick={onTryAgain}
                  variant="outline"
                  className="flex-1 text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                >
                  Try Again
                </Button>
                <Button
                  onClick={onNextRider}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  Next Rider →
                </Button>
              </div>
            </>
          )}

          {status === "accepted" && (
            <>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Rider Accepted Order
                </h3>
                <p className="text-sm text-gray-600">
                  You have successfully assigned Package to Rider, Rider on the
                  way
                </p>
              </div>
            </>
          )}
        </div>

        {/* EKOLOG branding */}
        <div className="mt-6 flex flex-col justify-center items-center text-center">
          <Image
            src={ecolog_logo}
            alt="ecolog-image"
            width={200}
            height={200}
            className="w-[100px] "
          />
        </div>
      </div>
    </div>
  );
};

const DispatchAssignmentSheet: React.FC<DispatchAssignmentSheetProps> = ({
  open,
  onOpenChange,
  requestId,
  onAssign,
  onUnassign,
  isAssigning = false,
}) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDispatch, setSelectedDispatch] = useState<number | null>(null);
  const [assignmentStatus, setAssignmentStatus] = useState<{
    show: boolean;
    dispatch: Dispatch | null;
    status: "waiting" | "declined" | "accepted";
  }>({
    show: false,
    dispatch: null,
    status: "waiting",
  });
  const [countdown, setCountdown] = useState(90); // 90 seconds timeout

  // Mock data - replace with actual API call
  const mockDispatches: Dispatch[] = [
    {
      id: 1,
      name: "John Adebayo",
      phone: "+234 801 234 5678",
      vehicle_type: "Truck",
      vehicle_number: "LAG-123-XY",
      distance_km: 2.5,
      status: "available",
      rating: 4.8,
      completedDeliveries: 127,
      location: "igobogbo LGA",
    },
    {
      id: 2,
      name: "Mary Okonkwo",
      phone: "+234 802 345 6789",
      vehicle_type: "Van",
      vehicle_number: "LAG-456-AB",
      distance_km: 4.2,
      status: "available",
      rating: 4.9,
      completedDeliveries: 203,
      location: "Ikeja LGA",
    },
    {
      id: 3,
      name: "Ibrahim Mohammed",
      phone: "+234 803 456 7890",
      vehicle_type: "Truck",
      vehicle_number: "LAG-789-CD",
      distance_km: 1.8,
      status: "busy",
      rating: 4.7,
      completedDeliveries: 156,
      location: "Surulere LGA",
    },
    {
      id: 4,
      name: "Grace Eze",
      phone: "+234 804 567 8901",
      vehicle_type: "Van",
      vehicle_number: "LAG-012-EF",
      distance_km: 5.1,
      status: "available",
      rating: 4.6,
      completedDeliveries: 89,
      location: "Lekki LGA",
    },
  ];

  const filteredDispatches = mockDispatches.filter(
    (dispatch) =>
      dispatch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispatch.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (
      assignmentStatus.show &&
      assignmentStatus.status === "waiting" &&
      countdown > 0
    ) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // Timeout - rider didn't respond
            handleRiderDecline();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [assignmentStatus.show, assignmentStatus.status, countdown]);

  // Simulate rider response (replace with actual API polling)
  useEffect(() => {
    let responseTimer: NodeJS.Timeout;

    if (assignmentStatus.show && assignmentStatus.status === "waiting") {
      // Simulate rider response after random time (15-60 seconds)
      // In production, you would poll an API endpoint instead
      const responseTime = Math.random() * 45000 + 15000; // 15-60 seconds
      const willAccept = Math.random() > 0.3; // 70% acceptance rate

      responseTimer = setTimeout(() => {
        if (willAccept) {
          handleRiderAccept();
        } else {
          handleRiderDecline();
        }
      }, responseTime);
    }

    return () => {
      if (responseTimer) clearTimeout(responseTimer);
    };
  }, [assignmentStatus.show]);

  const handleAssign = (dispatchId: number) => {
    const dispatch = mockDispatches.find((d) => d.id === dispatchId);
    if (!dispatch) return;

    // Show waiting dialog immediately (don't call onAssign yet)
    setAssignmentStatus({
      show: true,
      dispatch,
      status: "waiting",
    });
    setCountdown(90);
  };

  const handleRiderAccept = () => {
    setAssignmentStatus((prev) => ({
      ...prev,
      status: "accepted",
    }));

    // NOW call the parent onAssign callback after acceptance
    // This should update the order status to "out_for_delivery" (Assigned For Pickup)
    if (assignmentStatus.dispatch) {
      onAssign(requestId, assignmentStatus.dispatch.id);
    }

    // Navigate to tracking after 3 seconds
    setTimeout(() => {
      router.push(`/dashboard/bulk_trader/tracking/${requestId}`);
      closeAssignmentDialog();
    }, 3000);
  };

  const handleRiderDecline = () => {
    setAssignmentStatus((prev) => ({
      ...prev,
      status: "declined",
    }));

    // Unassign the rider
    if (onUnassign && assignmentStatus.dispatch) {
      onUnassign(requestId);
    }
  };

  const handleTryAgain = () => {
    if (assignmentStatus.dispatch) {
      setAssignmentStatus({
        show: true,
        dispatch: assignmentStatus.dispatch,
        status: "waiting",
      });
      setCountdown(90);

      // Don't re-assign yet, just wait for response
    }
  };

  const handleNextRider = () => {
    closeAssignmentDialog();
    // Sheet will remain open so user can select another rider
  };

  const closeAssignmentDialog = () => {
    setAssignmentStatus({
      show: false,
      dispatch: null,
      status: "waiting",
    });
    setCountdown(90);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-700";
      case "busy":
        return "bg-orange-100 text-orange-700";
      case "offline":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full p-4 sm:max-w-lg overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>Assign Dispatch Rider</SheetTitle>
            <SheetDescription>
              Select an available dispatch rider to deliver this order
            </SheetDescription>
          </SheetHeader>

          {/* Search Bar */}
          <div className="mt-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name or vehicle number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Dispatch List */}
          <div className="mt-6 space-y-3">
            {filteredDispatches.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No dispatch riders found
              </div>
            ) : (
              filteredDispatches.map((dispatch) => (
                <div
                  key={dispatch.id}
                  className={`border rounded-lg p-4 transition-all cursor-pointer ${
                    selectedDispatch === dispatch.id
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  } ${dispatch.status !== "available" ? "opacity-60" : ""}`}
                  onClick={() => {
                    if (dispatch.status === "available") {
                      setSelectedDispatch(dispatch.id);
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {dispatch.name}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Phone className="w-3 h-3" />
                          {dispatch.phone}
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(dispatch.status)}>
                      {dispatch.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-gray-500 text-xs">Vehicle</p>
                        <p className="font-medium text-gray-900">
                          {dispatch.vehicle_type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-gray-500 text-xs">Distance</p>
                        <p className="font-medium text-gray-900">
                          {dispatch.distance_km} km away
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-gray-600">
                    <span>⭐ {dispatch.rating} rating</span>
                    <span>{dispatch.completedDeliveries} deliveries</span>
                    <span className="font-mono">{dispatch.vehicle_number}</span>
                  </div>

                  {selectedDispatch === dispatch.id &&
                    dispatch.status === "available" && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAssign(dispatch.id);
                        }}
                        disabled={isAssigning}
                        className="mt-3 w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-colors"
                      >
                        {isAssigning ? "Assigning..." : "Assign & Track"}
                      </Button>
                    )}
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Assignment Status Dialog */}
      {assignmentStatus.show && assignmentStatus.dispatch && (
        <AssignmentStatusDialog
          dispatch={assignmentStatus.dispatch}
          status={assignmentStatus.status}
          countdown={countdown}
          onTryAgain={handleTryAgain}
          onNextRider={handleNextRider}
          onClose={closeAssignmentDialog}
        />
      )}
    </>
  );
};

export default DispatchAssignmentSheet;
