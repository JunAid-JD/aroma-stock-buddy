
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FinishedProductFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  configurations: any[];
}

const FinishedProductForm = ({ formData, onChange, configurations }: FinishedProductFormProps) => {
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
        <Label htmlFor="type">Type</Label>
        <Select
          value={formData.type || ''}
          onValueChange={(value) => onChange('type', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="essential_oil">Essential Oil</SelectItem>
            <SelectItem value="carrier_oil">Carrier Oil</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="quantity_in_stock">Quantity in Stock</Label>
        <Input
          id="quantity_in_stock"
          type="number"
          value={formData.quantity_in_stock || ''}
          onChange={(e) => onChange('quantity_in_stock', parseInt(e.target.value))}
          required
        />
      </div>
      <div>
        <Label htmlFor="volume_config">Volume Configuration</Label>
        <Select
          value={formData.volume_config || ''}
          onValueChange={(value) => onChange('volume_config', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select volume configuration" />
          </SelectTrigger>
          <SelectContent>
            {configurations?.map((config) => (
              <SelectItem key={config.id} value={config.volume_config}>
                {config.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="reorder_point">Reorder Point</Label>
        <Input
          id="reorder_point"
          type="number"
          value={formData.reorder_point || ''}
          onChange={(e) => onChange('reorder_point', parseInt(e.target.value))}
          required
        />
      </div>
    </div>
  );
};

export default FinishedProductForm;
