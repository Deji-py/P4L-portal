/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { DataTable } from "@/components/core/InToolTable/data-table";
import { Submission, useSubmissions } from "@/hooks/aggregators/useSubmissions";
import {
  Package,
  CheckCircle,
  AlertCircle,
  Eye,
  Star,
  User,
  MapPin,
  Calendar,
  Leaf,
  Tractor,
  Users,
  ImageIcon,
  Video as VideoIcon,
} from "lucide-react";
import {
  DataTableAction,
  DataTableColumn,
} from "@/components/core/InToolTable/types/table.types";
import { useRouter } from "next/navigation";
import ProceedsViewer from "../dialogs/ProceedsViewer";
import { useCallback, useState } from "react";
import ProduceCheckViewer from "../dialogs/ProduceCheckViewer";
import useProfile from "@/hooks/useProfile";
import SubmissionDetailsSheet from "../submission-detail-viewer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";

type SubmissionTableData = {
  id: number;
  farm_name: string;
  no_of_proceeds: number;
  farmer_name: string;
  farmer_id: number | null;
  local_gov_area: string;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "inspected"
    | "assigned"
    | string;
  score: number | null;
  submitted_at: string;
  aggregator_id: number | null;
};

const statusConfigMap = {
  approved: {
    className:
      "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/20",
    label: "Approved",
  },
  rejected: {
    className:
      "bg-rose-500/10 text-rose-700 border-rose-500/30 hover:bg-rose-500/20",
    label: "Rejected",
  },
  pending: {
    className:
      "bg-amber-500/10 text-amber-700 border-amber-500/30 hover:bg-amber-500/20",
    label: "Pending",
  },
  inspected: {
    className:
      "bg-blue-500/10 text-blue-700 border-blue-500/30 hover:bg-blue-500/20",
    label: "Inspected",
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
        "bg-blue-500/10 text-blue-700 border-blue-500/30 hover:bg-blue-500/20",
      label: status,
    }
  );
};

const columns: DataTableColumn<any>[] = [
  {
    key: "farmer_id",
    header: "Farmer ID",
    sortable: true,
  },
  {
    key: "farm_name",
    header: "Farm Name",
    sortable: true,
    accessor: (row) => row.farm_name,
    render: (value, row) => {
      return (
        <div className="flex items-center gap-2 font-medium">
          <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
            <Package className="h-4 w-4 text-green-600" />
          </div>
          <span className="text-gray-900">{value as string}</span>
        </div>
      );
    },
  },
  {
    key: "farmer_name",
    header: "Farmer",
    sortable: true,
    render: (value, row) => {
      return (
        <div>
          <p className="font-medium text-sm">{value as string}</p>
          <p className="text-xs text-muted-foreground">ID: {row.farmer_id}</p>
        </div>
      );
    },
  },
  {
    key: "no_of_proceeds",
    header: "Proceeds",
    sortable: true,
  },
  {
    key: "local_gov_area",
    header: "Location",
    sortable: true,
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
    key: "status",
    header: "Status",
    sortable: true,
    type: "status",
    filterable: true,
  },
  {
    key: "submitted_at",
    header: "Submitted At",
    sortable: true,
    type: "date",
  },
];

