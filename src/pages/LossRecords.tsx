
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
import { format } from "date-fns";

const columns = [
  { key: "date", label: "Date", isDate: true },
  { key: "item_id", label: "Item" },
  { key: "item_type", label: "Type" },
  { key: "quantity", label: "Quantity Lost" },
  { key: "reason", label: "Reason" },
  { key: "cost_impact", label: "Cost Impact" },
];

const LossRecords = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: lossRecords, isLoading } = useQuery({
    queryKey: ["lossRecords"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loss_records")
        .select("*")
        .order("date", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const handleSubmit = async (formData: any) => {
    try {
      if (selectedRecord) {
        const { error } = await supabase
          .from("loss_records")
          .update(formData)
          .eq("id", selectedRecord.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("loss_records")
          .insert(formData);
        if (error) throw error;
      }
      await queryClient.invalidateQueries({ queryKey: ["lossRecords"] });
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
          <h2 className="text-3xl font-bold tracking-tight">Loss Records</h2>
          <p className="text-muted-foreground">
            Track and manage inventory losses
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Record Loss
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={lossRecords || []}
        isLoading={isLoading}
        onEdit={handleEdit}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedRecord ? "Edit" : "Add"} Loss Record
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const data = {
              item_id: formData.get("item_id"),
              item_type: formData.get("item_type"),
              quantity: parseFloat(formData.get("quantity") as string),
              reason: formData.get("reason"),
              cost_impact: parseFloat(formData.get("cost_impact") as string),
              date: new Date().toISOString(),
            };
            handleSubmit(data);
          }}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="item_id">Item ID</Label>
                <Input
                  id="item_id"
                  name="item_id"
                  defaultValue={selectedRecord?.item_id}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="item_type">Type</Label>
                <Select
                  name="item_type"
                  defaultValue={selectedRecord?.item_type}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="raw">Raw Material</SelectItem>
                    <SelectItem value="packaging">Packaging</SelectItem>
                    <SelectItem value="finished">Finished Product</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity Lost</Label>
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
                <Label htmlFor="reason">Reason</Label>
                <Input
                  id="reason"
                  name="reason"
                  defaultValue={selectedRecord?.reason}
                  required
                />
              </div>

              <div>
                <Label htmlFor="cost_impact">Cost Impact</Label>
                <Input
                  id="cost_impact"
                  name="cost_impact"
                  type="number"
                  step="0.01"
                  defaultValue={selectedRecord?.cost_impact}
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

export default LossRecords;
