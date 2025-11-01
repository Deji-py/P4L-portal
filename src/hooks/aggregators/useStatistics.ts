/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabaseClient } from "@/utils/client";
import { useEffect, useState } from "react";

// ============ STATISTICS HOOK ============

interface FarmerRequest {
  id: number;
  submitted_at: string;
  aggregator_id: number | null;
  status: string | null;
  score: number | null;
  farmer_id: number | null;
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
  totalAccepted: number;
  totalRejected: number;
  assignedCount: number;
  pendingCount: number;
  approvedCount: number;
  totalRequests: number;
  totalInspected: number;
}

// Fetch farmer requests with produce data
const fetchFarmerRequests = async (
  aggregatorId: number
): Promise<FarmerRequest[]> => {
  const { data, error } = await supabaseClient
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

  if (error) {
    console.error("Error fetching farmer requests:", error);
    throw new Error(`Failed to fetch farmer requests: ${error.message}`);
  }

  return data as FarmerRequest[];
};

// Fetch bulk food requests for score averaging
const fetchBulkFoodRequests = async (
  aggregatorId: number
): Promise<BulkFoodRequest[]> => {
  const { data, error } = await supabaseClient
    .from("aggregator_requests")
    .select("*")
    .eq("id", aggregatorId);

  if (error) {
    console.error("Error fetching bulk food requests:", error);
    throw new Error(`Failed to fetch bulk food requests: ${error.message}`);
  }

  return data as BulkFoodRequest[];
};

// Calculate statistics
const calculateStatistics = (
  farmerRequests: FarmerRequest[],
  bulkFoodRequests: BulkFoodRequest[]
): Statistics => {
  const totalSubmissions = farmerRequests.length;

  const pendingInspection = farmerRequests.filter(
    (req) => req.status === "pending" || req.status === "pending_inspection"
  ).length;

  const inspected = farmerRequests.filter(
    (req) => req.status === "inspected"
  ).length;

  const approvedCount = farmerRequests.filter(
    (req) => req.status === "approved"
  ).length;

  const assignedCount = farmerRequests.filter(
    (req) => req.status === "assigned"
  ).length;

  const pendingCount = farmerRequests.filter(
    (req) => req.status === "pending"
  ).length;

  // Calculate average score: start at 100, average with aggregator_requests scores
  const scoresWithValues = bulkFoodRequests.filter(
    (req) => req.score !== null && req.score !== undefined
  );

  let averageScore = 100; // Default to 100

  if (scoresWithValues.length > 0) {
    const sum = scoresWithValues.reduce(
      (sum, req) => sum + (req.score || 0),
      0
    );
    averageScore = Math.round((sum / scoresWithValues.length) * 100) / 100;
  }

  // Calculate total accepted and rejected
  const totalPending = farmerRequests.filter((req) => {
    return req.status === "pending";
  }).length;

  const totalAccepted = farmerRequests.filter((req) => {
    return req.status === "accepted";
  }).length;

  const totalRejected = farmerRequests.filter((req) => {
    return req.status === "rejected";
  }).length;
  const totalInspected = farmerRequests.filter((req) => {
    return req.status === "inspected";
  }).length;

  // Calculate total requests (sum of accepted and rejected)
  const totalRequests =
    totalAccepted + totalRejected + totalPending + totalInspected;

  return {
    totalSubmissions,
    pendingInspection,
    inspected,
    averageScore,
    totalAccepted,
    totalRejected,
    assignedCount,
    pendingCount,
    approvedCount,
    totalRequests,
    totalInspected,
  };
};

export const useStatistics = (aggregatorId?: number) => {
  const queryClient = useQueryClient();
  const [statistics, setStatistics] = useState<Statistics | null>(null);

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
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const {
    data: bulkFoodRequests,
    isLoading: bulkFoodRequestsLoading,
    isError: bulkFoodRequestsError,
    error: bulkFoodRequestsErrorData,
  } = useQuery({
    queryKey: ["aggregator_requests", aggregatorId],
    queryFn: () => fetchBulkFoodRequests(aggregatorId!),
    enabled: !!aggregatorId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Update statistics whenever data changes
  useEffect(() => {
    if (farmerRequests && bulkFoodRequests) {
      const newStatistics = calculateStatistics(
        farmerRequests,
        bulkFoodRequests
      );
      setStatistics(newStatistics);
    }
  }, [farmerRequests, bulkFoodRequests]);

  // Real-time listener for farmer_requests
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
          queryClient.invalidateQueries({
            queryKey: ["farmer_requests", aggregatorId],
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
          queryClient.invalidateQueries({
            queryKey: ["farmer_requests", aggregatorId],
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [aggregatorId, queryClient]);

  // Real-time listener for aggregator_requests
  useEffect(() => {
    if (!aggregatorId) return;

    const channel = supabaseClient
      .channel(`aggregator_requests_${aggregatorId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "aggregator_requests",
          filter: `aggregator_id=eq.${aggregatorId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["aggregator_requests", aggregatorId],
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [aggregatorId, queryClient]);

  // Real-time listener for farmer_produce
  useEffect(() => {
    if (!aggregatorId) return;

    const channel = supabaseClient
      .channel(`farmer_produce_${aggregatorId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "farmer_produce",
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["farmer_requests", aggregatorId],
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [aggregatorId, queryClient]);

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
