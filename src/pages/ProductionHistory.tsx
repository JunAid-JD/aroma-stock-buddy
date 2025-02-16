
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

const columns = [
  { key: "batch_number", label: "Batch #" },
  { key: "items_summary", label: "Products" },
  { key: "production_date", label: "Date", isDate: true },
  { key: "status", label: "Status" },
  { key: "notes", label: "Notes" },
];

interface BatchItem {
  product_id: string;
  quantity: number;
}

const ProductionHistory = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [batchItems, setBatchItems] = useState<BatchItem[]>([{ product_id: "", quantity: 0 }]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: productionBatches, isLoading } = useQuery({
    queryKey: ["productionBatches"],
    queryFn: async () => {
      const { data: batches, error } = await supabase
        .from("production_batches")
        .select(`
          *,
          production_batch_items (
            quantity,
            finished_products (
              name
            )
          )
        `)
        .order("production_date", { ascending: false });

      if (error) throw error;

      return (batches || []).map(batch => ({
        ...batch,
        items_summary: batch.production_batch_items
          ?.map(item => `${item.finished_products.name} (${item.quantity})`)
          .join(", ") || "No items"
      }));
    },
  });

  const { data: products } = useQuery({
    queryKey: ["finishedProducts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finished_products")
        .select("id, name");
      if (error) throw error;
      return data || [];
    },
  });

  const handleSubmit = async (formData: any) => {
    try {
      if (selectedBatch) {
        // Update existing batch
        const { error: batchError } = await supabase
          .from("production_batches")
          .update({
            batch_number: formData.batch_number,
            status: formData.status,
            notes: formData.notes,
          })
          .eq("id", selectedBatch.id);
        
        if (batchError) throw batchError;

        // Delete existing items
        const { error: deleteError } = await supabase
          .from("production_batch_items")
          .delete()
          .eq("batch_id", selectedBatch.id);

        if (deleteError) throw deleteError;

      } else {
        // Create new batch
        const { data: newBatch, error: batchError } = await supabase
          .from("production_batches")
          .insert({
            batch_number: formData.batch_number,
            status: formData.status,
            notes: formData.notes,
            product_id: batchItems[0].product_id, // Use first item's product as main product
          })
          .select()
          .single();

        if (batchError) throw batchError;

        // Insert new batch items
        const { error: itemsError } = await supabase
          .from("production_batch_items")
          .insert(
            batchItems.map(item => ({
              batch_id: newBatch.id,
              item_id: item.product_id,
              quantity: item.quantity,
            }))
          );

        if (itemsError) throw itemsError;
      }

      await queryClient.invalidateQueries({ queryKey: ["productionBatches"] });
      toast({
        title: "Success",
        description: `Batch ${selectedBatch ? "updated" : "added"} successfully.`,
      });
      setIsDialogOpen(false);
      setSelectedBatch(null);
      setBatchItems([{ product_id: "", quantity: 0 }]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAdd = () => {
    setSelectedBatch(null);
    setBatchItems([{ product_id: "", quantity: 0 }]);
    setIsDialogOpen(true);
  };

  const handleEdit = (batch: any) => {
    setSelectedBatch(batch);
    // Load batch items
    const items = batch.production_batch_items?.map((item: any) => ({
      product_id: item.finished_products.id,
      quantity: item.quantity,
    })) || [{ product_id: "", quantity: 0 }];
    setBatchItems(items);
    setIsDialogOpen(true);
  };

  const addBatchItem = () => {
    setBatchItems([...batchItems, { product_id: "", quantity: 0 }]);
  };

  const removeBatchItem = (index: number) => {
    if (batchItems.length > 1) {
      setBatchItems(batchItems.filter((_, i) => i !== index));
    }
  };

  const updateBatchItem = (index: number, field: keyof BatchItem, value: any) => {
    const newItems = [...batchItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setBatchItems(newItems);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Production History</h2>
          <p className="text-muted-foreground">
            Track and manage production batches
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          New Batch
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={productionBatches || []}
        isLoading={isLoading}
        onEdit={handleEdit}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedBatch ? "Edit" : "Add"} Production Batch
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const data = {
              batch_number: formData.get("batch_number") as string,
              status: formData.get("status") as string,
              notes: formData.get("notes") as string,
            };
            handleSubmit(data);
          }}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="batch_number">Batch Number</Label>
                <Input
                  id="batch_number"
                  name="batch_number"
                  defaultValue={selectedBatch?.batch_number}
                  required
                />
              </div>

              <div className="space-y-4">
                <Label>Batch Items</Label>
                {batchItems.map((item, index) => (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label htmlFor={`product_${index}`}>Product</Label>
                      <Select 
                        value={item.product_id}
                        onValueChange={(value) => updateBatchItem(index, 'product_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products?.map((product: any) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-32">
                      <Label htmlFor={`quantity_${index}`}>Quantity</Label>
                      <Input
                        id={`quantity_${index}`}
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateBatchItem(index, 'quantity', parseInt(e.target.value))}
                        min="1"
                        required
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mb-0.5"
                      onClick={() => removeBatchItem(index)}
                      disabled={batchItems.length <= 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addBatchItem}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  name="status" 
                  defaultValue={selectedBatch?.status || "in_progress"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  name="notes"
                  defaultValue={selectedBatch?.notes}
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setSelectedBatch(null);
                  setBatchItems([{ product_id: "", quantity: 0 }]);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {selectedBatch ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductionHistory;
