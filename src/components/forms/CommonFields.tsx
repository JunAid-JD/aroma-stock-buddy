
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CommonFieldsProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  excludeFields?: string[];
}

const CommonFields = ({ formData, onChange, excludeFields = [] }: CommonFieldsProps) => {
  const fields = [
    {
      id: "quantity_in_stock",
      label: "Quantity in Stock",
      type: "number",
      step: "0.01",
      unit: "ml"
    },
    {
      id: "unit_cost",
      label: "Unit Cost",
      type: "number",
      step: "0.01",
      prefix: "$"
    },
    {
      id: "reorder_point",
      label: "Reorder Point",
      type: "number",
      step: "1"
    }
  ].filter(field => !excludeFields.includes(field.id));

  return (
    <>
      {fields.map((field) => (
        <div key={field.id}>
          <Label htmlFor={field.id}>
            {field.label} {field.unit ? `(${field.unit})` : ''}
            {field.prefix ? ` (${field.prefix})` : ''}
          </Label>
          <Input
            id={field.id}
            type={field.type}
            step={field.step}
            value={formData[field.id] || ''}
            onChange={(e) => {
              const value = field.type === 'number' ? parseFloat(e.target.value) : e.target.value;
              onChange(field.id, value);
            }}
            required
          />
        </div>
      ))}
    </>
  );
};

export default CommonFields;
