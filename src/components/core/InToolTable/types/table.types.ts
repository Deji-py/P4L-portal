/* eslint-disable @typescript-eslint/no-explicit-any */
import type React from "react";

export interface DataTableColumn<T = unknown> {
  key: string;
  header: string;
  type?: CellType;
  sortable?: boolean;
  filterable?: boolean;
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  accessor?: (row: T) => unknown;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface DataTableAction<T = unknown> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  variant?: "default" | "destructive";
  disabled?: (row: T) => boolean;
  hidden?: (row: T) => boolean;
}

export interface PaginationConfig {
  pageSize: number;
  pageSizeOptions: number[];
  showPageSizeSelector: boolean;
  showPageInfo: boolean;
  showFirstLastButtons: boolean;
}

export interface DataTableProps<T = unknown> {
  data: T[];
  columns: DataTableColumn<T>[];
  actions?: DataTableAction<T>[];
  loading?: boolean;
  error?: string;
  pagination?: Partial<PaginationConfig>;
  enableSelection?: boolean;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableColumnVisibility?: boolean;
  enableRowDragging?: boolean;
  enableVirtualization?: boolean;
  onSelectionChange?: (selectedRows: T[]) => void;
  onRowClick?: (row: T) => void;
  onRowDoubleClick?: (row: T) => void;
  className?: string;
  rowHeight?: number;
  maxHeight?: number;
  searchPlaceholder?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  // New reveal system props
  revealSystemEnabled?: boolean;
  onRevealChange?: (
    dataId: string,
    fieldName: string,
    revealed: boolean
  ) => void;
  revealStats?: {
    totalRevealableFields: number;
    revealedFields: number;
    maskableColumns: string[];
  };
}

export interface ColumnDefinition {
  key: string;
  type: CellType;
  label?: string;
  required?: boolean;
  defaultValue?: any;
  options?: string[] | { label: string; value: string }[];
  placeholder?: string;
  description?: string;
}

export type CellType =
  | "text"
  | "number"
  | "currency"
  | "percentage"
  | "date"
  | "datetime"
  | "time"
  | "boolean"
  | "badge"
  | "status"
  | "avatar"
  | "image"
  | "link"
  | "email"
  | "phone"
  | "progress"
  | "rating"
  | "tags"
  | "json"
  | "code"
  | "color"
  | "file"
  | "custom"
  | "share"
  | "category"
  | "options"
  | "rich-text";

export interface CellRendererProps<T = unknown> {
  value: unknown;
  row?: T;
  column?: DataTableColumn<T>;
}
