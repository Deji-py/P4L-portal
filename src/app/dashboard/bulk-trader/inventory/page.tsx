/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useMemo } from "react";
import {
  Package,
  Plus,
  Search,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Box,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useProfile from "@/hooks/useProfile";
import { toast } from "sonner";
import AddInventoryDialog from "@/features/Bulk-Foods/inventory/add-inventory-dialog";
import Image from "next/image";
import { useInventory } from "@/hooks/bulk-traders/useInventory";

function InventoryPage() {
  const { profile } = useProfile("bulk_traders");
  const bulkTraderId = profile?.id;

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(
    new Set()
  );
  const itemsPerPage = 15;

  const {
    inventory,
    totalCount,
    stats,
    productTypes,
    inventoryLoading,
    statsLoading,
    addInventory,
    updateInventory,
    deleteInventory,
    isAdding,
    isUpdating,
    isDeleting,
  } = useInventory(
    bulkTraderId,
    statusFilter,
    searchQuery,
    currentPage,
    itemsPerPage
  );

  // Group inventory by batch_id
  const groupedInventory = useMemo(() => {
    const groups = new Map<string, any[]>();

    inventory.forEach((item) => {
      const batchId = item.batch_id;
      if (!groups.has(batchId)) {
        groups.set(batchId, []);
      }
      groups.get(batchId)!.push(item);
    });

    // Convert to array and calculate aggregates
    return Array.from(groups.entries()).map(([batchId, items]) => {
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      const totalValue = items.reduce(
        (sum, item) => sum + (item.total_value || 0),
        0
      );
      const avgUnitPrice = totalValue / totalQuantity;

      // Determine overall status (priority: out_of_stock > low_stock > reserved > in_stock)
      const statusPriority: Record<string, number> = {
        out_of_stock: 4,
        expired: 3,
        low_stock: 2,
        reserved: 1,
        in_stock: 0,
      };
      const overallStatus = items.reduce((highest, item) => {
        const currentPriority = statusPriority[item.status] || 0;
        const highestPriority = statusPriority[highest] || 0;
        return currentPriority > highestPriority ? item.status : highest;
      }, items[0].status);

      // Get unique products
      const uniqueProducts = new Set(
        items.map((i) => i.product_types?.product_name)
      ).size;

      return {
        batchId,
        items,
        count: items.length,
        totalQuantity,
        totalValue,
        avgUnitPrice,
        overallStatus,
        uniqueProducts,
        unitMeasure: items[0].unit_measure,
        product: items[0].product_types,
      };
    });
  }, [inventory]);

  const toggleBatch = (batchId: string) => {
    setExpandedBatches((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(batchId)) {
        newSet.delete(batchId);
      } else {
        newSet.add(batchId);
      }
      return newSet;
    });
  };

  const handleAddInventory = async (data: any) => {
    try {
      await addInventory(data);
      toast.success("Inventory item added successfully");
      setAddDialogOpen(false);
    } catch (error) {
      toast.error("Failed to add inventory item");
    }
  };

  const handleEditInventory = async (data: any) => {
    try {
      await updateInventory({ id: editData.id, updates: data });
      toast.success("Inventory item updated successfully");
      setEditData(null);
      setAddDialogOpen(false);
    } catch (error) {
      toast.error("Failed to update inventory item");
    }
  };

  const openEditDialog = (item: any) => {
    setEditData(item);
    setAddDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this inventory item?")) {
      try {
        await deleteInventory(id);
        toast.success("Inventory item deleted successfully");
      } catch (error) {
        toast.error("Failed to delete inventory item");
      }
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "in_stock":
        return { label: "In Stock", color: "bg-green-100 text-green-700" };
      case "low_stock":
        return { label: "Low Stock", color: "bg-yellow-100 text-yellow-700" };
      case "out_of_stock":
        return { label: "Out of Stock", color: "bg-red-100 text-red-700" };
      case "reserved":
        return { label: "Reserved", color: "bg-blue-100 text-blue-700" };
      case "expired":
        return { label: "Expired", color: "bg-gray-100 text-gray-700" };
      default:
        return { label: status, color: "bg-gray-100 text-gray-700" };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Inventory Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Track and manage your product inventory (Grouped by Batch)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            size="sm"
            className="bg-orange-600 hover:bg-orange-700"
            onClick={() => {
              setEditData(null);
              setAddDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Inventory
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Value */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2 text-xs">
                <DollarSign className="w-4 h-4 text-blue-500" />
                Total Value
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.total_value)}
              </div>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                +12.5% from last month
              </p>
            </CardContent>
          </Card>

          {/* Total Items */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2 text-xs">
                <Box className="w-4 h-4 text-green-500" />
                Total Items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.total_items}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {groupedInventory.length} unique batches
              </p>
            </CardContent>
          </Card>

          {/* In Stock */}
          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2 text-xs">
                <Package className="w-4 h-4 text-emerald-500" />
                In Stock
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.in_stock}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.low_stock} low stock items
              </p>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 text-red-500" />
                Alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.out_of_stock + stats.low_stock}
              </div>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-red-600" />
                {stats.out_of_stock} out of stock
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4 py-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by batch ID, location..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 h-10"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              {[
                { value: "all", label: "All" },
                { value: "in_stock", label: "In Stock" },
                { value: "low_stock", label: "Low Stock" },
                { value: "out_of_stock", label: "Out of Stock" },
                { value: "reserved", label: "Reserved" },
              ].map((filter) => (
                <Button
                  key={filter.value}
                  variant={
                    statusFilter === filter.value ? "default" : "outline"
                  }
                  onClick={() => {
                    setStatusFilter(filter.value);
                    setCurrentPage(1);
                  }}
                  className="whitespace-nowrap"
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table - Grouped by Batch */}
      <Card className="p-4 bg-muted/60 pt-0">
        <CardHeader>
          <CardTitle className="text-lg sr-only">
            Inventory Items (Grouped)
          </CardTitle>
          <CardDescription className="sr-only">
            Showing {groupedInventory.length} batches
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {inventoryLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600"></div>
            </div>
          ) : groupedInventory.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">
                No inventory items found
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Add your first inventory item to get started"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto bg-white border rounded-xl">
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Batch ID</TableHead>
                        <TableHead>Product(s)</TableHead>
                        <TableHead>Total Qty</TableHead>
                        <TableHead>Avg Price</TableHead>
                        <TableHead>Total Value</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>
                          <div className="flex  items-center justify-end gap-1">
                            Actions
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedInventory.map((batch) => {
                        const isExpanded = expandedBatches.has(batch.batchId);
                        const statusConfig = getStatusConfig(
                          batch.overallStatus
                        );

                        return (
                          <React.Fragment key={batch.batchId}>
                            {/* Batch Row */}
                            <TableRow
                              key={batch.batchId}
                              className="bg-gray-50/50 hover:bg-gray-100/50 cursor-pointer font-medium"
                              onClick={() => toggleBatch(batch.batchId)}
                            >
                              <TableCell>
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </TableCell>
                              <TableCell className="font-mono text-xs font-bold">
                                {batch.batchId}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                                    {batch.product?.image_url ? (
                                      <Image
                                        src={batch.product.image_url}
                                        alt={batch.product.product_name}
                                        width={40}
                                        height={40}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <Package className="w-4 h-4 text-gray-600" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">
                                      {batch.product?.product_name}
                                    </p>
                                    {batch.uniqueProducts > 1 && (
                                      <p className="text-xs text-gray-500">
                                        +{batch.uniqueProducts - 1} more
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="font-semibold">
                                  {batch.totalQuantity.toLocaleString()}
                                </span>{" "}
                                <span className="text-gray-500 text-sm">
                                  {batch.unitMeasure}
                                </span>
                              </TableCell>
                              <TableCell>
                                {formatCurrency(batch.avgUnitPrice)}
                              </TableCell>
                              <TableCell className="font-bold text-green-700">
                                {formatCurrency(batch.totalValue)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {batch.count} items
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={`${statusConfig.color} border-0 text-xs`}
                                >
                                  {statusConfig.label}
                                </Badge>
                              </TableCell>

                              <TableCell>
                                <Badge variant="secondary" className="text-xs">
                                  {batch.count} items
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex  items-center justify-end gap-1">
                                  <Badge variant="outline" className="text-xs">
                                    Expand <ChevronDown />
                                  </Badge>
                                </div>
                              </TableCell>
                            </TableRow>

                            {/* Expanded Detail Rows */}
                            {isExpanded &&
                              batch.items.map((item, index) => {
                                const itemStatusConfig = getStatusConfig(
                                  item.status
                                );
                                return (
                                  <TableRow
                                    key={item.id}
                                    className="bg-white border-l border-l-gray-700"
                                  >
                                    <TableCell></TableCell>
                                    <TableCell className="text-xs text-gray-500 pl-8">
                                      └─ Item #{item.id}
                                    </TableCell>
                                    <TableCell>
                                      <div className="text-sm gap-2 flex items-center">
                                        <div className="w-8 h-8 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                                          {item.product_types?.image_url ? (
                                            <Image
                                              src={item.product_types.image_url}
                                              alt={
                                                item.product_types
                                                  .product_name || ""
                                              }
                                              width={40}
                                              height={40}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <Package className="w-4 h-4 text-gray-600" />
                                          )}
                                        </div>
                                        <div>
                                          <p className="font-medium">
                                            {item.product_types?.product_name}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            {item.product_types?.category}
                                          </p>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <span className="font-medium">
                                        {item.quantity.toLocaleString()}
                                      </span>{" "}
                                      <span className="text-gray-500 text-sm">
                                        {item.unit_measure}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      {item.unit_price
                                        ? formatCurrency(item.unit_price)
                                        : "-"}
                                    </TableCell>
                                    <TableCell className="font-semibold">
                                      {item.total_value
                                        ? formatCurrency(item.total_value)
                                        : "-"}
                                    </TableCell>

                                    <TableCell>
                                      <div className="space-y-1">
                                        <div className="text-xs flex items-center text-gray-500">
                                          <p>{item.local_gov_area || "-"}</p>
                                          <span className="px-1"> - </span>
                                          <p>{item.state}</p>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="outline"
                                        className={`${itemStatusConfig.color} border-0 text-xs`}
                                      >
                                        {itemStatusConfig.label}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {item.quality_grade || "N/A"}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex  items-center justify-end gap-1">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 w-8 p-0"
                                        >
                                          <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 w-8 p-0"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openEditDialog(item);
                                          }}
                                        >
                                          <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(item.id);
                                          }}
                                          disabled={isDeleting}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                          </React.Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <p className="text-sm text-gray-600">
                    Showing {groupedInventory.length} batches with{" "}
                    {inventory.length} total items
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600 px-2">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Inventory Dialog */}
      <AddInventoryDialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) setEditData(null);
        }}
        bulkTraderId={bulkTraderId}
        productTypes={productTypes}
        onSubmit={editData ? handleEditInventory : handleAddInventory}
        isSubmitting={isAdding || isUpdating}
        editData={editData}
      />
    </div>
  );
}

export default InventoryPage;
