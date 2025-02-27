
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [selectedTab, setSelectedTab] = useState<'raw_material' | 'packaging'>('raw_material');
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
          finished_products(id, name),
          raw_materials(id, name),
          packaging_items(id, name, type, size)
        `)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      return data.map((dep) => {
        const finishedProduct = dep.finished_products;
        const rawMaterial = dep.raw_materials;
        const packagingItem = dep.packaging_items;
        
        let componentName = 'Unknown';
        let componentType = dep.item_type;
        
        if (dep.item_type === 'raw_material' && rawMaterial) {
          componentName = rawMaterial.name;
        } else if (dep.item_type === 'packaging' && packagingItem) {
          componentName = `${packagingItem.name} (${packagingItem.type} - ${packagingItem.size})`;
        }
        
        return {
          ...dep,
          finished_product_name: finishedProduct?.name || 'Unknown Product',
          component_type: componentType === 'raw_material' ? 'Raw Material' : 'Packaging',
          component_name: componentName,
          finished_product_id: finishedProduct?.id,
          raw_material_id: rawMaterial?.id,
          packaging_item_id: packagingItem?.id,
        };
      });
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
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    
    try {
      const itemType = formData.get("item_type") as "raw_material" | "packaging";
      const finishedProductId = formData.get("finished_product_id") as string;
      const quantityRequired = parseFloat(formData.get("quantity_required") as string) || 1;
      
      let data: any = {
        finished_product_id: finishedProductId,
        item_type: itemType,
        quantity_required: quantityRequired
      };
      
      // Add the appropriate component ID based on the item type
      if (itemType === 'raw_material') {
        data.raw_material_id = formData.get("component_id") as string;
        data.packaging_item_id = null;
      } else if (itemType === 'packaging') {
        data.packaging_item_id = formData.get("component_id") as string;
        data.raw_material_id = null;
      }

      if (selectedDependency) {
        const { error } = await supabase
          .from("sku_dependencies")
          .update(data)
          .eq("id", selectedDependency.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("sku_dependencies")
          .insert(data);
        
        if (error) throw error;
      }

      await queryClient.invalidateQueries({ queryKey: ["skuDependencies"] });
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
        .eq("id", selectedDependency.id);
      
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["skuDependencies"] });
      await queryClient.invalidateQueries({ queryKey: ["finishedProducts"] });
      
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

  const handleEdit = (item: any) => {
    setSelectedDependency(item);
    setSelectedTab(item.item_type);
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDependency ? "Edit" : "Add"} Component Dependency
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="finished_product_id">Finished Product</Label>
                <Select
                  name="finished_product_id"
                  defaultValue={selectedDependency?.finished_product_id}
                  required
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

              <Tabs 
                defaultValue={selectedDependency?.item_type || "raw_material"} 
                value={selectedTab}
                onValueChange={(value) => setSelectedTab(value as 'raw_material' | 'packaging')}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="raw_material">Raw Material</TabsTrigger>
                  <TabsTrigger value="packaging">Packaging</TabsTrigger>
                </TabsList>
                
                <input
                  type="hidden"
                  name="item_type"
                  value={selectedTab}
                />
                
                <TabsContent value="raw_material">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="component_id">Raw Material</Label>
                      <Select
                        name="component_id"
                        defaultValue={selectedDependency?.raw_material_id}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a raw material" />
                        </SelectTrigger>
                        <SelectContent>
                          {rawMaterials?.map((material) => (
                            <SelectItem key={material.id} value={material.id}>
                              {material.name} ({material.sku})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="packaging">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="component_id">Packaging Item</Label>
                      <Select
                        name="component_id"
                        defaultValue={selectedDependency?.packaging_item_id}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a packaging item" />
                        </SelectTrigger>
                        <SelectContent>
                          {packagingItems?.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} - {item.type} {item.size} ({item.sku})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div>
                <Label htmlFor="quantity_required">Quantity Required</Label>
                <Input
                  id="quantity_required"
                  name="quantity_required"
                  type="number"
                  step="0.01"
                  min="0.01"
                  defaultValue={selectedDependency?.quantity_required || 1}
                  required
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setSelectedDependency(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {selectedDependency ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the component dependency.
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
