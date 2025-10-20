/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Plus, Trash2, Loader2, Leaf } from "lucide-react";
import { toast } from "sonner";
import { useFarmerData } from "@/hooks/farmers/useFarmerData";

interface CreateProduceRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farmer: any;
}

interface ProduceItem {
  product_name: string;
  quantity: number;
  unit_measure: string;
  unit_price: number;
}

export function CreateProduceRequestDialog({
  open,
  onOpenChange,
  farmer,
}: CreateProduceRequestDialogProps) {
  const { productTypes, useAggregators, createRequest, isCreatingRequest } =
    useFarmerData(farmer.user_id);

  const { data: aggregators } = useAggregators();

  const [selectedAggregator, setSelectedAggregator] = useState<string>("");
  const [produces, setProduces] = useState<ProduceItem[]>([
    {
      product_name: "",
      quantity: 0,
      unit_measure: "",
      unit_price: 0,
    },
  ]);

  const addProduceItem = () => {
    setProduces([
      ...produces,
      {
        product_name: "",
        quantity: 0,
        unit_measure: "",
        unit_price: 0,
      },
    ]);
  };

  const removeProduceItem = (index: number) => {
    setProduces(produces.filter((_, i) => i !== index));
  };

  const updateProduceItem = (
    index: number,
    field: keyof ProduceItem,
    value: any
  ) => {
    if (index < 0 || index >= produces.length) {
      console.error(`Invalid index: ${index}`);
      return;
    }

    setProduces((prevProduces) => {
      const updated = [...prevProduces];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleProductChange = (index: number, productName: string) => {
    const product = productTypes?.find(
      (p: any) => p.product_name === productName
    );

    if (product) {
      // Update both fields at once instead of calling updateProduceItem twice
      const updated = [...produces];
      updated[index] = {
        ...updated[index],
        product_name: productName,
        unit_measure: product.default_unit_measure,
      };
      setProduces(updated);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAggregator) {
      toast.error("Missing information", {
        description: "Please select an aggregator",
      });
      return;
    }

    console.log(produces);

    const validProduces = produces.filter(
      (p) =>
        p.product_name && p.quantity > 0 && p.unit_price > 0 && p.unit_measure
    );

    if (validProduces.length === 0) {
      toast.error("No produce items", {
        description:
          "Please add at least one complete produce item with all fields filled",
      });
      return;
    }

    createRequest(
      {
        aggregatorId: parseInt(selectedAggregator),
        produces: validProduces,
      },
      {
        onSuccess: () => {
          toast.success("Request submitted", {
            description: "Your produce request has been submitted successfully",
          });
          onOpenChange(false);
          // Reset form
          setSelectedAggregator("");
          setProduces([
            {
              product_name: "",
              quantity: 0,
              unit_measure: "",
              unit_price: 0,
            },
          ]);
        },
        onError: () => {
          toast.error("Submission failed", {
            description: "Failed to submit request. Please try again.",
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-col items-center text-center mb-2">
            <div className="w-14 h-14 bg-secondary text-primary rounded-2xl flex items-center justify-center mb-3">
              <Leaf />
            </div>
            <DialogTitle className="text-xl">
              Create Produce Request
            </DialogTitle>
            <DialogDescription className="text-sm mt-1">
              Submit your produce to the nearest aggregator in your area
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Select Aggregator */}
          <div className="space-y-2">
            <Label htmlFor="aggregator">Select Aggregator *</Label>
            <Select
              value={selectedAggregator}
              onValueChange={setSelectedAggregator}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose an aggregator" />
              </SelectTrigger>
              <SelectContent>
                {aggregators?.map((agg: any) => (
                  <SelectItem key={agg.id} value={agg.id.toString()}>
                    {agg.business_name} - {agg.local_gov_area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(!aggregators || aggregators.length === 0) && (
              <p className="text-sm text-muted-foreground">
                No aggregators found in your area. Please contact support.
              </p>
            )}
          </div>

          {/* Produce Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Produce Items *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addProduceItem}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>

            {produces.map((produce, index) => (
              <div
                key={index}
                className="grid gap-4 p-4 border rounded-lg bg-muted/30"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Item {index + 1}</h4>
                  {produces.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProduceItem(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* Product Type */}
                  <div className="space-y-2">
                    <Label>Product Type</Label>
                    <Select
                      value={produce.product_name || undefined}
                      onValueChange={(value) => {
                        handleProductChange(index, value);
                      }}
                    >
                      <SelectTrigger className="w-full  !h-11 ">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {productTypes?.map((product: any) => (
                          <SelectItem
                            key={product.id}
                            value={product.product_name}
                          >
                            {product.product_name} ({product.category})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quantity */}
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      value={produce.quantity === 0 ? "" : produce.quantity}
                      onChange={(e) => {
                        const value =
                          e.target.value === ""
                            ? 0
                            : parseFloat(e.target.value);
                        updateProduceItem(
                          index,
                          "quantity",
                          isNaN(value) ? 0 : value
                        );
                      }}
                    />
                  </div>

                  {/* Unit Measure */}
                  <div className="space-y-2">
                    <Label>Unit of Measure</Label>
                    <Select
                      value={produce.unit_measure || undefined}
                      onValueChange={(value) =>
                        updateProduceItem(index, "unit_measure", value)
                      }
                    >
                      <SelectTrigger className="w-full !h-11">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">Kilogram (kg)</SelectItem>
                        <SelectItem value="tons">Tons</SelectItem>
                        <SelectItem value="bags">Bags</SelectItem>
                        <SelectItem value="crates">Crates</SelectItem>
                        <SelectItem value="baskets">Baskets</SelectItem>
                        <SelectItem value="pieces">Pieces</SelectItem>
                        <SelectItem value="liters">Liters (L)</SelectItem>
                        <SelectItem value="bundles">Bundles</SelectItem>
                        <SelectItem value="sacks">Sacks</SelectItem>
                        <SelectItem value="cartons">Cartons</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Unit Price */}
                  <div className="space-y-2">
                    <Label>Unit Price (₦)</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={produce.unit_price === 0 ? "" : produce.unit_price}
                      onChange={(e) => {
                        const value =
                          e.target.value === ""
                            ? 0
                            : parseFloat(e.target.value);
                        updateProduceItem(
                          index,
                          "unit_price",
                          isNaN(value) ? 0 : value
                        );
                      }}
                    />
                  </div>
                </div>

                {/* Total */}
                {produce.quantity > 0 && produce.unit_price > 0 && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Total:{" "}
                      <span className="font-semibold text-foreground">
                        ₦
                        {(
                          produce.quantity * produce.unit_price
                        ).toLocaleString()}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Grand Total */}
          {produces.some((p) => p.quantity > 0 && p.unit_price > 0) && (
            <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg">
              <p className="font-semibold">Grand Total:</p>
              <p className="text-2xl font-bold text-primary">
                ₦
                {produces
                  .reduce(
                    (sum, p) => sum + (p.quantity || 0) * (p.unit_price || 0),
                    0
                  )
                  .toLocaleString()}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={isCreatingRequest}
              onClick={handleSubmit}
            >
              {isCreatingRequest ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
