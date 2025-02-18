
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CommonFields from "./CommonFields";

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
      <CommonFields formData={formData} onChange={onChange} />
    </>
  );
};

export default RawMaterialForm;
