
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { Plus, X } from "lucide-react";
import { useState } from "react";

export interface BatchItem {
  item_id: string;
  item_type: "finished_product";
  quantity: number;
}

interface BatchFormProps {
  selectedBatch: any;
  batchItems: BatchItem[];
  finishedProducts: any[];
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, field: keyof BatchItem, value: any) => void;
}

const BatchForm = ({
  selectedBatch,
  batchItems,
  finishedProducts,
  onSubmit,
  onClose,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
}: BatchFormProps) => {
  // Helper function to get finished product name by ID
  const getProductNameById = (id: string) => {
    const product = finishedProducts?.find(p => p.id === id);
    return product ? product.name : "Unknown product";
  };
  
  return (
    <form onSubmit={onSubmit} className="max-h-[80vh] overflow-y-auto">
      <div className="space-y-4">
        <div>
          <Label htmlFor="batch_id">Batch ID</Label>
          <Input
            id="batch_id"
            name="batch_id"
            defaultValue={selectedBatch?.batch_number || ""}
            placeholder="Enter a custom batch ID"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Batch Items</Label>
          {batchItems.map((item, index) => (
            <div key={index} className="flex gap-2 items-end border p-4 rounded-md">
              <div className="flex-1">
                <Label htmlFor={`product_${index}`}>Finished Product</Label>
                <Select 
                  value={item.item_id || ""}
                  onValueChange={(value) => onUpdateItem(index, 'item_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {finishedProducts?.map((product: any) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-32">
                <Label htmlFor={`quantity_${index}`}>Quantity</Label>
                <Input
                  id={`quantity_${index}`}
                  type="number"
                  value={item.quantity}
                  onChange={(e) => onUpdateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                  min="1"
                  required
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mb-0.5"
                onClick={() => onRemoveItem(index)}
                disabled={batchItems.length <= 1}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={onAddItem}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select 
            name="status" 
            defaultValue={selectedBatch?.status || "in_progress"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Input
            id="notes"
            name="notes"
            defaultValue={selectedBatch?.notes || ""}
          />
        </div>
      </div>

      <DialogFooter className="mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button type="submit">
          {selectedBatch ? "Update" : "Create"}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default BatchForm;
