
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, X } from "lucide-react";
import { DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

interface RawMaterialComponent {
  raw_material_id: string;
  quantity_required: number;
}

interface PackagingComponent {
  packaging_item_id: string;
  quantity_required: number;
}

interface SKUDependencyFormProps {
  onSubmit: (data: any) => Promise<void>;
  onClose: () => void;
  selectedDependency?: any;
  rawMaterials: any[];
  packagingItems: any[];
  finishedProducts: any[];
}

const SKUDependencyForm = ({
  onSubmit,
  onClose,
  selectedDependency,
  rawMaterials,
  packagingItems,
  finishedProducts,
}: SKUDependencyFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finishedProductId, setFinishedProductId] = useState<string>("");
  const [rawMaterialComponents, setRawMaterialComponents] = useState<RawMaterialComponent[]>([
    { raw_material_id: "", quantity_required: 1 }
  ]);
  const [packagingComponents, setPackagingComponents] = useState<PackagingComponent[]>([
    { packaging_item_id: "", quantity_required: 1 }
  ]);

  useEffect(() => {
    if (selectedDependency) {
      // Set finished product ID
      setFinishedProductId(selectedDependency.finished_product_id);

      if (selectedDependency.component_type === "raw_material") {
        setRawMaterialComponents([{
          raw_material_id: selectedDependency.raw_material_id || "",
          quantity_required: selectedDependency.quantity_required || 1
        }]);
      } else if (selectedDependency.component_type === "packaging") {
        setPackagingComponents([{
          packaging_item_id: selectedDependency.packaging_item_id || "",
          quantity_required: selectedDependency.quantity_required || 1
        }]);
      }
    }
  }, [selectedDependency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!finishedProductId) {
      toast({
        title: "Error",
        description: "Please select a finished product",
        variant: "destructive",
      });
      return;
    }
    
    const validRawMaterials = rawMaterialComponents.filter(item => item.raw_material_id && item.quantity_required > 0);
    const validPackagingItems = packagingComponents.filter(item => item.packaging_item_id && item.quantity_required > 0);
    
    if (validRawMaterials.length === 0 && validPackagingItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one component",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formData = {
        finished_product_id: finishedProductId,
        raw_materials: validRawMaterials,
        packaging_items: validPackagingItems
      };
      
      await onSubmit(formData);
    } catch (error) {
      console.error("Error submitting dependency:", error);
      toast({
        title: "Error",
        description: "Failed to save dependency. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addRawMaterial = () => {
    setRawMaterialComponents([
      ...rawMaterialComponents,
      { raw_material_id: "", quantity_required: 1 }
    ]);
  };

  const removeRawMaterial = (index: number) => {
    if (rawMaterialComponents.length > 1) {
      setRawMaterialComponents(
        rawMaterialComponents.filter((_, i) => i !== index)
      );
    }
  };

  const updateRawMaterial = (index: number, field: keyof RawMaterialComponent, value: any) => {
    const updated = [...rawMaterialComponents];
    updated[index] = { ...updated[index], [field]: value };
    setRawMaterialComponents(updated);
  };

  const addPackagingItem = () => {
    setPackagingComponents([
      ...packagingComponents,
      { packaging_item_id: "", quantity_required: 1 }
    ]);
  };

  const removePackagingItem = (index: number) => {
    if (packagingComponents.length > 1) {
      setPackagingComponents(
        packagingComponents.filter((_, i) => i !== index)
      );
    }
  };

  const updatePackagingItem = (index: number, field: keyof PackagingComponent, value: any) => {
    const updated = [...packagingComponents];
    updated[index] = { ...updated[index], [field]: value };
    setPackagingComponents(updated);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <div>
          <Label htmlFor="finished_product_id">Finished Product SKU</Label>
          <Select
            value={finishedProductId}
            onValueChange={setFinishedProductId}
            disabled={!!selectedDependency}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select finished product" />
            </SelectTrigger>
            <SelectContent>
              {finishedProducts.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.sku} - {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 pt-4">
          <h3 className="font-medium">Raw Materials</h3>
          
          {rawMaterialComponents.map((component, index) => (
            <div key={`raw-${index}`} className="flex gap-2 items-end">
              <div className="flex-1">
                <Label>Raw Material</Label>
                <Select
                  value={component.raw_material_id}
                  onValueChange={(value) => updateRawMaterial(index, "raw_material_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select raw material" />
                  </SelectTrigger>
                  <SelectContent>
                    {rawMaterials.map((material) => (
                      <SelectItem key={material.id} value={material.id}>
                        {material.sku} - {material.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-24">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={component.quantity_required}
                  onChange={(e) => updateRawMaterial(index, "quantity_required", parseFloat(e.target.value) || 0)}
                />
              </div>
              
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeRawMaterial(index)}
                className="mb-0.5"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={addRawMaterial}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Raw Material
          </Button>
        </div>

        <div className="space-y-2 pt-4">
          <h3 className="font-medium">Packaging Items</h3>
          
          {packagingComponents.map((component, index) => (
            <div key={`pkg-${index}`} className="flex gap-2 items-end">
              <div className="flex-1">
                <Label>Packaging Item</Label>
                <Select
                  value={component.packaging_item_id}
                  onValueChange={(value) => updatePackagingItem(index, "packaging_item_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select packaging item" />
                  </SelectTrigger>
                  <SelectContent>
                    {packagingItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.sku} - {item.name} ({item.size})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-24">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={component.quantity_required}
                  onChange={(e) => updatePackagingItem(index, "quantity_required", parseFloat(e.target.value) || 0)}
                />
              </div>
              
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removePackagingItem(index)}
                className="mb-0.5"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={addPackagingItem}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Packaging Item
          </Button>
        </div>
      </div>

      <DialogFooter className="mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : selectedDependency ? "Update" : "Create"}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default SKUDependencyForm;
