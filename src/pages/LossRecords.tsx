
import { useState, useEffect } from "react";
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
  { key: "quantity", label: "Quantity Lost" },
  { key: "reason", label: "Reason" },
  { key: "cost_impact", label: "Cost Impact" },
];

const LossRecords = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedItemType, setSelectedItemType] = useState<string>("");

  const { data: lossRecords, isLoading } = useQuery({
    queryKey: ["lossRecords"],
    queryFn: async () => {
      const { data: records, error } = await supabase
        .from("loss_records")
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
        } else if (record.item_type === 'finished_product') {
          const { data } = await supabase
            .from('finished_products')
            .select('name')
            .eq('id', record.item_id)
            .single();
          if (data) itemName = data.name;
        }

        return {
          ...record,
          item_name: itemName,
          cost_impact: record.cost_impact ? `Rs. ${record.cost_impact.toFixed(2)}` : 'Calculating...'
        };
      });

      return Promise.all(itemPromises);
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
          table: 'loss_records'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["lossRecords"] });
        }
      )
      .subscribe();   

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleDeleteClick = (record: any) => {
    setSelectedRecord(record);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedRecord) return;

    try {
      const { error } = await supabase
        .from("loss_records")
        .delete()
        .eq("id", selectedRecord.id);
      
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["lossRecords"] });
      await queryClient.invalidateQueries({ queryKey: ["rawMaterials"] });
      await queryClient.invalidateQueries({ queryKey: ["packagingItems"] });
      await queryClient.invalidateQueries({ queryKey: ["finishedProducts"] });
      
      toast({
        title: "Success",
        description: "Record deleted successfully.",
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

  const { data: items } = useQuery({
    queryKey: ["allItems"],
    queryFn: async () => {
      const [rawMaterials, packagingItems, finishedProducts] = await Promise.all([
        supabase.from("raw_materials").select("id, name"),
        supabase.from("packaging_items").select("id, name, type, size"),
        supabase.from("finished_products").select("id, name"),
      ]);

      return {
        raw_material: rawMaterials.data || [],
        packaging: packagingItems.data?.map(item => ({
          ...item,
          name: `${item.name} (${item.type} - ${item.size})`
        })) || [],
        finished_product: finishedProducts.data || [],
      };
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const data = {
      item_id: formData.get("item_id") as string,
      item_type: formData.get("item_type") as "raw_material" | "packaging" | "finished_product",
      quantity: parseFloat(formData.get("quantity") as string),
      reason: formData.get("reason") as string,
      date: new Date().toISOString(),
    };

    try {
      if (selectedRecord) {
        const { error } = await supabase
          .from("loss_records")
          .update(data)
          .eq("id", selectedRecord.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("loss_records")
          .insert(data);
        if (error) throw error;
      }
      await queryClient.invalidateQueries({ queryKey: ["lossRecords"] });
      await queryClient.invalidateQueries({ queryKey: ["rawMaterials"] });
      await queryClient.invalidateQueries({ queryKey: ["packagingItems"] });
      await queryClient.invalidateQueries({ queryKey: ["finishedProducts"] });
      
      toast({
        title: "Success",
        description: `Record ${selectedRecord ? "updated" : "added"} successfully.`,
      });
      setIsDialogOpen(false);
      setSelectedRecord(null);
      setSelectedItemType("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Loss Records</h1>
        <Button onClick={() => {
          setSelectedRecord(null);
          setIsDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> Add Loss Record
        </Button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <DataTable
          data={lossRecords || []}
          columns={columns}
          onEditClick={(record) => {
            setSelectedRecord(record);
            setSelectedItemType(record.item_type);
            setIsDialogOpen(true);
          }}
          onDeleteClick={handleDeleteClick}
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedRecord ? "Edit" : "Add"} Loss Record</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="item_type" className="text-right">
                  Item Type
                </Label>
                <Select
                  name="item_type"
                  value={selectedItemType}
                  onValueChange={setSelectedItemType}
                  required
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select item type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="raw_material">Raw Material</SelectItem>
                    <SelectItem value="packaging">Packaging</SelectItem>
                    <SelectItem value="finished_product">Finished Product</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedItemType && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="item_id" className="text-right">
                    Item
                  </Label>
                  <Select name="item_id" required defaultValue={selectedRecord?.item_id}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent>
                      {items && items[selectedItemType]?.map((item: any) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">
                  Quantity Lost
                </Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  step="0.01"
                  min="0.01"
                  defaultValue={selectedRecord?.quantity || ""}
                  className="col-span-3"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reason" className="text-right">
                  Reason
                </Label>
                <Input
                  id="reason"
                  name="reason"
                  defaultValue={selectedRecord?.reason || ""}
                  className="col-span-3"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the loss record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LossRecords;
