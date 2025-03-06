
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RawMaterialFormProps {
  formData: {
    name: string;
    sku: string;
    type: string;
    quantity_in_stock: number;
    unit_cost: number;
    reorder_point: number;
  };
  onChange: (field: string, value: any) => void;
}

const RawMaterialForm = ({ formData, onChange }: RawMaterialFormProps) => {
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
        <Label htmlFor="quantity_in_stock">Quantity in Stock (ml)</Label>
        <Input
          id="quantity_in_stock"
          type="number"
          min="0"
          step="0.01"
          value={formData.quantity_in_stock || ''}
          onChange={(e) => onChange('quantity_in_stock', parseFloat(e.target.value))}
          required
        />
      </div>
      <div>
        <Label htmlFor="unit_cost">Unit Cost (Rs.)</Label>
        <Input
          id="unit_cost"
          type="number"
          min="0"
          step="0.01"
          value={formData.unit_cost || ''}
          onChange={(e) => onChange('unit_cost', parseFloat(e.target.value))}
          required
        />
      </div>
      <div>
        <Label htmlFor="reorder_point">Reorder Point (ml)</Label>
        <Input
          id="reorder_point"
          type="number"
          min="0"
          step="1"
          value={formData.reorder_point || ''}
          onChange={(e) => onChange('reorder_point', parseInt(e.target.value))}
          required
        />
      </div>
    </div>
  );
};

export default RawMaterialForm;
