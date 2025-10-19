/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import FormBuilder, { FormType } from "../FormBuilder";
import { DataTableColumn, CellType } from "./types/table.types";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { z } from "zod";

type ColumnOverride = {
  column_name: string;
  input_type?: FormType[0]["input_type"];
  cell_type?: CellType;
  options?: Array<{ label: string; value: string | number }>;
};

type CreateEditParams<TData = any> = {
  row?: TData;
  columns: DataTableColumn[];
  required_columns: string[];
  onSubmit: (data: any) => void;
  onClose: () => void;
  title?: string;
  isOpen: boolean;
  overrides?: ColumnOverride[];
  isSubmitting?: boolean;
};

// Map cell types to zod schema types with overrides support
const column_type_to_schema = (
  columns: DataTableColumn[],
  requiredColumns: string[],
  overrides?: ColumnOverride[]
) => {
  const schemaObject: Record<string, z.ZodTypeAny> = {};

  columns.forEach((column) => {
    const isRequired = requiredColumns.includes(column.key);
    const override = overrides?.find((o) => o.column_name === column.key);

    // Use override cell_type if available, otherwise use column type
    const cellType = override?.cell_type || column.type;

    let fieldSchema: z.ZodTypeAny;

    // Handle select options (should be string to match option values)
    if (override?.options) {
      fieldSchema = z.string();
    } else {
      switch (cellType) {
        case "text":
        case "email":
        case "phone":
        case "link":
        case "code":
        case "custom":
          fieldSchema = z.string();
          break;
        case "number":
        case "currency":
        case "percentage":
        case "rating":
          fieldSchema = z.coerce.number();
          break;
        case "boolean":
          fieldSchema = z.boolean();
          break;
        case "date":
        case "datetime":
        case "time":
          fieldSchema = z.string(); // Will be converted to date in form
          break;
        case "tags":
          fieldSchema = z.array(z.string());
          break;
        case "json":
          fieldSchema = z.any();
          break;
        case "color":
          fieldSchema = z
            .string()
            .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format");
          break;
        default:
          fieldSchema = z.string();
      }
    }

    // Make field optional if not required
    if (!isRequired) {
      fieldSchema = fieldSchema.optional();
    }

    schemaObject[column.key] = fieldSchema;
  });

  return z.object(schemaObject);
};

// Map cell types to form input types with overrides support
const cellTypeToInputType = (
  cellType: CellType,
  override?: ColumnOverride
): FormType[0]["input_type"] => {
  // Use override input_type if specified
  if (override?.input_type) {
    return override.input_type;
  }

  // If options are provided, use select
  if (override?.options) {
    return "select";
  }

  switch (cellType) {
    case "text":
    case "link":
    case "phone":
    case "color":
      return "text";
    case "email":
      return "email";
    case "number":
    case "currency":
    case "percentage":
    case "rating":
      return "number";
    case "boolean":
      return "checkbox";
    case "date":
    case "datetime":
    case "time":
      return "date";
    case "tags":
      return "combobox";
    case "json":
    case "code":
      return "textarea";
    default:
      return "text";
  }
};

// Generate form configuration from columns with overrides support
const generateFormConfig = (
  columns: DataTableColumn[],
  overrides?: ColumnOverride[]
): FormType => {
  return columns.map((column) => {
    const overide = overrides?.find((o) => o.column_name === column.key);
    const cellType = overide?.cell_type || column.type || "text";

    const formField: FormType[0] = {
      label: column.header,
      name: column.key,
      input_type: cellTypeToInputType(cellType, overide),
      placeholder: `Enter ${column.header.toLowerCase()}...`,
      defaultValue: getDefaultValue(cellType, overide),
      options: overide?.options,
    };

    return formField;
  });
};

// Get default values based on column type and overrides
const getDefaultValue = (
  cellType?: CellType,
  override?: ColumnOverride
): any => {
  // If options are provided, default to first option value or empty string
  if (override?.options) {
    return override.options[0]?.value || "";
  }

  switch (cellType) {
    case "boolean":
      return false;
    case "number":
    case "currency":
    case "percentage":
    case "rating":
      return 0;
    case "tags":
      return [];
    case "date":
    case "datetime":
    case "time":
      return "";
    default:
      return "";
  }
};

function CreateEditRecord<TData = any>({
  row,
  columns,
  required_columns,
  onSubmit,
  onClose,
  title,
  isOpen,
  overrides,
  isSubmitting,
}: CreateEditParams<TData>) {
  // Handle dialog close
  const handleClose = () => {
    onClose();
  };

  // Generate schema and form config with overrides
  const formSchema = column_type_to_schema(
    columns,
    required_columns,
    overrides
  );
  const formConfig = generateFormConfig(columns, overrides);

  // Prepare default values from row data, overrides, or column defaults
  const defaultValues = React.useMemo(() => {
    const values: Record<string, any> = {};
    columns.forEach((column) => {
      const override = overrides?.find((o) => o.column_name === column.key);
      const cellType = override?.cell_type || column.type;

      if (
        row &&
        column.key in (row as any) &&
        (row as any)[column.key] !== undefined &&
        (row as any)[column.key] !== null
      ) {
        // Use existing row data only if it's not undefined or null
        values[column.key] = (row as any)[column.key];
      } else {
        // Use default value from override or column type
        values[column.key] = getDefaultValue(cellType, override);
      }
    });
    return values;
  }, [row, columns, overrides]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  });

  // Reset form when row data or defaultValues change
  React.useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const handleSubmitForm = (data: any) => {
    onSubmit(data);
    handleClose(); // Use handleClose to notify parent
  };

  // Always use internal state for dialog control
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="!max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {title || (row ? "Edit Record" : "Create New Record")}
          </DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmitForm)}
            className="space-y-6"
          >
            <FormBuilder formConfig={formConfig} />

            <div className="flex sticky -bottom-6 bg-background border-t justify-end gap-2 py-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit">
                {isSubmitting && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                )}{" "}
                {row ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default React.memo(CreateEditRecord);
