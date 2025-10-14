/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabaseClient } from "@/utils/client";
import { PostgrestError } from "@supabase/supabase-js";

type FetchTableDataParams = {
  table_name: string;
  excluded_columns?: string[];
  current_page: number;
  page_size: number;
  order_by?: string; // Optional: specify the ID column name, defaults to 'id'
};

type FetchTableDataResult = {
  count: number | null;
  data: any[] | null;
  error: PostgrestError | null;
};

export const fetchTableData = async ({
  table_name,
  excluded_columns = [],
  current_page,
  page_size,
  order_by = "id",
}: FetchTableDataParams): Promise<FetchTableDataResult> => {
  try {
    // Calculate correct range for pagination
    const from = (current_page - 1) * page_size;
    const to = from + page_size - 1;

    // First fetch one row to figure out the column names
    const { data: sample, error: sampleError } = await supabaseClient
      .from(table_name)
      .select("*")
      .range(0, 0); // Just get first row to inspect columns

    if (sampleError) {
      throw sampleError;
    }

    // Build column selection dynamically
    const columns =
      sample && sample.length > 0
        ? Object.keys(sample[0]).filter(
            (col) => !excluded_columns.includes(col)
          )
        : ["*"];

    // Fetch actual data with filtered columns and correct pagination
    const { data, count, error } = await supabaseClient
      .from(table_name)
      .select(columns.join(","), { count: "exact" })
      .range(from, to)
      .order(order_by, { ascending: false });

    if (error) {
      throw error;
    }

    return {
      count,
      data,
      error: null,
    };
  } catch (err: any) {
    // Re-throw PostgrestError as-is, convert other errors to PostgrestError-like structure
    if (err.code && err.message && err.details) {
      throw err; // This is already a PostgrestError
    } else {
      throw {
        code: "UNKNOWN_ERROR",
        message: err.message || "An unknown error occurred",
        details: err.details || null,
        hint: err.hint || null,
      } as PostgrestError;
    }
  }
};

type DeleteTableDataParams = {
  table_name: string;
  data: string[] | string;
  id_column?: string; // Optional: specify the ID column name, defaults to 'id'
};

type DeleteTableDataResult = {
  data: any[] | null;
  error: PostgrestError | null;
  success: boolean;
};

export const deleteTableData = async ({
  table_name,
  data,
  id_column = "id",
}: DeleteTableDataParams): Promise<DeleteTableDataResult> => {
  try {
    // Normalize data to array format
    const ids = Array.isArray(data) ? data : [data];

    // Perform the delete operation
    const { data: deletedData, error } = await supabaseClient
      .from(table_name)
      .delete()
      .in(id_column, ids)
      .select(); // Return deleted rows

    if (error) {
      throw error;
    }

    return {
      data: deletedData,
      error: null,
      success: true,
    };
  } catch (err: any) {
    // Re-throw PostgrestError as-is, convert other errors to PostgrestError-like structure
    if (err.code && err.message && err.details !== undefined) {
      throw err; // This is already a PostgrestError
    } else {
      throw {
        code: "UNKNOWN_ERROR",
        message: err.message || "An unknown error occurred during deletion",
        details: err.details || null,
        hint: err.hint || null,
      } as PostgrestError;
    }
  }
};

type UpdateTableDataParams = {
  table_name: string;
  id: string | number;
  data: Record<string, any>;
  id_column?: string; // Optional: specify the ID column name, defaults to 'id'
};

type UpdateTableDataResult = {
  data: any[] | null;
  error: PostgrestError | null;
  success: boolean;
};

export const updateTableData = async ({
  table_name,
  id,
  data,
  id_column = "id",
}: UpdateTableDataParams): Promise<UpdateTableDataResult> => {
  try {
    // Perform the update operation
    const { data: updatedData, error } = await supabaseClient
      .from(table_name)
      .update(data)
      .eq(id_column, id)
      .select(); // Return updated rows

    if (error) {
      throw error;
    }

    return {
      data: updatedData,
      error: null,
      success: true,
    };
  } catch (err: any) {
    // Re-throw PostgrestError as-is, convert other errors to PostgrestError-like structure
    if (err.code && err.message && err.details !== undefined) {
      throw err; // This is already a PostgrestError
    } else {
      throw {
        code: "UNKNOWN_ERROR",
        message: err.message || "An unknown error occurred during update",
        details: err.details || null,
        hint: err.hint || null,
      } as PostgrestError;
    }
  }
};

type CreateTableDataParams = {
  table_name: string;
  data: Record<string, any>;
};

type CreateTableDataResult = {
  data: any[] | null;
  error: PostgrestError | null;
  success: boolean;
};

export const createTableData = async ({
  table_name,
  data,
}: CreateTableDataParams): Promise<CreateTableDataResult> => {
  try {
    // Perform the insert operation
    const { data: createdData, error } = await supabaseClient
      .from(table_name)
      .insert(data)
      .select(); // Return created rows

    if (error) {
      throw error;
    }

    return {
      data: createdData,
      error: null,
      success: true,
    };
  } catch (err: any) {
    // Re-throw PostgrestError as-is, convert other errors to PostgrestError-like structure
    if (err.code && err.message && err.details !== undefined) {
      throw err; // This is already a PostgrestError
    } else {
      throw {
        code: "UNKNOWN_ERROR",
        message: err.message || "An unknown error occurred during creation",
        details: err.details || null,
        hint: err.hint || null,
      } as PostgrestError;
    }
  }
};
