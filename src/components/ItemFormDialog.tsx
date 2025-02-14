
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

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
    setFormData((prev: any) => ({ ...prev, [field]: value }));
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
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </div>

            {type === 'raw' && (
              <>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleChange('type', value)}
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
                    value={formData.volume || ''}
                    onChange={(e) => handleChange('volume', parseInt(e.target.value))}
                    required
                  />
                </div>
              </>
            )}

            {type === 'packaging' && (
              <>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottle">Bottle</SelectItem>
                      <SelectItem value="cap">Cap</SelectItem>
                      <SelectItem value="dropper">Dropper</SelectItem>
                      <SelectItem value="box">Box</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="size">Size</Label>
                  <Input
                    id="size"
                    value={formData.size || ''}
                    onChange={(e) => handleChange('size', e.target.value)}
                  />
                </div>
              </>
            )}

            {type === 'finished' && (
              <>
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku || ''}
                    onChange={(e) => handleChange('sku', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleChange('type', value)}
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
              </>
            )}

            <div>
              <Label htmlFor="quantity">Quantity in Stock</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity_in_stock || ''}
                onChange={(e) => handleChange('quantity_in_stock', parseInt(e.target.value))}
                required
              />
            </div>

            <div>
              <Label htmlFor="reorder">Reorder Point</Label>
              <Input
                id="reorder"
                type="number"
                value={formData.reorder_point || ''}
                onChange={(e) => handleChange('reorder_point', parseInt(e.target.value))}
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
                onChange={(e) => handleChange(type === 'finished' ? 'unit_price' : 'unit_cost', parseFloat(e.target.value))}
                required
              />
            </div>
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
