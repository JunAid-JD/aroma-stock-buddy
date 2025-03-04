
import { useState } from "react";
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
            item_id
          )
        `)
        .order("production_date", { ascending: false });

      if (error) throw error;

      // Fetch product details for each batch item
      const batchesWithItems = await Promise.all((batches || []).map(async batch => {
        // Extract product IDs
        const productIds = batch.production_batch_items.map((item: any) => item.item_id);
        
        // Fetch product details
        const { data: products, error: productsError } = await supabase
          .from("finished_products")
          .select("id, name, sku")
          .in("id", productIds);
        
        if (productsError) {
          console.error("Error fetching products:", productsError);
          return {
            ...batch,
            items_summary: "Error loading items"
          };
        }
        
        // Create a lookup map for products
        const productMap = new Map();
        (products || []).forEach(product => {
          productMap.set(product.id, product);
        });
        
        // Create items summary
        const items_summary = batch.production_batch_items
          .map((item: any) => {
            const product = productMap.get(item.item_id);
            return product ? `${product.name || product.sku} (${item.quantity})` : `Unknown product (${item.quantity})`;
          })
          .join(", ") || "No items";
        
        return {
          ...batch,
          items_summary
        };
      }));

      return batchesWithItems;
    },
  });

  const { data: availableProducts } = useQuery({
    queryKey: ["availableProducts"],
    queryFn: async () => {
      // First get regular finished products
      const { data: finishedProducts, error: fpError } = await supabase
        .from("finished_products")
        .select("id, name, sku");
      
      if (fpError) throw fpError;
      
      // Get products that have dependencies but might not be in the finished_products table
      const { data: dependencies, error: depError } = await supabase
        .from("sku_dependencies")
        .select(`
          finished_product_id,
          finished_products!finished_product_id(id, name, sku)
        `)
        .order("finished_product_id");
      
      if (depError) throw depError;
      
      // Create a set of all product IDs from the finished_products table
      const existingProductIds = new Set(finishedProducts.map(p => p.id));
      
      // Filter and map products from dependencies that don't exist in finished_products
      const dependencyOnlyProducts = dependencies
        .filter(d => d.finished_products && !existingProductIds.has(d.finished_product_id))
        .map(d => ({
          id: d.finished_product_id,
          name: d.finished_products.name || d.finished_products.sku,
          sku: d.finished_products.sku
        }));
      
      // Combine both lists and remove duplicates
      const allProducts = [
        ...finishedProducts,
        ...dependencyOnlyProducts
      ];
      
      // Remove duplicates based on ID
      const uniqueProducts = Array.from(
        new Map(allProducts.map(item => [item.id, item])).values()
      );
      
      return uniqueProducts;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const data = {
      status: formData.get("status") as string,
      notes: formData.get("notes") as string,
      product_id: batchItems[0].product_id, // First product for compatibility
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
        const batchItemsData = batchItems
          .filter(item => item.product_id && item.quantity > 0)
          .map(item => ({
            batch_id: selectedBatch.id,
            item_id: item.product_id,
            quantity: item.quantity,
            item_type: 'finished_product' as const
          }));

        if (batchItemsData.length > 0) {
          const { error: itemsError } = await supabase
            .from("production_batch_items")
            .insert(batchItemsData);

          if (itemsError) throw itemsError;
        }

      } else {
        // Create new batch
        const { data: newBatch, error: batchError } = await supabase
          .from("production_batches")
          .insert(data)
          .select()
          .single();

        if (batchError) throw batchError;

        // Insert batch items
        const batchItemsData = batchItems
          .filter(item => item.product_id && item.quantity > 0)
          .map(item => ({
            batch_id: newBatch.id,
            item_id: item.product_id,
            quantity: item.quantity,
            item_type: 'finished_product' as const
          }));

        if (batchItemsData.length > 0) {
          const { error: itemsError } = await supabase
            .from("production_batch_items")
            .insert(batchItemsData);

          if (itemsError) throw itemsError;
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["productionBatches"] });
      await queryClient.invalidateQueries({ queryKey: ["finishedProducts"] });
      await queryClient.invalidateQueries({ queryKey: ["rawMaterials"] });
      await queryClient.invalidateQueries({ queryKey: ["packagingItems"] });
      await queryClient.invalidateQueries({ queryKey: ["inventorySummary"] });
      
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
    setBatchItems([{ product_id: "", quantity: 0 }]);
  };

  const handleAdd = () => {
    setSelectedBatch(null);
    setBatchItems([{ product_id: "", quantity: 0 }]);
    setIsDialogOpen(true);
  };

  const handleEdit = (batch: any) => {
    setSelectedBatch(batch);
    
    // Map batch items
    const items = batch.production_batch_items?.map((item: any) => ({
      product_id: item.item_id,
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
      await queryClient.invalidateQueries({ queryKey: ["inventorySummary"] });
      
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedBatch ? "Edit" : "Add"} Production Batch
            </DialogTitle>
          </DialogHeader>
          <BatchForm
            selectedBatch={selectedBatch}
            batchItems={batchItems}
            products={availableProducts || []}
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
