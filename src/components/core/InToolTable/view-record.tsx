/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PenBox, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ViewRecordProps {
  isOpen: boolean;
  onClose: () => void;
  row: Record<string, any> | null;
  onEdit?: (row: Record<string, any>) => void;
  title?: string;
  excludedFields?: string[];
}

function ViewRecord({
  isOpen,
  onClose,
  row,
  onEdit,
  title = "View Record",
  excludedFields = [],
}: ViewRecordProps) {
  if (!row) return null;

  // Filter out excluded fields and format data
  const displayFields = Object.entries(row).filter(
    ([key]) => !excludedFields.includes(key)
  );

  // Format field name for display (convert snake_case to Title Case)
  const formatFieldName = (fieldName: string): string => {
    return fieldName
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Check if string contains HTML tags
  const isHTML = (str: string): boolean => {
    const htmlPattern = /<\/?[a-z][\s\S]*>/i;
    return htmlPattern.test(str);
  };

  // Sanitize HTML to prevent XSS attacks (basic sanitization)
  const sanitizeHTML = (html: string): string => {
    // Remove script tags and their content
    let sanitized = html.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      ""
    );
    // Remove event handlers
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
    sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, "");
    return sanitized;
  };

  // Format field value for display
  const formatFieldValue = (value: any): string => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    if (value instanceof Date) return value.toLocaleString();
    return String(value);
  };

  // Check if value should be rendered as HTML
  const shouldRenderAsHTML = (value: any): boolean => {
    return typeof value === "string" && isHTML(value);
  };

  const handleEdit = () => {
    if (onEdit && row) {
      onEdit(row);
      onClose();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl p-5 overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>{title}</SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <SheetDescription>
            View detailed information about this record
          </SheetDescription>
        </SheetHeader>

        <Separator className="my-4" />

        <div className="space-y-6 py-4">
          {displayFields.map(([key, value]) => (
            <div key={key} className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {formatFieldName(key)}
              </label>
              <div className="text-sm bg-muted/50 border rounded-md p-3 break-words">
                {typeof value === "object" && value !== null ? (
                  <pre className="text-xs overflow-x-auto">
                    {formatFieldValue(value)}
                  </pre>
                ) : shouldRenderAsHTML(value) ? (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHTML(value),
                    }}
                  />
                ) : (
                  <p>{formatFieldValue(value)}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex sticky -bottom-5 bg-background border-t justify-end gap-2 py-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {onEdit && (
            <Button onClick={handleEdit} className="gap-2">
              <PenBox className="h-4 w-4" />
              Edit Record
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default React.memo(ViewRecord);
