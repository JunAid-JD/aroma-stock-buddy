
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ItemFormDialog from "@/components/ItemFormDialog";

const columns = [
  { key: "sku", label: "SKU" },
  { key: "name", label: "Name" },
  { key: "type", label: "Type" },
  { key: "volume", label: "Volume" },
  { key: "volume_unit", label: "Unit" },
  { key: "quantity_in_stock", label: "Stock" },
  { key: "reorder_point", label: "Reorder Point" },
  { key: "unit_price", label: "Unit Price" },
  { key: "updated_at", label: "Last Updated", isDate: true },
];

const FinishedGoods = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: finishedProducts, isLoading } = useQuery({
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

  const handleSubmit = async (formData: any) => {
    if (selectedItem) {
      const { error } = await supabase
        .from("finished_products")
        .update(formData)
        .eq("id", selectedItem.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("finished_products")
        .insert(formData);
      if (error) throw error;
    }
    queryClient.invalidateQueries(["finishedProducts"]);
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
      />
      <ItemFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleSubmit}
        item={selectedItem}
        type="finished"
      />
    </div>
  );
};

export default FinishedGoods;
