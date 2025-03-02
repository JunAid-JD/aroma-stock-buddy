
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ItemFormDialog from "@/components/ItemFormDialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

const columns = [
  { key: "name", label: "Name" },
  { key: "sku", label: "SKU" },
  { key: "volume_config", label: "Volume" },
  { key: "quantity_in_stock", label: "Quantity in Stock" },
  { key: "unit_price", label: "Unit Price" },
  { key: "total_value", label: "Total Value" },
  { key: "updated_at", label: "Last Updated", isDate: true },
];

const FinishedGoods = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: finishedProducts, isLoading } = useQuery({
    queryKey: ["finishedProducts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finished_products")
        .select("*")
        .order("name");
      
      if (error) throw error;
      
      return data.map(product => ({
        ...product,
        unit_price: `Rs. ${product.unit_price.toFixed(2)}`,
        total_value: product.total_value ? `Rs. ${product.total_value.toFixed(2)}` : 'N/A'
      }));
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
          table: 'finished_products'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["finishedProducts"] });
        }
      )
      .subscribe();   

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleAddItem = () => {
    setSelectedItem(null);
    setIsDialogOpen(true);
  };

  const handleEditItem = (item: any) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (data: any) => {
    try {
      const { sku, name, volume_config, quantity_in_stock, reorder_point } = data;
      
      // Always set the type correctly based on volume_config
      const productType = volume_config.startsWith('essential') ? 'essential_oil' : 'carrier_oil';
      
      if (selectedItem) {
        await supabase
          .from("finished_products")
          .update({
            name,
            type: productType,
            quantity_in_stock,
            volume_config,
            sku,
            reorder_point,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedItem.id);
      } else {
        await supabase
          .from("finished_products")
          .insert({
            name,
            type: productType,
            quantity_in_stock,
            volume_config,
            sku,
            reorder_point,
            updated_at: new Date().toISOString(),
          });
      }

      await queryClient.invalidateQueries({ queryKey: ["finishedProducts"] });
      
      toast({
        title: "Success",
        description: `Product ${selectedItem ? "updated" : "added"} successfully.`,
      });
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = (item: any) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedItem) return;

    try {
      const { error } = await supabase
        .from("finished_products")
        .delete()
        .eq("id", selectedItem.id);
      
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["finishedProducts"] });
      
      toast({
        title: "Success",
        description: "Product deleted successfully.",
      });
      
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Finished Goods</h2>
          <p className="text-muted-foreground">
            Manage your finished oil products
          </p>
        </div>
        <Button onClick={handleAddItem}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>
      <DataTable 
        columns={columns} 
        data={finishedProducts || []} 
        isLoading={isLoading}
        onEdit={handleEditItem}
        onDelete={handleDeleteItem}
      />

      <ItemFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleSubmit}
        item={selectedItem}
        type="finished"
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FinishedGoods;
