
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2, X } from "lucide-react";

type MaterialType = 'raw' | 'packaging';

interface ComponentItem {
  id: string;
  material_id: string;
  quantity: number;
}

interface DependencyFormProps {
  onSubmit: (formData: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  initialData?: {
    finished_product_sku?: string;
    raw_materials?: ComponentItem[];
    packaging_items?: ComponentItem[];
  };
  isEditing?: boolean;
  rawMaterialsList: any[];
  packagingItemsList: any[];
}

const DependencyForm = ({ 
  onSubmit, 
  onCancel, 
  isSubmitting = false,
  initialData,
  isEditing = false,
  rawMaterialsList,
  packagingItemsList
}: DependencyFormProps) => {
  const [productSku, setProductSku] = useState(initialData?.finished_product_sku || '');
  const [rawMaterials, setRawMaterials] = useState<ComponentItem[]>(
    initialData?.raw_materials || []
  );
  const [packagingItems, setPackagingItems] = useState<ComponentItem[]>(
    initialData?.packaging_items || []
  );

  useEffect(() => {
    if (initialData) {
      setProductSku(initialData.finished_product_sku || '');
      setRawMaterials(initialData.raw_materials || []);
      setPackagingItems(initialData.packaging_items || []);
    }
  }, [initialData]);

  const addRawMaterial = () => {
    setRawMaterials([
      ...rawMaterials,
      { id: crypto.randomUUID(), material_id: '', quantity: 1 }
    ]);
  };

  const addPackagingItem = () => {
    setPackagingItems([
      ...packagingItems,
      { id: crypto.randomUUID(), material_id: '', quantity: 1 }
    ]);
  };

  const handleRawMaterialChange = (itemId: string, materialId: string) => {
    setRawMaterials(rawMaterials.map(item => 
      item.id === itemId ? { ...item, material_id: materialId } : item
    ));
  };

  const handleRawMaterialQuantityChange = (itemId: string, quantity: number) => {
    setRawMaterials(rawMaterials.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    ));
  };

  const handlePackagingChange = (itemId: string, materialId: string) => {
    setPackagingItems(packagingItems.map(item => 
      item.id === itemId ? { ...item, material_id: materialId } : item
    ));
  };

  const handlePackagingQuantityChange = (itemId: string, quantity: number) => {
    setPackagingItems(packagingItems.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    ));
  };

  const removeRawMaterial = (itemId: string) => {
    setRawMaterials(rawMaterials.filter(item => item.id !== itemId));
  };

  const removePackagingItem = (itemId: string) => {
    setPackagingItems(packagingItems.filter(item => item.id !== itemId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validRawMaterials = rawMaterials.filter(item => item.material_id);
    const validPackagingItems = packagingItems.filter(item => item.material_id);
    
    onSubmit({
      finished_product_sku: productSku,
      raw_materials: validRawMaterials,
      packaging_items: validPackagingItems
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div>
          <Label htmlFor="product_sku">Finished Product SKU</Label>
          <Input
            id="product_sku"
            value={productSku}
            onChange={(e) => setProductSku(e.target.value)}
            placeholder="Enter product SKU"
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <Label>Raw Materials</Label>
          </div>
          
          {rawMaterials.map((item) => (
            <div key={item.id} className="flex items-center gap-2 mb-2">
              <Select 
                value={item.material_id} 
                onValueChange={(value) => handleRawMaterialChange(item.id, value)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select raw material" />
                </SelectTrigger>
                <SelectContent>
                  {rawMaterialsList.map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.name} ({material.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input
                type="number"
                min={0.1}
                step={0.1}
                className="w-24"
                value={item.quantity}
                onChange={(e) => handleRawMaterialQuantityChange(item.id, parseFloat(e.target.value) || 1)}
              />
              
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeRawMaterial(item.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            className="w-full mt-2"
            onClick={addRawMaterial}
          >
            Add Raw Material
          </Button>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <Label>Packaging Items</Label>
          </div>
          
          {packagingItems.map((item) => (
            <div key={item.id} className="flex items-center gap-2 mb-2">
              <Select 
                value={item.material_id} 
                onValueChange={(value) => handlePackagingChange(item.id, value)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select packaging item" />
                </SelectTrigger>
                <SelectContent>
                  {packagingItemsList.map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.name} ({material.sku || 'No SKU'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input
                type="number"
                min={1}
                step={1}
                className="w-24"
                value={item.quantity}
                onChange={(e) => handlePackagingQuantityChange(item.id, parseInt(e.target.value) || 1)}
              />
              
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removePackagingItem(item.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            className="w-full mt-2"
            onClick={addPackagingItem}
          >
            Add Packaging Item
          </Button>
        </div>
      </div>

      <DialogFooter className="mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            isEditing ? 'Update' : 'Create'
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default DependencyForm;
