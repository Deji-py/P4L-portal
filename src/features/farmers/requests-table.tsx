/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, Package, Calendar, MapPin, Star, Clock } from "lucide-react";
import { format } from "date-fns";

interface Request {
  id: number;
  submitted_at: string;
  status: string;
  score: number | null;
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

export function RequestsTable({ requests, isLoading }: RequestsTableProps) {
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      accepted: { variant: "default", label: "Accepted" },
      rejected: { variant: "destructive", label: "Rejected" },
      complete: { variant: "outline", label: "Complete" },
    };

    const config = variants[status.toLowerCase()] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

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
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Aggregator</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Inspection Date</TableHead>
              <TableHead>Inspeaction Time</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">#{request.id}</TableCell>
                <TableCell>
                  {format(new Date(request.submitted_at), "MMM dd, yyyy")}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">
                      {request.aggregators?.business_name || "N/A"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {request.aggregators?.local_gov_area}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  {request.farmer_produce?.length || 0} item(s)
                </TableCell>
                <TableCell>{getStatusBadge(request.status)}</TableCell>
                <TableCell>
                  {request.score ? (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">
                        {request.score.toFixed(1)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </TableCell>
                <TableCell>
                  {request.inspection_date ? (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(
                          new Date(request.inspection_date),
                          "MMM dd, yyyy"
                        )}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Not scheduled</span>
                  )}
                </TableCell>
                <TableCell>
                  {request.inspection_time ? (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{request.inspection_time}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Not scheduled</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
                  {getStatusBadge(selectedRequest.status)}
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
