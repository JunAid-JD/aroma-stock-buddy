
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
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

const columns = [
  { key: "date", label: "Date", isDate: true },
  { key: "item_name", label: "Item" },
  { key: "item_type", label: "Type" },
  { key: "quantity", label: "Quantity" },
  { key: "unit_cost", label: "Unit Cost" },
  { key: "total_cost", label: "Total Cost" },
  { key: "supplier", label: "Supplier" },
];

interface PurchaseRecord {
  id: string;
  date: string;
  item_id: string;
  item_type: "raw_material" | "packaging" | "finished_product";
  quantity: number;
  unit_cost: number;
  total_cost: number;
  supplier: string;
  item_name?: string;
}

const PurchaseRecords = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PurchaseRecord | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItemType, setSelectedItemType] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: purchaseRecords, isLoading } = useQuery({
    queryKey: ["purchaseRecords"],
    queryFn: async () => {
      const { data: records, error } = await supabase
        .from("purchase_records")
        .select("*")
        .order("date", { ascending: false });
      
      if (error) throw error;

      const itemPromises = records.map(async (record) => {
        let itemName = 'Unknown Item';
        
        if (record.item_type === 'raw_material') {
          const { data } = await supabase
            .from('raw_materials')
            .select('name')
            .eq('id', record.item_id)
            .single();
          if (data) itemName = data.name;
        } else if (record.item_type === 'packaging') {
          const { data } = await supabase
            .from('packaging_items')
            .select('name')
            .eq('id', record.item_id)
            .single();
          if (data) itemName = data.name;
        }

        return {
          ...record,
          item_name: itemName
        };
      });

      return Promise.all(itemPromises);
    },
  });

  const { data: items } = useQuery({
    queryKey: ["allItems", selectedItemType],
    queryFn: async () => {
      if (!selectedItemType) return [];

      const query = {
        raw_material: () => supabase.from("raw_materials").select("id, name"),
        packaging: () => supabase.from("packaging_items").select("id, name, type, size"),
      }[selectedItemType];

      if (!query) return [];

      const { data, error } = await query();
      
      if (error) throw error;

      if (selectedItemType === 'packaging') {
        return data.map((item: any) => ({
          ...item,
          name: `${item.name} (${item.type} - ${item.size})`
        }));
      }

      return data || [];
    },
    enabled: !!selectedItemType
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
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
        date: selectedRecord?.date || new Date().toISOString(),
      };

      if (selectedRecord) {
        const { error } = await supabase
          .from("purchase_records")
          .update(data)
          .eq("id", selectedRecord.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("purchase_records")
          .insert(data);
        if (error) throw error;
      }

      await queryClient.invalidateQueries({ queryKey: ["purchaseRecords"] });
      toast({
        title: "Success",
        description: `Purchase record ${selectedRecord ? "updated" : "added"} successfully.`,
      });
      setIsDialogOpen(false);
      setSelectedRecord(null);
      setSelectedItemType("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAdd = () => {
    setSelectedRecord(null);
    setSelectedItemType("");
    setIsDialogOpen(true);
  };

  const handleEdit = (record: PurchaseRecord) => {
    setSelectedRecord(record);
    setSelectedItemType(record.item_type);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (record: PurchaseRecord) => {
    setSelectedRecord(record);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedRecord) return;

    try {
      const { error } = await supabase
        .from("purchase_records")
        .delete()
        .eq("id", selectedRecord.id);
      
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["purchaseRecords"] });
      toast({
        title: "Success",
        description: "Purchase record deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
      setSelectedRecord(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete record.",
        variant: "destructive",
      });
    }
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
        onDelete={handleDeleteClick}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedRecord ? "Edit" : "Add"} Purchase Record
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="item_type">Type</Label>
                <Select
                  name="item_type"
                  value={selectedItemType}
                  onValueChange={setSelectedItemType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="raw_material">Raw Material</SelectItem>
                    <SelectItem value="packaging">Packaging</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="item_id">Item</Label>
                <Select 
                  name="item_id" 
                  value={selectedRecord?.item_id}
                  onValueChange={(value) => {
                    if (selectedRecord) {
                      setSelectedRecord({ ...selectedRecord, item_id: value });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select item" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedItemType && items && items.map((item: any) => (
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
                onClick={() => {
                  setIsDialogOpen(false);
                  setSelectedRecord(null);
                  setSelectedItemType("");
                }}
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the purchase record.
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

export default PurchaseRecords;

