/* eslint-disable @typescript-eslint/no-explicit-any */
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react"; // Replace with your icons
import { cellRenderers } from "./cell-rendrerer";
import { CellType, DataTableColumn } from "./types/table.types";

// Transformer function
export function transformColumns(columns: DataTableColumn[]): ColumnDef<any>[] {
  return columns.map((col: any) => {
    const RendererComponent =
      cellRenderers[col.type as CellType] || cellRenderers["text"];

    const hasSorting = !!col.sortable;

    return {
      id: col.key,
      accessorKey: col.key,
      header: ({ column }) => {
        if (hasSorting) {
          const isSorted = column.getIsSorted(); // 'asc' | 'desc' | false

          return (
            <div
              className="flex items-center gap-1 cursor-pointer select-none"
              onClick={column.getToggleSortingHandler()}
            >
              {col.header}
              {isSorted === "asc" ? (
                <ArrowUp className="h-4 w-4" />
              ) : isSorted === "desc" ? (
                <ArrowDown className="h-4 w-4" />
              ) : (
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              )}
            </div>
          );
        }

        // If no sorting, render plain text
        return <>{col.header}</>;
      },
      enableSorting: hasSorting,
      enableColumnFilter: !!col.filterable,
      cell: ({ getValue, row, column }) => (
        <RendererComponent
          value={getValue()}
          row={row.original}
          column={{ ...col, render: undefined }}
        />
      ),
    } satisfies ColumnDef<any>;
  });
}

/**
 * Detects the appropriate cell type based on the column key and sample values
 */
