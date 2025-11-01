/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseClient } from "@/utils/client";

// Type Definitions
interface ProductType {
  id: number;
  product_name: string;
  category: string;
  description?: string;
  image_url?: string;
  default_unit_measure: string;
  is_active: boolean;
}

interface InventoryItem {
  id: number;
  created_at: string;
  updated_at: string;
  batch_id: string;
  bulk_trader_id: number;
  product_type_id: number;
  quantity: number;
  unit_measure: string;
  unit_price?: number;
  total_value?: number;
  purchase_date?: string;
  expiry_date?: string;
  source_location?: string;
  local_gov_area?: string;
  state?: string;
  storage_location?: string;
  quality_grade?: string;
  status: "in_stock" | "low_stock" | "out_of_stock" | "reserved" | "expired";
  notes?: string;
  farmer_request_id?: number;
  farmer_id?: number;
  product_types?: ProductType;
}

interface InventoryStats {
  total_items: number;
  total_value: number;
  in_stock: number;
  low_stock: number;
  out_of_stock: number;
  products_count: number;
}

interface AddInventoryData {
  bulk_trader_id: number;
  product_type_id: number;
  quantity: number;
  unit_measure: string;
  unit_price?: number;
  purchase_date?: string;
  expiry_date?: string;
  source_location?: string;
  local_gov_area?: string;
  state?: string;
  storage_location?: string;
  quality_grade?: string;
  notes?: string;
}

interface AddRequestToInventoryParams {
  bulk_trader_id: number;
  farmer_request_id: number;
  id: number;
}

// Fetch inventory items
const fetchInventory = async (
  bulkTraderId: number,
  status?: string,
  searchQuery?: string,
  page: number = 1,
  limit: number = 20
): Promise<{ data: InventoryItem[]; count: number }> => {
  let query = supabaseClient
    .from("inventory")
    .select("*, product_types(*)", { count: "exact" })
    .eq("bulk_trader_id", bulkTraderId)
    .order("created_at", { ascending: false });

  // Filter by status
  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  // Search functionality
  if (searchQuery) {
    query = query.or(
      `batch_id.ilike.%${searchQuery}%,source_location.ilike.%${searchQuery}%,storage_location.ilike.%${searchQuery}%`
    );
  }

  // Pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error(error);
    throw new Error(`Failed to fetch inventory: ${error.message}`);
  }

  return { data: data as InventoryItem[], count: count || 0 };
};

// Fetch inventory statistics
const fetchInventoryStats = async (
  bulkTraderId: number
): Promise<InventoryStats> => {
  const { data, error } = await supabaseClient
    .from("inventory")
    .select("quantity, total_value, status, product_type_id")
    .eq("bulk_trader_id", bulkTraderId);

  if (error) {
    throw new Error(`Failed to fetch stats: ${error.message}`);
  }

  const stats: InventoryStats = {
    total_items: data.length,
    total_value: data.reduce((sum, item) => sum + (item.total_value || 0), 0),
    in_stock: data.filter((item) => item.status === "in_stock").length,
    low_stock: data.filter((item) => item.status === "low_stock").length,
    out_of_stock: data.filter((item) => item.status === "out_of_stock").length,
    products_count: new Set(data.map((item) => item.product_type_id)).size,
  };

  return stats;
};

// Fetch product types
const fetchProductTypes = async (): Promise<ProductType[]> => {
  const { data, error } = await supabaseClient
    .from("product_types")
    .select("*")
    .eq("is_active", true)
    .order("product_name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch product types: ${error.message}`);
  }

  return data as ProductType[];
};

