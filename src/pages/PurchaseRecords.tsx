
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

const columns = [
  { key: "date", label: "Date", isDate: true },
  { key: "item_name", label: "Item" },
  { key: "item_type", label: "Type" },
  { key: "quantity", label: "Quantity" },
  { key: "unit_cost", label: "Unit Cost" },
  { key: "total_cost", label: "Total Cost" },
  { key: "supplier", label: "Supplier" },
];

const PurchaseRecords = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedItemType, setSelectedItemType] = useState<string>("");

  const { data: purchaseRecords, isLoading } = useQuery({
    queryKey: ["purchaseRecords"],
    queryFn: async () => {
      const { data: records, error } = await supabase
        .from("purchase_records")
        .select(`
          *,
          raw_materials (name),
          packaging_items (name),
          finished_products (name)
        `)
        .order("date", { ascending: false });
      
      if (error) throw error;

      return (records || []).map(record => ({
        ...record,
        item_name: 
          record.raw_materials?.name || 
          record.packaging_items?.name || 
          record.finished_products?.name || 
          'Unknown Item'
      }));
    },
  });

  const { data: items } = useQuery({
    queryKey: ["allItems"],
    queryFn: async () => {
      const [rawMaterials, packagingItems, finishedProducts] = await Promise.all([
        supabase.from("raw_materials").select("id, name"),
        supabase.from("packaging_items").select("id, name"),
        supabase.from("finished_products").select("id, name"),
      ]);

      return {
        raw_material: rawMaterials.data || [],
        packaging: packagingItems.data || [],
        finished_product: finishedProducts.data || [],
      };
    },
  });

  const handleSubmit = async (formData: any) => {
    try {
      if (selectedRecord) {
        const { error } = await supabase
          .from("purchase_records")
          .update(formData)
          .eq("id", selectedRecord.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("purchase_records")
          .insert(formData);
        if (error) throw error;
      }
      await queryClient.invalidateQueries({ queryKey: ["purchaseRecords"] });
      toast({
        title: "Success",
        description: `Record ${selectedRecord ? "updated" : "added"} successfully.`,
      });
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAdd = () => {
    setSelectedRecord(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (record: any) => {
    setSelectedRecord(record);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Purchase Records</h2>
          <p className="text-muted-foreground">
            Track and manage inventory purchases
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Record Purchase
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={purchaseRecords || []}
        isLoading={isLoading}
        onEdit={handleEdit}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedRecord ? "Edit" : "Add"} Purchase Record
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const quantity = parseFloat(formData.get("quantity") as string);
            const unitCost = parseFloat(formData.get("unit_cost") as string);
            const data = {
              item_id: formData.get("item_id") as string,
              item_type: formData.get("item_type") as "raw_material" | "packaging" | "finished_product",
              quantity,
              unit_cost: unitCost,
              total_cost: quantity * unitCost,
              supplier: formData.get("supplier") as string,
              date: new Date().toISOString(),
            };
            handleSubmit(data);
          }}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="item_type">Type</Label>
                <Select
                  name="item_type"
                  defaultValue={selectedRecord?.item_type}
                  onValueChange={setSelectedItemType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="raw_material">Raw Material</SelectItem>
                    <SelectItem value="packaging">Packaging</SelectItem>
                    <SelectItem value="finished_product">Finished Product</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="item_id">Item</Label>
                <Select name="item_id" defaultValue={selectedRecord?.item_id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select item" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedItemType && items && items[selectedItemType]?.map((item: any) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  step="0.01"
                  defaultValue={selectedRecord?.quantity}
                  required
                />
              </div>

              <div>
                <Label htmlFor="unit_cost">Unit Cost</Label>
                <Input
                  id="unit_cost"
                  name="unit_cost"
                  type="number"
                  step="0.01"
                  defaultValue={selectedRecord?.unit_cost}
                  required
                />
              </div>

              <div>
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  name="supplier"
                  defaultValue={selectedRecord?.supplier}
                  required
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {selectedRecord ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseRecords;
