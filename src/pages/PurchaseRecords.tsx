
import { useQuery } from "@tanstack/react-query";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const columns = [
  { key: "date", label: "Date" },
  { key: "item_name", label: "Item" },
  { key: "type", label: "Type" },
  { key: "quantity", label: "Quantity" },
  { key: "unit_cost", label: "Unit Cost" },
  { key: "total_cost", label: "Total Cost" },
  { key: "supplier", label: "Supplier" },
];

// Temporary sample data
const samplePurchaseRecords = [
  {
    id: 1,
    date: "2024-03-10",
    item_name: "Lavender Essential Oil",
    type: "Raw Material",
    quantity: 1000,
    unit_cost: "$0.20",
    total_cost: "$200.00",
    supplier: "Essential Oils Co.",
  },
  {
    id: 2,
    date: "2024-03-09",
    item_name: "Glass Bottle 30ml",
    type: "Packaging",
    quantity: 5000,
    unit_cost: "$0.75",
    total_cost: "$3,750.00",
    supplier: "Glass Solutions Inc.",
  },
];

const PurchaseRecords = () => {
  // This will be replaced with real data later
  const { data: purchaseRecords, isLoading } = useQuery({
    queryKey: ["purchaseRecords"],
    queryFn: async () => {
      // Simulate API call
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(samplePurchaseRecords);
        }, 500);
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Purchase Records</h2>
          <p className="text-muted-foreground">
            Track and manage inventory purchases
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Record Purchase
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={purchaseRecords || []}
        isLoading={isLoading}
      />
    </div>
  );
};

export default PurchaseRecords;
