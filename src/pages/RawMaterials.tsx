
import { useState, useEffect } from "react";
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
  { key: "quantity_in_stock", label: "Stock (ml)" },
  { key: "unit_cost", label: "Unit Cost" },
  { key: "total_value", label: "Total Value" },
  { key: "reorder_point", label: "Reorder Point" },
  { key: "updated_at", label: "Last Updated", isDate: true },
];

const RawMaterials = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: rawMaterials, isLoading } = useQuery({
    queryKey: ["rawMaterials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("raw_materials")
        .select("*")
        .order("name");
      
      if (error) throw error;
      
      return data.map(item => ({
        ...item,
        total_value: item.total_value ? `Rs. ${item.total_value.toFixed(2)}` : 'Rs. 0.00',
        unit_cost: `Rs. ${item.unit_cost.toFixed(2)}`
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
          table: 'raw_materials'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["rawMaterials"] });
        }
      )
      .subscribe();   

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleSubmit = async (formData: any) => {
    try {
      if (selectedItem) {
        const { error } = await supabase
          .from("raw_materials")
          .update({
            name: formData.name,
            sku: formData.sku,
            type: formData.type,
            quantity_in_stock: formData.quantity_in_stock,
            unit_cost: formData.unit_cost,
            reorder_point: formData.reorder_point,
            updated_at: new Date().toISOString()
          })
          .eq("id", selectedItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("raw_materials")
          .insert({
            name: formData.name,
            sku: formData.sku,
            type: formData.type,
            quantity_in_stock: formData.quantity_in_stock,
            unit_cost: formData.unit_cost,
            reorder_point: formData.reorder_point
          });
        if (error) throw error;
      }
      await queryClient.invalidateQueries({ queryKey: ["rawMaterials"] });
    } catch (error: any) {
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    try {
      const { error } = await supabase
        .from("raw_materials")
        .delete()
        .eq("id", selectedItem.id);
      
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["rawMaterials"] });
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
          <h2 className="text-3xl font-bold tracking-tight">Raw Materials</h2>
          <p className="text-muted-foreground">
            Manage your raw materials inventory
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Raw Material
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={rawMaterials || []}
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
        type="raw"
      />
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the raw material
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

export default RawMaterials;
