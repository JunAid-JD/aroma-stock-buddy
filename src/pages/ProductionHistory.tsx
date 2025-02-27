
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import BatchForm from "@/components/production/BatchForm";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

const columns = [
  { key: "batch_number", label: "Batch #" },
  { key: "items_summary", label: "Items" },
  { key: "production_date", label: "Date", isDate: true },
  { key: "status", label: "Status" },
  { key: "notes", label: "Notes" },
];

interface BatchItem {
  item_id: string;
  item_type: "raw_material" | "finished_product";
  quantity: number;
}

const ProductionHistory = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [batchItems, setBatchItems] = useState<BatchItem[]>([{ item_id: "", item_type: "finished_product", quantity: 1 }]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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
            item_type,
            item_id
          )
        `)
        .order("production_date", { ascending: false });

      if (error) throw error;

      // We need to fetch the names of the items
      const batchesWithNames = await Promise.all((batches || []).map(async (batch) => {
        const itemsWithNames = await Promise.all((batch.production_batch_items || []).map(async (item) => {
          let name = "Unknown";
          
          if (item.item_type === 'finished_product') {
            const { data } = await supabase
              .from("finished_products")
              .select("name")
              .eq("id", item.item_id)
              .maybeSingle();
            name = data?.name || "Unknown Product";
          } else if (item.item_type === 'raw_material') {
            const { data } = await supabase
              .from("raw_materials")
              .select("name")
              .eq("id", item.item_id)
              .maybeSingle();
            name = data?.name || "Unknown Raw Material";
          }
          
          return `${name} (${item.quantity}) - ${item.item_type === 'finished_product' ? 'FG' : 'RM'}`;
        }));
        
        return {
          ...batch,
          items_summary: itemsWithNames.join(", ") || "No items"
        };
      }));
      
      return batchesWithNames;
    },
  });

  // Listen for realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'production_batches'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["productionBatches"] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'production_batch_items'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["productionBatches"] });
        }
      )
      .subscribe();   

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: finishedProducts } = useQuery({
    queryKey: ["finishedProducts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finished_products")
        .select("id, name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: rawMaterials } = useQuery({
    queryKey: ["rawMaterials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("raw_materials")
        .select("id, name");
      if (error) throw error;
      return data || [];
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const data = {
      status: formData.get("status") as string,
      notes: formData.get("notes") as string,
      production_date: new Date().toISOString()
    };

    try {
      if (selectedBatch) {
        // Update existing batch
        const { error: batchError } = await supabase
          .from("production_batches")
          .update({
            ...data,
            updated_at: new Date().toISOString()
          })
          .eq("id", selectedBatch.id);
        
        if (batchError) throw batchError;

        // Delete existing items
        const { error: deleteError } = await supabase
          .from("production_batch_items")
          .delete()
          .eq("batch_id", selectedBatch.id);

        if (deleteError) throw deleteError;

        // Insert new items
        const { error: itemsError } = await supabase
          .from("production_batch_items")
          .insert(
            batchItems.map(item => ({
              batch_id: selectedBatch.id,
              item_id: item.item_id,
              item_type: item.item_type,
              quantity: item.quantity,
            }))
          );

        if (itemsError) throw itemsError;

      } else {
        // Create new batch
        const { data: newBatch, error: batchError } = await supabase
          .from("production_batches")
          .insert({
            ...data,
            // We're not sending product_id because we have multiple item types now
            product_id: batchItems[0].item_type === 'finished_product' ? batchItems[0].item_id : rawMaterials?.[0]?.id
          })
          .select()
          .single();

        if (batchError) throw batchError;

        // Insert batch items
        const { error: itemsError } = await supabase
          .from("production_batch_items")
          .insert(
            batchItems.map(item => ({
              batch_id: newBatch.id,
              item_id: item.item_id,
              item_type: item.item_type,
              quantity: item.quantity,
            }))
          );

        if (itemsError) throw itemsError;
      }

      await queryClient.invalidateQueries({ queryKey: ["productionBatches"] });
      await queryClient.invalidateQueries({ queryKey: ["finishedProducts"] });
      await queryClient.invalidateQueries({ queryKey: ["rawMaterials"] });
      await queryClient.invalidateQueries({ queryKey: ["packagingItems"] });
      
      toast({
        title: "Success",
        description: `Batch ${selectedBatch ? "updated" : "added"} successfully.`,
      });
      handleClose();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setSelectedBatch(null);
    setBatchItems([{ item_id: "", item_type: "finished_product", quantity: 1 }]);
  };

  const handleAdd = () => {
    setSelectedBatch(null);
    setBatchItems([{ item_id: "", item_type: "finished_product", quantity: 1 }]);
    setIsDialogOpen(true);
  };

  const handleEdit = (batch: any) => {
    setSelectedBatch(batch);
    
    // Extract batch items - we need to get their details from the production_batch_items
    supabase
      .from("production_batch_items")
      .select("*")
      .eq("batch_id", batch.id)
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching batch items:", error);
          setBatchItems([{ item_id: "", item_type: "finished_product", quantity: 1 }]);
        } else if (data && data.length > 0) {
          setBatchItems(data.map(item => ({
            item_id: item.item_id,
            item_type: item.item_type,
            quantity: item.quantity,
          })));
        } else {
          setBatchItems([{ item_id: "", item_type: "finished_product", quantity: 1 }]);
        }
        
        setIsDialogOpen(true);
      });
  };

  const addBatchItem = () => {
    setBatchItems([...batchItems, { item_id: "", item_type: "finished_product", quantity: 1 }]);
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

  const handleDelete = async () => {
    if (!selectedBatch) return;

    try {
      // First delete batch items
      const { error: itemsError } = await supabase
        .from("production_batch_items")
        .delete()
        .eq("batch_id", selectedBatch.id);

      if (itemsError) throw itemsError;

      // Then delete the batch
      const { error: batchError } = await supabase
        .from("production_batches")
        .delete()
        .eq("id", selectedBatch.id);

      if (batchError) throw batchError;

      await queryClient.invalidateQueries({ queryKey: ["productionBatches"] });
      toast({
        title: "Success",
        description: "Production batch deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
      setSelectedBatch(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete batch.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (batch: any) => {
    setSelectedBatch(batch);
    setIsDeleteDialogOpen(true);
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
        onDelete={handleDeleteClick}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedBatch ? "Edit" : "Add"} Production Batch
            </DialogTitle>
          </DialogHeader>
          <BatchForm
            selectedBatch={selectedBatch}
            batchItems={batchItems}
            finishedProducts={finishedProducts || []}
            rawMaterials={rawMaterials || []}
            onSubmit={handleSubmit}
            onClose={handleClose}
            onAddItem={addBatchItem}
            onRemoveItem={removeBatchItem}
            onUpdateItem={updateBatchItem}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the production batch
              and all associated records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductionHistory;
