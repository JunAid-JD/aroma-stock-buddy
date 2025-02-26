
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Dependency {
  item_id: string;
  item_type: 'raw_material' | 'packaging';
  quantity_required: number;
}

interface FinishedProductFormProps {
  formData: {
    name: string;
    sku: string;
    type: string;
    volume_config: string;
    quantity_in_stock: number;
    configuration_id?: string;
    dependencies?: Dependency[];
  };
  onChange: (field: string, value: any) => void;
  configurations: any[];
}

const FinishedProductForm = ({ formData, onChange, configurations }: FinishedProductFormProps) => {
  const [selectedConfig, setSelectedConfig] = useState<any>(null);
  const [dependencies, setDependencies] = useState<Dependency[]>(formData.dependencies || []);

  useEffect(() => {
    if (formData.configuration_id) {
      const config = configurations.find(c => c.id === formData.configuration_id);
      setSelectedConfig(config || null);
    }
  }, [formData.configuration_id, configurations]);

  const { data: rawMaterials } = useQuery({
    queryKey: ["rawMaterials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("raw_materials")
        .select("id, name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: packagingItems } = useQuery({
    queryKey: ["packagingItems"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packaging_items")
        .select("id, name");
      if (error) throw error;
      return data || [];
    },
  });

  const addDependency = () => {
    const newDependency: Dependency = {
      item_id: "",
      item_type: "raw_material",
      quantity_required: 0
    };
    setDependencies([...dependencies, newDependency]);
    onChange('dependencies', [...dependencies, newDependency]);
  };

  const removeDependency = (index: number) => {
    const newDependencies = dependencies.filter((_, i) => i !== index);
    setDependencies(newDependencies);
    onChange('dependencies', newDependencies);
  };

  const updateDependency = (index: number, field: keyof Dependency, value: any) => {
    const newDependencies = [...dependencies];
    newDependencies[index] = { ...newDependencies[index], [field]: value };
    setDependencies(newDependencies);
    onChange('dependencies', newDependencies);
  };

  return (
    <div className="space-y-4 max-h-[80vh] overflow-y-auto">
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
              setSelectedConfig(config);
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
        <div className="flex items-center justify-between">
          <Label>Dependencies</Label>
          <Button type="button" variant="outline" size="sm" onClick={addDependency}>
            <Plus className="h-4 w-4 mr-2" />
            Add Dependency
          </Button>
        </div>
        {dependencies.map((dep, index) => (
          <div key={index} className="flex gap-2 items-end">
            <div className="w-1/4">
              <Label>Type</Label>
              <Select
                value={dep.item_type}
                onValueChange={(value: 'raw_material' | 'packaging') => 
                  updateDependency(index, 'item_type', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="raw_material">Raw Material</SelectItem>
                  <SelectItem value="packaging">Packaging</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Item</Label>
              <Select
                value={dep.item_id}
                onValueChange={(value) => updateDependency(index, 'item_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {dep.item_type === 'raw_material' ?
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
            <div className="w-24">
              <Label>Quantity</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={dep.quantity_required}
                onChange={(e) => updateDependency(index, 'quantity_required', parseFloat(e.target.value))}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeDependency(index)}
              className="mb-0.5"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FinishedProductForm;
