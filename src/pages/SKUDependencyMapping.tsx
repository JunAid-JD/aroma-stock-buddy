
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import SKUDependencyForm from "@/components/SKUDependencyForm";
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
  { key: "finished_product_sku", label: "Product SKU" },
  { key: "finished_product_name", label: "Product Name" },
  { key: "raw_materials_summary", label: "Raw Materials" },
  { key: "packaging_items_summary", label: "Packaging Items" },
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
      // Get finished products with their dependencies
      const { data: products, error: productsError } = await supabase
        .from("finished_products")
        .select("id, name, sku")
        .order("name");

      if (productsError) throw productsError;
      
      // For each product, get raw materials and packaging items
      const dependenciesPromises = products.map(async (product) => {
        // Get raw materials
        const { data: rawMaterials, error: rawError } = await supabase
          .from("sku_dependencies")
          .select(`
            id,
            quantity_required,
            component_type,
            raw_materials:raw_material_id(id, name, sku)
          `)
          .eq("finished_product_id", product.id)
          .eq("component_type", "raw_material")
          .not("raw_material_id", "is", null);

        if (rawError) throw rawError;

        // Get packaging items
        const { data: packagingItems, error: packagingError } = await supabase
          .from("sku_dependencies")
          .select(`
            id,
            quantity_required,
            component_type,
            packaging_items:packaging_item_id(id, name, sku, type, size)
          `)
          .eq("finished_product_id", product.id)
          .eq("component_type", "packaging")
          .not("packaging_item_id", "is", null);

        if (packagingError) throw packagingError;

        // Only include products that have at least one dependency
        if (rawMaterials.length === 0 && packagingItems.length === 0) {
          return null;
        }

        // Format raw materials summary
        const rawMaterialsSummary = rawMaterials
          .map((item) => {
            if (!item.raw_materials) return null;
            return `${item.raw_materials.name} (${item.quantity_required})`;
          })
          .filter(Boolean)
          .join(", ");

        // Format packaging items summary
        const packagingItemsSummary = packagingItems
          .map((item) => {
            if (!item.packaging_items) return null;
            return `${item.packaging_items.name} (${item.quantity_required})`;
          })
          .filter(Boolean)
          .join(", ");

        return {
          finished_product_id: product.id,
          finished_product_name: product.name,
          finished_product_sku: product.sku,
          raw_materials: rawMaterials,
          packaging_items: packagingItems,
          raw_materials_summary: rawMaterialsSummary || "None",
          packaging_items_summary: packagingItemsSummary || "None",
          updated_at: new Date().toISOString(), // Use the most recent update time
        };
      });

      const results = await Promise.all(dependenciesPromises);
      return results.filter(Boolean); // Filter out null values
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
        // Delete existing dependencies for this product
        const { error: deleteRawError } = await supabase
          .from("sku_dependencies")
          .delete()
          .eq("finished_product_id", formData.finished_product_id)
          .eq("component_type", "raw_material");
        
        if (deleteRawError) throw deleteRawError;
        
        const { error: deletePackagingError } = await supabase
          .from("sku_dependencies")
          .delete()
          .eq("finished_product_id", formData.finished_product_id)
          .eq("component_type", "packaging");
        
        if (deletePackagingError) throw deletePackagingError;
      }

      // Insert raw materials
      if (formData.raw_materials && formData.raw_materials.length > 0) {
        const rawMaterialsData = formData.raw_materials.map((item: any) => ({
          finished_product_id: formData.finished_product_id,
          raw_material_id: item.raw_material_id,
          quantity_required: item.quantity_required,
          component_type: 'raw_material'
        }));

        const { error: rawInsertError } = await supabase
          .from("sku_dependencies")
          .insert(rawMaterialsData);
        
        if (rawInsertError) throw rawInsertError;
      }

      // Insert packaging items
      if (formData.packaging_items && formData.packaging_items.length > 0) {
        const packagingItemsData = formData.packaging_items.map((item: any) => ({
          finished_product_id: formData.finished_product_id,
          packaging_item_id: item.packaging_item_id,
          quantity_required: item.quantity_required,
          component_type: 'packaging'
        }));

        const { error: packagingInsertError } = await supabase
          .from("sku_dependencies")
          .insert(packagingItemsData);
        
        if (packagingInsertError) throw packagingInsertError;
      }

      await queryClient.invalidateQueries({ queryKey: ["dependencies"] });
      await queryClient.invalidateQueries({ queryKey: ["finishedProducts"] });
      
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
      // Delete all dependencies for this product
      const { error: deleteError } = await supabase
        .from("sku_dependencies")
        .delete()
        .eq("finished_product_id", selectedDependency.finished_product_id);
      
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
            Define product compositions and calculate costs
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Dependency
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={dependencies || []}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

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
              This action cannot be undone. This will permanently delete all dependencies
              for this product.
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
