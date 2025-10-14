/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { supabaseClient } from "@/utils/client";

// Type Definitions
interface FarmerRequest {
  id: number;
  submitted_at: string;
  aggregator_id: number | null;
  status: string | null;
  score: number | null;
  accepted: number | null;
  rejected: number | null;
  farmer_id: number | null;
  no_of_proceeds: number | null;
  bulk_trader_id: number | null;
  inspection_date: string | null;
  inspection_time: string | null;
}

interface BulkFoodRequest {
  id: number;
  created_at: string;
  bulk_trader_id: number | null;
  aggregator_id: number | null;
  status: string | null;
  score: number | null;
  farmer_request_id: number | null;
}

interface Statistics {
  totalSubmissions: number;
  pendingInspection: number;
  inspected: number;
  averageScore: number;
  totalProceeds: number;
  assignedCount: number;
  pendingCount: number;
}

// Fetch farmer requests for a specific aggregator
const fetchFarmerRequests = async (
  aggregatorId: number
): Promise<FarmerRequest[]> => {
  const { data, error } = await supabaseClient
    .from("farmer_requests")
    .select("*")
    .eq("aggregator_id", aggregatorId)
    .order("submitted_at", { ascending: false });

  if (error) {
    console.log(error);
    throw new Error(`Failed to fetch farmer requests: ${error.message}`);
  }

  return data as FarmerRequest[];
};

// Fetch bulk food requests for a specific aggregator to calculate average score
const fetchBulkFoodRequests = async (
  aggregatorId: number
): Promise<BulkFoodRequest[]> => {
  const { data, error } = await supabaseClient
    .from("bulk_food_request")
    .select("*")
    .eq("aggregator_id", aggregatorId);

  if (error) {
    console.log(error);
    throw new Error(`Failed to fetch bulk food requests: ${error.message}`);
  }

  return data as BulkFoodRequest[];
};

// Calculate statistics from farmer requests and bulk food requests
const calculateStatistics = (
  farmerRequests: FarmerRequest[],
  bulkFoodRequests: BulkFoodRequest[]
): Statistics => {
  const totalSubmissions = farmerRequests.length;

  const pendingInspection = farmerRequests.filter(
    (req) => req.status === "pending" || req.status === "pending_inspection"
  ).length;

  const inspected = farmerRequests.filter(
    (req) => req.status === "inspected" || req.status === "accepted"
  ).length;

  const assignedCount = farmerRequests.filter(
    (req) => req.status === "assigned" || req.bulk_trader_id !== null
  ).length;

  const pendingCount = farmerRequests.filter(
    (req) => req.status === "pending"
  ).length;

  // Calculate average score from bulk_food_request table
  const scoresWithValues = bulkFoodRequests.filter(
    (req) => req.score !== null && req.score !== undefined
  );

  const averageScore =
    scoresWithValues.length > 0
      ? scoresWithValues.reduce((sum, req) => sum + (req.score || 0), 0) /
        scoresWithValues.length
      : 0;

  // Calculate total proceeds
  const totalProceeds = farmerRequests.reduce(
    (sum, req) => sum + (req.no_of_proceeds || 0),
    0
  );

  return {
    totalSubmissions,
    pendingInspection,
    inspected,
    averageScore: Math.round(averageScore),
    totalProceeds,
    assignedCount,
    pendingCount,
  };
};

export const useStatistics = (aggregatorId?: number) => {
  const {
    data: farmerRequests,
    isLoading: farmerRequestsLoading,
    isError: farmerRequestsError,
    error: farmerRequestsErrorData,
    refetch: refetchFarmerRequests,
  } = useQuery({
    queryKey: ["farmer_requests", aggregatorId],
    queryFn: () => fetchFarmerRequests(aggregatorId!),
    enabled: !!aggregatorId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const {
    data: bulkFoodRequests,
    isLoading: bulkFoodRequestsLoading,
    isError: bulkFoodRequestsError,
    error: bulkFoodRequestsErrorData,
  } = useQuery({
    queryKey: ["bulk_food_requests", aggregatorId],
    queryFn: () => fetchBulkFoodRequests(aggregatorId!),
    enabled: !!aggregatorId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const statistics =
    farmerRequests && bulkFoodRequests
      ? calculateStatistics(farmerRequests, bulkFoodRequests)
      : null;

  const isLoading = farmerRequestsLoading || bulkFoodRequestsLoading;
  const isError = farmerRequestsError || bulkFoodRequestsError;
  const error = farmerRequestsErrorData || bulkFoodRequestsErrorData;

  return {
    farmerRequests,
    bulkFoodRequests,
    statistics,
    isLoading,
    isError,
    error,
    refetchFarmerRequests,
  };
};
