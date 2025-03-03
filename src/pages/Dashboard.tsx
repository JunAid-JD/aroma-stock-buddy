
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AreaChart, BarChart, LineChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch inventory stats
  const { data: inventoryStats, isLoading: isLoadingInventory } = useQuery({
    queryKey: ["inventoryStats"],
    queryFn: async () => {
      // Fetch raw materials counts
      const { data: rawMaterials, error: rawError } = await supabase
        .from("raw_materials")
        .select("*");

      if (rawError) throw rawError;

      // Fetch packaging items counts
      const { data: packagingItems, error: packagingError } = await supabase
        .from("packaging_items")
        .select("*");

      if (packagingError) throw packagingError;

      // Fetch finished products counts
      const { data: finishedProducts, error: finishedError } = await supabase
        .from("finished_products")
        .select("*");

      if (finishedError) throw finishedError;

      // Calculate totals and items below reorder point
      const rawMaterialsCount = rawMaterials?.length || 0;
      const packagingItemsCount = packagingItems?.length || 0;
      const finishedProductsCount = finishedProducts?.length || 0;

      const rawMaterialsBelowReorder = rawMaterials?.filter(
        (item) => item.quantity_in_stock < item.reorder_point
      ).length || 0;
      
      const packagingItemsBelowReorder = packagingItems?.filter(
        (item) => item.quantity_in_stock < item.reorder_point
      ).length || 0;

      // Calculate total inventory value
      const rawMaterialsValue = rawMaterials?.reduce(
        (sum, item) => sum + (parseFloat(String(item.total_value)) || 0), 
        0
      ) || 0;
      
      const packagingValue = packagingItems?.reduce(
        (sum, item) => sum + (parseFloat(String(item.total_value)) || 0), 
        0
      ) || 0;
      
      const finishedProductsValue = finishedProducts?.reduce(
        (sum, item) => sum + (parseFloat(String(item.total_value)) || 0), 
        0
      ) || 0;

      return {
        rawMaterialsCount,
        packagingItemsCount,
        finishedProductsCount,
        rawMaterialsBelowReorder,
        packagingItemsBelowReorder,
        totalItems: rawMaterialsCount + packagingItemsCount + finishedProductsCount,
        totalValue: rawMaterialsValue + packagingValue + finishedProductsValue,
        inventoryComposition: [
          { name: "Raw Materials", value: rawMaterialsValue },
          { name: "Packaging", value: packagingValue },
          { name: "Finished Products", value: finishedProductsValue },
        ],
      };
    },
  });

  // Fetch recent production batches
  const { data: recentBatches } = useQuery({
    queryKey: ["recentBatches"],
    queryFn: async () => {
      const { data: batches, error } = await supabase
        .from("production_batches")
        .select(`
          id,
          batch_number,
          status,
          created_at,
          product_id,
          finished_products (name, sku)
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      
      return batches.map(batch => {
        return {
          ...batch,
          product_name: batch.finished_products?.name || "Unknown Product",
          product_sku: batch.finished_products?.sku || "Unknown SKU"
        };
      });
    },
  });

  // Mock data for charts
  const productionTrendData = [
    { month: "Jan", productions: 65 },
    { month: "Feb", productions: 59 },
    { month: "Mar", productions: 80 },
    { month: "Apr", productions: 81 },
    { month: "May", productions: 56 },
    { month: "Jun", productions: 55 },
  ];

  const inventoryChartData = [
    { month: "Jan", raw: 4000, packaging: 2400, finished: 2400 },
    { month: "Feb", raw: 3000, packaging: 1398, finished: 2210 },
    { month: "Mar", raw: 2000, packaging: 9800, finished: 2290 },
    { month: "Apr", raw: 2780, packaging: 3908, finished: 2000 },
    { month: "May", raw: 1890, packaging: 4800, finished: 2181 },
    { month: "Jun", raw: 2390, packaging: 3800, finished: 2500 },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome to your inventory management dashboard
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Inventory Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingInventory ? "Loading..." : inventoryStats?.totalItems || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all categories
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Inventory Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingInventory 
                    ? "Loading..." 
                    : `Rs. ${(inventoryStats?.totalValue || 0).toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}`
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Sum of all inventory items
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Items Below Reorder Point
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingInventory 
                    ? "Loading..." 
                    : (inventoryStats?.rawMaterialsBelowReorder || 0) + 
                      (inventoryStats?.packagingItemsBelowReorder || 0)
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Requires attention
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Finished Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingInventory ? "Loading..." : inventoryStats?.finishedProductsCount || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Available for sale
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Recent Production Batches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {!recentBatches ? (
                    <div>Loading...</div>
                  ) : recentBatches.length === 0 ? (
                    <div>No recent batches</div>
                  ) : (
                    recentBatches.map((batch: any) => (
                      <div key={batch.id} className="flex items-center">
                        <div className={`mr-2 h-2 w-2 rounded-full ${
                          batch.status === 'completed' 
                            ? 'bg-green-500' 
                            : batch.status === 'cancelled' 
                              ? 'bg-red-500' 
                              : 'bg-yellow-500'
                        }`} />
                        <div className="flex-1 space-y-1">
                          <div className="font-medium">{batch.batch_number || 'No batch number'}</div>
                          <div className="text-sm text-muted-foreground">
                            {batch.product_name || 'Unknown'} ({batch.product_sku || 'Unknown'})
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(batch.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">View All Batches</Button>
              </CardFooter>
            </Card>
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Inventory Composition</CardTitle>
                <CardDescription>
                  Value distribution across inventory categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingInventory ? (
                  <div>Loading chart data...</div>
                ) : (
                  <ChartContainer 
                    className="h-80"
                    config={{
                      raw: { theme: { light: "#4361ee", dark: "#3366ff" } },
                      packaging: { theme: { light: "#7209b7", dark: "#8b5cf6" } },
                      finished: { theme: { light: "#f72585", dark: "#ec4899" } },
                    }}
                  >
                    <BarChart
                      data={[
                        {
                          name: "Raw Materials",
                          value: inventoryStats?.inventoryComposition?.[0]?.value || 0,
                          fill: "var(--color-raw)",
                        },
                        {
                          name: "Packaging",
                          value: inventoryStats?.inventoryComposition?.[1]?.value || 0,
                          fill: "var(--color-packaging)",
                        },
                        {
                          name: "Finished",
                          value: inventoryStats?.inventoryComposition?.[2]?.value || 0,
                          fill: "var(--color-finished)",
                        },
                      ]}
                      margin={{
                        top: 10,
                        right: 10,
                        left: 10,
                        bottom: 20,
                      }}
                    >
                      <ChartTooltip
                        content={
                          <ChartTooltipContent indicator="line" />
                        }
                      />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
