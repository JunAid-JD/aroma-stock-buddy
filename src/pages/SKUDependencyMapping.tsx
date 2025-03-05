
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import SKUDependencyForm from "@/components/SKUDependencyForm";
import DataTable from "@/components/DataTable";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const columns = [
  { key: "product_sku", label: "FG SKU" },
  { key: "component_name", label: "Components" },
  { key: "created_at", label: "Created At", isDate: true },
  { key: "updated_at", label: "Updated At", isDate: true },
];

const SKUDependencyMapping = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDependency, setSelectedDependency] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all dependencies with joined data
  const { data: skuDependencies, isLoading } = useQuery({
    queryKey: ["skuDependencies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sku_dependencies")
        .select(`
          id,
          component_type,
          quantity_required,
          created_at,
          updated_at,
          finished_products:finished_product_id(id, name, sku),
          raw_materials:raw_material_id(id, name, sku),
          packaging_items:packaging_item_id(id, name, type, size)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform data for table display
      return data.map((dependency) => {
        const finished_product = dependency.finished_products;
        const raw_material = dependency.raw_materials;
        const packaging_item = dependency.packaging_items;

        let component_name = "";
        let product_sku = "";

        if (finished_product) {
          product_sku = finished_product.sku;
        }

        if (dependency.component_type === "raw_material" && raw_material) {
          component_name = `${raw_material.name} (${dependency.quantity_required} ${raw_material.sku})`;
        } else if (dependency.component_type === "packaging" && packaging_item) {
          component_name = `${packaging_item.name} (${dependency.quantity_required} ${packaging_item.type})`;
        }

        return {
          id: dependency.id,
          product_sku,
          component_name,
          component_type: dependency.component_type,
          quantity_required: dependency.quantity_required,
          finished_product_id: finished_product?.id,
          finished_product_name: finished_product?.name,
          raw_material_id: raw_material?.id,
          packaging_item_id: packaging_item?.id,
          created_at: dependency.created_at,
          updated_at: dependency.updated_at,
        };
      });
    },
  });

  // Fetch raw materials for form
  const { data: rawMaterials } = useQuery({
    queryKey: ["rawMaterials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("raw_materials")
        .select("id, name, sku, type")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  // Fetch packaging items for form
  const { data: packagingItems } = useQuery({
    queryKey: ["packagingItems"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packaging_items")
        .select("id, name, sku, type, size")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  // Fetch finished products for form
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

  const handleAdd = () => {
    setSelectedDependency(null);
    setIsFormOpen(true);
  };

  const handleEdit = (dependency: any) => {
    setSelectedDependency(dependency);
    setIsFormOpen(true);
  };

  const handleDelete = (dependency: any) => {
    setSelectedDependency(dependency);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedDependency) return;

    try {
      const { error } = await supabase
        .from("sku_dependencies")
        .delete()
        .eq("id", selectedDependency.id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["skuDependencies"] });
      await queryClient.invalidateQueries({ queryKey: ["finishedProducts"] });
      
      toast({
        title: "Dependency deleted",
        description: "SKU dependency has been deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete dependency",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      // If it's an update to an existing dependency
      if (selectedDependency) {
        const { error } = await supabase
          .from("sku_dependencies")
          .update({
            quantity_required: formData.quantity_required,
            updated_at: new Date().toISOString(),
          })
          .eq("id", formData.id);

        if (error) throw error;

        toast({
          title: "Dependency updated",
          description: "SKU dependency has been updated successfully",
        });
      } else {
        // Check if we need to create a finished product first
        if (formData.sku && !formData.finished_product_id) {
          // Check if product with this SKU already exists
          const { data: existingProduct, error: checkError } = await supabase
            .from("finished_products")
            .select("id")
            .eq("sku", formData.sku)
            .maybeSingle();
            
          if (checkError) throw checkError;

          if (existingProduct) {
            // Use existing product
            formData.finished_product_id = existingProduct.id;
          } else {
            // Create new product based on SKU
            const name = formData.sku.split('-')[0] || formData.sku;
            
            const { data: newProduct, error: createError } = await supabase
              .from("finished_products")
              .insert({
                sku: formData.sku,
                name: name,
                quantity_in_stock: 0
              })
              .select("id")
              .single();
              
            if (createError) throw createError;
            
            formData.finished_product_id = newProduct.id;
          }
        }

        // For new dependencies, process each component type separately
        const { finished_product_id, raw_materials, packaging_items } = formData;

        // Insert raw material dependencies
        if (raw_materials && raw_materials.length > 0) {
          const rawMaterialInserts = raw_materials
            .filter((item: any) => item.raw_material_id && item.quantity_required > 0)
            .map((item: any) => ({
              finished_product_id,
              raw_material_id: item.raw_material_id,
              component_type: "raw_material",
              item_type: "raw_material",
              quantity_required: item.quantity_required,
            }));

          if (rawMaterialInserts.length > 0) {
            const { error: rawError } = await supabase
              .from("sku_dependencies")
              .insert(rawMaterialInserts);

            if (rawError) throw rawError;
          }
        }

        // Insert packaging dependencies
        if (packaging_items && packaging_items.length > 0) {
          const packagingInserts = packaging_items
            .filter((item: any) => item.packaging_item_id && item.quantity_required > 0)
            .map((item: any) => ({
              finished_product_id,
              packaging_item_id: item.packaging_item_id,
              component_type: "packaging",
              item_type: "packaging",
              quantity_required: item.quantity_required,
            }));

          if (packagingInserts.length > 0) {
            const { error: pkgError } = await supabase
              .from("sku_dependencies")
              .insert(packagingInserts);

            if (pkgError) throw pkgError;
          }
        }

        toast({
          title: "Dependencies created",
          description: "SKU dependencies have been created successfully",
        });
      }

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ["skuDependencies"] });
      await queryClient.invalidateQueries({ queryKey: ["finishedProducts"] });

      // Close the form
      setIsFormOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save dependency",
        variant: "destructive",
      });
    }
  };

  // Filter dependencies by search query
  const filteredDependencies = searchQuery
    ? skuDependencies?.filter(
        (dep) =>
          dep.product_sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dep.component_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : skuDependencies;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">SKU Dependency Mapping</h2>
          <p className="text-muted-foreground">
            Map finished products to their raw material and packaging requirements
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Dependency
        </Button>
      </div>

      <div className="flex items-center mb-4">
        <Input
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredDependencies || []}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-hidden">
          {!selectedDependency && (
            <DialogHeader>
              <DialogTitle>Add SKU Dependency</DialogTitle>
            </DialogHeader>
          )}
          {rawMaterials && packagingItems && finishedProducts && (
            <SKUDependencyForm
              onSubmit={handleFormSubmit}
              onClose={() => setIsFormOpen(false)}
              selectedDependency={selectedDependency}
              rawMaterials={rawMaterials}
              packagingItems={packagingItems}
              finishedProducts={finishedProducts}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              selected dependency and may affect inventory calculations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SKUDependencyMapping;
