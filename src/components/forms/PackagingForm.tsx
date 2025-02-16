
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
            <SelectItem value="inner">Inner Box</SelectItem>
            <SelectItem value="outer">Outer Box</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="size">Size</Label>
        <Input
          id="size"
          value={formData.size || ''}
          onChange={(e) => onChange('size', e.target.value)}
          required
        />
      </div>
    </>
  );
};

export default PackagingForm;
