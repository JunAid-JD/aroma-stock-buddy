
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";

interface BatchItem {
  product_id: string;
  quantity: number;
}

interface BatchItemsListProps {
  items: BatchItem[];
  products: any[];
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, field: keyof BatchItem, value: any) => void;
}

const BatchItemsList = ({ items, products, onAddItem, onRemoveItem, onUpdateItem }: BatchItemsListProps) => {
  return (
    <div className="space-y-4">
      <Label>Batch Items</Label>
      {items.map((item, index) => (
        <div key={index} className="flex gap-2 items-end">
          <div className="flex-1">
            <Label htmlFor={`product_${index}`}>Product</Label>
            <Select 
              value={item.product_id}
              onValueChange={(value) => onUpdateItem(index, 'product_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products?.map((product: any) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
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
              onChange={(e) => onUpdateItem(index, 'quantity', parseInt(e.target.value))}
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
            disabled={items.length <= 1}
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
        Add Product
      </Button>
    </div>
  );
};

export default BatchItemsList;
