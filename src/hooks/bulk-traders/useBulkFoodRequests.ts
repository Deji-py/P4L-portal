/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseClient } from "@/utils/client";

// Type Definitions
interface BulkFoodRequest {
  id: number;
  created_at: string;
  bulk_trader_id: number | null;
  aggregator_id: number | null;
  status: string;
  score: number | null;
  farmer_request_id: number | null;
  aggregators?: {
    id: number;
    business_name: string;
    local_gov_area: string;
    state: string;
  };
  farmer_requests?: {
    id: number;
    farmer_id: number;
    created_at: string;
  };
  farmer_produce?: Array<{
    id: number;
    product_name: string;
    quantity: number;
    unit_measure: string;
    unit_price: number;
  }>;
}

interface ScoreProducePayload {
  requestId: number;
  score: number;
}

interface UpdateRequestStatusPayload {
  requestId: number;
  status: "accepted" | "declined" | "out_for_delivery" | "complete";
}

interface AssignDispatchPayload {
  requestId: number;
  dispatchId: number;
}

// Fetch bulk food requests with filters
const fetchBulkFoodRequests = async (
  bulkTraderId: number,
  status?: string,
  page: number = 1,
  limit: number = 10
): Promise<{ data: BulkFoodRequest[]; count: number }> => {
  let query = supabaseClient
    .from("bulk_food_request")
    .select(
      `
      *,
      aggregators (
        id,
        business_name,
        local_gov_area,
        state
      ),
      farmer_requests (
        id,
        farmer_id,
        submitted_at
      )
    `,
      { count: "exact" }
    )
    // .eq("bulk_trader_id", bulkTraderId)
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status.toLowerCase());
  }

  // Pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error(error);
    throw new Error(`Failed to fetch bulk food requests: ${error.message}`);
  }

  // Fetch farmer produce for each request
  const requestsWithProduce = await Promise.all(
    (data || []).map(async (request) => {
      if (request.farmer_request_id) {
        const { data: produceData } = await supabaseClient
          .from("farmer_produce")
          .select("*")
          .eq("request_id", request.farmer_request_id);

        return { ...request, farmer_produce: produceData || [] };
      }
      return { ...request, farmer_produce: [] };
    })
  );

  return {
    data: requestsWithProduce as BulkFoodRequest[],
    count: count || 0,
  };
};

// Get request counts by status
// Get request counts by status
const fetchRequestCounts = async (
  bulkTraderId: number
): Promise<Record<string, number>> => {
  const statuses = [
    "pending",
    "accepted",
    "declined",
    "out_for_delivery", // Changed from "assigned_for_pickup"
    "complete",
  ];
  const counts: Record<string, number> = {};

  await Promise.all(
    statuses.map(async (status) => {
      const { count, error } = await supabaseClient
        .from("bulk_food_request")
        .select("*", { count: "exact", head: true })
        .eq("bulk_trader_id", bulkTraderId)
        .eq("status", status);

      if (error) {
        console.log(error);
        throw new Error(`Failed to fetch request counts: ${error.message}`);
      }

      counts[status] = count || 0;
    })
  );

  return counts;
};

// Update request status
const updateRequestStatus = async (
  payload: UpdateRequestStatusPayload
): Promise<BulkFoodRequest> => {
  const { data, error } = await supabaseClient
    .from("bulk_food_request")
    .update({ status: payload.status })
    .eq("id", payload.requestId)
    .select()
    .single();

  if (error) {
    console.error(error);
    throw new Error(`Failed to update request status: ${error.message}`);
  }

  return data as BulkFoodRequest;
};

// Score produce
const scoreProduce = async (payload: ScoreProducePayload): Promise<any> => {
  const { data, error } = await supabaseClient
    .from("bulk_food_request")
    .update({
      score: payload.score,
    })
    .eq("farmer_request_id", payload.requestId)
    .select();

  console.log(payload.requestId, payload.score);

  if (error) {
    console.error(error);
    throw new Error(`Failed to score produce: ${error.message}`);
  }

  return data;
};

