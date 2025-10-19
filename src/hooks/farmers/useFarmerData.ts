/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseClient } from "@/utils/client";

// Type Definitions
interface Farmer {
  id: number;
  user_id: string;
  full_name: string;
  farm_cluster_name: string;
  contact_information: string;
  state: string;
  local_gov_area: string;
  address: string;
  farm_size: string;
  farming_type: string[];
  main_crops: string;
  seasonal_calendar: string;
  monthly_output: string;
  irrigation_methods_used: string;
  post_harvest_facilities_available: string;
  ownership_type: string[];
  land_tenure_status: string[];
  is_cooperative_member: boolean;
  has_extension_service_access: boolean;
  support_needed_areas: string[];
  support_needed_other: string;
  years_of_operation: string;
  created_at: string;
  farm_image_url?: string;
  farm_video_url?: string;
  profile_approved?: boolean;
}

interface FarmerRequest {
  id: number;
  farmer_id: number;
  submitted_at: string;
  aggregator_id: number | null;
  status: string;
  score: number | null;
  accepted: number | null;
  rejected: number | null;
  no_of_proceeds: number | null;
  inspection_date: string | null;
  inspection_time: string | null;
  aggregators?: {
    id: number;
    business_name: string;
    local_gov_area: string;
    state: string;
  };
  farmer_produce?: FarmerProduce[];
}

interface FarmerProduce {
  id: number;
  request_id: number;
  product_name: string;
  quantity: number;
  unit_measure: string;
  unit_price: number;
  submission_date: string;
}

interface ProductType {
  id: number;
  product_name: string;
  category: string;
  description: string;
  image_url: string;
  default_unit_measure: string;
  is_active: boolean;
}

interface FarmerAnalytics {
  totalRequests: number;
  acceptedRequests: number;
  rejectedRequests: number;
  pendingRequests: number;
  totalProduce: number;
  averageScore: number;
}

interface UpdateFarmerProfilePayload {
  farmerId: number;
  data: Partial<Farmer>;
}

interface CreateProduceRequestPayload {
  farmerId: number;
  aggregatorId: number;
  produces: Array<{
    product_name: string;
    quantity: number;
    unit_measure: string;
    unit_price: number;
  }>;
}

// Fetch farmer by user_id
const fetchFarmerByUserId = async (userId: string): Promise<Farmer | null> => {
  const { data, error } = await supabaseClient
    .from("farmers")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // No farmer found
    throw new Error(`Failed to fetch farmer: ${error.message}`);
  }

  return data as Farmer;
};

// Fetch farmer requests with filters
const fetchFarmerRequests = async (
  farmerId: number,
  status?: string,
  page: number = 1,
  limit: number = 10
): Promise<{ data: FarmerRequest[]; count: number }> => {
  let query = supabaseClient
    .from("farmer_requests")
    .select(
      `
      *,
      aggregators (
        id,
        business_name,
        local_gov_area,
        state
      )
    `,
      { count: "exact" }
    )
    .eq("farmer_id", farmerId)
    .order("submitted_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status.toLowerCase());
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch farmer requests: ${error.message}`);
  }

  // Fetch produce for each request
  const requestsWithProduce = await Promise.all(
    (data || []).map(async (request) => {
      const { data: produceData } = await supabaseClient
        .from("farmer_produce")
        .select("*")
        .eq("request_id", request.id);

      return { ...request, farmer_produce: produceData || [] };
    })
  );

  return {
    data: requestsWithProduce as FarmerRequest[],
    count: count || 0,
  };
};

// Fetch farmer analytics
const fetchFarmerAnalytics = async (
  farmerId: number
): Promise<FarmerAnalytics> => {
  const { data: requests, error } = await supabaseClient
    .from("farmer_requests")
    .select("status, score, no_of_proceeds")
    .eq("farmer_id", farmerId);

  if (error) {
    throw new Error(`Failed to fetch analytics: ${error.message}`);
  }

  const totalRequests = requests?.length || 0;
  const acceptedRequests =
    requests?.filter((r) => r.status === "accepted").length || 0;
  const rejectedRequests =
    requests?.filter((r) => r.status === "rejected").length || 0;
  const pendingRequests =
    requests?.filter((r) => r.status === "pending").length || 0;

  const totalProduce =
    requests?.reduce((sum, r) => sum + (r.no_of_proceeds || 0), 0) || 0;

  const scores =
    requests?.filter((r) => r.score !== null).map((r) => r.score) || [];
  const averageScore =
    scores.length > 0
      ? scores.reduce((sum, score) => sum + (score || 0), 0) / scores.length
      : 0;

  return {
    totalRequests,
    acceptedRequests,
    rejectedRequests,
    pendingRequests,
    totalProduce,
    averageScore,
  };
};

// Fetch product types
const fetchProductTypes = async (): Promise<ProductType[]> => {
  const { data, error } = await supabaseClient
    .from("product_types")
    .select("*")
    .eq("is_active", true)
    .order("product_name");

  if (error) {
    throw new Error(`Failed to fetch product types: ${error.message}`);
  }

  return data as ProductType[];
};

// Fetch aggregators by location
const fetchAggregatorsByLocation = async (
  state: string,
  localGovArea: string
) => {
  const { data, error } = await supabaseClient
    .from("aggregators")
    .select("id, business_name, local_gov_area, state");
  // .eq("state", state)
  // .eq("local_gov_area", localGovArea);

  if (error) {
    throw new Error(`Failed to fetch aggregators: ${error.message}`);
  }

  return data;
};

// Update farmer profile
const updateFarmerProfile = async (
  payload: UpdateFarmerProfilePayload
): Promise<Farmer> => {
  const { data, error } = await supabaseClient
    .from("farmers")
    .update(payload.data)
    .eq("id", payload.farmerId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update farmer profile: ${error.message}`);
  }

  return data as Farmer;
};

