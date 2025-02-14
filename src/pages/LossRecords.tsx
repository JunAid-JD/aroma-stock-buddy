
import { useQuery } from "@tanstack/react-query";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const columns = [
  { key: "date", label: "Date" },
  { key: "item_name", label: "Item" },
  { key: "type", label: "Type" },
  { key: "quantity", label: "Quantity Lost" },
  { key: "reason", label: "Reason" },
  { key: "cost", label: "Cost Impact" },
];

// Temporary sample data
const sampleLossRecords = [
  {
    id: 1,
    date: "2024-03-10",
    item_name: "Lavender Essential Oil",
    type: "Raw Material",
    quantity: 50,
    reason: "Spillage",
    cost: "$10.00",
  },
  {
    id: 2,
    date: "2024-03-09",
    item_name: "Glass Bottle 30ml",
    type: "Packaging",
    quantity: 20,
    reason: "Breakage",
    cost: "$15.00",
  },
];

const LossRecords = () => {
  // This will be replaced with real data later
  const { data: lossRecords, isLoading } = useQuery({
    queryKey: ["lossRecords"],
    queryFn: async () => {
      // Simulate API call
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(sampleLossRecords);
        }, 500);
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Loss Records</h2>
          <p className="text-muted-foreground">
            Track and manage inventory losses
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Record Loss
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={lossRecords || []}
        isLoading={isLoading}
      />
    </div>
  );
};

export default LossRecords;
