
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import BatchItemsList from "./BatchItemsList";
import { useState } from "react";

export interface BatchItem {
  item_id: string;
  item_type: "raw_material" | "finished_product" | "packaging";
  quantity: number;
}

interface BatchFormProps {
  selectedBatch: any;
  batchItems: BatchItem[];
  finishedProducts: any[];
  rawMaterials: any[];
  packagingItems: any[];
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
  rawMaterials,
  packagingItems,
  onSubmit,
  onClose,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
}: BatchFormProps) => {
  const [selectedType, setSelectedType] = useState<"finished_product" | "raw_material" | "packaging">("finished_product");
  
  // Helper function to get item name by ID and type
  const getItemNameById = (id: string, type: string) => {
    if (type === "finished_product") {
      const product = finishedProducts.find(p => p.id === id);
      return product ? product.name : "Unknown product";
    } else if (type === "raw_material") {
      const material = rawMaterials.find(m => m.id === id);
      return material ? material.name : "Unknown material";
    } else if (type === "packaging") {
      const packaging = packagingItems.find(p => p.id === id);
      return packaging ? `${packaging.name} (${packaging.type})` : "Unknown packaging";
    }
    return "Unknown item";
  };
  
  return (
    <form onSubmit={onSubmit}>
      <div className="space-y-4">
        <BatchItemsList
          items={batchItems}
          finishedProducts={finishedProducts}
          rawMaterials={rawMaterials}
          packagingItems={packagingItems}
          onAddItem={onAddItem}
          onRemoveItem={onRemoveItem}
          onUpdateItem={onUpdateItem}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          getItemNameById={getItemNameById}
        />

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
            defaultValue={selectedBatch?.notes}
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
