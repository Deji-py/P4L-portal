// ============ LOCATION MANAGEMENT HOOK ============

import { supabaseClient } from "@/utils/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface AggregatorLocation {
  id: number;
  aggregator_id: number;
  address: string;
  longitude: number;
  latitude: number;
  location: { type: string; coordinates: [number, number] };
  is_primary: boolean;
  created_at: string;
}

interface UpdateLocationPayload {
  aggregatorId: number;
  address: string;
  longitude: number;
  latitude: number;
}

interface ReverseGeocodeResult {
  address: string;
  longitude: number;
  latitude: number;
}

// Reverse geocode address to coordinates
const reverseGeocodeAddress = async (
  address: string
): Promise<ReverseGeocodeResult> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}`
    );
    const data = await response.json();

    if (data.length === 0) {
      throw new Error("Address not found");
    }

    const result = data[0];
    return {
      address: result.display_name,
      longitude: parseFloat(result.lon),
      latitude: parseFloat(result.lat),
    };
  } catch (error) {
    throw new Error(
      `Failed to geocode address: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

// Update aggregator location
const updateAggregatorLocation = async (
  payload: UpdateLocationPayload
): Promise<AggregatorLocation> => {
  const { data, error } = await supabaseClient
    .from("aggregators")
    .update({
      aggregator_address: payload.address,
      longitude: payload.longitude,
      latitude: payload.latitude,
    })
    .eq("id", payload.aggregatorId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update location: ${error.message}`);
  }

  return data as AggregatorLocation;
};

// Get aggregator location
const fetchAggregatorLocation = async (
  aggregatorId: number
): Promise<AggregatorLocation | null> => {
  const { data, error } = await supabaseClient
    .from("aggregators")
    .select("*")
    .eq("id", aggregatorId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch location: ${error.message}`);
  }

  return data as AggregatorLocation;
};

export const useAggregatorLocation = (aggregatorId?: number) => {
  const queryClient = useQueryClient();

  const {
    data: location,
    isLoading: locationLoading,
    error: locationError,
    refetch: refetchLocation,
  } = useQuery({
    queryKey: ["aggregator_location", aggregatorId],
    queryFn: () => fetchAggregatorLocation(aggregatorId!),
    enabled: !!aggregatorId,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const {
    mutate: updateLocation,
    isPending: isUpdatingLocation,
    error: updateLocationError,
  } = useMutation({
    mutationFn: (payload: UpdateLocationPayload) =>
      updateAggregatorLocation(payload),
    onSuccess: () => {
      toast.success("Location updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["aggregator_location", aggregatorId],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update location");
    },
  });

  const {
    mutate: geocodeAndUpdate,
    isPending: isGeocoding,
    error: geocodeError,
  } = useMutation({
    mutationFn: async (address: string) => {
      const geocoded = await reverseGeocodeAddress(address);
      return updateAggregatorLocation({
        aggregatorId: aggregatorId!,
        address: geocoded.address,
        longitude: geocoded.longitude,
        latitude: geocoded.latitude,
      });
    },
    onSuccess: () => {
      toast.success("Location geocoded and saved successfully");
      queryClient.invalidateQueries({
        queryKey: ["aggregator_location", aggregatorId],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to geocode address");
    },
  });

  return {
    location,
    locationLoading,
    locationError,
    refetchLocation,
    updateLocation,
    isUpdatingLocation,
    updateLocationError,
    geocodeAndUpdate,
    isGeocoding,
    geocodeError,
  };
};
