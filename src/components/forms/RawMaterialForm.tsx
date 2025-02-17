
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RawMaterialFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

const RawMaterialForm = ({ formData, onChange }: RawMaterialFormProps) => {
  return (
    <>
      <div>
        <Label htmlFor="sku">SKU</Label>
        <Input
          id="sku"
          value={formData.sku || ''}
          onChange={(e) => onChange('sku', e.target.value)}
          placeholder="SKU will be auto-generated if left empty"
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
        <Label htmlFor="volume">Volume</Label>
        <Input
          id="volume"
          type="number"
          step="0.01"
          value={formData.volume || ''}
          onChange={(e) => onChange('volume', parseFloat(e.target.value))}
          required
        />
      </div>
      <div>
        <Label htmlFor="volume_unit">Volume Unit</Label>
        <Select
          value={formData.volume_unit || 'ml'}
          onValueChange={(value) => onChange('volume_unit', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select unit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ml">ml</SelectItem>
            <SelectItem value="l">L</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="unit_cost">Unit Cost</Label>
        <Input
          id="unit_cost"
          type="number"
          step="0.01"
          value={formData.unit_cost || ''}
          onChange={(e) => onChange('unit_cost', parseFloat(e.target.value))}
          required
        />
      </div>
      <div>
        <Label htmlFor="quantity">Quantity in Stock</Label>
        <Input
          id="quantity"
          type="number"
          step="0.01"
          value={formData.quantity_in_stock || ''}
          onChange={(e) => onChange('quantity_in_stock', parseFloat(e.target.value))}
          required
        />
      </div>
      <div>
        <Label htmlFor="reorder_point">Reorder Point</Label>
        <Input
          id="reorder_point"
          type="number"
          step="1"
          value={formData.reorder_point || ''}
          onChange={(e) => onChange('reorder_point', parseInt(e.target.value))}
          required
        />
      </div>
    </>
  );
};

export default RawMaterialForm;
