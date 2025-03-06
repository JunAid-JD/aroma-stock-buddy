import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DialogFooter } from "@/components/ui/dialog";
import { AlertCircle, Plus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const columns = [
  { key: "sku", label: "SKU" },
  { key: "name", label: "Name" },
  { key: "quantity_in_stock", label: "Quantity in Stock" },
  { key: "unit_price", label: "Unit Price (₹)", isCurrency: true },
  { key: "total_value", label: "Total Value (₹)", isCurrency: true },
  { key: "updated_at", label: "Last Updated", isDate: true },
];

const FinishedGoods = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [sku, setSku] = useState("");
  const [quantity, setQuantity] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasDependency, setHasDependency] = useState(true);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: products, isLoading } = useQuery({
    queryKey: ["finishedProducts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finished_products")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const checkDependency = async (sku: string) => {
    try {
      // Check if there are dependencies for this SKU directly
      const { data: dependencies, error: depError } = await supabase
        .from("sku_dependencies")
        .select("id")
        .eq("finished_product_sku", sku)
        .limit(1);
      
      if (depError) throw depError;
      
      if (dependencies && dependencies.length > 0) {
        setHasDependency(true);
        return true;
      }
      
      setHasDependency(false);
      return false;
    } catch (error) {
      console.error("Error checking dependencies:", error);
      setHasDependency(false);
      return false;
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Check if product with this SKU already exists
      const { data: existingProduct, error: checkError } = await supabase
        .from("finished_products")
        .select("*")
        .eq("sku", sku)
        .maybeSingle();
      
      if (checkError) throw checkError;

      if (existingProduct) {
        // Update existing product's quantity
        const { error: updateError } = await supabase
          .from("finished_products")
          .update({
            quantity_in_stock: existingProduct.quantity_in_stock + quantity,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingProduct.id);
        
        if (updateError) throw updateError;
        
        toast({
          title: "Success",
          description: "Product quantity updated successfully.",
        });
      } else {
        // Check if there's a dependency mapping for this SKU
        const hasDep = await checkDependency(sku);
        
        if (!hasDep) {
          toast({
            title: "Warning",
            description: "No dependency mapping found for this SKU. Cost calculation may not be accurate.",
            variant: "destructive",
          });
        }

        // Extract name from SKU (simple approach)
        const name = sku.split('-')[0] || sku;
        
        // Create new product
        const { error: insertError } = await supabase
          .from("finished_products")
          .insert({
            sku: sku,
            name: name,
            quantity_in_stock: quantity,
            unit_price: 0, // Will be calculated by trigger
          });
        
        if (insertError) throw insertError;
        
        toast({
          title: "Success",
          description: "Product added successfully.",
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["finishedProducts"] });
      await queryClient.invalidateQueries({ queryKey: ["inventorySummary"] });
      setIsAddDialogOpen(false);
      clearForm();
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add product.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    try {
      const { error } = await supabase
        .from("finished_products")
        .delete()
        .eq("id", selectedProduct.id);
      
      if (error) throw error;
      
      await queryClient.invalidateQueries({ queryKey: ["finishedProducts"] });
      await queryClient.invalidateQueries({ queryKey: ["inventorySummary"] });
      
      toast({
        title: "Success",
        description: "Product deleted successfully.",
      });
      
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product.",
        variant: "destructive",
      });
    }
  };

  const clearForm = () => {
    setSku("");
    setQuantity(0);
    setHasDependency(true);
  };

  const handleAddClick = () => {
    clearForm();
    setIsAddDialogOpen(true);
  };

  const handleSkuChange = async (newSku: string) => {
    setSku(newSku);
    if (newSku.length > 3) {
      await checkDependency(newSku);
    }
  };

  const handleDeleteClick = (product: any) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Finished Goods</h2>
          <p className="text-muted-foreground">
            Manage finished product inventory
          </p>
        </div>
        <Button onClick={handleAddClick}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={products || []}
        isLoading={isLoading}
        onDelete={handleDeleteClick}
      />

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Finished Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={sku}
                onChange={(e) => handleSkuChange(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="quantity">Quantity in Stock</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                required
              />
            </div>

            {!hasDependency && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No dependency mapping found</AlertTitle>
                <AlertDescription>
                  This SKU doesn't have a dependency mapping. The cost calculation may not be accurate. Consider adding a dependency first.
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Add Product"}
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
              This action cannot be undone. This will permanently delete the product
              and may affect production records and dependency mappings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FinishedGoods;
