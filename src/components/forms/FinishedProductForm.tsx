
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";

interface ProductConfiguration {
  id: string;
  name: string;
  volume_config: string;
  description?: string;
  required_packaging: any;
}

interface Component {
  id?: string;
  type: 'raw_material' | 'packaging';
  quantity_required: number;
  quantity_per_unit: number;
  raw_material_id?: string;
  packaging_item_id?: string;
}

interface FinishedProductFormProps {
  formData: {
    name: string;
    sku: string;
    type: string;
    volume_config: string;
    quantity_in_stock: number;
    configuration_id?: string;
    components?: Component[];
  };
  onChange: (field: string, value: any) => void;
  configurations: ProductConfiguration[];
}

const FinishedProductForm = ({ formData, onChange, configurations }: FinishedProductFormProps) => {
  const [selectedConfig, setSelectedConfig] = useState<ProductConfiguration | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { data: rawMaterials } = useQuery({
    queryKey: ["rawMaterials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("raw_materials")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: packagingItems } = useQuery({
    queryKey: ["packagingItems"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packaging_items")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (formData.configuration_id) {
      const config = configurations.find(c => c.id === formData.configuration_id);
      setSelectedConfig(config || null);
      
      if (config) {
        onChange('volume_config', config.volume_config);
      }
    }
  }, [formData.configuration_id, configurations]);

  const validateForm = () => {
    if (!formData.name || !formData.sku || !formData.configuration_id) {
      setValidationError("Please fill in all required fields");
      return false;
    }
    
    if (!formData.components || formData.components.length === 0) {
      setValidationError("Please add at least one component");
      return false;
    }

    for (const component of formData.components) {
      if (!component.quantity_required || component.quantity_required <= 0) {
        setValidationError("All components must have a quantity greater than 0");
        return false;
      }
      
      if (component.type === 'raw_material' && !component.raw_material_id) {
        setValidationError("Please select a raw material for all raw material components");
        return false;
      }
      
      if (component.type === 'packaging' && !component.packaging_item_id) {
        setValidationError("Please select a packaging item for all packaging components");
        return false;
      }
    }

    setValidationError(null);
    return true;
  };

  const handleAddComponent = () => {
    const components = formData.components || [];
    onChange('components', [
      ...components,
      { type: 'raw_material', quantity_required: 0, quantity_per_unit: 1 }
    ]);
  };

  const handleRemoveComponent = (index: number) => {
    const components = [...(formData.components || [])];
    components.splice(index, 1);
    onChange('components', components);
  };

  const handleComponentChange = (index: number, field: string, value: any) => {
    const components = [...(formData.components || [])];
    components[index] = { ...components[index], [field]: value };
    
    // Clear the other ID field when type changes
    if (field === 'type') {
      if (value === 'raw_material') {
        delete components[index].packaging_item_id;
      } else {
        delete components[index].raw_material_id;
      }
    }
    
    onChange('components', components);
  };

  return (
    <div className="space-y-4">
      {validationError && (
        <div className="text-red-500 text-sm">{validationError}</div>
      )}
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name || ''}
          onChange={(e) => onChange('name', e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="sku">SKU</Label>
        <Input
          id="sku"
          value={formData.sku || ''}
          onChange={(e) => onChange('sku', e.target.value)}
          required
          placeholder="Enter SKU"
        />
      </div>
      <div>
        <Label htmlFor="configuration">Product Configuration</Label>
        <Select
          value={formData.configuration_id || ''}
          onValueChange={(value) => {
            onChange('configuration_id', value);
            const config = configurations.find(c => c.id === value);
            if (config) {
              onChange('volume_config', config.volume_config);
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select configuration" />
          </SelectTrigger>
          <SelectContent>
            {configurations.map((config) => (
              <SelectItem key={config.id} value={config.id}>
                {config.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {selectedConfig && (
        <div className="text-sm text-muted-foreground">
          <p>Configuration: {selectedConfig.description}</p>
        </div>
      )}
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

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Components</Label>
          <Button type="button" variant="outline" size="sm" onClick={handleAddComponent}>
            <Plus className="h-4 w-4 mr-2" />
            Add Component
          </Button>
        </div>

        {(formData.components || []).map((component, index) => (
          <div key={index} className="space-y-2 p-4 border rounded-lg">
            <div className="flex justify-between">
              <Label>Component {index + 1}</Label>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={() => handleRemoveComponent(index)}
              >
                <Minus className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select
                  value={component.type}
                  onValueChange={(value) => handleComponentChange(index, 'type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="raw_material">Raw Material</SelectItem>
                    <SelectItem value="packaging">Packaging</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Item</Label>
                <Select
                  value={component.raw_material_id || component.packaging_item_id || ''}
                  onValueChange={(value) => handleComponentChange(
                    index, 
                    component.type === 'raw_material' ? 'raw_material_id' : 'packaging_item_id',
                    value
                  )}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select item" />
                  </SelectTrigger>
                  <SelectContent>
                    {component.type === 'raw_material' ? 
                      rawMaterials?.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      )) :
                      packagingItems?.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantity Required</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={component.quantity_required}
                  onChange={(e) => handleComponentChange(index, 'quantity_required', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label>Quantity per Unit</Label>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  value={component.quantity_per_unit}
                  onChange={(e) => handleComponentChange(index, 'quantity_per_unit', parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FinishedProductForm;
