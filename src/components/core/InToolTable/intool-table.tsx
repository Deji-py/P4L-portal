/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useCallback, useMemo } from "react";
import { CustomButton, DataTable } from "./data-table";
import useTableQuery from "./hooks/useTableQuery";
import {
  CellType,
  DataTableAction,
  DataTableColumn,
} from "./types/table.types";
import { generateTableColumns } from "./column-transformer";
import { EyeIcon, PenBox, Trash, View } from "lucide-react";
import { IconRotate } from "@tabler/icons-react";
import { useSearchParams } from "next/navigation";
import CreateEditRecord from "./create-edit-record";
import ViewRecord from "./view-record";

export type ColumnOverrides = Array<{
  column_name: string;
  input_type?:
    | "text"
    | "password"
    | "email"
    | "number"
    | "textarea"
    | "checkbox"
    | "select"
    | "date"
    | "otp"
    | "combobox";
  cell_type?: CellType;
  options?: Array<{ label: string; value: string | number }>;
}>;

interface TableQueryProps {
  table_name: string;
  excluded_columns?: string[];
  table_hidden_columns?: string[];
  id_column?: string;
  column_overrides?: ColumnOverrides;
  onView?: (data: any) => void;
  additional_actions?: DataTableAction[];
  additional_buttons?: CustomButton[];
  order_by?: string;
}

