/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { supabaseClient } from "@/utils/client";

// Type Definitions
interface DispatchRider {
  id: number;
  name: string;
  phone: string;
  vehicle_type: string;
  vehicle_number: string;
  distance_km: number;
  status: "available" | "busy" | "offline";
  rating: number;
  completed_deliveries: number;
  local_gov_area?: string;
  state?: string;
}

// Fetch dispatch riders
const fetchDispatchRiders = async (
  localGovArea?: string,
  status?: string
): Promise<DispatchRider[]> => {
  let query = supabaseClient
    .from("dispatch_riders")
    .select("*")
    .order("distance_km", { ascending: true });

  // Filter by local government area if provided
  if (localGovArea) {
    query = query.eq("local_gov_area", localGovArea);
  }

  // Filter by status if provided
  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    throw new Error(`Failed to fetch dispatch riders: ${error.message}`);
  }

  return data as DispatchRider[];
};

export const useDispatchRiders = (
  localGovArea?: string,
  status: string = "available"
) => {
  const {
    data: dispatchRiders,
    isLoading: dispatchRidersLoading,
    isError: dispatchRidersError,
    error: dispatchRidersErrorData,
    refetch: refetchDispatchRiders,
  } = useQuery({
    queryKey: ["dispatch_riders", localGovArea, status],
    queryFn: () => fetchDispatchRiders(localGovArea, status),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    dispatchRiders: dispatchRiders || [],
    dispatchRidersLoading,
    dispatchRidersError,
    dispatchRidersErrorData,
    refetchDispatchRiders,
  };
};
