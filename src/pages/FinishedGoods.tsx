
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
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
  { key: "volume_config", label: "Volume" },
  { key: "quantity_in_stock", label: "Stock" },
  { key: "unit_price", label: "Unit Price" },
  { key: "total_value", label: "Total Value" },
  { key: "updated_at", label: "Last Updated", isDate: true },
];

const FinishedGoods = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [sku, setSku] = useState("");
  const [volumeConfig, setVolumeConfig] = useState("essential_10ml");
  const [quantityInStock, setQuantityInStock] = useState(0);
  const [hasDependency, setHasDependency] = useState(true);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: finishedProducts, isLoading } = useQuery({
    queryKey: ["finishedProducts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finished_products")
        .select("*")
        .order("sku");
      
      if (error) throw error;
      
      return data.map(item => ({
        ...item,
        name: item.name || item.sku,
        total_value: item.total_value ? `Rs. ${item.total_value.toFixed(2)}` : 'Rs. 0.00',
        unit_price: item.unit_price ? `Rs. ${item.unit_price.toFixed(2)}` : 'Rs. 0.00',
        volume_config: item.volume_config.replace(/_/g, ' ').replace(/(\w+)/, (s) => s.charAt(0).toUpperCase() + s.slice(1))
      }));
    },
  });

  // Check if dependencies exist for a given SKU
  const checkDependency = async (sku: string) => {
    try {
      // First check if the finished product already exists
      const { data: existingProduct, error: fpError } = await supabase
        .from("finished_products")
        .select("id")
        .eq("sku", sku)
        .maybeSingle();

      if (fpError) throw fpError;

      if (existingProduct) {
        // Check if dependencies exist for this product
        const { data: dependencies, error: depError } = await supabase
          .from("sku_dependencies")
          .select("id")
          .eq("finished_product_id", existingProduct.id)
          .limit(1);

        if (depError) throw depError;

        return dependencies && dependencies.length > 0;
      } else {
        // If product doesn't exist, set to false
        return false;
      }
    } catch (error) {
      console.error("Error checking dependency:", error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sku) {
      toast({
        title: "Error",
        description: "SKU is required",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if dependency exists
      const hasDep = await checkDependency(sku);
      setHasDependency(hasDep);

      if (!hasDep) {
        toast({
          title: "Warning",
          description: "No dependency mapping found for this SKU. Cost calculation will not be accurate.",
          variant: "warning",
        });
      }

      const productData = {
        sku,
        name: sku, // Use SKU as name initially, can be updated later
        volume_config: volumeConfig,
        quantity_in_stock: quantityInStock,
        type: volumeConfig.includes('carrier') ? 'carrier_oil' : 'essential_oil' as const
      };

      if (selectedItem) {
        const { error } = await supabase
          .from("finished_products")
          .update({
            ...productData,
            updated_at: new Date().toISOString()
          })
          .eq("id", selectedItem.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("finished_products")
          .insert(productData);
        
        if (error) throw error;
      }

      await queryClient.invalidateQueries({ queryKey: ["finishedProducts"] });
      
      toast({
        title: "Success",
        description: `Finished product ${selectedItem ? "updated" : "added"} successfully.`,
      });
      
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

  const resetForm = () => {
    setIsDialogOpen(false);
    setSelectedItem(null);
    setSku("");
    setVolumeConfig("essential_10ml");
    setQuantityInStock(0);
    setHasDependency(true);
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    try {
      // First, delete any dependencies
      const { error: dependencyError } = await supabase
        .from("sku_dependencies")
        .delete()
        .eq("finished_product_id", selectedItem.id);
      
      if (dependencyError) throw dependencyError;

      // Then delete production batch items
      const { error: batchItemsError } = await supabase
        .from("production_batch_items")
        .delete()
        .eq("item_id", selectedItem.id);
      
      if (batchItemsError) throw batchItemsError;

      // Finally delete the product
      const { error } = await supabase
        .from("finished_products")
        .delete()
        .eq("id", selectedItem.id);
      
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["finishedProducts"] });
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
    setSku("");
    setVolumeConfig("essential_10ml");
    setQuantityInStock(0);
    setHasDependency(true);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setSku(item.sku);
    setVolumeConfig(item.volume_config.toLowerCase().replace(/\s+/g, '_'));
    setQuantityInStock(item.quantity_in_stock);
    
    // Check for dependency
    checkDependency(item.sku).then(setHasDependency);
    
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
          <h2 className="text-3xl font-bold tracking-tight">Finished Goods</h2>
          <p className="text-muted-foreground">
            Manage your finished products inventory
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Finished Product
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={finishedProducts || []}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? "Edit" : "Add"} Finished Product
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Enter product SKU"
                  required
                />
              </div>

              <div>
                <Label htmlFor="volume_config">Volume</Label>
                <Select
                  value={volumeConfig}
                  onValueChange={setVolumeConfig}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select volume" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="essential_10ml">10ml (Essential Oil)</SelectItem>
                    <SelectItem value="essential_30ml">30ml (Essential Oil)</SelectItem>
                    <SelectItem value="carrier_30ml">30ml (Carrier Oil)</SelectItem>
                    <SelectItem value="carrier_70ml">70ml (Carrier Oil)</SelectItem>
                    <SelectItem value="carrier_140ml">140ml (Carrier Oil)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity_in_stock">Quantity in Stock</Label>
                <Input
                  id="quantity_in_stock"
                  type="number"
                  min="0"
                  value={quantityInStock}
                  onChange={(e) => setQuantityInStock(parseInt(e.target.value) || 0)}
                  required
                />
              </div>

              {!hasDependency && (
                <Alert variant="warning">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No dependency mapping found</AlertTitle>
                  <AlertDescription>
                    Please add dependency mapping for this SKU in the SKU Dependency Mapping page to enable accurate cost calculation.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
              >
                Cancel
              </Button>
              <Button type="submit">
                {selectedItem ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the finished product
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

export default FinishedGoods;
