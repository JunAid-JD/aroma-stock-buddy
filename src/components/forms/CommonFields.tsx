
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CommonFieldsProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  type: 'raw' | 'packaging' | 'finished';
}

const CommonFields = ({ formData, onChange, type }: CommonFieldsProps) => {
  return (
    <>
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
        />
      </div>

      <div>
        <Label htmlFor="quantity">Quantity in Stock</Label>
        <Input
          id="quantity"
          type="number"
          value={formData.quantity_in_stock || ''}
          onChange={(e) => onChange('quantity_in_stock', parseInt(e.target.value))}
          required
        />
      </div>

      <div>
        <Label htmlFor="reorder">Reorder Point</Label>
        <Input
          id="reorder"
          type="number"
          value={formData.reorder_point || ''}
          onChange={(e) => onChange('reorder_point', parseInt(e.target.value))}
          required
        />
      </div>

      <div>
        <Label htmlFor="cost">
          {type === 'finished' ? 'Unit Price' : 'Unit Cost'}
        </Label>
        <Input
          id="cost"
          type="number"
          step="0.01"
          value={formData[type === 'finished' ? 'unit_price' : 'unit_cost'] || ''}
          onChange={(e) => onChange(type === 'finished' ? 'unit_price' : 'unit_cost', parseFloat(e.target.value))}
          required
        />
      </div>
    </>
  );
};

export default CommonFields;
