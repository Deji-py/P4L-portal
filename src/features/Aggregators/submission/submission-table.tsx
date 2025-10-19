/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { DataTable } from "@/components/core/InToolTable/data-table";
import { Submission, useSubmissions } from "@/hooks/aggregators/useSubmissions";
import { Package, CheckCircle, AlertCircle, Eye } from "lucide-react";
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

type SubmissionTableData = {
  id: number;
  farm_name: string;
  no_of_proceeds: number;
  farmer_name: string;
  local_gov_area: string;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "inspected"
    | "assigned"
    | string;
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

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return dateString;
  }
};

const columns: DataTableColumn<any>[] = [
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
    key: "no_of_proceeds",
    header: "No of Proceeds",
    sortable: true,
  },
  {
    key: "farmer_name",
    header: "Farmer Name",
    sortable: true,
  },
  {
    key: "local_gov_area",
    header: "Local Gov Area",
    sortable: true,
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
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [showProduceCheckViewer, setShowProduceCheckViewer] = useState(false);
  const { handleApproveSubmission, handleRejectSubmission, isUpdating } =
    useSubmissions(profile?.aggregator_id as number);

  // Transform the Submission data to match our table structure
  const tableData: SubmissionTableData[] = data?.map((submission) => ({
    id: submission.id,
    farm_name: submission.farmer_info?.farm_cluster_name || "N/A",
    no_of_proceeds: submission.no_of_proceeds || 0,
    farmer_name: submission.farmer_info?.full_name || "Unknown",
    local_gov_area: submission.farmer_info?.local_gov_area || "N/A",
    status: submission.status,
    submitted_at: submission.submitted_at,
    aggregator_id: submission.aggregator_id,
  }));

  const handleAssignToBulkFoods = useCallback(
    (row: SubmissionTableData) => {
      setShowProceedsViewer(true);

      const selected = data.find(
        (item) => item.aggregator_id === row.aggregator_id
      ) as Submission;

      setSelectedSubmission(selected);
    },
    [loading]
  );

  const handleViewSubmissionDetails = (row: Submission) => {
    const selected = data.find(
      (item) => item.aggregator_id === row.aggregator_id
    ) as Submission;
    setSelectedSubmission(selected);
    setShowDetailsSheet(true);
  };

  const actions: DataTableAction<any>[] = [
    {
      label: "Start Inspection",
      onClick: (row) => {
        router.push(`/dashboard/aggregator/inspection/${row?.aggregator_id}`);
      },
      icon: <CheckCircle className="h-5 w-5" />,
      hidden: (row) => {
        return row.status !== "approved" && row.status !== "inspected";
      },
    },
    {
      label: "Review",
      onClick: (row) => {
        setShowProduceCheckViewer(true);
        setSelectedSubmission(row);
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
        disableFiltering
        table_hidden_columns={[]}
      />
      <ProceedsViewer
        aggregatorId={selectedSubmission?.aggregator_id as number}
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
