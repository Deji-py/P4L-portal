/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { createActionsColumn } from "./action-columns";
import { transformColumns } from "./column-transformer";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { DataTableAction, DataTableColumn } from "./types/table.types";

export type CustomButton = {
  label: string;
  onClick: () => void;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  icon?: ReactNode;
  disabled?: boolean;
};

type DataTableProps<TData, TValue> = {
  columns: DataTableColumn[];
  data: TData[];
  actions?: DataTableAction<TData>[];
  totalCount?: number; // Optional - if provided, enables server-side pagination
  pageSizeOptions?: number[];
  className?: string;
  getRowId?: (row: TData) => string; // Function to get a unique ID for each row
  customButtons?: CustomButton[]; // Custom buttons to display next to the filter button
  onSelectedRowsChange?: (selectedRows: TData[]) => void; // Callback when selected rows change
  isLoading?: boolean;
  disableFiltering?: boolean;
  customComponentRight?: ReactNode;
  customComponentCenter?: ReactNode;
  noDataComponent?: ReactNode;
  title?: string;
  showDeleteConsent?: boolean; // Controls whether the delete confirmation dialog is shown
  onConfirm?: () => void; // Callback for when the user confirms deletion
  onClose?: () => void; // Callback for when the dialog is closed
  isDeleting?: boolean; // Indicates if a deletion is in progress
  dialogTitle?: string; // New: Custom title for the delete dialog
  dialogDescription?: string; // New: Custom description for the delete dialog
  table_hidden_columns: string[];
};

