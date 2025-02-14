
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ItemFormDialog from "@/components/ItemFormDialog";

const columns = [
  { key: "name", label: "Name" },
  { key: "type", label: "Type" },
  { key: "size", label: "Size" },
  { key: "quantity_in_stock", label: "Stock" },
  { key: "reorder_point", label: "Reorder Point" },
  { key: "unit_cost", label: "Unit Cost" },
  { key: "updated_at", label: "Last Updated", isDate: true },
];

const PackagingGoods = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: packagingItems, isLoading } = useQuery({
    queryKey: ["packagingItems"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packaging_items")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (formData: any) => {
    if (selectedItem) {
      const { error } = await supabase
        .from("packaging_items")
        .update(formData)
        .eq("id", selectedItem.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("packaging_items")
        .insert(formData);
      if (error) throw error;
    }
    queryClient.invalidateQueries(["packagingItems"]);
  };

  const handleAdd = () => {
    setSelectedItem(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Packaging Goods</h2>
          <p className="text-muted-foreground">
            Manage your packaging materials inventory
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Packaging Item
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={packagingItems || []}
        isLoading={isLoading}
        onEdit={handleEdit}
      />
      <ItemFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleSubmit}
        item={selectedItem}
        type="packaging"
      />
    </div>
  );
};

export default PackagingGoods;
