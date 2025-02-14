
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const columns = [
  { key: "name", label: "Name" },
  { key: "type", label: "Type" },
  { key: "volume", label: "Volume" },
  { key: "volume_unit", label: "Unit" },
  { key: "quantity_in_stock", label: "Stock" },
  { key: "reorder_point", label: "Reorder Point" },
  { key: "unit_cost", label: "Unit Cost" },
];

const RawMaterials = () => {
  const { data: rawMaterials, isLoading } = useQuery({
    queryKey: ["rawMaterials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("raw_materials")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Raw Materials</h2>
          <p className="text-muted-foreground">
            Manage your raw materials inventory
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Raw Material
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={rawMaterials || []}
        isLoading={isLoading}
      />
    </div>
  );
};

export default RawMaterials;
