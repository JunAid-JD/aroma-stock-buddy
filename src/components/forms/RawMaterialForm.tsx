
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
    </>
  );
};

export default RawMaterialForm;
