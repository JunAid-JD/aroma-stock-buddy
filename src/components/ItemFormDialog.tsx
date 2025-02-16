
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import RawMaterialForm from "./forms/RawMaterialForm";
import PackagingForm from "./forms/PackagingForm";
import FinishedProductForm from "./forms/FinishedProductForm";
import CommonFields from "./forms/CommonFields";

interface ItemFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  item?: any;
  type: 'raw' | 'packaging' | 'finished';
}

const ItemFormDialog = ({ isOpen, onClose, onSubmit, item, type }: ItemFormDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState(item || {});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: configurations } = useQuery({
    queryKey: ["productConfigurations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_configurations")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: type === 'finished'
  });

  useEffect(() => {
    setFormData(item || {});
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      toast({
        title: "Success",
        description: `Item ${item ? "updated" : "created"} successfully.`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    if (field === 'volume_config' && type === 'finished') {
      const selectedConfig = configurations?.find(config => config.volume_config === value);
      setFormData(prev => ({
        ...prev,
        [field]: value,
        required_packaging: selectedConfig?.required_packaging
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {item ? "Edit" : "Add"} {type === 'raw' ? 'Raw Material' : type === 'packaging' ? 'Packaging Item' : 'Finished Product'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <CommonFields formData={formData} onChange={handleChange} type={type} />

            {type === 'raw' && (
              <RawMaterialForm formData={formData} onChange={handleChange} />
            )}

            {type === 'packaging' && (
              <PackagingForm formData={formData} onChange={handleChange} />
            )}

            {type === 'finished' && (
              <FinishedProductForm 
                formData={formData} 
                onChange={handleChange}
                configurations={configurations || []}
              />
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : item ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ItemFormDialog;
