
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

const columns = [
  { key: "batch_number", label: "Batch #" },
  { key: "product_name", label: "Product" },
  { key: "quantity_produced", label: "Quantity" },
  { key: "production_date", label: "Date", isDate: true },
  { key: "status", label: "Status" },
  { key: "notes", label: "Notes" },
];

const ProductionHistory = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: productionBatches, isLoading } = useQuery({
    queryKey: ["productionBatches"],
    queryFn: async () => {
      const { data: batches, error } = await supabase
        .from("production_batches")
        .select("*, finished_products!production_batches_product_id_fkey(name)")
        .order("production_date", { ascending: false });

      if (error) throw error;

      return (batches || []).map(batch => ({
        ...batch,
        product_name: batch.finished_products?.name || 'Unknown Product'
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
        const { error } = await supabase
          .from("production_batches")
          .update(formData)
          .eq("id", selectedBatch.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("production_batches")
          .insert(formData);
        if (error) throw error;
      }
      await queryClient.invalidateQueries({ queryKey: ["productionBatches"] });
      toast({
        title: "Success",
        description: `Batch ${selectedBatch ? "updated" : "added"} successfully.`,
      });
      setIsDialogOpen(false);
      setSelectedBatch(null);
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
    setIsDialogOpen(true);
  };

  const handleEdit = (batch: any) => {
    setSelectedBatch(batch);
    setIsDialogOpen(true);
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
              product_id: formData.get("product_id") as string,
              quantity_produced: parseInt(formData.get("quantity_produced") as string),
              status: formData.get("status") as string,
              notes: formData.get("notes") as string,
              production_date: selectedBatch?.production_date || new Date().toISOString(),
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

              <div>
                <Label htmlFor="product_id">Product</Label>
                <Select 
                  name="product_id" 
                  defaultValue={selectedBatch?.product_id}
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

              <div>
                <Label htmlFor="quantity_produced">Quantity Produced</Label>
                <Input
                  id="quantity_produced"
                  name="quantity_produced"
                  type="number"
                  defaultValue={selectedBatch?.quantity_produced}
                  required
                />
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