// Create produce request
const createProduceRequest = async (payload: CreateProduceRequestPayload) => {
  // Create the farmer request
  const { data: requestData, error: requestError } = await supabaseClient
    .from("farmer_requests")
    .insert({
      farmer_id: payload.farmerId,
      aggregator_id: payload.aggregatorId,
      status: "pending",
      no_of_proceeds: payload.produces.length,
    })
    .select()
    .single();

  if (requestError) {
    throw new Error(`Failed to create request: ${requestError.message}`);
  }

  // Create the produce items
  const produceItems = payload.produces.map((produce) => ({
    ...produce,
    request_id: requestData.id,
  }));

  const { error: produceError } = await supabaseClient
    .from("farmer_produce")
    .insert(produceItems);

  if (produceError) {
    throw new Error(`Failed to create produce: ${produceError.message}`);
  }

  return requestData;
};

// Main hook
export const useFarmerData = (userId: string) => {
  const queryClient = useQueryClient();

  // Fetch farmer profile
  const {
    data: farmer,
    isLoading: farmerLoading,
    error: farmerError,
    refetch: refetchFarmer,
  } = useQuery({
    queryKey: ["farmer", userId],
    queryFn: () => fetchFarmerByUserId(userId),
    enabled: !!userId,
  });

  // Fetch farmer requests
  const useFarmerRequests = (
    status?: string,
    page: number = 1,
    limit: number = 10
  ) => {
    return useQuery({
      queryKey: ["farmer_requests", farmer?.id, status, page, limit],
      queryFn: () => fetchFarmerRequests(farmer!.id, status, page, limit),
      enabled: !!farmer?.id,
    });
  };

  // Fetch analytics
  const {
    data: analytics,
    isLoading: analyticsLoading,
    refetch: refetchAnalytics,
  } = useQuery({
    queryKey: ["farmer_analytics", farmer?.id],
    queryFn: () => fetchFarmerAnalytics(farmer!.id),
    enabled: !!farmer?.id,
  });

  // Fetch product types
  const { data: productTypes, isLoading: productTypesLoading } = useQuery({
    queryKey: ["product_types"],
    queryFn: fetchProductTypes,
  });

  // Fetch aggregators
  const useAggregators = () => {
    return useQuery({
      queryKey: ["aggregators", farmer?.state, farmer?.local_gov_area],
      queryFn: () =>
        fetchAggregatorsByLocation(farmer!.state, farmer!.local_gov_area),
      enabled: !!farmer?.state && !!farmer?.local_gov_area,
    });
  };

  // Update profile mutation
  const {
    mutate: updateProfile,
    isPending: isUpdatingProfile,
    error: updateProfileError,
  } = useMutation({
    mutationFn: (data: Partial<Farmer>) =>
      updateFarmerProfile({ farmerId: farmer!.id, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmer"] });
    },
  });

  // Create request mutation
  const {
    mutate: createRequest,
    isPending: isCreatingRequest,
    error: createRequestError,
  } = useMutation({
    mutationFn: (payload: Omit<CreateProduceRequestPayload, "farmerId">) =>
      createProduceRequest({ ...payload, farmerId: farmer!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmer_requests"] });
      queryClient.invalidateQueries({ queryKey: ["farmer_analytics"] });
    },
  });

  return {
    farmer,
    farmerLoading,
    farmerError,
    refetchFarmer,
    analytics,
    analyticsLoading,
    refetchAnalytics,
    productTypes,
    productTypesLoading,
    useFarmerRequests,
    useAggregators,
    updateProfile,
    isUpdatingProfile,
    updateProfileError,
    createRequest,
    isCreatingRequest,
    createRequestError,
  };
};
