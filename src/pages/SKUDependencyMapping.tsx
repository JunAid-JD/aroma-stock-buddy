
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

const columns = [
  { key: "finished_product_sku", label: "Finished Product SKU" },
  { key: "finished_product_name", label: "Finished Product Name" },
  { key: "raw_material_sku", label: "Raw Material SKU" },
  { key: "packaging_items", label: "Packaging Items" },
  { key: "updated_at", label: "Last Updated", isDate: true },
];

const SKUDependencyMapping = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDependency, setSelectedDependency] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: dependencies, isLoading } = useQuery({
    queryKey: ["skuDependencies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sku_dependencies")
        .select("*")
        .order("finished_product_name");

      if (error) throw error;

      return data.map((dep) => ({
        ...dep,
        packaging_items: [
          dep.bottle_sku && `Bottle: ${dep.bottle_sku}`,
          dep.cap_sku && `Cap: ${dep.cap_sku}`,
          dep.dropper_sku && `Dropper: ${dep.dropper_sku}`,
          dep.inner_box_sku && `Inner Box: ${dep.inner_box_sku}`,
          dep.outer_box_sku && `Outer Box: ${dep.outer_box_sku}`,
        ].filter(Boolean).join(", ") || "None",
      }));
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
      const data = {
        finished_product_sku: formData.get("finished_product_sku") as string,
        finished_product_name: formData.get("finished_product_name") as string,
        raw_material_sku: formData.get("raw_material_sku") as string,
        raw_material_quantity: parseFloat(formData.get("raw_material_quantity") as string) || 1,
        bottle_sku: formData.get("bottle_sku") as string || null,
        bottle_quantity: parseInt(formData.get("bottle_quantity") as string) || 1,
        cap_sku: formData.get("cap_sku") as string || null,
        cap_quantity: parseInt(formData.get("cap_quantity") as string) || 1,
        dropper_sku: formData.get("dropper_sku") as string || null,
        dropper_quantity: parseInt(formData.get("dropper_quantity") as string) || 1,
        inner_box_sku: formData.get("inner_box_sku") as string || null,
        inner_box_quantity: parseInt(formData.get("inner_box_quantity") as string) || 1,
        outer_box_sku: formData.get("outer_box_sku") as string || null,
        outer_box_quantity: parseInt(formData.get("outer_box_quantity") as string) || 1,
        updated_at: new Date().toISOString(),
      };

      // Clean up empty values to be null
      Object.keys(data).forEach((key) => {
        if (data[key] === '') {
          data[key] = null;
        }
      });

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
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDependency ? "Edit" : "Add"} SKU Dependency
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="finished_product_sku">Finished Product SKU</Label>
                  <Input
                    id="finished_product_sku"
                    name="finished_product_sku"
                    defaultValue={selectedDependency?.finished_product_sku}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="finished_product_name">Finished Product Name</Label>
                  <Input
                    id="finished_product_name"
                    name="finished_product_name"
                    defaultValue={selectedDependency?.finished_product_name}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="raw_material_sku">Raw Material SKU</Label>
                  <Select
                    name="raw_material_sku"
                    defaultValue={selectedDependency?.raw_material_sku}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select raw material" />
                    </SelectTrigger>
                    <SelectContent>
                      {rawMaterials?.map((material) => (
                        <SelectItem key={material.id} value={material.sku}>
                          {material.name} ({material.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="raw_material_quantity">Raw Material Quantity (ml)</Label>
                  <Input
                    id="raw_material_quantity"
                    name="raw_material_quantity"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={selectedDependency?.raw_material_quantity || 1}
                  />
                </div>
              </div>

              <h3 className="text-lg font-medium pt-2">Packaging Components</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bottle_sku">Bottle SKU</Label>
                  <Select
                    name="bottle_sku"
                    defaultValue={selectedDependency?.bottle_sku || ""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select bottle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {packagingItems?.filter(item => item.type === 'bottle').map((item) => (
                        <SelectItem key={item.id} value={item.sku}>
                          {item.name} {item.size} ({item.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bottle_quantity">Bottle Quantity</Label>
                  <Input
                    id="bottle_quantity"
                    name="bottle_quantity"
                    type="number"
                    min="0"
                    defaultValue={selectedDependency?.bottle_quantity || 1}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cap_sku">Cap SKU</Label>
                  <Select
                    name="cap_sku"
                    defaultValue={selectedDependency?.cap_sku || ""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select cap" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {packagingItems?.filter(item => item.type === 'cap').map((item) => (
                        <SelectItem key={item.id} value={item.sku}>
                          {item.name} {item.size} ({item.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cap_quantity">Cap Quantity</Label>
                  <Input
                    id="cap_quantity"
                    name="cap_quantity"
                    type="number"
                    min="0"
                    defaultValue={selectedDependency?.cap_quantity || 1}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dropper_sku">Dropper SKU</Label>
                  <Select
                    name="dropper_sku"
                    defaultValue={selectedDependency?.dropper_sku || ""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select dropper" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {packagingItems?.filter(item => item.type === 'dropper').map((item) => (
                        <SelectItem key={item.id} value={item.sku}>
                          {item.name} {item.size} ({item.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dropper_quantity">Dropper Quantity</Label>
                  <Input
                    id="dropper_quantity"
                    name="dropper_quantity"
                    type="number"
                    min="0"
                    defaultValue={selectedDependency?.dropper_quantity || 1}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="inner_box_sku">Inner Box SKU</Label>
                  <Select
                    name="inner_box_sku"
                    defaultValue={selectedDependency?.inner_box_sku || ""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select inner box" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {packagingItems?.filter(item => item.type === 'inner_box').map((item) => (
                        <SelectItem key={item.id} value={item.sku}>
                          {item.name} {item.size} ({item.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="inner_box_quantity">Inner Box Quantity</Label>
                  <Input
                    id="inner_box_quantity"
                    name="inner_box_quantity"
                    type="number"
                    min="0"
                    defaultValue={selectedDependency?.inner_box_quantity || 1}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="outer_box_sku">Outer Box SKU</Label>
                  <Select
                    name="outer_box_sku"
                    defaultValue={selectedDependency?.outer_box_sku || ""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select outer box" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {packagingItems?.filter(item => item.type === 'outer_box').map((item) => (
                        <SelectItem key={item.id} value={item.sku}>
                          {item.name} {item.size} ({item.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="outer_box_quantity">Outer Box Quantity</Label>
                  <Input
                    id="outer_box_quantity"
                    name="outer_box_quantity"
                    type="number"
                    min="0"
                    defaultValue={selectedDependency?.outer_box_quantity || 1}
                  />
                </div>
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
              This action cannot be undone. This will permanently delete the SKU dependency mapping.
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