function detectCellType(key: string, sampleValues: unknown[]): CellType {
  const lowerKey = key.toLowerCase();
  const nonNullValues = sampleValues.filter(
    (v) => v !== null && v !== undefined
  );

  if (nonNullValues.length === 0) return "text";

  // Check key patterns first (more reliable than value inspection)
  if (lowerKey.includes("email")) return "email";
  if (
    lowerKey.includes("phone") ||
    lowerKey.includes("mobile") ||
    lowerKey.includes("tel")
  )
    return "phone";
  if (
    lowerKey === "url" ||
    lowerKey.includes("link") ||
    lowerKey.includes("website")
  )
    return "link";
  if (
    lowerKey.includes("avatar") ||
    lowerKey.includes("profile_image") ||
    lowerKey.includes("profile_pic") ||
    lowerKey.includes("photo")
  )
    return "avatar";
  if (
    lowerKey.includes("image") ||
    lowerKey.includes("img") ||
    lowerKey.includes("picture") ||
    lowerKey.includes("cover_image_url")
  )
    return "image";
  if (lowerKey.includes("color") || lowerKey.includes("colour")) return "color";
  if (lowerKey.includes("status")) return "status";
  if (
    lowerKey.includes("category") ||
    lowerKey.includes("type") ||
    lowerKey.includes("group")
  )
    return "category";
  if (lowerKey.includes("badge") || lowerKey.includes("label")) return "badge";
  if (lowerKey.includes("progress") || lowerKey.includes("completion"))
    return "progress";
  if (
    lowerKey.includes("rating") ||
    lowerKey.includes("score") ||
    lowerKey.includes("stars")
  )
    return "rating";
  if (lowerKey.includes("tags") || lowerKey.includes("keywords")) return "tags";
  if (
    lowerKey.includes("price") ||
    lowerKey.includes("cost") ||
    lowerKey.includes("amount") ||
    lowerKey.includes("salary")
  )
    return "currency";
  if (
    lowerKey.includes("percentage") ||
    lowerKey.includes("percent") ||
    lowerKey.includes("rate")
  )
    return "percentage";
  if (
    lowerKey.includes("created_at") ||
    lowerKey.includes("updated_at") ||
    lowerKey.includes("timestamp")
  )
    return "datetime";
  if (
    lowerKey.includes("date") &&
    (lowerKey.includes("time") || lowerKey.includes("at"))
  )
    return "datetime";
  if (lowerKey.includes("time") && !lowerKey.includes("date")) return "time";
  if (lowerKey.includes("date")) return "date";
  if (
    lowerKey.includes("file") ||
    lowerKey.includes("attachment") ||
    lowerKey.includes("document") ||
    lowerKey.includes("pdf")
  )
    return "file";

  // Check for rich text content based on key name
  if (
    lowerKey.includes("content") ||
    lowerKey.includes("description") ||
    lowerKey.includes("body") ||
    lowerKey.includes("html") ||
    lowerKey.includes("rich")
  ) {
    // Verify by checking if any sample values contain HTML
    const hasHTML = nonNullValues.some((v) => {
      if (typeof v === "string") {
        return /<\/?[a-z][\s\S]*>/i.test(v);
      }
      return false;
    });
    if (hasHTML) return "rich-text";
  }

  // Check value patterns
  const firstValue = nonNullValues[0];

  // Boolean values
  if (typeof firstValue === "boolean") return "boolean";

  // Number patterns
  if (typeof firstValue === "number") {
    // Check if it's a percentage (0-100 or 0-1 range)
    const allNumbers = nonNullValues.filter(
      (v) => typeof v === "number"
    ) as number[];
    if (allNumbers.every((n) => n >= 0 && n <= 1)) return "percentage";
    if (
      allNumbers.every((n) => n >= 0 && n <= 100) &&
      lowerKey.includes("percent")
    )
      return "percentage";
    if (
      allNumbers.every((n) => n >= 0 && n <= 5) &&
      lowerKey.includes("rating")
    )
      return "rating";
    if (
      allNumbers.every((n) => n >= 0 && n <= 100) &&
      lowerKey.includes("progress")
    )
      return "progress";
    return "number";
  }

  // String pattern analysis
  if (typeof firstValue === "string") {
    const strValue = firstValue as string;

    // HTML/Rich text pattern - check early to catch HTML content
    if (/<\/?[a-z][\s\S]*>/i.test(strValue)) {
      // Verify it's actual HTML by checking for common HTML tags
      if (
        /<(p|div|span|h[1-6]|ul|ol|li|a|br|strong|em|b|i|img|table|tr|td|th)[\s>]/i.test(
          strValue
        )
      ) {
        return "rich-text";
      }
    }

    // Email pattern
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strValue)) return "email";

    // Phone pattern
    if (/^[\+]?[\s\-\(\)]?[\d\s\-\(\)]{7,}$/.test(strValue?.replace(/\s/g, "")))
      return "phone";

    // URL pattern
    if (/^https?:\/\//.test(strValue) || strValue.startsWith("www."))
      return "link";

    // Color pattern (hex, rgb, hsl)
    if (
      /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(strValue) ||
      /^rgb\(/.test(strValue) ||
      /^hsl\(/.test(strValue)
    )
      return "color";

    // Date patterns
    if (!isNaN(Date.parse(strValue))) {
      const date = new Date(strValue);
      // Check if it includes time
      if (strValue.includes(":") && strValue.includes(" ")) return "datetime";
      if (strValue.includes("T") || strValue.includes("Z")) return "datetime";
      if (/^\d{2}:\d{2}/.test(strValue)) return "time";
      return "date";
    }

    // JSON pattern
    if (
      (strValue.startsWith("{") && strValue.endsWith("}")) ||
      (strValue.startsWith("[") && strValue.endsWith("]"))
    ) {
      try {
        JSON.parse(strValue);
        return "json";
      } catch {
        // Not valid JSON
      }
    }

    // Tags pattern (comma-separated values)
    // if (strValue.includes(",") && strValue.split(",").length > 1) return "tags";

    // Code pattern (contains typical code characters)
    if (/[{}();]/.test(strValue) && strValue.length > 10) return "code";

    // Image URL pattern
    if (/\.(jpg|jpeg|png|gif|svg|webp)$/i.test(strValue)) return "image";

    // File pattern
    if (/\.\w{2,4}$/.test(strValue)) return "file";
  }

  return "text";
}

export function generateTableColumns(
  data: Record<string, unknown>[]
): DataTableColumn[] {
  if (!data || data.length === 0) {
    return [];
  }

  const firstRow = data[0];
  const sampleSize = Math.min(data.length, 10); // Sample first 10 rows for type detection

  return Object.keys(firstRow).map((key) => {
    // Get sample values for this column
    const sampleValues = data.slice(0, sampleSize).map((row) => row[key]);

    // Detect the appropriate cell type
    const type = detectCellType(key, sampleValues);

    return {
      key,
      header: key?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      type,
      sortable: true,
      filterable: !["image", "avatar", "json", "code"].includes(type),
      minWidth:
        type === "boolean"
          ? 80
          : type === "avatar" || type === "image"
          ? 60
          : 100,
    };
  });
}
