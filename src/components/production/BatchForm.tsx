
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import BatchItemsList from "./BatchItemsList";

interface BatchItem {
  product_id: string;
  quantity: number;
}

interface BatchFormProps {
  selectedBatch: any;
  batchItems: BatchItem[];
  products: any[];
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, field: keyof BatchItem, value: any) => void;
}

const BatchForm = ({
  selectedBatch,
  batchItems,
  products,
  onSubmit,
  onClose,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
}: BatchFormProps) => {
  return (
    <form onSubmit={onSubmit}>
      <div className="space-y-4">
        <BatchItemsList
          items={batchItems}
          products={products}
          onAddItem={onAddItem}
          onRemoveItem={onRemoveItem}
          onUpdateItem={onUpdateItem}
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
