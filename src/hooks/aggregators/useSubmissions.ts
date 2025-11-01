/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseClient } from "@/utils/client";
import { toast } from "sonner";
import { useEffect } from "react";

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
  farm_image_url: string | null;
  farm_video_url: string | null;
  address: string | null;
}

interface FarmerProduce {
  id: number;
  quantity: number | null;
  unit_measure: string | null;
  unit_price: number | null;
  product_name: string | null;
  request_id: number | null;
  accepted: number | null;
  rejected: number | null;
  score: number | null;
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
  farmer_id: number | null;
  inspection_date: string | null;
  inspection_time: string | null;
  farmer_info: Farmer;
  produce: FarmerProduce[];
}

interface ProduceInspectionData {
  produceId: number;
  rejected: number;
  accepted: number;
  score: number;
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
  produceInspections?: ProduceInspectionData[];
}

interface UpdateSubmissionResponse {
  success: boolean;
  message: string;
  data?: Submission;
}

// Fetch pending submissions only
const fetchSubmissionsPending = async (
  aggregatorId: number
): Promise<Submission[]> => {
  const { data: requests, error: requestsError } = await supabaseClient
    .from("farmer_requests")
    .select(
      `
      id,
      submitted_at,
      aggregator_id,
      status,
      score,
      farmer_id,
      inspection_date,
      inspection_time,
      farmer_info:farmers(
        id,
        user_id,
        full_name,
        farm_cluster_name,
        contact_information,
        state,
        farm_size,
        farming_type,
        main_crops,
        seasonal_calendar,
        monthly_output,
        irrigation_methods_used,
        post_harvest_facilities_available,
        ownership_type,
        land_tenure_status,
        is_cooperative_member,
        has_extension_service_access,
        support_needed_areas,
        support_needed_other,
        created_at,
        years_of_operation,
        local_gov_area,
        farm_image_url,
        farm_video_url,
        address
      ),
      produce:farmer_produce(
        id,
        quantity,
        unit_measure,
        unit_price,
        product_name,
        request_id,
        accepted,
        rejected,
        score
      )
    `
    )
    .eq("aggregator_id", aggregatorId)
    .eq("status", "pending")
    .order("submitted_at", { ascending: false });

  if (requestsError) {
    console.error("Error fetching pending submissions:", requestsError);
    throw new Error(
      `Failed to fetch pending submissions: ${requestsError.message}`
    );
  }

  return (requests as any) || [];
};

// Fetch all submissions (pending and completed)
const fetchSubmissions = async (
  aggregatorId: number
): Promise<Submission[]> => {
  const { data: requests, error: requestsError } = await supabaseClient
    .from("farmer_requests")
    .select(
      `
      id,
      submitted_at,
      aggregator_id,
      status,
      score,
      farmer_id,
      inspection_date,
      inspection_time,
      farmer_info:farmers(
        id,
        user_id,
        full_name,
        farm_cluster_name,
        contact_information,
        state,
        farm_size,
        farming_type,
        main_crops,
        seasonal_calendar,
        monthly_output,
        irrigation_methods_used,
        post_harvest_facilities_available,
        ownership_type,
        land_tenure_status,
        is_cooperative_member,
        has_extension_service_access,
        support_needed_areas,
        support_needed_other,
        created_at,
        years_of_operation,
        local_gov_area,
        farm_image_url,
        farm_video_url,
        address
      ),
      produce:farmer_produce(
        id,
        quantity,
        unit_measure,
        unit_price,
        product_name,
        request_id,
        accepted,
        rejected,
        score
      )
    `
    )
    .eq("aggregator_id", aggregatorId)
    .order("submitted_at", { ascending: false });

  if (requestsError) {
    console.error("Error fetching all submissions:", requestsError);
    throw new Error(`Failed to fetch submissions: ${requestsError.message}`);
  }

  return (requests as any) || [];
};

