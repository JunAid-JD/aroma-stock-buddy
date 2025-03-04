
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import BatchItemsList from "./BatchItemsList";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  const [productsWithDependencies, setProductsWithDependencies] = useState<any[]>([]);
  const [hasValidProducts, setHasValidProducts] = useState(true);
  const [manualInput, setManualInput] = useState<string>("");

  // Fetch products that have dependencies
  const { data: dependencies } = useQuery({
    queryKey: ["dependencies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sku_dependencies")
        .select("finished_product_id")
        .order("finished_product_id");
      
      if (error) throw error;
      
      // Get unique product IDs
      const uniqueProductIds = [...new Set(data.map(d => d.finished_product_id))];
      return uniqueProductIds;
    },
  });

  useEffect(() => {
    // Create a combined list of products that may include ones only from the dependency table
    if (dependencies && products) {
      // Get products from the finished_products table
      const existingProducts = products.map(p => ({
        ...p,
        exists_in_finished_products: true
      }));
      
      // Get products that only exist in the dependency table
      const dependencyOnlyProductIds = dependencies.filter(
        depId => !products.some(p => p.id === depId)
      );
      
      // If there are products that only exist in dependencies, fetch their details
      if (dependencyOnlyProductIds.length > 0) {
        const fetchDependencyProducts = async () => {
          try {
            // Get finished products referenced in dependencies
            const { data: dependencyProducts, error } = await supabase
              .from("finished_products")
              .select("id, name, sku")
              .in("id", dependencyOnlyProductIds);
            
            if (error) throw error;
            
            // Combine with existing products
            setProductsWithDependencies([
              ...existingProducts,
              ...(dependencyProducts || []).map(p => ({
                ...p,
                exists_in_finished_products: false
              }))
            ]);
          } catch (error) {
            console.error("Error fetching dependency products:", error);
            setProductsWithDependencies(existingProducts);
          }
        };
        
        fetchDependencyProducts();
      } else {
        setProductsWithDependencies(existingProducts);
      }
    }
  }, [dependencies, products]);

  // Check if any selected products don't have dependencies
  useEffect(() => {
    if (dependencies && batchItems.length > 0) {
      const allValid = batchItems.every(item => 
        !item.product_id || dependencies.includes(item.product_id)
      );
      setHasValidProducts(allValid);
    }
  }, [batchItems, dependencies]);

  // Handle manual product input
  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualInput(e.target.value);
  };

  // Function to handle manual input submission
  const handleManualProductAdd = async () => {
    if (!manualInput.trim()) return;
    
    try {
      // First check if product exists in finished_products
      const { data: existingProduct, error: existingError } = await supabase
        .from("finished_products")
        .select("id, name, sku")
        .eq("sku", manualInput)
        .maybeSingle();
      
      if (existingError) throw existingError;
      
      // If product exists, add it to batch items
      if (existingProduct) {
        const newItem = { product_id: existingProduct.id, quantity: 1 };
        batchItems.length === 1 && batchItems[0].product_id === "" 
          ? onUpdateItem(0, "product_id", existingProduct.id)
          : onAddItem();
        setManualInput("");
        return;
      }
      
      // Check if product exists in SKU dependencies
      const { data: depProducts, error: depError } = await supabase
        .from("sku_dependencies")
        .select("finished_product_id, finished_products:finished_product_id(id, name, sku)")
        .eq("finished_products.sku", manualInput)
        .limit(1);
        
      if (depError) throw depError;
      
      if (depProducts && depProducts.length > 0 && depProducts[0].finished_products) {
        const productId = depProducts[0].finished_product_id;
        // Add to batch items
        batchItems.length === 1 && batchItems[0].product_id === "" 
          ? onUpdateItem(0, "product_id", productId)
          : onAddItem();
        setManualInput("");
      } else {
        // Product not found
        alert(`Product with SKU ${manualInput} not found in the system`);
      }
    } catch (error) {
      console.error("Error adding manual product:", error);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="manualInput">Manual Product Input (SKU)</Label>
          <Input
            id="manualInput"
            value={manualInput}
            onChange={handleManualInputChange}
            placeholder="Enter product SKU"
          />
        </div>

        <BatchItemsList
          items={batchItems}
          products={productsWithDependencies || products || []}
          onAddItem={onAddItem}
          onRemoveItem={onRemoveItem}
          onUpdateItem={onUpdateItem}
        />

        {!hasValidProducts && (
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Some selected products don't have dependency mappings. Production may not correctly update inventory.
            </AlertDescription>
          </Alert>
        )}

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
