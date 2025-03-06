
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface RawMaterialItem {
  raw_material_id: string;
  quantity_required: number;
}

interface PackagingItem {
  packaging_item_id: string;
  quantity_required: number;
}

interface SKUDependencyFormProps {
  onSubmit: (data: any) => void;
  onClose: () => void;
  selectedDependency: any;
  rawMaterials: any[];
  packagingItems: any[];
  finishedProducts: any[];
}

const SKUDependencyForm: React.FC<SKUDependencyFormProps> = ({
  onSubmit,
  onClose,
  selectedDependency,
  rawMaterials,
  packagingItems,
  finishedProducts,
}) => {
  const [finishedProductId, setFinishedProductId] = useState<string>("");
  const [rawMaterialItems, setRawMaterialItems] = useState<RawMaterialItem[]>([
    { raw_material_id: "", quantity_required: 1 }
  ]);
  const [packagingItemsList, setPackagingItemsList] = useState<PackagingItem[]>([
    { packaging_item_id: "", quantity_required: 1 }
  ]);
  const [skuInput, setSkuInput] = useState<string>("");
  const [existingProduct, setExistingProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedDependency) {
      // Set finished product ID
      setFinishedProductId(selectedDependency.finished_product_id);
      setSkuInput(selectedDependency.product_sku);

      // For editing single dependencies
      if (selectedDependency.component_type === "raw_material") {
        setRawMaterialItems([
          {
            raw_material_id: selectedDependency.raw_material_id,
            quantity_required: selectedDependency.quantity_required,
          },
        ]);
        setPackagingItemsList([{ packaging_item_id: "", quantity_required: 1 }]);
      } else if (selectedDependency.component_type === "packaging") {
        setPackagingItemsList([
          {
            packaging_item_id: selectedDependency.packaging_item_id,
            quantity_required: selectedDependency.quantity_required,
          },
        ]);
        setRawMaterialItems([{ raw_material_id: "", quantity_required: 1 }]);
      }
    }
  }, [selectedDependency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If editing an existing dependency, just update that specific one
    if (selectedDependency) {
      onSubmit({
        id: selectedDependency.id,
        quantity_required: selectedDependency.component_type === "raw_material"
          ? rawMaterialItems[0].quantity_required
          : packagingItemsList[0].quantity_required,
      });
      return;
    }

    // We need a SKU to create a dependency
    if (!skuInput) {
      toast({
        title: "Error",
        description: "Please enter a product SKU",
        variant: "destructive",
      });
      return;
    }

    // Validate at least one component is selected
    const hasRawMaterial = rawMaterialItems.some(
      (item) => item.raw_material_id && item.quantity_required > 0
    );
    const hasPackagingItem = packagingItemsList.some(
      (item) => item.packaging_item_id && item.quantity_required > 0
    );

    if (!hasRawMaterial && !hasPackagingItem) {
      toast({
        title: "Error",
        description: "Please add at least one component with quantity",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // If the product doesn't exist, create it first
      if (!existingProduct) {
        // Extract name from SKU for better display
        const nameFromSku = skuInput.split('-')[0] || skuInput;
        
        // Create new product
        const { data: newProduct, error: createError } = await supabase
          .from("finished_products")
          .insert({
            sku: skuInput,
            name: nameFromSku,
            quantity_in_stock: 0,
            unit_price: 0
          })
          .select("id, sku")
          .single();
        
        if (createError) {
          console.error("Error creating product:", createError);
          throw createError;
        }
        
        console.log("Created new product:", newProduct);
      }
      
      // Now send the dependencies with the product SKU directly
      onSubmit({
        product_sku: skuInput,
        raw_materials: rawMaterialItems.filter(item => item.raw_material_id),
        packaging_items: packagingItemsList.filter(item => item.packaging_item_id),
      });
    } catch (error: any) {
      console.error("Form submission error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create dependency",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkSku = async () => {
    if (!skuInput) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("finished_products")
        .select("*")
        .eq("sku", skuInput)
        .maybeSingle();
      
      if (error) throw error;
      
      setExistingProduct(data);
      
      if (data) {
        setFinishedProductId(data.id);
        toast({
          title: "Product found",
          description: `Found existing product: ${data.name} (SKU: ${data.sku})`,
        });
      } else {
        setFinishedProductId("");
        toast({
          title: "Product not found",
          description: "New product will be created with this SKU",
        });
      }
    } catch (error: any) {
      console.error("Error checking SKU:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to check SKU",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addRawMaterialItem = () => {
    setRawMaterialItems([
      ...rawMaterialItems,
      { raw_material_id: "", quantity_required: 1 },
    ]);
  };

  const removeRawMaterialItem = (index: number) => {
    if (rawMaterialItems.length > 1) {
      setRawMaterialItems(rawMaterialItems.filter((_, i) => i !== index));
    }
  };

  const updateRawMaterialItem = (
    index: number,
    field: keyof RawMaterialItem,
    value: any
  ) => {
    const newItems = [...rawMaterialItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setRawMaterialItems(newItems);
  };

  const addPackagingItem = () => {
    setPackagingItemsList([
      ...packagingItemsList,
      { packaging_item_id: "", quantity_required: 1 },
    ]);
  };

  const removePackagingItem = (index: number) => {
    if (packagingItemsList.length > 1) {
      setPackagingItemsList(packagingItemsList.filter((_, i) => i !== index));
    }
  };

  const updatePackagingItem = (
    index: number,
    field: keyof PackagingItem,
    value: any
  ) => {
    const newItems = [...packagingItemsList];
    newItems[index] = { ...newItems[index], [field]: value };
    setPackagingItemsList(newItems);
  };

  // Handle SKU input change
  const handleSkuChange = (value: string) => {
    setSkuInput(value);
    setExistingProduct(null); // Reset existing product when SKU changes
    setFinishedProductId(""); // Reset finished product ID
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto p-1">
      {!selectedDependency && (
        <div>
          <DialogHeader>
            <DialogTitle>Add SKU Dependency</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-2">
            Define the components required to produce a finished product.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {selectedDependency ? (
          <div>
            <p className="text-sm font-medium mb-2">
              Finished Product: {selectedDependency.finished_product_name || selectedDependency.product_sku}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Component: {selectedDependency.component_name} ({selectedDependency.component_type})
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="finished_product_sku">Finished Product SKU (e.g. FG-abc123)</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="skuInput"
                  value={skuInput}
                  onChange={(e) => handleSkuChange(e.target.value)}
                  placeholder="e.g. FG-abc123"
                  className="flex-grow"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={checkSku}
                  disabled={isLoading || !skuInput}
                >
                  Check
                </Button>
              </div>
              {existingProduct && (
                <p className="text-sm text-green-600">
                  Found: {existingProduct.name} (Stock: {existingProduct.quantity_in_stock}, SKU: {existingProduct.sku})
                </p>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t">
              <Label className="text-base font-medium">Raw Materials</Label>
              
              {rawMaterialItems.map((item, index) => (
                <div key={`raw-${index}`} className="flex items-center space-x-2 mb-4">
                  <div className="grid grid-cols-2 gap-4 flex-grow">
                    <div>
                      <Label htmlFor={`raw-material-${index}`}>
                        Raw Material
                      </Label>
                      <Select
                        value={item.raw_material_id}
                        onValueChange={(value) =>
                          updateRawMaterialItem(index, "raw_material_id", value)
                        }
                      >
                        <SelectTrigger id={`raw-material-${index}`}>
                          <SelectValue placeholder="Select raw material" />
                        </SelectTrigger>
                        <SelectContent>
                          {rawMaterials.map((material) => (
                            <SelectItem key={material.id} value={material.id}>
                              {material.name} ({material.sku})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`raw-quantity-${index}`}>
                        Quantity
                      </Label>
                      <Input
                        id={`raw-quantity-${index}`}
                        type="number"
                        value={item.quantity_required}
                        onChange={(e) =>
                          updateRawMaterialItem(
                            index,
                            "quantity_required",
                            parseFloat(e.target.value) || 1
                          )
                        }
                        placeholder="Quantity"
                        min="1"
                        step="0.01"
                      />
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRawMaterialItem(index)}
                    disabled={rawMaterialItems.length <= 1}
                    className="self-end mt-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={addRawMaterialItem}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Raw Material
              </Button>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <Label className="text-base font-medium">Packaging Items</Label>
              
              {packagingItemsList.map((item, index) => (
                <div key={`pkg-${index}`} className="flex items-center space-x-2 mb-4">
                  <div className="grid grid-cols-2 gap-4 flex-grow">
                    <div>
                      <Label htmlFor={`packaging-${index}`}>
                        Packaging Item
                      </Label>
                      <Select
                        value={item.packaging_item_id}
                        onValueChange={(value) =>
                          updatePackagingItem(index, "packaging_item_id", value)
                        }
                      >
                        <SelectTrigger id={`packaging-${index}`}>
                          <SelectValue placeholder="Select packaging item" />
                        </SelectTrigger>
                        <SelectContent>
                          {packagingItems.map((pkg) => (
                            <SelectItem key={pkg.id} value={pkg.id}>
                              {pkg.name} ({pkg.type} - {pkg.size})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`pkg-quantity-${index}`}>
                        Quantity
                      </Label>
                      <Input
                        id={`pkg-quantity-${index}`}
                        type="number"
                        value={item.quantity_required}
                        onChange={(e) =>
                          updatePackagingItem(
                            index,
                            "quantity_required",
                            parseFloat(e.target.value) || 1
                          )
                        }
                        placeholder="Quantity"
                        min="1"
                        step="0.01"
                      />
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePackagingItem(index)}
                    disabled={packagingItemsList.length <= 1}
                    className="self-end mt-8"
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
                <Plus className="h-4 w-4 mr-2" /> Add Packaging Item
              </Button>
            </div>
          </>
        )}

        {selectedDependency && (
          <div>
            <Label htmlFor="quantity_required">Quantity Required</Label>
            <Input
              id="quantity_required"
              type="number"
              value={
                selectedDependency.component_type === "raw_material"
                  ? rawMaterialItems[0].quantity_required
                  : packagingItemsList[0].quantity_required
              }
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 1;
                if (selectedDependency.component_type === "raw_material") {
                  updateRawMaterialItem(0, "quantity_required", value);
                } else {
                  updatePackagingItem(0, "quantity_required", value);
                }
              }}
              min="1"
              step="0.01"
            />
          </div>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="bg-blue-600 hover:bg-blue-700"
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : (selectedDependency ? "Update" : "Create")}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default SKUDependencyForm;
