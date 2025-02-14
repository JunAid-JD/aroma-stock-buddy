
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Box, Archive, AlertTriangle } from "lucide-react";
import DataTable from "@/components/DataTable";

const DashboardCard = ({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: any;
}) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const productionBatchColumns = [
  { key: "batch_number", label: "Batch #" },
  { key: "product_name", label: "Product" },
  { key: "quantity_produced", label: "Quantity" },
  { key: "production_date", label: "Date", isDate: true },
  { key: "status", label: "Status" },
];

const Dashboard = () => {
  const { data: counts } = useQuery({
    queryKey: ["inventoryCounts"],
    queryFn: async () => {
      const [rawMaterials, packagingItems, finishedProducts] = await Promise.all([
        supabase.from("raw_materials").select("count"),
        supabase.from("packaging_items").select("count"),
        supabase.from("finished_products").select("count"),
      ]);

      const lowStockItems = await supabase
        .from("raw_materials")
        .select("count")
        .lte("quantity_in_stock", "reorder_point");

      return {
        rawMaterials: rawMaterials.count || 0,
        packagingItems: packagingItems.count || 0,
        finishedProducts: finishedProducts.count || 0,
        lowStockAlerts: lowStockItems.count || 0,
      };
    },
  });

  const { data: recentBatches, isLoading: isLoadingBatches } = useQuery({
    queryKey: ["recentBatches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("production_batches")
        .select(`
          *,
          finished_products (
            name
          )
        `)
        .order("production_date", { ascending: false })
        .limit(5);

      if (error) throw error;
      
      return data.map(batch => ({
        ...batch,
        product_name: batch.finished_products?.name
      }));
    },
  });

  const dashboardData = [
    {
      title: "Raw Materials",
      value: counts?.rawMaterials || 0,
      description: "Total SKUs in stock",
      icon: Box,
    },
    {
      title: "Packaging Items",
      value: counts?.packagingItems || 0,
      description: "Available items",
      icon: Package,
    },
    {
      title: "Finished Products",
      value: counts?.finishedProducts || 0,
      description: "Ready for shipment",
      icon: Archive,
    },
    {
      title: "Low Stock Alerts",
      value: counts?.lowStockAlerts || 0,
      description: "Items need attention",
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to your inventory management system
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardData.map((item) => (
          <DashboardCard key={item.title} {...item} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Production Batches</CardTitle>
            <CardDescription>
              Latest production activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={productionBatchColumns}
              data={recentBatches || []}
              isLoading={isLoadingBatches}
            />
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Stock Overview</CardTitle>
            <CardDescription>
              Current inventory levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* We'll add charts in the next iteration */}
            <p className="text-sm text-muted-foreground">
              Stock charts coming soon...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