const updateSubmission = async (
  payload: UpdateSubmissionPayload
): Promise<UpdateSubmissionResponse> => {
  // Update farmer_requests table
  const { error, data } = await supabaseClient
    .from("farmer_requests")
    .update({
      status: payload.status,
      score: payload.score || null,
      inspection_date: payload.inspectionDate || null,
      inspection_time: payload.inspectionTime || null,
    })
    .eq("id", payload.requestId)
    .select(
      `
      id,
      submitted_at,
      aggregator_id,
      status,
      score,
      farmer_id,
      inspection_date,
      inspection_time,
      farmer_info:farmers(
        id,
        user_id,
        full_name,
        farm_cluster_name,
        contact_information,
        state,
        farm_size,
        farming_type,
        main_crops,
        seasonal_calendar,
        monthly_output,
        irrigation_methods_used,
        post_harvest_facilities_available,
        ownership_type,
        land_tenure_status,
        is_cooperative_member,
        has_extension_service_access,
        support_needed_areas,
        support_needed_other,
        created_at,
        years_of_operation,
        local_gov_area,
        farm_image_url,
        farm_video_url,
        address
      ),
      produce:farmer_produce(
        id,
        quantity,
        unit_measure,
        unit_price,
        product_name,
        request_id,
        accepted,
        rejected,
        score
      )
    `
    )
    .single();

  if (error) {
    console.error("Error updating submission:", error);
    throw new Error(`Failed to update submission: ${error.message}`);
  }

  // Update individual produce items with inspection data
  if (payload.produceInspections && payload.produceInspections.length > 0) {
    const produceUpdates = payload.produceInspections.map(
      async (inspection) => {
        const { error: produceError } = await supabaseClient
          .from("farmer_produce")
          .update({
            rejected: inspection.rejected,
            accepted: inspection.accepted,
            score: inspection.score,
          })
          .eq("id", inspection.produceId);

        if (produceError) {
          console.error(
            `Error updating produce ${inspection.produceId}:`,
            produceError
          );
          throw new Error(`Failed to update produce: ${produceError.message}`);
        }
      }
    );

    await Promise.all(produceUpdates);
  }

  // If there's a rejection reason, store it
  if (payload.reason && payload.status === "rejected") {
    const { error: reasonError } = await supabaseClient
      .from("farmer_requests")
      .update({
        rejection_reason: payload.reason,
      })
      .eq("id", payload.requestId);

    if (reasonError) {
      console.warn("Failed to store rejection reason:", reasonError);
    }
  }

  // Fetch updated data with produce information
  const { data: updatedData, error: fetchError } = await supabaseClient
    .from("farmer_requests")
    .select(
      `
      id,
      submitted_at,
      aggregator_id,
      status,
      score,
      farmer_id,
      inspection_date,
      inspection_time,
      farmer_info:farmers(
        id,
        user_id,
        full_name,
        farm_cluster_name,
        contact_information,
        state,
        farm_size,
        farming_type,
        main_crops,
        seasonal_calendar,
        monthly_output,
        irrigation_methods_used,
        post_harvest_facilities_available,
        ownership_type,
        land_tenure_status,
        is_cooperative_member,
        has_extension_service_access,
        support_needed_areas,
        support_needed_other,
        created_at,
        years_of_operation,
        local_gov_area,
        farm_image_url,
        farm_video_url,
        address
      ),
      produce:farmer_produce(
        id,
        quantity,
        unit_measure,
        unit_price,
        product_name,
        request_id,
        accepted,
        rejected,
        score
      )
    `
    )
    .eq("id", payload.requestId)
    .single();

  if (fetchError) {
    console.error("Error fetching updated data:", fetchError);
  }

  return {
    success: true,
    message: `Inspection saved successfully`,
    data:
      (updatedData as unknown as Submission) || (data as unknown as Submission),
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
    staleTime: 1000 * 60 * 5,
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
    staleTime: 1000 * 60 * 5,
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
      toast.success(response.message);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["pending_submissions", aggregatorId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["submissions", aggregatorId],
        }),
      ]);

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

  useEffect(() => {
    if (!aggregatorId) return;

    const channel = supabaseClient
      .channel(`farmer_requests_${aggregatorId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "farmer_requests",
          filter: `aggregator_id=eq.${aggregatorId}`,
        },
        () => {
          console.log("New farmer request inserted");
          queryClient.invalidateQueries({
            queryKey: ["pending_submissions", aggregatorId],
          });
          queryClient.invalidateQueries({
            queryKey: ["submissions", aggregatorId],
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "farmer_requests",
          filter: `aggregator_id=eq.${aggregatorId}`,
        },
        () => {
          console.log("Farmer request updated");
          queryClient.invalidateQueries({
            queryKey: ["pending_submissions", aggregatorId],
          });
          queryClient.invalidateQueries({
            queryKey: ["submissions", aggregatorId],
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "farmer_requests",
          filter: `aggregator_id=eq.${aggregatorId}`,
        },
        () => {
          console.log("Farmer request deleted");
          queryClient.invalidateQueries({
            queryKey: ["pending_submissions", aggregatorId],
          });
          queryClient.invalidateQueries({
            queryKey: ["submissions", aggregatorId],
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [aggregatorId, queryClient]);

  useEffect(() => {
    if (!aggregatorId) return;

    const channel = supabaseClient
      .channel(`farmer_produce:changes`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "farmer_produce",
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["pending_submissions", aggregatorId],
          });
          queryClient.invalidateQueries({
            queryKey: ["submissions", aggregatorId],
          });

          queryClient.refetchQueries({
            queryKey: ["pending_submissions", aggregatorId],
          });
          queryClient.refetchQueries({
            queryKey: ["submissions", aggregatorId],
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [aggregatorId, queryClient]);

  const handleApproveSubmission = async (
    requestId: number,
    inspectionDate: string,
    inspectionTime: string
  ) => {
    updateSubmissionMutation({
      requestId,
      status: "accepted",
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
