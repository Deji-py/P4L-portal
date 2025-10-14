/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseClient } from "@/utils/client";

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
    .order("business_name", { ascending: true });

  // Filter by local government area if provided
  if (localGovArea) {
    query = query.eq("local_gov_area", localGovArea);
  }

  // Filter by state as fallback
  if (state && !localGovArea) {
    query = query.eq("state", state);
  }

  const { data, error } = await query;

  if (error) {
    console.log(error);
    throw new Error(`Failed to fetch bulk traders: ${error.message}`);
  }

  return data as BulkTrader[];
};

// Assign bulk trader to farmer request
const assignBulkTrader = async (
  payload: AssignBulkTraderPayload
): Promise<AssignBulkTraderResponse> => {
  // Update farmer_requests table with bulk_trader_id
  const { error: updateError } = await supabaseClient
    .from("farmer_requests")
    .update({
      bulk_trader_id: payload.bulkTraderId,
      status: "assigned",
    })
    .eq("id", payload.farmerRequestId);

  if (updateError) {
    console.log(updateError);
    throw new Error(`Failed to update farmer request: ${updateError.message}`);
  }

  // Create entry in bulk_food_request table
  const { data, error: insertError } = await supabaseClient
    .from("bulk_food_request")
    .insert({
      bulk_trader_id: payload.bulkTraderId,
      aggregator_id: payload.aggregatorId,
      farmer_request_id: payload.farmerRequestId,
      status: "pending",
    })
    .select()
    .single();

  if (insertError) {
    console.log(insertError);
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
  });

  const {
    mutate: assignBulkTraderMutation,
    isPending: isAssigning,
    error: assignError,
    isSuccess: assignSuccess,
  } = useMutation({
    mutationFn: (payload: AssignBulkTraderPayload) => assignBulkTrader(payload),
    onSuccess: (response) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ["submissions"],
      });
      queryClient.invalidateQueries({
        queryKey: ["pending_submissions"],
      });

      console.log("Bulk trader assigned:", response.message);
    },
    onError: (error: Error) => {
      console.error("Error assigning bulk trader:", error.message);
    },
  });

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
    bulkTraders,
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
