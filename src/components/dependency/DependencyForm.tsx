
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { Plus, X } from "lucide-react";

interface DependencyFormProps {
  dependency?: any;
  onSubmit: (formData: any) => void;
  onClose: () => void;
}

interface DependencyItem {
  id?: string;
  item_id: string;
  type: 'raw_material' | 'packaging';
  quantity: number;
}

const DependencyForm = ({ dependency, onSubmit, onClose }: DependencyFormProps) => {
  const [formValues, setFormValues] = useState({
    fg_sku: "",
    finished_product_id: "",
  });
  const [rawMaterials, setRawMaterials] = useState<DependencyItem[]>([{ 
    item_id: "", type: "raw_material", quantity: 1 
  }]);
  const [packagingItems, setPackagingItems] = useState<DependencyItem[]>([{ 
    item_id: "", type: "packaging", quantity: 1 
  }]);

  const { data: rawMaterialsData } = useQuery({
    queryKey: ["rawMaterialsForDependency"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("raw_materials")
        .select("id, name, sku")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: packagingItemsData } = useQuery({
    queryKey: ["packagingItemsForDependency"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packaging_items")
        .select("id, name, sku")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: finishedProductsData } = useQuery({
    queryKey: ["finishedProductsForDependency"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finished_products")
        .select("id, name, sku")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (dependency) {
      setFormValues({
        fg_sku: dependency.fg_sku || "",
        finished_product_id: dependency.finished_product_id || "",
      });

      // Process components into raw materials and packaging items
      const rawMaterialItems: DependencyItem[] = [];
      const packagingItems: DependencyItem[] = [];

      if (dependency.components && dependency.components.length > 0) {
        dependency.components.forEach((component: any) => {
          if (component.type === 'raw_material') {
            rawMaterialItems.push({
              id: component.id,
              item_id: component.item_id,
              type: 'raw_material',
              quantity: component.quantity,
            });
          } else if (component.type === 'packaging') {
            packagingItems.push({
              id: component.id,
              item_id: component.item_id,
              type: 'packaging',
              quantity: component.quantity,
            });
          }
        });
      }

      // Ensure we always have at least one empty item
      if (rawMaterialItems.length === 0) {
        rawMaterialItems.push({ item_id: "", type: "raw_material", quantity: 1 });
      }
      if (packagingItems.length === 0) {
        packagingItems.push({ item_id: "", type: "packaging", quantity: 1 });
      }

      setRawMaterials(rawMaterialItems);
      setPackagingItems(packagingItems);
    }
  }, [dependency]);

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out items that don't have an item_id
    const validRawMaterials = rawMaterials.filter(item => item.item_id !== "");
    const validPackagingItems = packagingItems.filter(item => item.item_id !== "");
    
    onSubmit({
      ...formValues,
      rawMaterials: validRawMaterials,
      packagingItems: validPackagingItems,
    });
  };

  const handleChange = (name: string, value: string) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const addRawMaterial = () => {
    setRawMaterials([...rawMaterials, { item_id: "", type: "raw_material", quantity: 1 }]);
  };

  const removeRawMaterial = (index: number) => {
    if (rawMaterials.length > 1) {
      setRawMaterials(rawMaterials.filter((_, i) => i !== index));
    }
  };

  const updateRawMaterial = (index: number, field: 'item_id' | 'quantity', value: any) => {
    const newItems = [...rawMaterials];
    newItems[index] = { ...newItems[index], [field]: value };
    setRawMaterials(newItems);
  };

  const addPackagingItem = () => {
    setPackagingItems([...packagingItems, { item_id: "", type: "packaging", quantity: 1 }]);
  };

  const removePackagingItem = (index: number) => {
    if (packagingItems.length > 1) {
      setPackagingItems(packagingItems.filter((_, i) => i !== index));
    }
  };

  const updatePackagingItem = (index: number, field: 'item_id' | 'quantity', value: any) => {
    const newItems = [...packagingItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setPackagingItems(newItems);
  };

  return (
    <form onSubmit={handleSubmitForm}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="fg_sku">Finished Product SKU</Label>
          {dependency ? (
            <Select
              value={formValues.finished_product_id}
              onValueChange={(value) => handleChange('finished_product_id', value)}
              disabled={!!dependency}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select finished product" />
              </SelectTrigger>
              <SelectContent>
                {finishedProductsData?.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="fg_sku"
              value={formValues.fg_sku}
              onChange={(e) => handleChange('fg_sku', e.target.value)}
              placeholder="Enter finished product SKU"
              required
            />
          )}
        </div>

        <div className="space-y-2">
          <Label>Raw Materials</Label>
          {rawMaterials.map((item, index) => (
            <div key={`rm-${index}`} className="flex gap-2 items-end border p-4 rounded-md">
              <div className="flex-1">
                <Label htmlFor={`rm_${index}`}>Raw Material</Label>
                <Select 
                  value={item.item_id}
                  onValueChange={(value) => updateRawMaterial(index, 'item_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select raw material" />
                  </SelectTrigger>
                  <SelectContent>
                    {rawMaterialsData?.map((material) => (
                      <SelectItem key={material.id} value={material.id}>
                        {material.name} ({material.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-32">
                <Label htmlFor={`rm_qty_${index}`}>Quantity</Label>
                <Input
                  id={`rm_qty_${index}`}
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateRawMaterial(index, 'quantity', parseFloat(e.target.value) || 1)}
                  min="0.1"
                  step="0.1"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mb-0.5"
                onClick={() => removeRawMaterial(index)}
                disabled={rawMaterials.length <= 1}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addRawMaterial}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Raw Material
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Packaging Items</Label>
          {packagingItems.map((item, index) => (
            <div key={`pkg-${index}`} className="flex gap-2 items-end border p-4 rounded-md">
              <div className="flex-1">
                <Label htmlFor={`pkg_${index}`}>Packaging Item</Label>
                <Select 
                  value={item.item_id}
                  onValueChange={(value) => updatePackagingItem(index, 'item_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select packaging item" />
                  </SelectTrigger>
                  <SelectContent>
                    {packagingItemsData?.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        {pkg.name} ({pkg.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-32">
                <Label htmlFor={`pkg_qty_${index}`}>Quantity</Label>
                <Input
                  id={`pkg_qty_${index}`}
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updatePackagingItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                  min="1"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mb-0.5"
                onClick={() => removePackagingItem(index)}
                disabled={packagingItems.length <= 1}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addPackagingItem}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Packaging Item
          </Button>
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
          {dependency ? "Update" : "Create"}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default DependencyForm;
