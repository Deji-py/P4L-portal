import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseClient } from "@/utils/client";
import { toast } from "sonner";

// Type Definitions
interface Farmer {
  id: number;
  user_id: string | null;
  full_name: string | null;
  farm_cluster_name: string | null;
  contact_information: string | null;
  state: string | null;
  farm_size: string | null;
  farming_type: string[] | null;
  main_crops: string | null;
  seasonal_calendar: string | null;
  monthly_output: string | null;
  irrigation_methods_used: string | null;
  post_harvest_facilities_available: string | null;
  ownership_type: string[] | null;
  land_tenure_status: string[] | null;
  is_cooperative_member: boolean | null;
  has_extension_service_access: boolean | null;
  support_needed_areas: string[] | null;
  support_needed_other: string | null;
  created_at: string | null;
  years_of_operation: string | null;
  local_gov_area: string | null;
  farm_image_url : string | null;
  farm_video_url : string | null;
  address : string | null;

}

interface FarmerProduce {
  id: number;
  submission_date: string;
  quantity: number | null;
  unit_measure: string | null;
  unit_price: number | null;
  product_name: string | null;
  request_id: number | null;
}

export type StatusType =
  | "pending"
  | "approved"
  | "rejected"
  | "inspected"
  | "assigned"
  | string;

export interface Submission {
  id: number;
  submitted_at: string;
  aggregator_id: number | null;
  status: StatusType;
  score: number | null;
  accepted: number | null;
  rejected: number | null;
  farmer_id: number | null;
  no_of_proceeds: number | null;
  farmer_info: Farmer;
  produce: FarmerProduce[];
  
}

interface UpdateSubmissionPayload {
  requestId: number;
  status: StatusType;
  reason?: string;
  inspectionDate?: string;
  inspectionTime?: string;
  score?: number;
  accepted?: number;
  rejected?: number;
}

interface UpdateSubmissionResponse {
  success: boolean;
  message: string;
  data?: Submission;
}

// fetch-all submissions pending
const fetchSubmissionsPending = async (
  aggregatorId: number
): Promise<Submission[]> => {
  const { data, error } = await supabaseClient.rpc("get_submissions", {
    p_aggregator_id: aggregatorId,
  });

  if (error) {
    console.error("Error fetching pending submissions:", error);
    throw new Error(`Failed to fetch submissions: ${error.message}`);
  }

  return data as Submission[];
};

// fetch-all submissions pending or not
const fetchSubmissions = async (
  aggregatorId: number
): Promise<Submission[]> => {
  const { data, error } = await supabaseClient.rpc("get_all_submissions", {
    p_aggregator_id: aggregatorId,
  });

  if (error) {
    console.error("Error fetching all submissions:", error);
    throw new Error(`Failed to fetch submissions: ${error.message}`);
  }

  return data as Submission[];
};

const updateSubmission = async (
  payload: UpdateSubmissionPayload
): Promise<UpdateSubmissionResponse> => {
  const { error, data } = await supabaseClient
    .from("farmer_requests")
    .update({
      status: payload.status,
      score: payload.score || null,
      accepted: payload.accepted || null,
      rejected: payload.rejected || null,
      inspection_date: payload.inspectionDate || null,
      inspection_time: payload.inspectionTime || null,
    })
    .eq("id", payload.requestId)
    .select()
    .single();

  if (error) {
    console.error("Error updating submission:", error);
    throw new Error(`Failed to update submission: ${error.message}`);
  }

  // If there's a rejection reason, store it in a separate reason table
  if (payload.reason && payload.status === "rejected") {
    const { error: reasonError } = await supabaseClient
      .from("rejection_reasons")
      .insert({
        request_id: payload.requestId,
        reason: payload.reason,
        created_at: new Date().toISOString(),
      });

    if (reasonError) {
      console.warn("Failed to store rejection reason:", reasonError);
    }
  }

  return {
    success: true,
    message: `Submission ${payload.status} successfully`,
    data: data as unknown as Submission,
  };
};

export const useSubmissions = (aggregatorId: number, all_only = false) => {
  const queryClient = useQueryClient();

  const {
    data: pendingSubmissions,
    isLoading: pendingSubmissionsLoading,
    isError: pendingSubmissionsError,
    error: pendingSubmissionsErrorData,
    refetch: refetchPendingSubmissions,
  } = useQuery({
    queryKey: ["pending_submissions", aggregatorId],
    queryFn: () => fetchSubmissionsPending(aggregatorId),
    enabled: !!aggregatorId && !all_only,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const {
    data: submissions,
    isLoading: submissionsLoading,
    isError: submissionsError,
    error: submissionsErrorData,
    refetch: refetchSubmissions,
  } = useQuery({
    queryKey: ["submissions", aggregatorId],
    queryFn: () => fetchSubmissions(aggregatorId),
    enabled: !!aggregatorId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const {
    mutate: updateSubmissionMutation,
    isPending: isUpdating,
    error: updateError,
  } = useMutation({
    mutationFn: (payload: UpdateSubmissionPayload) => updateSubmission(payload),
    onSuccess: async (response, variables) => {
      // Show success toast
      toast.success(response.message);

      // Invalidate and refetch both queries
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["pending_submissions", aggregatorId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["submissions", aggregatorId],
        }),
      ]);

      // Force refetch to ensure data is fresh
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: ["pending_submissions", aggregatorId],
        }),
        queryClient.refetchQueries({
          queryKey: ["submissions", aggregatorId],
        }),
      ]);
    },
    onError: (error: Error) => {
      console.error("Error updating submission:", error.message);
      toast.error(error.message || "Failed to update submission");
    },
  });

  const handleApproveSubmission = async (
    requestId: number,
    inspectionDate: string,
    inspectionTime: string
  ) => {
    updateSubmissionMutation({
      requestId,
      status: "approved",
      inspectionDate,
      inspectionTime,
    });
  };

  const handleRejectSubmission = async (requestId: number, reason: string) => {
    updateSubmissionMutation({
      requestId,
      status: "rejected",
      reason,
    });
  };

  return {
    pendingSubmissions: pendingSubmissions || [],
    pendingSubmissionsLoading,
    pendingSubmissionsError,
    pendingSubmissionsErrorData,
    refetchPendingSubmissions,
    submissions: submissions || [],
    submissionsLoading,
    submissionsError,
    submissionsErrorData,
    refetchSubmissions,
    updateSubmissionMutation,
    isUpdating,
    updateError,
    handleApproveSubmission,
    handleRejectSubmission,
  };
};
