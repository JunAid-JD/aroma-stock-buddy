
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FinishedProductFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  configurations: any[];
}

const FinishedProductForm = ({ formData, onChange, configurations }: FinishedProductFormProps) => {
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
              <SelectItem key={config.volume_config} value={config.volume_config}>
                {config.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
};

export default FinishedProductForm;