function Data_table<TData, TValue>({
  actions = [],
  columns,
  data,
  totalCount,
  pageSizeOptions = [10, 20, 50, 100],
  className,
  getRowId = (row: any) =>
    row?.id?.toString() || Math.random().toString(36).substring(2, 9),
  customButtons = [],
  onSelectedRowsChange,
  isLoading = true,
  disableFiltering,
  customComponentRight,
  customComponentCenter,
  noDataComponent,
  title,
  showDeleteConsent = false,
  onConfirm,
  onClose,
  isDeleting = false,
  dialogTitle = "Confirm Deletion", // Default title
  dialogDescription = "Are you sure you want to delete this row? This action cannot be undone.", // Default description
  table_hidden_columns,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tableRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);

  // Store the current scroll position before navigation
  useEffect(() => {
    const handleScroll = () => {
      scrollPositionRef.current = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Restore scroll position after URL changes
  useEffect(() => {
    const scrollPosition = scrollPositionRef.current;
    if (scrollPosition > 0) {
      // Use requestAnimationFrame to ensure the DOM has updated
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPosition);
      });
    }
  }, [searchParams]);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Initialize column visibility with 'id' column hidden
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const updateColumnVsibility = () => {
    const initialVisibility: VisibilityState = {};
    columns.forEach((column) => {
      if (["id", ...table_hidden_columns].includes(column.key)) {
        initialVisibility[column.key] = false;
      }
    });

    setColumnVisibility(initialVisibility);
  };

  useEffect(() => {
    updateColumnVsibility();
  }, [columns]);

  const [showFilters, setShowFilters] = useState(false);

  // Row selection state that persists across pages
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  // Get pagination from URL params
  const currentPage = Number.parseInt(searchParams.get("page") || "1", 10);
  const pageSize = Number.parseInt(
    searchParams.get("pageSize") || pageSizeOptions[0].toString(),
    10
  );

  // Determine if we're using server-side or client-side pagination
  const isServerSide = totalCount !== undefined && totalCount !== data?.length;
  const actualTotalCount = totalCount || data?.length;
  const totalPages = Math.ceil(actualTotalCount / pageSize);

  // For client-side pagination, slice the data
  const paginatedData = useMemo(() => {
    if (isServerSide) {
      return data; // Server should already provide paginated data
    }
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data?.slice(startIndex, endIndex);
  }, [data, currentPage, pageSize, isServerSide]);

  // Create a map of row IDs to their data for selection tracking
  const rowDataMap = useMemo(() => {
    const map = new Map<string, TData>();
    data?.forEach((row) => {
      const id = getRowId(row);
      map.set(id, row);
    });
    return map;
  }, [data, getRowId]);

  // Get the currently selected rows as an array of data objects
  const selectedRows = useMemo(() => {
    return Object.entries(rowSelection)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => rowDataMap.get(id))
      .filter((row): row is TData => row !== undefined);
  }, [rowSelection, rowDataMap]);

  // Notify parent component when selected rows change
  useEffect(() => {
    onSelectedRowsChange?.(selectedRows);
  }, [rowSelection, onSelectedRowsChange]); // Added selectedRows to dependency array

  const handlePageChange = (page: number) => {
    // Save current scroll position
    scrollPositionRef.current = window.scrollY;
    // Create new URL with updated parameters
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    // Use shallow routing to prevent full page reload
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    if (!searchParams.get("pageSize")) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("pageSize", "10"); // Set default page size
      params.set("page", "1");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, []);

  const handlePageSizeChange = (size: string) => {
    // Save current scroll position
    scrollPositionRef.current = window.scrollY;
    // Create new URL with updated parameters
    const params = new URLSearchParams(searchParams.toString());
    params.set("pageSize", size);
    params.set("page", "1"); // Reset to first page when changing size
    // Use shallow routing to prevent full page reload
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Add selection column
  const selectionColumn: ColumnDef<TData, any> = {
    id: "select",
    header: ({ table }) => (
      <div className="px-1">
        <Checkbox
          checked={
            paginatedData?.length > 0 &&
            paginatedData?.every((row) => {
              const rowId = getRowId(row);
              return rowSelection[rowId] === true;
            })
          }
          onCheckedChange={(value) => {
            // Toggle all rows on the current page
            const newSelection = { ...rowSelection };
            paginatedData?.forEach((row) => {
              const rowId = getRowId(row);
              newSelection[rowId] = !!value;
            });
            setRowSelection(newSelection);
          }}
          aria-label="Select all rows"
        />
      </div>
    ),
    cell: ({ row }) => {
      const rowId = getRowId(row.original);
      return (
        <div className="px-1">
          <Checkbox
            checked={rowSelection[rowId] === true}
            onCheckedChange={(value) => {
              setRowSelection((prev) => ({
                ...prev,
                [rowId]: !!value,
              }));
            }}
            aria-label={`Select row ${rowId}`}
          />
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  };

  // Add actions column with pinning
  const actionsColumn =
    actions.length > 0
      ? ({
          ...createActionsColumn(actions),
          meta: {
            pinned: true,
          },
        } as ColumnDef<TData, TValue>)
      : null;

  const tanstackColumns: ColumnDef<TData, TValue>[] = [
    selectionColumn as ColumnDef<TData, TValue>,
    ...(transformColumns(columns) as ColumnDef<TData, TValue>[]),
    ...(actionsColumn ? [actionsColumn] : []),
  ];

  const table = useReactTable({
    data: paginatedData,
    columns: tanstackColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },

    // We're handling pagination manually
    manualPagination: true,
    pageCount: totalPages,
  });

  // Calculate display range
  const startIndex = data?.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endIndex = Math.min(currentPage * pageSize, actualTotalCount);

  // Handle dialog close
  const handleCloseDialog = () => {
    onClose?.(); // Call the onClose callback if provided
  };

  return (
    <Card
      className={cn("w-full overflow-hidden py-3 ", className)}
      ref={tableRef}
    >
      <Dialog open={showDeleteConsent} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="p-4 pt-0  space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl flex items-center gap-4 font-bold mr-5">
            {title}
          </h2>
          <div className="flex items-center gap-2">
            <div className=" flex items-center">
              {!disableFiltering && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {showFilters ? "Hide Filters" : "Show Filters"}
                </Button>
              )}
            </div>
            {/* Custom buttons */}
            {customButtons.map((button, index) => (
              <Button
                key={index}
                variant={button.variant || "outline"}
                onClick={button.onClick}
                disabled={button.disabled}
                className="flex items-center gap-2"
              >
                {button.icon && button.icon}
                {button.label}
              </Button>
            ))}
            {customComponentCenter && customComponentCenter}
          </div>
          {customComponentRight && customComponentRight}
        </div>

        <div className="rounded-md border overflow-x-auto">
          <div className="relative">
            <Table>
              <TableHeader className="sticky top-0 z-20 bg-background   ">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className=" bg-muted/60 dark:bg-muted0/30  border-b hover:bg-accent "
                  >
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className={cn(
                          " pl-4 text-left text-xs font-semibold  tracking-wider text-muted0 dark:text-muted0",
                          header.column.columnDef.meta &&
                            "sticky right-0 bg-muted dark:bg-muted/70 z-20 border-l border-muted0 dark:border-muted0"
                        )}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {noDataComponent ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns?.length + 2}
                      className="text-center h-24"
                    >
                      {noDataComponent}
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {isLoading || paginatedData?.length === null
                      ? // Skeleton loading rows based on pageSize
                        Array.from({ length: pageSize || 10 }).map((_, i) => (
                          <TableRow
                            key={i}
                            className={
                              i % 2 === 0 ? "bg-muted/40" : "bg-muted/10"
                            }
                          >
                            {table.getAllColumns().map((column) => (
                              <TableCell key={column.id} className="px-4  py-2">
                                <div className="h-4 w-full animate-pulse bg-muted-foreground/20 rounded" />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      : paginatedData?.length > 0
                      ? table.getRowModel().rows.map((row, i) => (
                          <TableRow
                            key={row.id}
                            data-state={
                              rowSelection[getRowId(row.original)]
                                ? "selected"
                                : undefined
                            }
                            className={
                              i % 2 === 0 ? "bg-muted/40" : "bg-muted/10"
                            }
                          >
                            {row.getVisibleCells().map((cell) => (
                              <TableCell
                                key={cell.id}
                                className={cn(
                                  "px-4 py-2 max-w-[250px] truncate ",
                                  cell.column.columnDef.meta &&
                                    "sticky right-0 bg-muted  z-40 border-l shadow-[-8px_0_10px_-5px_rgba(0,0,0,0.1)]"
                                )}
                              >
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      : paginatedData?.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={columns?.length + 2}
                              className="h-24 text-center"
                            >
                              No results found.
                            </TableCell>
                          </TableRow>
                        )}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="flex items-center mt-4 justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            {data?.length > 0 ? (
              <>
                Showing {startIndex} to {endIndex} of {actualTotalCount} entries
              </>
            ) : (
              <>No entries to display</>
            )}
          </div>
          <div className=" flex  items-center gap-4">
            <div className="flex items-center gap-2">
              {selectedRows?.length > 0 && (
                <span className="text-sm font-medium">
                  {selectedRows?.length}{" "}
                  {selectedRows?.length === 1 ? "row" : "rows"} selected
                </span>
              )}
              <Select
                value={pageSize.toString()}
                onValueChange={handlePageSizeChange}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder={pageSize.toString()} />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center  gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous page</span>
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={i}
                      variant={
                        pageNum === currentPage ? "secondary" : "outline"
                      }
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className={cn(
                        "h-8 w-8",
                        pageNum === currentPage &&
                          "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary border border-primary/30"
                      )}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                {totalPages > 5 && (
                  <>
                    <span className="px-2">...</span>
                    <Button
                      variant={
                        totalPages === currentPage ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => handlePageChange(totalPages)}
                      className="h-8  w-8"
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next page</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

const DataTable = React.memo(Data_table);

export { DataTable };