// Add inventory item (manual entry)
const addInventoryItem = async (
  inventoryData: AddInventoryData
): Promise<InventoryItem> => {
  // For manual entries, generate a different batch ID format
  const manualBatchId = `BT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const { data, error } = await supabaseClient
    .from("inventory")
    .insert([{ ...inventoryData, batch_id: manualBatchId }])
    .select("*, product_types(*)")
    .single();

  if (error) {
    throw new Error(`Failed to add inventory: ${error.message}`);
  }

  return data as InventoryItem;
};

// Add completed request to inventory
const addRequestToInventory = async ({
  bulk_trader_id,
  farmer_request_id,
  id,
}: AddRequestToInventoryParams): Promise<{
  success: boolean;
  message: string;
  items_added: number;
}> => {
  const { data, error } = await supabaseClient.rpc("add_request_to_inventory", {
    p_bulk_trader_id: bulk_trader_id,
    p_farmer_request_id: farmer_request_id,
    p_id: id,
  });

  if (error) {
    throw new Error(`Failed to add to inventory: ${error.message}`);
  }

  return data[0];
};

// Update inventory item
const updateInventoryItem = async (
  id: number,
  updates: Partial<InventoryItem>
): Promise<InventoryItem> => {
  const { data, error } = await supabaseClient
    .from("inventory")
    .update(updates)
    .eq("id", id)
    .select("*, product_types(*)")
    .single();

  if (error) {
    throw new Error(`Failed to update inventory: ${error.message}`);
  }

  return data as InventoryItem;
};

// Delete inventory item
const deleteInventoryItem = async (id: number): Promise<void> => {
  const { error } = await supabaseClient
    .from("inventory")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete inventory: ${error.message}`);
  }
};

// Check if request already in inventory
const checkRequestInInventory = async (
  bulkTraderId: number,
  farmerId: number,
  requestId: number
): Promise<boolean> => {
  const batchId = `FR-${farmerId}-${requestId}`;

  const { data, error } = await supabaseClient
    .from("inventory")
    .select("id")
    .eq("bulk_trader_id", bulkTraderId)
    .eq("batch_id", batchId)
    .limit(1);

  if (error) {
    console.error("Error checking inventory:", error);
    return false;
  }

  return (data?.length || 0) > 0;
};

// Main Hook
export const useInventory = (
  bulkTraderId: number,
  status?: string,
  searchQuery?: string,
  page: number = 1,
  limit: number = 20
) => {
  const queryClient = useQueryClient();

  // Fetch inventory
  const {
    data: inventoryData,
    isLoading: inventoryLoading,
    error: inventoryError,
  } = useQuery({
    queryKey: ["inventory", bulkTraderId, status, searchQuery, page, limit],
    queryFn: () =>
      fetchInventory(bulkTraderId, status, searchQuery, page, limit),
    enabled: !!bulkTraderId,
  });

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["inventory-stats", bulkTraderId],
    queryFn: () => fetchInventoryStats(bulkTraderId),
    enabled: !!bulkTraderId,
  });

  // Fetch product types
  const { data: productTypes, isLoading: productTypesLoading } = useQuery({
    queryKey: ["product-types"],
    queryFn: fetchProductTypes,
  });

  // Add mutation (manual)
  const addMutation = useMutation({
    mutationFn: addInventoryItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
    },
  });

  // Add request to inventory mutation
  const addRequestMutation = useMutation({
    mutationFn: addRequestToInventory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: number;
      updates: Partial<InventoryItem>;
    }) => updateInventoryItem(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteInventoryItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
    },
  });

  return {
    inventory: inventoryData?.data || [],
    totalCount: inventoryData?.count || 0,
    stats: stats || {
      total_items: 0,
      total_value: 0,
      in_stock: 0,
      low_stock: 0,
      out_of_stock: 0,
      products_count: 0,
    },
    productTypes: productTypes || [],
    inventoryLoading,
    statsLoading,
    productTypesLoading,
    inventoryError,
    addInventory: addMutation.mutateAsync,
    addRequestToInventory: addRequestMutation.mutateAsync,
    updateInventory: updateMutation.mutateAsync,
    deleteInventory: deleteMutation.mutateAsync,
    checkRequestInInventory,
    isAdding: addMutation.isPending,
    isAddingRequest: addRequestMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
