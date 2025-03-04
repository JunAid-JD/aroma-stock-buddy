
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash } from "lucide-react";

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
    { raw_material_id: "", quantity_required: 0 }
  ]);
  const [packagingItemsList, setPackagingItemsList] = useState<PackagingItem[]>([
    { packaging_item_id: "", quantity_required: 0 }
  ]);
  const [skuInput, setSkuInput] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    if (selectedDependency) {
      // Set finished product ID
      setFinishedProductId(selectedDependency.finished_product_id);

      // For editing single dependencies
      if (selectedDependency.component_type === "raw_material") {
        setRawMaterialItems([
          {
            raw_material_id: selectedDependency.raw_material_id,
            quantity_required: selectedDependency.quantity_required,
          },
        ]);
        setPackagingItemsList([{ packaging_item_id: "", quantity_required: 0 }]);
      } else if (selectedDependency.component_type === "packaging") {
        setPackagingItemsList([
          {
            packaging_item_id: selectedDependency.packaging_item_id,
            quantity_required: selectedDependency.quantity_required,
          },
        ]);
        setRawMaterialItems([{ raw_material_id: "", quantity_required: 0 }]);
      }
    }
  }, [selectedDependency]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!finishedProductId && !selectedDependency) {
      toast({
        title: "Error",
        description: "Please select a finished product",
        variant: "destructive",
      });
      return;
    }

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

    // Submit the form with all components
    onSubmit({
      finished_product_id: finishedProductId,
      raw_materials: rawMaterialItems,
      packaging_items: packagingItemsList,
    });
  };

  const addRawMaterialItem = () => {
    setRawMaterialItems([
      ...rawMaterialItems,
      { raw_material_id: "", quantity_required: 0 },
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
      { packaging_item_id: "", quantity_required: 0 },
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

  // Search product by SKU
  const searchProductBySku = () => {
    if (!skuInput) return;

    const product = finishedProducts.find((p) => p.sku === skuInput);
    if (product) {
      setFinishedProductId(product.id);
    } else {
      toast({
        title: "Product not found",
        description: `No product found with SKU: ${skuInput}`,
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        {selectedDependency ? (
          <div>
            <p className="text-sm font-medium mb-2">
              Finished Product: {selectedDependency.finished_product_name}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Component: {selectedDependency.component_name} ({selectedDependency.component_type})
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="skuInput">Search by SKU</Label>
              <div className="flex space-x-2">
                <Input
                  id="skuInput"
                  value={skuInput}
                  onChange={(e) => setSkuInput(e.target.value)}
                  placeholder="Enter product SKU"
                />
                <Button
                  type="button"
                  onClick={searchProductBySku}
                  variant="secondary"
                >
                  Find
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="finished_product_id">Finished Product</Label>
              <Select
                value={finishedProductId}
                onValueChange={setFinishedProductId}
              >
                <SelectTrigger id="finished_product_id">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {finishedProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Raw Materials</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addRawMaterialItem}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
                {rawMaterialItems.map((item, index) => (
                  <div
                    key={`raw-${index}`}
                    className="flex items-center space-x-2 mb-2"
                  >
                    <Select
                      value={item.raw_material_id}
                      onValueChange={(value) =>
                        updateRawMaterialItem(index, "raw_material_id", value)
                      }
                    >
                      <SelectTrigger className="flex-1">
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
                    <Input
                      type="number"
                      value={item.quantity_required}
                      onChange={(e) =>
                        updateRawMaterialItem(
                          index,
                          "quantity_required",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="Quantity"
                      className="w-24"
                      min="0"
                      step="0.01"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRawMaterialItem(index)}
                      disabled={rawMaterialItems.length <= 1}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Packaging Items</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPackagingItem}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
                {packagingItemsList.map((item, index) => (
                  <div
                    key={`pkg-${index}`}
                    className="flex items-center space-x-2 mb-2"
                  >
                    <Select
                      value={item.packaging_item_id}
                      onValueChange={(value) =>
                        updatePackagingItem(index, "packaging_item_id", value)
                      }
                    >
                      <SelectTrigger className="flex-1">
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
                    <Input
                      type="number"
                      value={item.quantity_required}
                      onChange={(e) =>
                        updatePackagingItem(
                          index,
                          "quantity_required",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="Quantity"
                      className="w-24"
                      min="0"
                      step="0.01"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePackagingItem(index)}
                      disabled={packagingItemsList.length <= 1}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
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
                const value = parseFloat(e.target.value) || 0;
                if (selectedDependency.component_type === "raw_material") {
                  updateRawMaterialItem(0, "quantity_required", value);
                } else {
                  updatePackagingItem(0, "quantity_required", value);
                }
              }}
              min="0"
              step="0.01"
            />
          </div>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          {selectedDependency ? "Update" : "Create"}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default SKUDependencyForm;
