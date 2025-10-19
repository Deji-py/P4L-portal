import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  Bike,
  CheckCircle2,
  Clock,
  XCircle,
  Star,
  Phone,
  MapPin,
} from "lucide-react";
import { useDispatchRiders } from "@/hooks/bulk-traders/useDispatchRiders";

interface ViewAllRidersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  localGovArea?: string;
}

const ViewAllRidersDialog = ({
  open,
  onOpenChange,
  localGovArea,
}: ViewAllRidersDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const { dispatchRiders, dispatchRidersLoading } = useDispatchRiders(
    localGovArea,
    statusFilter === "all" ? undefined : statusFilter
  );

  // Filter riders based on search query
  const filteredRiders = dispatchRiders.filter(
    (rider) =>
      rider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rider.phone.includes(searchQuery) ||
      rider.vehicle_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate statistics
  const stats = {
    total: dispatchRiders.length,
    available: dispatchRiders.filter((r) => r.status === "available").length,
    busy: dispatchRiders.filter((r) => r.status === "busy").length,
    offline: dispatchRiders.filter((r) => r.status === "offline").length,
  };

  // Pagination
  const totalPages = Math.ceil(filteredRiders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRiders = filteredRiders.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Reset to page 1 when search changes
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "available":
        return {
          label: "Available",
          color: "bg-green-100 text-green-700 border-green-200",
          icon: <CheckCircle2 className="w-3 h-3" />,
          dot: "bg-green-500",
        };
      case "busy":
        return {
          label: "Busy",
          color: "bg-yellow-100 text-yellow-700 border-yellow-200",
          icon: <Clock className="w-3 h-3" />,
          dot: "bg-yellow-500",
        };
      case "offline":
        return {
          label: "Offline",
          color: "bg-gray-100 text-gray-700 border-gray-200",
          icon: <XCircle className="w-3 h-3" />,
          dot: "bg-gray-400",
        };
      default:
        return {
          label: status,
          color: "bg-gray-100 text-gray-700 border-gray-200",
          icon: null,
          dot: "bg-gray-400",
        };
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bike className="w-5 h-5 text-orange-600" />
            All Dispatch Riders
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600 font-medium">Total</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {stats.total}
                  </p>
                </div>
                <Bike className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-600 font-medium">
                    Available
                  </p>
                  <p className="text-2xl font-bold text-green-700">
                    {stats.available}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-yellow-600 font-medium">Busy</p>
                  <p className="text-2xl font-bold text-yellow-700">
                    {stats.busy}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-medium">Offline</p>
                  <p className="text-2xl font-bold text-gray-700">
                    {stats.offline}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, phone, or vehicle..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              <Button
                size="sm"
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => {
                  setStatusFilter("all");
                  setCurrentPage(1);
                }}
                className="whitespace-nowrap"
              >
                All
              </Button>
              <Button
                size="sm"
                variant={statusFilter === "available" ? "default" : "outline"}
                onClick={() => {
                  setStatusFilter("available");
                  setCurrentPage(1);
                }}
                className="whitespace-nowrap"
              >
                Available
              </Button>
              <Button
                size="sm"
                variant={statusFilter === "busy" ? "default" : "outline"}
                onClick={() => {
                  setStatusFilter("busy");
                  setCurrentPage(1);
                }}
                className="whitespace-nowrap"
              >
                Busy
              </Button>
              <Button
                size="sm"
                variant={statusFilter === "offline" ? "default" : "outline"}
                onClick={() => {
                  setStatusFilter("offline");
                  setCurrentPage(1);
                }}
                className="whitespace-nowrap"
              >
                Offline
              </Button>
            </div>
          </div>

          {/* Riders Grid */}
          {dispatchRidersLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600"></div>
            </div>
          ) : paginatedRiders.length === 0 ? (
            <div className="text-center py-20">
              <Bike className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">
                No riders found
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {searchQuery
                  ? "Try adjusting your search"
                  : "No dispatch riders available"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {paginatedRiders.map((rider) => {
                const statusConfig = getStatusConfig(rider.status);
                return (
                  <div
                    key={rider.id}
                    className="border rounded-lg p-3 hover:shadow-md transition-shadow bg-white relative"
                  >
                    {/* Status Indicator Dot */}
                    <div className="absolute top-2 right-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${statusConfig.dot} ring-2 ring-white block`}
                      ></span>
                    </div>

                    <div className="flex flex-col items-center text-center space-y-2">
                      <Avatar className="w-14 h-14 border-2 border-orange-500">
                        <AvatarImage src={undefined} />
                        <AvatarFallback className="bg-orange-100 text-orange-700 font-semibold">
                          {rider.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="w-full">
                        <h3 className="font-semibold text-sm truncate">
                          {rider.name}
                        </h3>
                        <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mt-0.5">
                          <Phone className="w-3 h-3" />
                          <span>{rider.phone}</span>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className={`text-xs ${statusConfig.color} border`}
                      >
                        <span className="flex items-center gap-1">
                          {statusConfig.icon}
                          {statusConfig.label}
                        </span>
                      </Badge>

                      <div className="w-full pt-2 border-t space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Vehicle:</span>
                          <span className="font-medium">
                            {rider.vehicle_type}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Plate:</span>
                          <span className="font-medium font-mono">
                            {rider.vehicle_number}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            Rating:
                          </span>
                          <span className="font-medium">
                            {rider.rating.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Deliveries:</span>
                          <span className="font-medium">
                            {rider.completed_deliveries}
                          </span>
                        </div>
                        {rider.local_gov_area && (
                          <div className="flex items-start justify-between text-xs pt-1">
                            <MapPin className="w-3 h-3 text-gray-400 mt-0.5" />
                            <span className="font-medium text-right flex-1 ml-1">
                              {rider.local_gov_area}, {rider.state}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-gray-600">
                Showing {startIndex + 1}-
                {Math.min(startIndex + itemsPerPage, filteredRiders.length)} of{" "}
                {filteredRiders.length} riders
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600 px-2">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewAllRidersDialog;