// Assign dispatch to request
const assignDispatch = async (payload: AssignDispatchPayload): Promise<any> => {
  // This would create an entry in a dispatch_assignments table
  // For now, we'll just update the status
  const { data, error } = await supabaseClient
    .from("bulk_food_request")
    .update({
      status: "out_for_delivery",
      // dispatch_id: payload.dispatchId // Add this column to your schema
    })
    .eq("id", payload.requestId)
    .select()
    .single();

  if (error) {
    console.error(error);
    throw new Error(`Failed to assign dispatch: ${error.message}`);
  }

  return data;
};

export const useBulkFoodRequests = (
  bulkTraderId: number,
  status?: string,
  page: number = 1,
  limit: number = 10
) => {
  const queryClient = useQueryClient();

  const {
    data: requestsData,
    isLoading: requestsLoading,
    isError: requestsError,
    error: requestsErrorData,
    refetch: refetchRequests,
  } = useQuery({
    queryKey: ["bulk_food_requests", bulkTraderId, status, page, limit],
    queryFn: () => fetchBulkFoodRequests(bulkTraderId, status, page, limit),
    enabled: !!bulkTraderId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const {
    data: requestCounts,
    isLoading: countsLoading,
    refetch: refetchCounts,
  } = useQuery({
    queryKey: ["bulk_food_request_counts", bulkTraderId],
    queryFn: () => fetchRequestCounts(bulkTraderId),
    enabled: !!bulkTraderId,
    staleTime: 1000 * 60 * 5,
  });

  const {
    mutate: updateStatusMutation,
    isPending: isUpdatingStatus,
    error: updateStatusError,
  } = useMutation({
    mutationFn: (payload: UpdateRequestStatusPayload) =>
      updateRequestStatus(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bulk_food_requests"],
      });
      queryClient.invalidateQueries({
        queryKey: ["bulk_food_request_counts"],
      });
    },
    onError: (error: Error) => {
      console.error("Error updating request status:", error.message);
    },
  });

  const {
    mutate: scoreProduceMutation,
    isPending: isScoringProduce,
    error: scoreProduceError,
  } = useMutation({
    mutationFn: (payload: ScoreProducePayload) => scoreProduce(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bulk_food_requests"],
      });
      queryClient.invalidateQueries({
        queryKey: ["bulk_food_request_counts"],
      });
    },
    onError: (error: Error) => {
      console.error("Error scoring produce:", error.message);
    },
  });

  const {
    mutate: assignDispatchMutation,
    isPending: isAssigningDispatch,
    error: assignDispatchError,
  } = useMutation({
    mutationFn: (payload: AssignDispatchPayload) => assignDispatch(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bulk_food_requests"],
      });
      queryClient.invalidateQueries({
        queryKey: ["bulk_food_request_counts"],
      });
    },
    onError: (error: Error) => {
      console.error("Error assigning dispatch:", error.message);
    },
  });

  const handleUpdateStatus = (
    requestId: number,
    status: UpdateRequestStatusPayload["status"]
  ) => {
    updateStatusMutation({ requestId, status });
  };

  const handleAssignDispatch = (requestId: number, dispatchId: number) => {
    assignDispatchMutation({ requestId, dispatchId });
  };

  const handleScoreProduce = (requestId: number, score: number) => {
    scoreProduceMutation({ requestId, score });
  };

  return {
    requests: requestsData?.data || [],
    totalCount: requestsData?.count || 0,
    requestCounts: requestCounts || {},
    requestsLoading,
    requestsError,
    requestsErrorData,
    countsLoading,
    refetchRequests,
    refetchCounts,
    updateStatusMutation,
    isUpdatingStatus,
    updateStatusError,
    assignDispatchMutation,
    isAssigningDispatch,
    assignDispatchError,
    handleUpdateStatus,
    handleAssignDispatch,
    scoreProduceMutation,
    isScoringProduce,
    scoreProduceError,
    handleScoreProduce,
  };
};
