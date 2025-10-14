/* eslint-disable @typescript-eslint/no-explicit-any */
import useAuth from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchTableData,
  deleteTableData,
  updateTableData,
  createTableData,
} from "./table.action";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

interface TableQueryProps {
  table_name: string;
  excluded_columns?: string[];
  id_column?: string;
  order_by?: string;
}

interface DeleteMutationParams {
  data: string[] | string;
}

interface UpdateMutationParams {
  id: string | number;
  data: Record<string, any>;
}

interface CreateMutationParams {
  data: Record<string, any>;
}

function useTableQuery({
  table_name,
  excluded_columns,
  id_column = "id",
  order_by = "created_at",
}: TableQueryProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const searchParams = useSearchParams();

  const current_page = Number.parseInt(searchParams.get("page") || "1", 10);
  const page_size = Number.parseInt(searchParams.get("pageSize") as string, 10);

  const { data, isLoading } = useQuery({
    queryKey: [table_name, user, current_page, page_size],
    queryFn: () =>
      fetchTableData({
        table_name,
        excluded_columns,
        current_page,
        page_size,
        order_by,
      }),
  });

  const delete_mutation = useMutation({
    mutationKey: [table_name, "deleting"],
    mutationFn: ({ data: rowData }: DeleteMutationParams) =>
      deleteTableData({
        table_name,
        data: rowData,
        id_column,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [table_name, user],
      });

      toast.success("Successfully deleted record");
    },
    onError: (error) => {
      toast.error(error.message || "Unable to delete data");
    },
  });

  const update_mutation = useMutation({
    mutationKey: [table_name, "updating"],
    mutationFn: ({ id, data: rowData }: UpdateMutationParams) =>
      updateTableData({
        table_name,
        id,
        data: rowData,
        id_column,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [table_name, user],
      });

      toast.success("Successfully updated record");
    },
    onError: (error) => {
      toast.error(error.message || "Unable to update data");
    },
  });

  const create_mutation = useMutation({
    mutationKey: [table_name, "creating"],
    mutationFn: ({ data: rowData }: CreateMutationParams) =>
      createTableData({
        table_name,
        data: rowData,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [table_name, user],
      });

      toast.success("Successfully created record");
    },
    onError: (error) => {
      toast.error(error.message || "Unable to create data");
    },
  });

  return {
    data,
    loading: isLoading,

    // Delete Mutation
    delete: delete_mutation,

    // Update Mutation
    update: update_mutation,

    // Create Mutation
    create: create_mutation,
  };
}

export default useTableQuery;
