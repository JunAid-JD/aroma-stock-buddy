
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CommonFields from "./CommonFields";

interface PackagingFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

const PackagingForm = ({ formData, onChange }: PackagingFormProps) => {
  return (
    <>
      <CommonFields formData={formData} onChange={onChange} formType="packaging" />
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
    </>
  );
};

export default PackagingForm;
