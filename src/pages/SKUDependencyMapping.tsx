
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import SKUDependencyForm from "@/components/SKUDependencyForm";
import { Input } from "@/components/ui/input";

const columns = [
  { key: "finished_product_name", label: "Finished Product" },
  { key: "component_type", label: "Component Type" },
  { key: "component_name", label: "Component Name" },
  { key: "quantity_required", label: "Quantity Required" },
  { key: "updated_at", label: "Last Updated", isDate: true },
];

const SKUDependencyMapping = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDependency, setSelectedDependency] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: dependencies, isLoading } = useQuery({
    queryKey: ["dependencies"],
    queryFn: async () => {
      // Get all dependencies
      const { data: rawDependencies, error: rawError } = await supabase
        .from("sku_dependencies")
        .select(`
          id,
          finished_product_id,
          item_type,
          quantity_required,
          updated_at,
          raw_material_id,
          packaging_item_id,
          finished_products:finished_product_id(id, name, sku),
          raw_materials:raw_material_id(id, name, sku),
          packaging_items:packaging_item_id(id, name, sku, type, size)
        `)
        .order("finished_product_id");

      if (rawError) throw rawError;

      // Transform the data for the table view
      const transformedData = rawDependencies.map(dep => {
        let componentName = "";
        let componentType = dep.item_type;

        if (dep.item_type === "raw_material" && dep.raw_materials) {
          componentName = dep.raw_materials.name || dep.raw_materials.sku;
        } else if (dep.item_type === "packaging" && dep.packaging_items) {
          componentName = dep.packaging_items.name || dep.packaging_items.sku;
        }

        return {
          id: dep.id,
          finished_product_id: dep.finished_product_id,
          finished_product_name: dep.finished_products?.name || "Unknown",
          component_type: componentType,
          component_name: componentName,
          quantity_required: dep.quantity_required,
          updated_at: dep.updated_at,
          raw_material_id: dep.raw_material_id,
          packaging_item_id: dep.packaging_item_id,
        };
      });

      return transformedData;
    },
  });

  const { data: rawMaterials } = useQuery({
    queryKey: ["rawMaterials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("raw_materials")
        .select("id, name, sku, unit_cost")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: packagingItems } = useQuery({
    queryKey: ["packagingItems"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packaging_items")
        .select("id, name, sku, type, size, unit_cost")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: finishedProducts } = useQuery({
    queryKey: ["finishedProducts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finished_products")
        .select("id, name, sku")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (formData: any) => {
    try {
      if (selectedDependency) {
        // Update existing dependency
        const { error: updateError } = await supabase
          .from("sku_dependencies")
          .update({
            quantity_required: formData.quantity_required,
            updated_at: new Date().toISOString()
          })
          .eq("id", selectedDependency.id);
        
        if (updateError) throw updateError;
      } else {
        // Insert raw materials
        if (formData.raw_materials && formData.raw_materials.length > 0) {
          const rawMaterialsData = formData.raw_materials
            .filter((item: any) => item.raw_material_id && item.quantity_required > 0)
            .map((item: any) => ({
              finished_product_id: formData.finished_product_id,
              raw_material_id: item.raw_material_id,
              quantity_required: item.quantity_required,
              item_type: 'raw_material' as const
            }));

          if (rawMaterialsData.length > 0) {
            const { error: rawInsertError } = await supabase
              .from("sku_dependencies")
              .insert(rawMaterialsData);
            
            if (rawInsertError) throw rawInsertError;
          }
        }

        // Insert packaging items
        if (formData.packaging_items && formData.packaging_items.length > 0) {
          const packagingItemsData = formData.packaging_items
            .filter((item: any) => item.packaging_item_id && item.quantity_required > 0)
            .map((item: any) => ({
              finished_product_id: formData.finished_product_id,
              packaging_item_id: item.packaging_item_id,
              quantity_required: item.quantity_required,
              item_type: 'packaging' as const
            }));

          if (packagingItemsData.length > 0) {
            const { error: packagingInsertError } = await supabase
              .from("sku_dependencies")
              .insert(packagingItemsData);
            
            if (packagingInsertError) throw packagingInsertError;
          }
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["dependencies"] });
      
      toast({
        title: "Success",
        description: `Dependency ${selectedDependency ? "updated" : "created"} successfully.`,
      });
      
      setIsDialogOpen(false);
      setSelectedDependency(null);
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save dependency.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedDependency) return;

    try {
      // Delete the dependency
      const { error: deleteError } = await supabase
        .from("sku_dependencies")
        .delete()
        .eq("id", selectedDependency.id);
      
      if (deleteError) throw deleteError;

      await queryClient.invalidateQueries({ queryKey: ["dependencies"] });
      
      toast({
        title: "Success",
        description: "Dependency deleted successfully.",
      });
      
      setIsDeleteDialogOpen(false);
      setSelectedDependency(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete dependency.",
        variant: "destructive",
      });
    }
  };

  const handleAdd = () => {
    setSelectedDependency(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (dependency: any) => {
    setSelectedDependency(dependency);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (dependency: any) => {
    setSelectedDependency(dependency);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">SKU Dependency Mapping</h2>
          <p className="text-muted-foreground">
            Manage relationships between finished products and their components
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Dependency
        </Button>
      </div>

      <div className="bg-white rounded-md border p-4">
        <div className="pb-4">
          <Input 
            placeholder="Search..." 
            className="max-w-sm" 
          />
        </div>
        <DataTable
          columns={columns}
          data={dependencies || []}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedDependency ? "Edit" : "Add"} SKU Dependency
            </DialogTitle>
          </DialogHeader>
          <SKUDependencyForm
            onSubmit={handleSubmit}
            onClose={() => setIsDialogOpen(false)}
            selectedDependency={selectedDependency}
            rawMaterials={rawMaterials || []}
            packagingItems={packagingItems || []}
            finishedProducts={finishedProducts || []}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this dependency.
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

export default SKUDependencyMapping;
