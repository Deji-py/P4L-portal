/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface ProductType {
  id: number;
  product_name: string;
  category: string;
  default_unit_measure: string;
}

interface AddInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bulkTraderId: number;
  productTypes: ProductType[];
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
  editData?: any;
}

const AddInventoryDialog = ({
  open,
  onOpenChange,
  bulkTraderId,
  productTypes,
  onSubmit,
  isSubmitting,
  editData,
}: AddInventoryDialogProps) => {
  const [formData, setFormData] = useState({
    product_type_id: "",
    quantity: "",
    unit_measure: "",
    unit_price: "",
    purchase_date: "",
    expiry_date: "",
    source_location: "",
    local_gov_area: "",
    state: "",
    storage_location: "",
    quality_grade: "",
    notes: "",
  });

  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(
    null
  );

  useEffect(() => {
    if (editData) {
      setFormData({
        product_type_id: editData.product_type_id?.toString() || "",
        quantity: editData.quantity?.toString() || "",
        unit_measure: editData.unit_measure || "",
        unit_price: editData.unit_price?.toString() || "",
        purchase_date: editData.purchase_date || "",
        expiry_date: editData.expiry_date || "",
        source_location: editData.source_location || "",
        local_gov_area: editData.local_gov_area || "",
        state: editData.state || "",
        storage_location: editData.storage_location || "",
        quality_grade: editData.quality_grade || "",
        notes: editData.notes || "",
      });
    } else {
      setFormData({
        product_type_id: "",
        quantity: "",
        unit_measure: "",
        unit_price: "",
        purchase_date: "",
        expiry_date: "",
        source_location: "",
        local_gov_area: "",
        state: "",
        storage_location: "",
        quality_grade: "",
        notes: "",
      });
    }
  }, [editData, open]);

  const handleProductChange = (value: string) => {
    const product = productTypes.find((p) => p.id.toString() === value);
    setSelectedProduct(product || null);
    setFormData({
      ...formData,
      product_type_id: value,
      unit_measure: product?.default_unit_measure || "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      bulk_trader_id: bulkTraderId,
      product_type_id: parseInt(formData.product_type_id),
      quantity: parseFloat(formData.quantity),
      unit_measure: formData.unit_measure,
      unit_price: formData.unit_price
        ? parseFloat(formData.unit_price)
        : undefined,
      purchase_date: formData.purchase_date || undefined,
      expiry_date: formData.expiry_date || undefined,
      source_location: formData.source_location || undefined,
      local_gov_area: formData.local_gov_area || undefined,
      state: formData.state || undefined,
      storage_location: formData.storage_location || undefined,
      quality_grade: formData.quality_grade || undefined,
      notes: formData.notes || undefined,
    };

    await onSubmit(submitData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editData ? "Edit Inventory Item" : "Add New Inventory Item"}
          </DialogTitle>
          <DialogDescription>
            {editData
              ? "Update the inventory item details below"
              : "Fill in the details to add a new item to your inventory"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product_type_id">
                Product <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.product_type_id}
                onValueChange={handleProductChange}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {productTypes.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.product_name} ({product.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quality_grade">Quality Grade</Label>
              <Select
                value={formData.quality_grade}
                onValueChange={(value) =>
                  setFormData({ ...formData, quality_grade: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Grade A (Premium)</SelectItem>
                  <SelectItem value="B">Grade B (Standard)</SelectItem>
                  <SelectItem value="C">Grade C (Basic)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quantity and Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantity <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                placeholder="Enter quantity"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_measure">
                Unit Measure <span className="text-red-500">*</span>
              </Label>
              <Input
                id="unit_measure"
                placeholder="kg, ton, bag, etc."
                value={formData.unit_measure}
                onChange={(e) =>
                  setFormData({ ...formData, unit_measure: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-2">
            <Label htmlFor="unit_price">Unit Price (₦)</Label>
            <Input
              id="unit_price"
              type="number"
              step="0.01"
              placeholder="Enter price per unit"
              value={formData.unit_price}
              onChange={(e) =>
                setFormData({ ...formData, unit_price: e.target.value })
              }
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchase_date">Purchase Date</Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) =>
                  setFormData({ ...formData, purchase_date: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry_date">Expiry Date</Label>
              <Input
                id="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) =>
                  setFormData({ ...formData, expiry_date: e.target.value })
                }
              />
            </div>
          </div>

          {/* Locations */}
          <div className="space-y-2">
            <Label htmlFor="source_location">Source Location</Label>
            <Input
              id="source_location"
              placeholder="Where was this sourced from?"
              value={formData.source_location}
              onChange={(e) =>
                setFormData({ ...formData, source_location: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="local_gov_area">Local Government Area</Label>
              <Input
                id="local_gov_area"
                placeholder="LGA"
                value={formData.local_gov_area}
                onChange={(e) =>
                  setFormData({ ...formData, local_gov_area: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                placeholder="State"
                value={formData.state}
                onChange={(e) =>
                  setFormData({ ...formData, state: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="storage_location">Storage Location</Label>
            <Input
              id="storage_location"
              placeholder="Warehouse or facility location"
              value={formData.storage_location}
              onChange={(e) =>
                setFormData({ ...formData, storage_location: e.target.value })
              }
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editData ? "Updating..." : "Adding..."}
                </>
              ) : editData ? (
                "Update Item"
              ) : (
                "Add Item"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddInventoryDialog;