function InToolTable({
  table_name,
  excluded_columns = [],
  table_hidden_columns = [],
  id_column = "id",
  column_overrides,
  onView,
  additional_actions = [],
  additional_buttons = [],
  order_by = "created_at",
}: TableQueryProps) {
  // ========================================
  // STATE MANAGEMENT
  // ========================================
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [showDeleteConsent, setShowDeleteConsent] = useState(false);
  const [row_ids, setRowIds] = useState<string[] | string | null>(null);

  // Dialog state management
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [currentEditRow, setCurrentEditRow] = useState<any>(null);
  const [currentViewRow, setCurrentViewRow] = useState<any>(null);

  // ========================================
  // URL PARAMS & DATA FETCHING
  // ========================================
  const searchParams = useSearchParams();
  const currentPage = searchParams.get("page");
  const pageSize = searchParams.get("pageSize");
  const params_ready = currentPage && pageSize;

  const {
    data,
    loading,
    delete: deleteMutation,
    update: updateMutation,
    create: createMutation,
  } = useTableQuery({
    table_name,
    excluded_columns,
    id_column,
    order_by,
  });

  // ========================================
  // COLUMN PROCESSING
  // ========================================

  // Generate table columns from data
  const table_columns: DataTableColumn[] = useMemo(
    () => generateTableColumns(data?.data as any),
    [data?.data]
  );

  // Filter out excluded columns and get required columns for forms
  const form_columns = useMemo(
    () =>
      table_columns.filter(
        (col) => !excluded_columns?.includes(col.key) && col.key !== id_column
      ),
    [table_columns, excluded_columns, id_column]
  );

  // Define required columns (you can customize this logic)
  const required_columns = useMemo(
    () =>
      form_columns
        .filter(
          (col) =>
            // Add your logic for determining required fields
            // For now, assuming text and email fields are required
            col.type === "text" || col.type === "email"
        )
        .map((col) => col.key),
    [form_columns]
  );

  // ========================================
  // ROW SELECTION HANDLERS
  // ========================================
  const handleSelectedRowsChange = useCallback((rows: any[]) => {
    setSelectedRows(rows);
  }, []);

  // ========================================
  // DELETE OPERATIONS
  // ========================================

  /**
   * Handle individual row deletion
   */
  const handleDeleteRow = useCallback(
    (row: any) => {
      const rowId = row[id_column];
      if (rowId) {
        setRowIds(rowId);
        setShowDeleteConsent(true);
      }
    },
    [id_column]
  );

  /**
   * Handle bulk deletion confirmation
   */
  const handleBulkDelete = useCallback(() => {
    if (selectedRows.length > 0) {
      const rowIds = selectedRows.map((row) => row[id_column]).filter(Boolean);
      if (rowIds.length > 0) {
        setRowIds(rowIds);
        setShowDeleteConsent(true);
      }
    }
  }, [selectedRows, id_column]);

  /**
   * Execute deletion after confirmation
   */
  const handleConfirmDeletion = async () => {
    setSelectedRows([]);
    if (row_ids) {
      await deleteMutation.mutateAsync({
        data: row_ids,
      });
      setShowDeleteConsent(false);
      setRowIds(null);
    }
  };

  // ========================================
  // CRUD OPERATIONS
  // ========================================

  /**
   * Handle create new record
   */
  const handleCreate = useCallback(() => {
    setShowCreateDialog(true);
  }, []);

  /**
   * Handle edit record
   */
  const handleEdit = useCallback((row: any) => {
    setCurrentEditRow(row);
    setShowEditDialog(true);
  }, []);

  /**
   * Handle view record
   */
  const handleView = useCallback((row: any) => {
    setCurrentViewRow(row);
    setShowViewDialog(true);
  }, []);

  /**
   * Handle form submission for create
   */
  const handleCreateSubmit = useCallback(
    async (formData: any) => {
      try {
        await createMutation.mutateAsync({ data: formData });
        setShowCreateDialog(false);
      } catch (error) {
        console.error("Error creating record:", error);
      }
    },
    [createMutation]
  );

  /**
   * Handle form submission for edit
   */
  const handleEditSubmit = useCallback(
    async (formData: any) => {
      if (!currentEditRow) return;

      try {
        await updateMutation.mutateAsync({
          id: currentEditRow[id_column],
          data: formData,
        });
        setShowEditDialog(false);
        setCurrentEditRow(null);
      } catch (error) {
        console.error("Error updating record:", error);
      }
    },
    [currentEditRow, id_column, updateMutation]
  );

  /**
   * Handle edit trigger from view dialog
   */
  const handleEditFromView = useCallback((row: any) => {
    setShowViewDialog(false);
    setCurrentViewRow(null);
    setCurrentEditRow(row);
    setShowEditDialog(true);
  }, []);

  // ========================================
  // DIALOG HELPERS
  // ========================================

  /**
   * Generate delete confirmation dialog content
   */
  const getDialogContent = () => {
    const count = Array.isArray(row_ids) ? row_ids?.length : 1;
    if (count === 0) return { title: "", description: "" };

    return {
      title: `Delete ${count} ${count === 1 ? "Record" : "Records"}`,
      description: `Are you sure you want to delete ${count} ${
        count === 1 ? "record" : "records"
      } from ${table_name.replace(/_/g, " ")}? This action cannot be undone.`,
    };
  };

  // ========================================
  // TABLE CONFIGURATION
  // ========================================

  /**
   * Define row actions - combining default and additional actions
   */
  const actions: DataTableAction[] = useMemo(() => {
    const defaultActions: DataTableAction[] = [
      {
        label: "Edit",
        icon: <PenBox />,
        onClick: handleEdit,
      },
      {
        label: "View",
        icon: <EyeIcon />,
        onClick: onView || handleView,
      },
    ];

    return [
      ...defaultActions,
      ...additional_actions,
      {
        label: "Delete",
        icon: <Trash />,
        onClick: handleDeleteRow,
        variant: "destructive",
      },
    ];
  }, [handleEdit, handleView, handleDeleteRow, onView, additional_actions]);

  /**
   * Define custom table buttons - combining default and additional buttons
   */
  const custom_buttons: CustomButton[] = useMemo(() => {
    const defaultButtons: CustomButton[] = [
      {
        label: "Create New",
        onClick: handleCreate,
        variant: "default",
      },
      ...(selectedRows.length > 0
        ? [
            {
              label: `Delete Selected (${selectedRows.length})`,
              onClick: handleBulkDelete,
              variant: "destructive" as const,
            },
          ]
        : []),
    ];

    return [...defaultButtons, ...additional_buttons];
  }, [handleCreate, handleBulkDelete, selectedRows.length, additional_buttons]);

  // ========================================
  // COMPUTED VALUES
  // ========================================
  const { title: dialogTitle, description: dialogDescription } =
    getDialogContent();

  const formattedTableTitle = table_name
    ?.replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  // ========================================
  // RENDER
  // ========================================

  return (
    <>
      {/* Create Record Dialog */}
      <CreateEditRecord
        isOpen={showCreateDialog}
        columns={form_columns}
        required_columns={required_columns}
        overrides={column_overrides}
        onSubmit={handleCreateSubmit}
        onClose={() => setShowCreateDialog(false)}
        title={`Create New ${formattedTableTitle.slice(0, -1)}`}
        isSubmitting={createMutation.isPending}
      />

      {/* Edit Record Dialog */}
      <CreateEditRecord
        isOpen={showEditDialog}
        row={currentEditRow}
        columns={form_columns}
        required_columns={required_columns}
        overrides={column_overrides}
        onSubmit={handleEditSubmit}
        onClose={() => {
          setShowEditDialog(false);
          setCurrentEditRow(null);
        }}
        title={`Edit ${formattedTableTitle.slice(0, -1)}`}
        isSubmitting={updateMutation.isPending}
      />

      {/* View Record Sheet */}
      <ViewRecord
        isOpen={showViewDialog}
        row={currentViewRow}
        onClose={() => {
          setShowViewDialog(false);
          setCurrentViewRow(null);
        }}
        onEdit={handleEditFromView}
        title={`View ${formattedTableTitle.slice(0, -1)}`}
        excludedFields={[id_column, ...excluded_columns]}
      />

      {/* Data Table */}
      <DataTable
        customButtons={custom_buttons}
        title={formattedTableTitle}
        actions={actions}
        onSelectedRowsChange={handleSelectedRowsChange}
        table_hidden_columns={table_hidden_columns}
        // Delete confirmation props
        onClose={() => {
          setShowDeleteConsent(false);
          setRowIds(null);
        }}
        onConfirm={handleConfirmDeletion}
        isDeleting={deleteMutation.isPending}
        showDeleteConsent={showDeleteConsent}
        dialogTitle={dialogTitle}
        dialogDescription={dialogDescription}
        // Table data props
        disableFiltering
        data={data?.data as any}
        columns={table_columns}
        isLoading={loading}
        totalCount={data?.count as number}
        // Loading state
        noDataComponent={
          data && params_ready ? null : (
            <div className="flex flex-col justify-center items-center">
              <IconRotate className="animate-spin" />
            </div>
          )
        }
      />
    </>
  );
}

export default React.memo(InToolTable);
