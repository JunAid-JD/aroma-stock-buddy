
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FinishedProductFormProps {
  formData: {
    sku: string;
    name?: string;
    type?: string;
    volume_config?: string;
    quantity_in_stock: number;
  };
  onChange: (field: string, value: any) => void;
}

const volumeOptions = [
  { value: 'essential_10ml', label: '10ml' },
  { value: 'essential_30ml', label: '30ml' },
  { value: 'carrier_30ml', label: '30ml (Carrier)' },
  { value: 'carrier_70ml', label: '70ml (Carrier)' },
  { value: 'carrier_140ml', label: '140ml (Carrier)' },
];

const FinishedProductForm = ({ formData, onChange }: FinishedProductFormProps) => {
  const [dependencyExists, setDependencyExists] = useState(false);
  const [productName, setProductName] = useState<string | null>(null);

  useEffect(() => {
    const checkDependency = async () => {
      if (formData.sku) {
        try {
          // First check if we can find a finished product by this SKU
          const { data: existingProduct, error: productError } = await supabase
            .from("finished_products")
            .select("name")
            .eq("sku", formData.sku)
            .maybeSingle();
            
          if (existingProduct && !productError) {
            setProductName(existingProduct.name);
            onChange('name', existingProduct.name);
            setDependencyExists(true);
            return;
          }
          
          // Check for dependencies in sku_dependencies table using finished_product_sku field
          const { data: dependencies, error: depsError } = await supabase
            .from("sku_dependencies")
            .select(`
              id,
              finished_product_id,
              finished_product_sku
            `)
            .eq("finished_product_sku", formData.sku)
            .maybeSingle();
          
          if (!depsError && dependencies) {
            // If we found a dependency using the sku, now get the product name
            const { data: productData, error: productFetchError } = await supabase
              .from("finished_products")
              .select("name")
              .eq("sku", formData.sku)
              .maybeSingle();
              
            if (!productFetchError && productData) {
              setDependencyExists(true);
              setProductName(productData.name);
              onChange('name', productData.name);
            } else {
              setDependencyExists(false);
              setProductName(null);
            }
          } else {
            setDependencyExists(false);
            setProductName(null);
          }
        } catch (error) {
          console.error("Error checking dependency:", error);
          setDependencyExists(false);
          setProductName(null);
        }
      }
    };

    checkDependency();
  }, [formData.sku]);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="sku">SKU</Label>
        <Input
          id="sku"
          value={formData.sku || ''}
          onChange={(e) => onChange('sku', e.target.value)}
          required
          placeholder="Enter product SKU (e.g., FG-mango12345)"
        />
        <p className="text-xs text-muted-foreground mt-1">
          SKU should start with "FG-" for finished goods
        </p>
      </div>

      {dependencyExists && productName && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Dependency found: {productName}
              </p>
            </div>
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="volume_config">Volume</Label>
        <Select
          value={formData.volume_config || 'essential_10ml'}
          onValueChange={(value) => onChange('volume_config', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select volume" />
          </SelectTrigger>
          <SelectContent>
            {volumeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="quantity_in_stock">Quantity in Stock</Label>
        <Input
          id="quantity_in_stock"
          type="number"
          min="0"
          step="1"
          value={formData.quantity_in_stock || ''}
          onChange={(e) => onChange('quantity_in_stock', parseInt(e.target.value))}
          required
        />
      </div>

      {!dependencyExists && (
        <div className="rounded-md bg-yellow-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-800">
                No dependency mapping found for this SKU. Please add one in the SKU Dependency Mapping page.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinishedProductForm;
