
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PackagingFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

const PackagingForm = ({ formData, onChange }: PackagingFormProps) => {
  return (
    <>
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
            <SelectItem value="bottle">Bottle</SelectItem>
            <SelectItem value="cap">Cap</SelectItem>
            <SelectItem value="dropper">Dropper</SelectItem>
            <SelectItem value="label">Label</SelectItem>
            <SelectItem value="box">Box</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="size">Size</Label>
        <Select
          value={formData.size || ''}
          onValueChange={(value) => onChange('size', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10ml">10ml</SelectItem>
            <SelectItem value="30ml">30ml</SelectItem>
            <SelectItem value="70ml">70ml</SelectItem>
            <SelectItem value="140ml">140ml</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
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
        <Label htmlFor="unit_cost">Unit Cost ($)</Label>
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
        <Label htmlFor="reorder_point">Reorder Point</Label>
        <Input
          id="reorder_point"
          type="number"
          value={formData.reorder_point || ''}
          onChange={(e) => onChange('reorder_point', parseInt(e.target.value))}
          required
        />
      </div>
    </>
  );
};

export default PackagingForm;
