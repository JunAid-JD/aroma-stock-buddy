
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, getChannelName } from "@/integrations/supabase/client";
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
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const { data: rawMaterials, isLoading, error } = useQuery({
    queryKey: ["rawMaterials"],
    queryFn: async () => {
      console.log("Fetching raw materials from Supabase...");
      const { data, error } = await supabase
        .from("raw_materials")
        .select("*")
        .order("name");
      
      if (error) {
        console.error("Error fetching raw materials:", error);
        setDebugInfo({ error: error.message, details: error });
        throw error;
      }
      
      console.log("Raw materials fetched successfully:", data);
      setDebugInfo({ count: data?.length, sample: data?.[0] });
      
      return data.map(item => ({
        ...item,
        total_value: item.total_value ? `Rs. ${item.total_value.toFixed(2)}` : 'Rs. 0.00',
        unit_cost: `Rs. ${item.unit_cost.toFixed(2)}`
      }));
    },
    retry: 1,
    staleTime: 30000,
  });

  // Listen for realtime updates
  useEffect(() => {
    console.log("Setting up realtime subscription for raw_materials table");
    const channelName = getChannelName("raw_materials");
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'raw_materials'
        },
        (payload) => {
          console.log("Realtime update received:", payload);
          queryClient.invalidateQueries({ queryKey: ["rawMaterials"] });
        }
      )
      .subscribe((status) => {
        console.log(`Realtime subscription status: ${status}`);
      });   

    return () => {
      console.log("Cleaning up realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleSubmit = async (formData: any) => {
    try {
      console.log("Submitting form data:", formData);
      
      if (selectedItem) {
        console.log(`Updating raw material with ID: ${selectedItem.id}`);
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
          
        if (error) {
          console.error("Error updating raw material:", error);
          throw error;
        }
        
        toast({
          title: "Success",
          description: "Raw material updated successfully.",
        });
      } else {
        console.log("Creating new raw material");
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
          
        if (error) {
          console.error("Error creating raw material:", error);
          throw error;
        }
        
        toast({
          title: "Success",
          description: "Raw material created successfully.",
        });
      }
      
      await queryClient.invalidateQueries({ queryKey: ["rawMaterials"] });
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Error in handleSubmit:", error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    try {
      console.log(`Deleting raw material with ID: ${selectedItem.id}`);
      const { error } = await supabase
        .from("raw_materials")
        .delete()
        .eq("id", selectedItem.id);
      
      if (error) {
        console.error("Error deleting raw material:", error);
        throw error;
      }

      await queryClient.invalidateQueries({ queryKey: ["rawMaterials"] });
      toast({
        title: "Success",
        description: "Item deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      console.error("Error in handleDelete:", error);
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

  if (error) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <h2 className="text-3xl font-bold tracking-tight text-red-600">Error Loading Raw Materials</h2>
        <p className="text-muted-foreground">{(error as Error).message}</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["rawMaterials"] })}>
          Retry
        </Button>
        {debugInfo && (
          <div className="mt-4 p-4 bg-slate-100 rounded-md">
            <h3 className="text-lg font-semibold mb-2">Debug Information</h3>
            <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  }

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
      
      {debugInfo && (
        <div className="p-2 bg-slate-50 rounded-md text-xs">
          <p>Debug: {rawMaterials ? `${rawMaterials.length} items loaded` : 'No data'}</p>
          <pre className="whitespace-pre-wrap overflow-auto max-h-24">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
      
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
      
      <div className="mt-4">
        <Button 
          variant="outline" 
          onClick={() => {
            console.log("Manual refresh triggered");
            queryClient.invalidateQueries({ queryKey: ["rawMaterials"] });
            toast({
              title: "Refreshing",
              description: "Fetching latest data from server.",
            });
          }}
        >
          Refresh Data
        </Button>
      </div>
    </div>
  );
};

export default RawMaterials;
