/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useCallback } from "react";
import { DataTable } from "@/components/core/InToolTable/data-table";
import {
  DataTableAction,
  DataTableColumn,
} from "@/components/core/InToolTable/types/table.types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  Package,
  Calendar,
  MapPin,
  Star,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";

interface Request {
  id: number;
  submitted_at: string;
  status: string;
  score: number | null;
  inspected?: boolean;
  aggregators?: {
    business_name: string;
    local_gov_area: string;
    state: string;
  };
  farmer_produce?: Array<{
    product_name: string;
    quantity: number;
    unit_measure: string;
    unit_price: number;
  }>;
  inspection_date?: string | null;
  inspection_time?: string | null;
}

interface RequestsTableProps {
  requests: Request[];
  isLoading: boolean;
}

type RequestTableData = {
  id: number;
  submitted_at: string;
  aggregator_name: string;
  local_gov_area: string;
  items_count: number;
  status: string;
  score: number | null;
  inspected: boolean;
  inspection_date: string | null;
  inspection_time: string | null;
};

const statusConfigMap = {
  pending: {
    className:
      "bg-amber-500/10 text-amber-700 border-amber-500/30 hover:bg-amber-500/20",
    label: "Pending",
  },
  accepted: {
    className:
      "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/20",
    label: "Accepted",
  },
  rejected: {
    className:
      "bg-rose-500/10 text-rose-700 border-rose-500/30 hover:bg-rose-500/20",
    label: "Rejected",
  },
  complete: {
    className:
      "bg-blue-500/10 text-blue-700 border-blue-500/30 hover:bg-blue-500/20",
    label: "Complete",
  },
  assigned: {
    className:
      "bg-purple-500/10 text-purple-700 border-purple-500/30 hover:bg-purple-500/20",
    label: "Assigned",
  },
} as const;

const getStatusConfig = (status: string) => {
  const statusLower = status.toLowerCase();
  return (
    statusConfigMap[statusLower as keyof typeof statusConfigMap] || {
      className:
        "bg-gray-500/10 text-gray-700 border-gray-500/30 hover:bg-gray-500/20",
      label: status,
    }
  );
};

const columns: DataTableColumn<any>[] = [
  {
    key: "submitted_at",
    header: "Date",
    sortable: true,
    type: "date",
    render: (value) => {
      return (
        <span className="text-sm">
          {format(new Date(value as string), "MMM dd, yyyy")}
        </span>
      );
    },
  },
  {
    key: "aggregator_name",
    header: "Aggregator",
    sortable: true,
    render: (value, row) => {
      return (
        <div>
          <p className="font-medium text-sm">{value as string}</p>
          <p className="text-xs text-muted-foreground">{row.local_gov_area}</p>
        </div>
      );
    },
  },
  {
    key: "items_count",
    header: "Items",
    sortable: true,
    render: (value: any) => {
      return <span className="text-sm">{value} item(s)</span>;
    },
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    type: "status",
    filterable: true,
  },
  {
    key: "score",
    header: "Score",
    sortable: true,
    render: (value) => {
      if (value) {
        return (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium text-sm">
              {(value as number).toFixed(1)}
            </span>
          </div>
        );
      }
      return <span className="text-muted-foreground text-sm">N/A</span>;
    },
  },
  {
    key: "inspected",
    header: "Inspected",
    sortable: true,
    filterable: true,
    type: "boolean",
  },
  {
    key: "inspection_date",
    header: "Inspection Date",
    sortable: true,
    type: "date",
    render: (value) => {
      if (value) {
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {format(new Date(value as string), "MMM dd, yyyy")}
            </span>
          </div>
        );
      }
      return (
        <span className="text-muted-foreground text-sm">Not scheduled</span>
      );
    },
  },
  {
    key: "inspection_time",
    header: "Inspection Time",
    sortable: true,
    render: (value) => {
      if (value) {
        return (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{value as string}</span>
          </div>
        );
      }
      return (
        <span className="text-muted-foreground text-sm">Not scheduled</span>
      );
    },
  },
];

