
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Plus, Trash, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const columns = [
  { key: "finished_product_name", label: "Finished Product" },
  { key: "finished_product_sku", label: "SKU" },
  { key: "components_summary", label: "Components" },
  { key: "updated_at", label: "Last Updated", isDate: true },
];

const SKUDependencyMapping = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDependency, setSelectedDependency] = useState<any>(null);
  const [newFinishedProductSku, setNewFinishedProductSku] = useState("");
  const [newFinishedProductName, setNewFinishedProductName] = useState("");
  const [selectedFinishedProduct, setSelectedFinishedProduct] = useState<string | null>(null);
  const [components, setComponents] = useState<Array<{
    id: string;
    type: "raw_material" | "packaging";
    item_id: string;
    quantity_required: number;
  }>>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: dependencies, isLoading } = useQuery({
    queryKey: ["skuDependencies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sku_dependencies")
        .select(`
          id, 
          quantity_required,
          item_type,
          updated_at,
          finished_products(id, name, sku),
          raw_materials(id, name, sku),
          packaging_items(id, name, type, size, sku)
        `)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Group dependencies by finished product
      const groupedDeps = data.reduce((acc: any, dep) => {
        const finishedProductId = dep.finished_products?.id;
        if (!finishedProductId) return acc;
        
        if (!acc[finishedProductId]) {
          acc[finishedProductId] = {
            id: finishedProductId,
            finished_product_name: dep.finished_products?.name || 'Unknown Product',
            finished_product_sku: dep.finished_products?.sku || 'Unknown SKU',
            components: [],
            updated_at: dep.updated_at
          };
        }
        
        // Add component info
        if (dep.item_type === 'raw_material' && dep.raw_materials) {
          acc[finishedProductId].components.push({
            id: dep.id,
            type: 'raw_material',
            name: dep.raw_materials.name,
            sku: dep.raw_materials.sku,
            quantity: dep.quantity_required
          });
        } else if (dep.item_type === 'packaging' && dep.packaging_items) {
          acc[finishedProductId].components.push({
            id: dep.id,
            type: 'packaging',
            name: `${dep.packaging_items.name} (${dep.packaging_items.type} - ${dep.packaging_items.size})`,
            sku: dep.packaging_items.sku,
            quantity: dep.quantity_required
          });
        }
        
        return acc;
      }, {});
      
      // Convert to array and add components summary
      return Object.values(groupedDeps).map((item: any) => ({
        ...item,
        components_summary: item.components.map((comp: any) => 
          `${comp.name} (${comp.sku}) x${comp.quantity}`
        ).join(", ")
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

  const { data: finishedProducts } = useQuery({
    queryKey: ["finishedProducts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finished_products")
        .select("id, name, sku")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: rawMaterials } = useQuery({
    queryKey: ["rawMaterials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("raw_materials")
        .select("id, name, sku")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: packagingItems } = useQuery({
    queryKey: ["packagingItems"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packaging_items")
        .select("id, name, sku, type, size")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let finishedProductId = selectedFinishedProduct;
      
      // If creating new finished product
      if (!finishedProductId && newFinishedProductSku) {
        const { data: existingProduct, error: checkError } = await supabase
          .from("finished_products")
          .select("id")
          .eq("sku", newFinishedProductSku)
          .maybeSingle();
          
        if (checkError) throw checkError;
        
        if (existingProduct) {
          finishedProductId = existingProduct.id;
        } else {
          // Create new finished product entry
          const { data: newProduct, error: insertError } = await supabase
            .from("finished_products")
            .insert({
              name: newFinishedProductName || `Product ${newFinishedProductSku}`,
              sku: newFinishedProductSku,
              type: "essential_oil" // Default type
            })
            .select('id')
            .single();
            
          if (insertError) throw insertError;
          finishedProductId = newProduct.id;
        }
      }
      
      if (!finishedProductId) {
        throw new Error("No finished product selected or created");
      }
      
      // Handle components
      if (components.length === 0) {
        throw new Error("Please add at least one component");
      }
      
      if (selectedDependency) {
        // First delete existing dependencies
        const { error: deleteError } = await supabase
          .from("sku_dependencies")
          .delete()
          .eq("finished_product_id", finishedProductId);
        
        if (deleteError) throw deleteError;
      }
      
      // Insert new dependencies
      const dependencyItems = components.map(comp => {
        const baseData = {
          finished_product_id: finishedProductId,
          item_type: comp.type,
          quantity_required: comp.quantity_required
        };
        
        if (comp.type === 'raw_material') {
          return {
            ...baseData,
            raw_material_id: comp.item_id,
            packaging_item_id: null
          };
        } else {
          return {
            ...baseData,
            packaging_item_id: comp.item_id,
            raw_material_id: null
          };
        }
      });
      
      const { error: insertError } = await supabase
        .from("sku_dependencies")
        .insert(dependencyItems);
      
      if (insertError) throw insertError;

      await queryClient.invalidateQueries({ queryKey: ["skuDependencies"] });
      await queryClient.invalidateQueries({ queryKey: ["finishedProducts"] });
      
      toast({
        title: "Success",
        description: selectedDependency ? "Dependencies updated successfully." : "Dependencies created successfully.",
      });
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedDependency) return;

    try {
      const { error } = await supabase
        .from("sku_dependencies")
        .delete()
        .eq("finished_product_id", selectedDependency.id);
      
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["skuDependencies"] });
      await queryClient.invalidateQueries({ queryKey: ["finishedProducts"] });
      
      toast({
        title: "Success",
        description: "Dependencies deleted successfully.",
      });
      
      setIsDeleteDialogOpen(false);
      setSelectedDependency(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete dependencies.",
        variant: "destructive",
      });
    }
  };

  const handleAddComponent = () => {
    setComponents([
      ...components, 
      {
        id: crypto.randomUUID(),
        type: "raw_material",
        item_id: "",
        quantity_required: 1
      }
    ]);
  };

  const handleRemoveComponent = (id: string) => {
    setComponents(components.filter(comp => comp.id !== id));
  };

  const handleUpdateComponent = (id: string, field: keyof typeof components[0], value: any) => {
    setComponents(components.map(comp => 
      comp.id === id ? { ...comp, [field]: value } : comp
    ));
  };

  const resetForm = () => {
    setSelectedDependency(null);
    setSelectedFinishedProduct(null);
    setNewFinishedProductSku("");
    setNewFinishedProductName("");
    setComponents([{
      id: crypto.randomUUID(),
      type: "raw_material",
      item_id: "",
      quantity_required: 1
    }]);
  };

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    setSelectedDependency(item);
    setSelectedFinishedProduct(item.id);
    
    // Convert components to expected format
    const formattedComponents = item.components.map((comp: any) => ({
      id: crypto.randomUUID(),
      type: comp.type as "raw_material" | "packaging",
      item_id: comp.id,
      quantity_required: comp.quantity
    }));
    
    setComponents(formattedComponents);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (item: any) => {
    setSelectedDependency(item);
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
      <DataTable
        columns={columns}
        data={dependencies || []}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDependency ? "Edit" : "Add"} Component Dependency
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="finished_product">Finished Product</Label>
                  {selectedDependency ? (
                    <Select
                      name="finished_product_id"
                      value={selectedFinishedProduct || ""}
                      onValueChange={setSelectedFinishedProduct}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a finished product" />
                      </SelectTrigger>
                      <SelectContent>
                        {finishedProducts?.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({product.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="new_sku">SKU</Label>
                        <Input
                          id="new_sku"
                          value={newFinishedProductSku}
                          onChange={(e) => setNewFinishedProductSku(e.target.value)}
                          placeholder="Enter product SKU"
                          required={!selectedFinishedProduct}
                        />
                      </div>
                      <div>
                        <Label htmlFor="new_name">Name</Label>
                        <Input
                          id="new_name"
                          value={newFinishedProductName}
                          onChange={(e) => setNewFinishedProductName(e.target.value)}
                          placeholder="Enter product name"
                          required={!selectedFinishedProduct && newFinishedProductSku !== ""}
                        />
                      </div>
                      <div className="flex items-center">
                        <div className="h-px flex-1 bg-gray-200"></div>
                        <span className="px-2 text-sm text-gray-500">OR</span>
                        <div className="h-px flex-1 bg-gray-200"></div>
                      </div>
                      <div>
                        <Label>Select Existing Product</Label>
                        <Select
                          value={selectedFinishedProduct || ""}
                          onValueChange={setSelectedFinishedProduct}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a finished product" />
                          </SelectTrigger>
                          <SelectContent>
                            {finishedProducts?.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} ({product.sku})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label className="text-lg font-medium">Components</Label>
                  <div className="space-y-4">
                    {components.map((component, index) => (
                      <div key={component.id} className="p-4 border rounded-md bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">Component #{index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveComponent(component.id)}
                            disabled={components.length <= 1}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Component Type</Label>
                            <Select
                              value={component.type}
                              onValueChange={(value: "raw_material" | "packaging") => 
                                handleUpdateComponent(component.id, 'type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select component type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="raw_material">Raw Material</SelectItem>
                                <SelectItem value="packaging">Packaging</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label>Component</Label>
                            <Select
                              value={component.item_id}
                              onValueChange={(value) => 
                                handleUpdateComponent(component.id, 'item_id', value)}
                              required
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select component" />
                              </SelectTrigger>
                              <SelectContent>
                                {component.type === "raw_material" ? 
                                  rawMaterials?.map((item) => (
                                    <SelectItem key={item.id} value={item.id}>
                                      {item.name} ({item.sku})
                                    </SelectItem>
                                  )) :
                                  packagingItems?.map((item) => (
                                    <SelectItem key={item.id} value={item.id}>
                                      {item.name} - {item.type} {item.size} ({item.sku})
                                    </SelectItem>
                                  ))
                                }
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label>Quantity Required</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={component.quantity_required}
                              onChange={(e) => 
                                handleUpdateComponent(
                                  component.id, 
                                  'quantity_required', 
                                  parseFloat(e.target.value) || 1
                                )
                              }
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddComponent}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Component
                    </Button>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedDependency ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the component dependencies.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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

export default SKUDependencyMapping;
