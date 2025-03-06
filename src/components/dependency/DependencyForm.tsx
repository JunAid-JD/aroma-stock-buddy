
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

type MaterialType = 'raw' | 'packaging';

interface DependencyFormProps {
  onSubmit: (formData: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  initialData?: {
    material_type?: MaterialType;
    material_id?: string;
    quantity_required?: number;
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
  const [materialType, setMaterialType] = useState<MaterialType>(initialData?.material_type || 'raw');
  const [materialId, setMaterialId] = useState<string>(initialData?.material_id || '');
  const [quantityRequired, setQuantityRequired] = useState<number>(initialData?.quantity_required || 1);

  useEffect(() => {
    if (initialData) {
      setMaterialType(initialData.material_type || 'raw');
      setMaterialId(initialData.material_id || '');
      setQuantityRequired(initialData.quantity_required || 1);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSubmit({
      material_type: materialType,
      material_id: materialId,
      quantity_required: quantityRequired
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="material_type">Component Type</Label>
          <Select
            value={materialType}
            onValueChange={(value: MaterialType) => {
              setMaterialType(value);
              setMaterialId(''); // Reset material ID when type changes
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select component type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="raw">Raw Material</SelectItem>
              <SelectItem value="packaging">Packaging Item</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="material_id">
            {materialType === 'raw' ? 'Raw Material' : 'Packaging Item'}
          </Label>
          <Select
            value={materialId}
            onValueChange={setMaterialId}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${materialType === 'raw' ? 'raw material' : 'packaging item'}`} />
            </SelectTrigger>
            <SelectContent>
              {materialType === 'raw' ? (
                rawMaterialsList.map((material) => (
                  <SelectItem key={material.id} value={material.id}>
                    {material.name} ({material.sku})
                  </SelectItem>
                ))
              ) : (
                packagingItemsList.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} ({item.sku || 'No SKU'})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="quantity_required">Quantity Required</Label>
          <Input
            id="quantity_required"
            type="number"
            value={quantityRequired}
            onChange={(e) => setQuantityRequired(parseFloat(e.target.value) || 0)}
            min={0.1}
            step={0.1}
            required
          />
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
        <Button type="submit" disabled={isSubmitting || !materialId}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? 'Updating...' : 'Adding...'}
            </>
          ) : (
            isEditing ? 'Update' : 'Add'
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default DependencyForm;
