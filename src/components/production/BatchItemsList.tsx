
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BatchItem } from "./BatchForm";

interface BatchItemsListProps {
  items: BatchItem[];
  finishedProducts: any[];
  rawMaterials: any[];
  packagingItems: any[];
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, field: keyof BatchItem, value: any) => void;
  selectedType: "finished_product" | "raw_material" | "packaging";
  setSelectedType: (type: "finished_product" | "raw_material" | "packaging") => void;
}

const BatchItemsList = ({ 
  items, 
  finishedProducts, 
  rawMaterials, 
  packagingItems,
  onAddItem, 
  onRemoveItem, 
  onUpdateItem,
  selectedType,
  setSelectedType
}: BatchItemsListProps) => {
  return (
    <div className="space-y-4">
      <Label>Batch Items</Label>
      {items.map((item, index) => (
        <div key={index} className="flex gap-2 items-end">
          <div className="flex-1">
            <Tabs defaultValue={item.item_type} onValueChange={(value: "finished_product" | "raw_material" | "packaging") => {
              onUpdateItem(index, 'item_type', value);
              onUpdateItem(index, 'item_id', '');
              setSelectedType(value);
            }}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="finished_product">Finished Product</TabsTrigger>
                <TabsTrigger value="raw_material">Raw Material</TabsTrigger>
                <TabsTrigger value="packaging">Packaging</TabsTrigger>
              </TabsList>
              <TabsContent value="finished_product">
                <Label htmlFor={`product_${index}`}>Finished Product</Label>
                <Select 
                  value={item.item_id}
                  onValueChange={(value) => onUpdateItem(index, 'item_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {finishedProducts?.map((product: any) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TabsContent>
              <TabsContent value="raw_material">
                <Label htmlFor={`raw_material_${index}`}>Raw Material</Label>
                <Select 
                  value={item.item_id}
                  onValueChange={(value) => onUpdateItem(index, 'item_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select raw material" />
                  </SelectTrigger>
                  <SelectContent>
                    {rawMaterials?.map((material: any) => (
                      <SelectItem key={material.id} value={material.id}>
                        {material.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TabsContent>
              <TabsContent value="packaging">
                <Label htmlFor={`packaging_${index}`}>Packaging Item</Label>
                <Select 
                  value={item.item_id}
                  onValueChange={(value) => onUpdateItem(index, 'item_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select packaging item" />
                  </SelectTrigger>
                  <SelectContent>
                    {packagingItems?.map((item: any) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TabsContent>
            </Tabs>
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
        Add Item
      </Button>
    </div>
  );
};

export default BatchItemsList;