export function RequestsTable({ requests, isLoading }: RequestsTableProps) {
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

  // Transform Request data to match table structure
  const tableData: RequestTableData[] = requests?.map((request) => ({
    id: request.id,
    submitted_at: request.submitted_at,
    aggregator_name: request.aggregators?.business_name || "N/A",
    local_gov_area: request.aggregators?.local_gov_area || "N/A",
    items_count: request.farmer_produce?.length || 0,
    status: request.status,
    score: request.score,
    inspected: request.inspected || request.status.toLowerCase() === "assigned",
    inspection_date: request.inspection_date || null,
    inspection_time: request.inspection_time || null,
  }));

  const handleViewDetails = useCallback(
    (row: RequestTableData) => {
      const selected = requests.find((item) => item.id === row.id) as Request;
      setSelectedRequest(selected);
    },
    [requests]
  );

  const actions: DataTableAction<any>[] = [
    {
      label: "View Details",
      onClick: (row) => {
        handleViewDetails(row);
      },
      icon: <Eye className="h-5 w-5" />,
    },
  ];

  if (!requests || requests.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No requests found</h3>
        <p className="text-muted-foreground">
          Start by creating your first produce request
        </p>
      </div>
    );
  }

  return (
    <>
      <DataTable
        actions={actions}
        columns={columns}
        isLoading={isLoading}
        data={tableData}
        disableFiltering={true}
        table_hidden_columns={[]}
      />

      {/* Request Details Dialog */}
      <Dialog
        open={!!selectedRequest}
        onOpenChange={() => setSelectedRequest(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Details #{selectedRequest?.id}</DialogTitle>
            <DialogDescription>
              Submitted on{" "}
              {selectedRequest &&
                format(new Date(selectedRequest.submitted_at), "MMMM dd, yyyy")}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Status & Score */}
              <div className="flex gap-4">
                <div className="flex-1 p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground mb-2">Status</p>
                  <Badge
                    className={
                      getStatusConfig(selectedRequest.status).className
                    }
                  >
                    {getStatusConfig(selectedRequest.status).label}
                  </Badge>
                </div>
                <div className="flex-1 p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground mb-2">Score</p>
                  {selectedRequest.score ? (
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-lg font-bold">
                        {selectedRequest.score.toFixed(1)}/5.0
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">
                      Not scored yet
                    </span>
                  )}
                </div>
                <div className="flex-1 p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground mb-2">
                    Inspected
                  </p>
                  {selectedRequest.inspected ||
                  selectedRequest.status.toLowerCase() === "assigned" ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">Yes</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <XCircle className="h-5 w-5" />
                      <span className="font-semibold">No</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Aggregator Info */}
              <div className="p-4 rounded-lg border">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold">
                      {selectedRequest.aggregators?.business_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedRequest.aggregators?.local_gov_area},{" "}
                      {selectedRequest.aggregators?.state}
                    </p>
                  </div>
                </div>
              </div>

              {/* Inspection Details */}
              {selectedRequest.inspection_date && (
                <div className="p-4 rounded-lg border bg-accent/30">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold">Inspection Scheduled</p>
                      <p className="text-sm text-muted-foreground">
                        {format(
                          new Date(selectedRequest.inspection_date),
                          "MMMM dd, yyyy"
                        )}{" "}
                        at {selectedRequest.inspection_time}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Produce Items */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Produce Items
                </h4>
                <div className="space-y-2">
                  {selectedRequest.farmer_produce?.map((produce, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">{produce.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {produce.quantity} {produce.unit_measure}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ₦{produce.unit_price.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          per unit
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg">
                  <p className="font-semibold">Total Value:</p>
                  <p className="text-xl font-bold text-primary">
                    ₦
                    {selectedRequest.farmer_produce
                      ?.reduce((sum, p) => sum + p.quantity * p.unit_price, 0)
                      .toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
