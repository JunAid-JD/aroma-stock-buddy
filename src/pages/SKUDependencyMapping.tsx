
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import DependencyForm from "@/components/dependency/DependencyForm";

const columns = [
  { key: "fg_sku", label: "FG SKU" },
  { key: "components_summary", label: "Components" },
  { key: "created_at", label: "Created At", isDate: true },
  { key: "updated_at", label: "Updated At", isDate: true },
];

const SKUDependencyMapping = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDependency, setSelectedDependency] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: dependencies, isLoading } = useQuery({
    queryKey: ["skuDependencies"],
    queryFn: async () => {
      const { data: dependencies, error } = await supabase
        .from("sku_dependencies")
        .select(`
          id,
          finished_product_id,
          raw_material_id,
          packaging_item_id,
          item_type,
          quantity_required,
          created_at,
          updated_at,
          finished_products:finished_product_id (sku),
          raw_materials:raw_material_id (sku, name),
          packaging_items:packaging_item_id (sku, name)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching dependencies:", error);
        throw error;
      }

      // Group dependencies by finished product ID
      const groupedDependencies = dependencies.reduce((acc, dep) => {
        const fpId = dep.finished_product_id;
        if (!acc[fpId]) {
          acc[fpId] = {
            id: fpId,
            finished_product_id: fpId,
            fg_sku: dep.finished_products?.sku || "Unknown",
            components: [],
            created_at: dep.created_at,
            updated_at: dep.updated_at,
          };
        }

        // Add component information
        if (dep.item_type === "raw_material" && dep.raw_materials) {
          acc[fpId].components.push({
            id: dep.id,
            type: "raw_material",
            item_id: dep.raw_material_id,
            sku: dep.raw_materials.sku,
            name: dep.raw_materials.name,
            quantity: dep.quantity_required,
          });
        } else if (dep.item_type === "packaging" && dep.packaging_items) {
          acc[fpId].components.push({
            id: dep.id,
            type: "packaging",
            item_id: dep.packaging_item_id,
            sku: dep.packaging_items.sku,
            name: dep.packaging_items.name,
            quantity: dep.quantity_required,
          });
        }

        return acc;
      }, {});

      // Convert to array and add components summary
      const formattedDependencies = Object.values(groupedDependencies).map((dep: any) => ({
        ...dep,
        components_summary: dep.components
          .map((comp: any) => `${comp.name} (${comp.sku}) x${comp.quantity}`)
          .join(", "),
      }));

      return formattedDependencies;
    },
  });

  const handleAdd = () => {
    setSelectedDependency(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (dependency: any) => {
    setSelectedDependency(dependency);
    setIsDialogOpen(true);
  };

  const handleDelete = async (dependency: any) => {
    try {
      if (!dependency.finished_product_id) {
        toast({
          title: "Error",
          description: "Missing finished product ID",
          variant: "destructive",
        });
        return;
      }

      // Delete all dependencies for this finished product
      const { error } = await supabase
        .from("sku_dependencies")
        .delete()
        .eq("finished_product_id", dependency.finished_product_id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["skuDependencies"] });
      
      toast({
        title: "Success",
        description: "Dependency mapping deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting dependency:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete dependency",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (formData: any) => {
    try {
      console.log("Form data submitted:", formData);

      let finishedProductId = formData.finished_product_id;
      
      if (!finishedProductId && formData.fg_sku) {
        // Create a new finished product
        const { data: newProduct, error: productError } = await supabase
          .from("finished_products")
          .insert({
            sku: formData.fg_sku,
            name: formData.fg_sku, // Using SKU as name for now
            quantity_in_stock: 0,
            unit_price: 0
          })
          .select()
          .single();

        if (productError) {
          console.error("Error creating finished product:", productError);
          throw productError;
        }
        
        finishedProductId = newProduct.id;
        console.log("Created new finished product with ID:", finishedProductId);
      }

      if (!finishedProductId) {
        throw new Error("No finished product ID provided or created");
      }

      // If editing, delete existing dependencies
      if (selectedDependency) {
        const { error: deleteError } = await supabase
          .from("sku_dependencies")
          .delete()
          .eq("finished_product_id", selectedDependency.finished_product_id);

        if (deleteError) throw deleteError;
      }

      // Insert new dependencies for raw materials
      if (formData.rawMaterials && formData.rawMaterials.length > 0) {
        const rawMaterialDeps = formData.rawMaterials.map((rm: any) => ({
          finished_product_id: finishedProductId,
          raw_material_id: rm.item_id,
          item_type: "raw_material",
          quantity_required: parseFloat(rm.quantity) || 1,
          packaging_item_id: null
        }));

        console.log("Inserting raw material dependencies:", rawMaterialDeps);
        const { error: rmError } = await supabase
          .from("sku_dependencies")
          .insert(rawMaterialDeps);

        if (rmError) {
          console.error("Error inserting raw material dependencies:", rmError);
          throw rmError;
        }
      }

      // Insert new dependencies for packaging items
      if (formData.packagingItems && formData.packagingItems.length > 0) {
        const packagingDeps = formData.packagingItems.map((pkg: any) => ({
          finished_product_id: finishedProductId,
          packaging_item_id: pkg.item_id,
          item_type: "packaging",
          quantity_required: parseFloat(pkg.quantity) || 1,
          raw_material_id: null
        }));

        console.log("Inserting packaging dependencies:", packagingDeps);
        const { error: pkgError } = await supabase
          .from("sku_dependencies")
          .insert(packagingDeps);

        if (pkgError) {
          console.error("Error inserting packaging dependencies:", pkgError);
          throw pkgError;
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["skuDependencies"] });
      await queryClient.invalidateQueries({ queryKey: ["finishedProducts"] });
      
      toast({
        title: "Success",
        description: `Dependency mapping ${selectedDependency ? "updated" : "added"} successfully`,
      });
      
      setIsDialogOpen(false);

    } catch (error: any) {
      console.error("Error saving dependency:", error);
      toast({
        title: "Error",
        description: error.message || "An error occurred while saving the dependency mapping",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setSelectedDependency(null);
  };

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

      <DataTable
        columns={columns}
        data={dependencies || []}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDependency ? "Edit" : "Add"} SKU Dependency
            </DialogTitle>
            <DialogDescription>
              Define the components required to produce a finished product.
            </DialogDescription>
          </DialogHeader>
          <DependencyForm
            dependency={selectedDependency}
            onSubmit={handleSubmit}
            onClose={handleClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SKUDependencyMapping;
