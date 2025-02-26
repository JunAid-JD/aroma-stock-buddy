
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ItemFormDialog from "@/components/ItemFormDialog";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const columns = [
  { key: "sku", label: "SKU" },
  { key: "name", label: "Name" },
  { key: "type", label: "Type" },
  { key: "quantity_in_stock", label: "Stock" },
  { key: "volume_config", label: "Volume" },
  { key: "unit_price", label: "Unit Price" },
  { key: "total_value", label: "Total Value" },
  { key: "updated_at", label: "Last Updated", isDate: true },
];

const FinishedGoods = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
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
      
      return data.map(item => ({
        ...item,
        total_value: item.total_value ? `Rs. ${item.total_value.toFixed(2)}` : 'Rs. 0.00',
        unit_price: item.unit_price ? `Rs. ${item.unit_price.toFixed(2)}` : 'Rs. 0.00',
        volume_config: item.volume_config.replace(/_/g, ' ').replace(/(\w+)/, (s) => s.charAt(0).toUpperCase() + s.slice(1))
      }));
    },
  });

  const handleSubmit = async (formData: any) => {
    try {
      const productData = {
        name: formData.name,
        type: 'essential_oil' as const, // Explicitly type as literal
        quantity_in_stock: formData.quantity_in_stock || 0,
        volume_config: formData.volume_config || 'essential_10ml',
        sku: formData.sku,
        unit_price: 0, // Initial value, will be updated by trigger
        reorder_point: formData.reorder_point || 10,
        updated_at: new Date().toISOString()
      };

      if (selectedItem) {
        const { error } = await supabase
          .from("finished_products")
          .update(productData)
          .eq("id", selectedItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("finished_products")
          .insert(productData);
        if (error) throw error;
      }

      // If there are product components, add them
      if (formData.components && formData.components.length > 0) {
        // First, delete existing components if updating
        if (selectedItem) {
          const { error: deleteError } = await supabase
            .from("product_components")
            .delete()
            .eq("finished_product_id", selectedItem.id);
          
          if (deleteError) throw deleteError;
        }

        // Then insert new components
        const { data: newProduct } = await supabase
          .from("finished_products")
          .select("id")
          .order('created_at', { ascending: false })
          .limit(1);

        const productId = selectedItem ? selectedItem.id : newProduct?.[0]?.id;

        if (productId) {
          const componentData = formData.components.map((comp: any) => ({
            finished_product_id: productId,
            component_type: comp.type,
            raw_material_id: comp.type === 'raw_material' ? comp.id : null,
            packaging_item_id: comp.type === 'packaging' ? comp.id : null,
            quantity_required: comp.quantity || 0
          }));

          const { error: componentsError } = await supabase
            .from("product_components")
            .insert(componentData);

          if (componentsError) throw componentsError;
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["finishedProducts"] });
      toast({
        title: "Success",
        description: `Item ${selectedItem ? "updated" : "created"} successfully.`,
      });
      setIsDialogOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    try {
      // First, delete product components
      const { error: componentsError } = await supabase
        .from("product_components")
        .delete()
        .eq("finished_product_id", selectedItem.id);
      
      if (componentsError) throw componentsError;

      // Then delete production batch items
      const { error: batchItemsError } = await supabase
        .from("production_batch_items")
        .delete()
        .eq("item_id", selectedItem.id);
      
      if (batchItemsError) throw batchItemsError;

      // Finally delete the product
      const { error } = await supabase
        .from("finished_products")
        .delete()
        .eq("id", selectedItem.id);
      
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["finishedProducts"] });
      toast({
        title: "Success",
        description: "Item deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete item.",
        variant: "destructive",
      });
    }
  };

  const handleAdd = () => {
    setSelectedItem(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (item: any) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Finished Goods</h2>
          <p className="text-muted-foreground">
            Manage your finished products inventory
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Finished Product
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={finishedProducts || []}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />
      <ItemFormDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedItem(null);
        }}
        onSubmit={handleSubmit}
        item={selectedItem}
        type="finished"
      />
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the finished product
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

export default FinishedGoods;