function SubmissionTable({
  data,
  loading,
}: {
  data: Submission[];
  loading: boolean;
}) {
  const router = useRouter();
  const { profile } = useProfile("aggregators");
  const [showProceedsViewer, setShowProceedsViewer] = useState(false);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [showFarmerDialog, setShowFarmerDialog] = useState(false);
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [showProduceCheckViewer, setShowProduceCheckViewer] = useState(false);
  const { handleApproveSubmission, handleRejectSubmission, isUpdating } =
    useSubmissions(profile?.id as number);

  // Transform the Submission data to match our table structure
  const tableData: SubmissionTableData[] = data?.map((submission) => ({
    id: submission.id,
    farm_name: submission.farmer_info?.farm_cluster_name || "N/A",
    no_of_proceeds: submission.produce.length || 0.0,
    farmer_name: submission.farmer_info?.full_name || "Unknown",
    farmer_id: submission.farmer_id,
    local_gov_area: submission.farmer_info?.local_gov_area || "N/A",
    status: submission.status,
    score: submission.score,
    submitted_at: submission.submitted_at,
    aggregator_id: submission.aggregator_id,
  }));

  const handleAssignToBulkFoods = useCallback(
    (row: SubmissionTableData) => {
      setShowProceedsViewer(true);
      const selected = data.find((item) => item.id === row.id) as Submission;
      setSelectedSubmission(selected);
    },
    [data]
  );

  const handleViewSubmissionDetails = (row: SubmissionTableData) => {
    const selected = data.find((item) => item.id === row.id) as Submission;
    setSelectedSubmission(selected);
    setShowDetailsSheet(true);
  };

  const handleViewFarmerDetails = (row: SubmissionTableData) => {
    const selected = data.find((item) => item.id === row.id) as Submission;
    setSelectedSubmission(selected);
    setShowFarmerDialog(true);
  };

  const actions: DataTableAction<any>[] = [
    {
      label: "View Farmer",
      onClick: (row) => {
        handleViewFarmerDetails(row);
      },
      icon: <User className="h-5 w-5" />,
    },
    {
      label: "Start Inspection",
      onClick: (row) => {
        router.push(`/dashboard/aggregator/inspection/${row?.id}`);
      },
      icon: <CheckCircle className="h-5 w-5" />,
      hidden: (row) => {
        return row.status !== "accepted";
      },
    },
    {
      label: "Review",
      onClick: (row) => {
        const selected = data.find((item) => item.id === row.id) as Submission;
        setSelectedSubmission(selected);
        setShowProduceCheckViewer(true);
      },
      icon: <AlertCircle className="h-5 w-5" />,
      hidden: (row) => row.status !== "pending",
    },
    {
      label: "Assign to Bulk Foods",
      onClick: (row) => {
        handleAssignToBulkFoods(row);
      },
      icon: <Package className="h-5 w-5" />,
      hidden: (row) => row.status !== "inspected",
    },
    {
      label: "View Details",
      onClick: (row) => {
        handleViewSubmissionDetails(row);
      },
      icon: <Eye className="h-5 w-5" />,
      hidden: (row) => row.status !== "rejected" && row.status !== "assigned",
    },
  ];

  return (
    <>
      <DataTable
        actions={actions}
        columns={columns}
        isLoading={loading}
        data={tableData}
        disableFiltering={true}
        table_hidden_columns={[]}
      />

      {/* Farmer Details Dialog */}
      <Dialog open={showFarmerDialog} onOpenChange={setShowFarmerDialog}>
        <DialogContent className="!max-w-4xl !max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Farmer Profile</DialogTitle>
            <DialogDescription>
              Complete details about the farmer and their farm
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="flex items-start gap-4 p-6 bg-muted/60 rounded-xl border">
                <div className="w-16 h-16 rounded-2xl bg-secondary border-primary flex items-center justify-center text-white text-2xl font-bold">
                  <Leaf className="w-10 h-10 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">
                    {selectedSubmission.farmer_info?.full_name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Farmer ID: {selectedSubmission.farmer_id}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="secondary">
                      <Calendar className="h-3 w-3 mr-1" />
                      {selectedSubmission.farmer_info?.years_of_operation ||
                        "N/A"}{" "}
                      years
                    </Badge>
                    {selectedSubmission.farmer_info?.is_cooperative_member && (
                      <Badge variant="secondary">
                        <Users className="h-3 w-3 mr-1" />
                        Cooperative Member
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Farm Media */}
              {(selectedSubmission.farmer_info?.farm_image_url ||
                selectedSubmission.farmer_info?.farm_video_url) && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg flex items-center gap-2">
                    <Tractor className="h-5 w-5 text-primary" />
                    Farm Media
                  </h4>
                  <Tabs
                    defaultValue={
                      selectedSubmission.farmer_info?.farm_image_url
                        ? "image"
                        : "video"
                    }
                  >
                    <TabsList>
                      {selectedSubmission.farmer_info?.farm_image_url && (
                        <TabsTrigger value="image">
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Photo
                        </TabsTrigger>
                      )}
                      {selectedSubmission.farmer_info?.farm_video_url && (
                        <TabsTrigger value="video">
                          <VideoIcon className="h-4 w-4 mr-2" />
                          Video
                        </TabsTrigger>
                      )}
                    </TabsList>
                    {selectedSubmission.farmer_info?.farm_image_url && (
                      <TabsContent value="image" className="mt-3">
                        <div className="rounded-xl overflow-hidden border">
                          <Image
                            src={selectedSubmission.farmer_info.farm_image_url}
                            alt="Farm"
                            width={800}
                            height={500}
                            className="w-full h-[400px] object-cover"
                          />
                        </div>
                      </TabsContent>
                    )}
                    {selectedSubmission.farmer_info?.farm_video_url && (
                      <TabsContent value="video" className="mt-3">
                        <div className="rounded-xl overflow-hidden border bg-black">
                          <video
                            src={selectedSubmission.farmer_info.farm_video_url}
                            controls
                            className="w-full h-[400px] object-contain"
                          >
                            Your browser does not support video playback.
                          </video>
                        </div>
                      </TabsContent>
                    )}
                  </Tabs>
                </div>
              )}

              {/* Farm Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contact & Location */}
                <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                  <h4 className="font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Location & Contact
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Farm Name</p>
                      <p className="font-medium">
                        {selectedSubmission.farmer_info?.farm_cluster_name ||
                          "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Location</p>
                      <p className="font-medium">
                        {selectedSubmission.farmer_info?.local_gov_area},{" "}
                        {selectedSubmission.farmer_info?.state}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Address</p>
                      <p className="font-medium">
                        {selectedSubmission.farmer_info?.address ||
                          `${selectedSubmission.farmer_info.local_gov_area}, ${selectedSubmission.farmer_info.state}` ||
                          "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Contact</p>
                      <p className="font-medium">
                        {selectedSubmission.farmer_info?.contact_information ||
                          "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Farm Details */}
                <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-primary" />
                    Farm Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Farm Size</p>
                      <p className="font-medium">
                        {selectedSubmission.farmer_info?.farm_size || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Farming Type</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedSubmission.farmer_info?.farming_type?.map(
                          (type, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs"
                            >
                              {type}
                            </Badge>
                          )
                        ) || <span className="font-medium">N/A</span>}
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Main Crops</p>
                      <p className="font-medium">
                        {selectedSubmission.farmer_info?.main_crops || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Monthly Output</p>
                      <p className="font-medium">
                        {selectedSubmission.farmer_info?.monthly_output ||
                          "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Operations */}
                <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                  <h4 className="font-semibold">Operations</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">
                        Irrigation Methods
                      </p>
                      <p className="font-medium">
                        {selectedSubmission.farmer_info
                          ?.irrigation_methods_used || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        Post-Harvest Facilities
                      </p>
                      <p className="font-medium">
                        {selectedSubmission.farmer_info
                          ?.post_harvest_facilities_available || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Seasonal Calendar</p>
                      <p className="font-medium">
                        {selectedSubmission.farmer_info?.seasonal_calendar ||
                          "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ownership & Support */}
                <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                  <h4 className="font-semibold">Ownership & Support</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Ownership Type</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedSubmission.farmer_info?.ownership_type?.map(
                          (type, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs"
                            >
                              {type}
                            </Badge>
                          )
                        ) || <span className="font-medium">N/A</span>}
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        Land Tenure Status
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedSubmission.farmer_info?.land_tenure_status?.map(
                          (status, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs"
                            >
                              {status}
                            </Badge>
                          )
                        ) || <span className="font-medium">N/A</span>}
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        Extension Service Access
                      </p>
                      <p className="font-medium">
                        {selectedSubmission.farmer_info
                          ?.has_extension_service_access
                          ? "Yes"
                          : "No"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Support Needed</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedSubmission.farmer_info?.support_needed_areas?.map(
                          (area, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-xs"
                            >
                              {area}
                            </Badge>
                          )
                        ) || <span className="font-medium">N/A</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowFarmerDialog(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowFarmerDialog(false);
                    handleViewSubmissionDetails(
                      tableData.find(
                        (t) => t.farmer_id === selectedSubmission.farmer_id
                      )!
                    );
                  }}
                >
                  View Submission Details
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ProceedsViewer
        aggregatorId={selectedSubmission?.id as number}
        submission={selectedSubmission as Submission}
        open={showProceedsViewer}
        onClose={() => setShowProceedsViewer(false)}
      />
      <ProduceCheckViewer
        open={showProduceCheckViewer}
        onClose={() => setShowProduceCheckViewer(false)}
        data={selectedSubmission as Submission}
        isUpdating={isUpdating}
        onApprove={handleApproveSubmission}
        onReject={handleRejectSubmission}
      />

      <SubmissionDetailsSheet
        open={showDetailsSheet}
        onClose={() => setShowDetailsSheet(false)}
        submission={selectedSubmission as Submission}
      />
    </>
  );
}

export default SubmissionTable;
