/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseClient } from "@/utils/client";
import { toast } from "sonner";
import { useEffect } from "react";

// Type Definitions
interface BulkTrader {
  id: number;
  user_id: string | null;
  business_name: string | null;
  business_entity: string | null;
  year_established: string | null;
  business_address: string | null;
  contact_person: string | null;
  email_address: string | null;
  phone_numbers: string | null;
  website: string | null;
  registration_number: string | null;
  primary_commodities: string | null;
  monthly_trade_volume: string | null;
  points_of_origin: string | null;
  distribution_channels: string | null;
  transport_vehicles: string | null;
  storage_facilities: string | null;
  storage_capacity: string | null;
  trading_hubs: string | null;
  programme_participation: string | null;
  support_required: string | null;
  created_at: string | null;
  state: string | null;
  local_gov_area: string | null;
  role: string | null;
}

interface AssignBulkTraderPayload {
  farmerRequestId: number;
  bulkTraderId: number;
  aggregatorId: number;
}

interface AssignBulkTraderResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Fetch bulk traders in the same local government area
const fetchBulkTraders = async (
  localGovArea: string,
  state: string
): Promise<BulkTrader[]> => {
  let query = supabaseClient
    .from("bulk_traders")
    .select("*")
    .eq("role", "bulk-trader")
    .order("business_name", { ascending: true });

  // Filter by local government area if provided
  if (localGovArea && localGovArea.trim()) {
    query = query.eq("local_gov_area", localGovArea);
  }
  // Filter by state as fallback
  else if (state && state.trim()) {
    query = query.eq("state", state);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching bulk traders:", error);
    throw new Error(`Failed to fetch bulk traders: ${error.message}`);
  }

  return (data as BulkTrader[]) || [];
};

// Assign bulk trader to farmer request
const assignBulkTrader = async (
  payload: AssignBulkTraderPayload
): Promise<AssignBulkTraderResponse> => {
  // First, get the current farmer request to preserve other fields
  const { data: farmerRequest, error: fetchError } = await supabaseClient
    .from("farmer_requests")
    .select("*")
    .eq("id", payload.farmerRequestId)
    .single();

  if (fetchError) {
    console.error("Error fetching farmer request:", fetchError);
    throw new Error(`Failed to fetch farmer request: ${fetchError.message}`);
  }

  // Update farmer_requests table with bulk_trader_id and status
  const { error: updateError } = await supabaseClient
    .from("farmer_requests")
    .update({
      status: "assigned",
    })
    .eq("id", payload.farmerRequestId);

  if (updateError) {
    console.error("Error updating farmer request:", updateError);
    throw new Error(`Failed to update farmer request: ${updateError.message}`);
  }

  // Create entry in aggregator_request table
  const { data, error: insertError } = await supabaseClient
    .from("aggregator_request")
    .insert({
      bulk_trader_id: payload.bulkTraderId,
      id: payload.aggregatorId,
      farmer_request_id: payload.farmerRequestId,
      status: "pending",
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    console.error("Error creating bulk food request:", insertError);
    throw new Error(
      `Failed to create bulk food request: ${insertError.message}`
    );
  }

  return {
    success: true,
    message: "Bulk trader assigned successfully",
    data,
  };
};

export const useBulkTrader = (localGovArea?: string, state?: string) => {
  const queryClient = useQueryClient();

  const {
    data: bulkTraders,
    isLoading: bulkTradersLoading,
    isError: bulkTradersError,
    error: bulkTradersErrorData,
    refetch: refetchBulkTraders,
  } = useQuery({
    queryKey: ["bulk_traders", localGovArea, state],
    queryFn: () => fetchBulkTraders(localGovArea || "", state || ""),
    enabled: !!(localGovArea || state),
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const {
    mutate: assignBulkTraderMutation,
    isPending: isAssigning,
    error: assignError,
    isSuccess: assignSuccess,
  } = useMutation({
    mutationFn: (payload: AssignBulkTraderPayload) => assignBulkTrader(payload),
    onSuccess: (response) => {
      // Show success toast
      toast.success(response.message);

      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ["pending_submissions"],
      });
      queryClient.invalidateQueries({
        queryKey: ["submissions"],
      });
      queryClient.invalidateQueries({
        queryKey: ["farmer_requests"],
      });

      // Refetch to ensure fresh data
      queryClient.refetchQueries({
        queryKey: ["pending_submissions"],
      });
      queryClient.refetchQueries({
        queryKey: ["submissions"],
      });
    },
    onError: (error: Error) => {
      console.error("Error assigning bulk trader:", error.message);
      toast.error(error.message || "Failed to assign bulk trader");
    },
  });

  // Setup real-time listener for bulk_traders table
  useEffect(() => {
    const channel = supabaseClient
      .channel("bulk_traders:changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bulk_traders",
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["bulk_traders"],
          });
          queryClient.refetchQueries({
            queryKey: ["bulk_traders"],
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [queryClient]);

  // Setup real-time listener for aggregator_request
  useEffect(() => {
    const channel = supabaseClient
      .channel("aggregator_request:changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "aggregator_request",
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["aggregator_requests"],
          });
          queryClient.invalidateQueries({
            queryKey: ["pending_submissions"],
          });
          queryClient.invalidateQueries({
            queryKey: ["submissions"],
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [queryClient]);

  const handleAssignBulkTrader = (
    farmerRequestId: number,
    bulkTraderId: number,
    aggregatorId: number
  ) => {
    assignBulkTraderMutation({
      farmerRequestId,
      bulkTraderId,
      aggregatorId,
    });
  };

  return {
    bulkTraders: bulkTraders || [],
    bulkTradersLoading,
    bulkTradersError,
    bulkTradersErrorData,
    refetchBulkTraders,
    assignBulkTraderMutation,
    isAssigning,
    assignError,
    assignSuccess,
    handleAssignBulkTrader,
  };
};
