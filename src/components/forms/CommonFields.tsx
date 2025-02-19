
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CommonFieldsProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  excludeFields?: string[];
  formType?: 'raw' | 'packaging' | 'finished';
}

const CommonFields = ({ formData, onChange, excludeFields = [], formType }: CommonFieldsProps) => {
  const fields = [
    {
      id: "name",
      label: "Name",
      type: "text"
    },
    {
      id: "sku",
      label: "SKU",
      type: "text",
      readOnly: true
    }
  ].filter(field => !excludeFields.includes(field.id));

  return (
    <>
      {fields.map((field) => (
        <div key={field.id}>
          <Label htmlFor={field.id}>{field.label}</Label>
          <Input
            id={field.id}
            type={field.type}
            value={formData[field.id] || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            readOnly={field.readOnly}
            required
          />
        </div>
      ))}
    </>
  );
};

export default CommonFields;
