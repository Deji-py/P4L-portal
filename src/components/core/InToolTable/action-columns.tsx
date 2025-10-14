/* eslint-disable @typescript-eslint/no-explicit-any */
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { DataTableAction } from "./types/table.types";

export function createActionsColumn<TData>(
  actions: DataTableAction<TData>[]
): ColumnDef<TData> {
  return {
    id: "actions",
    header: () => <span className="font-bold">Actions</span>,
    cell: ({ row }) => {
      const rowData = row.original as any;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="font-bold">Actions</DropdownMenuLabel>
            {actions.map((action, index) => {
              const isDisabled = action.disabled?.(rowData);
              const isHidden = action.hidden?.(rowData);

              if (isHidden) {
                return null;
              }

              return (
                <DropdownMenuItem
                  key={index}
                  variant={action.variant}
                  onClick={() => !isDisabled && action.onClick(rowData)}
                  disabled={isDisabled}
                >
                  {action.icon}
                  <span className="ml-2">{action.label}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  };
}
