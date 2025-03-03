
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import DependencyForm from "@/components/dependency/DependencyForm";

const SKUDependencyMapping = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedDependency, setSelectedDependency] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all SKU dependencies
  const { data: dependencies, isLoading } = useQuery({
    queryKey: ["skuDependencies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sku_dependencies")
        .select(`
          id,
          item_type,
          quantity_required,
          finished_product_id,
          raw_material_id,
          packaging_item_id,
          finished_products (id, name, sku),
          raw_materials (id, name, sku),
          packaging_items (id, name, sku)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch all finished products for the dropdown
  const { data: finishedProducts } = useQuery({
    queryKey: ["finishedProducts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finished_products")
        .select("id, name, sku");

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch all raw materials for the dropdown
  const { data: rawMaterials } = useQuery({
    queryKey: ["rawMaterials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("raw_materials")
        .select("id, name, sku");

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch all packaging items for the dropdown
  const { data: packagingItems } = useQuery({
    queryKey: ["packagingItems"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packaging_items")
        .select("id, name, sku");

      if (error) throw error;
      return data || [];
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
          table: 'sku_dependencies'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["skuDependencies"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Group dependencies by finished product
  const groupedDependencies = dependencies?.reduce((acc: any, dependency: any) => {
    const finishedProductId = dependency.finished_product_id;
    if (!acc[finishedProductId]) {
      const finishedProduct = dependency.finished_products;
      acc[finishedProductId] = {
        id: finishedProductId,
        name: finishedProduct?.name || "Unknown Product",
        sku: finishedProduct?.sku || "Unknown SKU",
        dependencies: []
      };
    }
    
    let componentDetails;
    if (dependency.item_type === 'raw_material') {
      componentDetails = dependency.raw_materials;
    } else if (dependency.item_type === 'packaging') {
      componentDetails = dependency.packaging_items;
    }
    
    acc[finishedProductId].dependencies.push({
      id: dependency.id,
      type: dependency.item_type,
      name: componentDetails?.name || "Unknown",
      sku: componentDetails?.sku || "Unknown",
      quantity: dependency.quantity_required
    });
    
    return acc;
  }, {});

  const handleAdd = () => {
    setSelectedDependency(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (dependency: any) => {
    setSelectedDependency(dependency);
    setIsDialogOpen(true);
  };

  const handleDelete = (dependency: any) => {
    setSelectedDependency(dependency);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedDependency) return;

    try {
      const { error } = await supabase
        .from("sku_dependencies")
        .delete()
        .eq("id", selectedDependency.id);
      
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["skuDependencies"] });
      toast({
        title: "Success",
        description: "Dependency mapping deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
      setSelectedDependency(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete dependency mapping.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (formData: any) => {
    try {
      console.log("Form data to be submitted:", formData);
      
      // Validate form data
      if (!formData.finished_product_id) {
        throw new Error("Please select a finished product");
      }
      
      if (!formData.item_type) {
        throw new Error("Please select a component type");
      }
      
      if (formData.item_type === 'raw_material' && !formData.raw_material_id) {
        throw new Error("Please select a raw material");
      }
      
      if (formData.item_type === 'packaging' && !formData.packaging_item_id) {
        throw new Error("Please select a packaging item");
      }
      
      if (!formData.quantity_required || formData.quantity_required <= 0) {
        throw new Error("Please enter a valid quantity greater than 0");
      }

      // Format data for insertion
      let insertData: any = {
        finished_product_id: formData.finished_product_id,
        item_type: formData.item_type,
        quantity_required: formData.quantity_required,
      };
      
      if (formData.item_type === 'raw_material') {
        insertData.raw_material_id = formData.raw_material_id;
      } else if (formData.item_type === 'packaging') {
        insertData.packaging_item_id = formData.packaging_item_id;
      }

      console.log("Data to be inserted/updated:", insertData);
      
      // If we're creating a new finished product
      if (formData.finished_product_id === "new" && formData.new_product_name && formData.new_product_sku) {
        console.log("Creating new finished product");
        
        const { data: productData, error: productError } = await supabase
          .from("finished_products")
          .insert({
            name: formData.new_product_name,
            sku: formData.new_product_sku,
            volume_config: formData.volume_config || 'essential_10ml',
            quantity_in_stock: 0,
            unit_price: 0,
          })
          .select('id')
          .single();
        
        if (productError) {
          console.error("Error creating product:", productError);
          throw productError;
        }
        
        if (!productData || !productData.id) {
          throw new Error("Failed to create new product");
        }
        
        console.log("New product created with ID:", productData.id);
        insertData.finished_product_id = productData.id;
      }

      if (selectedDependency) {
        // Update existing dependency
        const { error } = await supabase
          .from("sku_dependencies")
          .update(insertData)
          .eq("id", selectedDependency.id);
        
        if (error) throw error;
      } else {
        // Create new dependency
        const { error } = await supabase
          .from("sku_dependencies")
          .insert(insertData);
        
        if (error) {
          console.error("Error inserting dependency:", error);
          throw error;
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["skuDependencies"] });
      await queryClient.invalidateQueries({ queryKey: ["finishedProducts"] });
      toast({
        title: "Success",
        description: `Dependency mapping ${selectedDependency ? "updated" : "added"} successfully.`,
      });
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Error in handleSubmit:", error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">SKU Dependency Mapping</h2>
          <p className="text-muted-foreground">
            Define what components are needed for each finished product
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Dependency
        </Button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : !groupedDependencies || Object.keys(groupedDependencies).length === 0 ? (
        <div className="text-center py-10 bg-muted rounded-lg">
          <h3 className="text-lg font-medium">No dependencies defined yet</h3>
          <p className="text-muted-foreground mt-2">
            Add a new dependency to define what components are needed for your finished products.
          </p>
          <Button onClick={handleAdd} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Dependency
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.values(groupedDependencies).map((product: any) => (
            <div key={product.id} className="border rounded-lg overflow-hidden">
              <div className="bg-muted px-4 py-3 flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleAdd}>
                  <Plus className="mr-2 h-3 w-3" />
                  Add Component
                </Button>
              </div>
              <div className="p-4">
                <div className="divide-y">
                  {product.dependencies.map((dependency: any) => (
                    <div key={dependency.id} className="py-3 flex justify-between items-center">
                      <div>
                        <div className="flex items-center">
                          <span className={`w-2 h-2 rounded-full mr-2 ${
                            dependency.type === 'raw_material' ? 'bg-blue-500' : 'bg-green-500'
                          }`}></span>
                          <span className="font-medium">{dependency.name}</span>
                        </div>
                        <div className="text-sm text-muted-foreground flex mt-1">
                          <div className="mr-4">Type: {dependency.type === 'raw_material' ? 'Raw Material' : 'Packaging'}</div>
                          <div className="mr-4">SKU: {dependency.sku}</div>
                          <div>Quantity: {dependency.quantity}</div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(dependency)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(dependency)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDependency ? "Edit" : "Add"} SKU Dependency
            </DialogTitle>
            <DialogDescription>
              Define what components are needed for each finished product. This helps with inventory tracking during production.
            </DialogDescription>
          </DialogHeader>
          <DependencyForm
            finishedProducts={finishedProducts || []}
            rawMaterials={rawMaterials || []}
            packagingItems={packagingItems || []}
            selectedDependency={selectedDependency}
            onSubmit={handleSubmit}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this dependency mapping.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </Dialog>
    </div>
  );
};

export default SKUDependencyMapping;
