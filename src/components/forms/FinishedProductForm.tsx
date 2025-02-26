
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";

interface ProductConfiguration {
  id: string;
  name: string;
  volume_config: string;
  description?: string;
  required_packaging: any;
}

interface FinishedProductFormProps {
  formData: {
    name: string;
    sku: string;
    type: string;
    volume_config: string;
    quantity_in_stock: number;
    configuration_id?: string;
  };
  onChange: (field: string, value: any) => void;
  configurations: ProductConfiguration[];
}

const FinishedProductForm = ({ formData, onChange, configurations }: FinishedProductFormProps) => {
  const [selectedConfig, setSelectedConfig] = useState<ProductConfiguration | null>(null);

  useEffect(() => {
    if (formData.configuration_id) {
      const config = configurations.find(c => c.id === formData.configuration_id);
      setSelectedConfig(config || null);
    }
  }, [formData.configuration_id, configurations]);

  return (
    <div className="space-y-4">
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
    </div>
  );
};

export default FinishedProductForm;
