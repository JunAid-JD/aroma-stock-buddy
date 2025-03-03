
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, DollarSign, Package, TrendingUp, List } from "lucide-react";
import { Chart } from "@/components/ui/chart";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/providers/AuthProvider";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut } = useAuth();
  const [stockData, setStockData] = useState<any>([]);
  const [chartOptions, setChartOptions] = useState<any>({});

  const { data: rawMaterialsData, isLoading: isRawMaterialsLoading } = useQuery({
    queryKey: ["rawMaterialsTotal"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("raw_materials")
        .select("total_value");
      
      if (error) throw error;
      
      const totalValue = data.reduce((sum, item) => sum + (item.total_value || 0), 0);
      return { count: data.length, totalValue };
    },
  });

  const { data: packagingData, isLoading: isPackagingLoading } = useQuery({
    queryKey: ["packagingTotal"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packaging_items")
        .select("total_value");
      
      if (error) throw error;
      
      const totalValue = data.reduce((sum, item) => sum + (item.total_value || 0), 0);
      return { count: data.length, totalValue };
    },
  });

  const { data: finishedProductsData, isLoading: isFinishedProductsLoading } = useQuery({
    queryKey: ["finishedProductsTotal"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finished_products")
        .select("total_value");
      
      if (error) throw error;
      
      const totalValue = data.reduce((sum, item) => sum + (item.total_value || 0), 0);
      return { count: data.length, totalValue };
    },
  });

  const { data: recentBatches, isLoading: isRecentBatchesLoading } = useQuery({
    queryKey: ["recentBatches"],
    queryFn: async () => {
      try {
        // Fix the relationship error by explicitly specifying the foreign key relationship to use
        const { data, error } = await supabase
          .from("production_batches")
          .select(`
            id,
            batch_number,
            status,
            created_at,
            finished_products:product_id(id, name, sku)
          `)
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) {
          console.error("Error fetching recent batches:", error);
          throw error;
        }

        return data;
      } catch (error) {
        console.error("Error fetching recent batches:", error);
        return [];
      }
    },
  });

  const { data: inventoryValue, isLoading: isInventoryValueLoading } = useQuery({
    queryKey: ["inventoryValue"],
    queryFn: async () => {
      const { data: rawMaterials, error: rawMaterialsError } = await supabase
        .from("raw_materials")
        .select("total_value");
      
      if (rawMaterialsError) throw rawMaterialsError;
      
      const { data: packagingItems, error: packagingError } = await supabase
        .from("packaging_items")
        .select("total_value");
      
      if (packagingError) throw packagingError;
      
      const { data: finishedProducts, error: finishedProductsError } = await supabase
        .from("finished_products")
        .select("total_value");
      
      if (finishedProductsError) throw finishedProductsError;
      
      const rawMaterialsValue = rawMaterials.reduce((sum, item) => sum + (item.total_value || 0), 0);
      const packagingValue = packagingItems.reduce((sum, item) => sum + (item.total_value || 0), 0);
      const finishedProductsValue = finishedProducts.reduce((sum, item) => sum + (item.total_value || 0), 0);
      
      const total = rawMaterialsValue + packagingValue + finishedProductsValue;
      
      return {
        rawMaterials: rawMaterialsValue,
        packaging: packagingValue,
        finishedProducts: finishedProductsValue,
        total
      };
    }
  });

  useEffect(() => {
    if (inventoryValue && !isInventoryValueLoading) {
      const newStockData = [
        {
          name: "Raw Materials",
          value: inventoryValue.rawMaterials || 0
        },
        {
          name: "Packaging",
          value: inventoryValue.packaging || 0
        },
        {
          name: "Finished Products",
          value: inventoryValue.finishedProducts || 0
        }
      ];
      
      setStockData(newStockData);
      
      setChartOptions({
        series: [
          {
            name: "Inventory Value",
            data: newStockData.map(item => item.value)
          }
        ],
        chart: {
          type: "bar",
          height: 350
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: "55%",
            endingShape: "rounded"
          }
        },
        dataLabels: {
          enabled: false
        },
        stroke: {
          show: true,
          width: 2,
          colors: ["transparent"]
        },
        xaxis: {
          categories: newStockData.map(item => item.name)
        },
        yaxis: {
          title: {
            text: "₹ (rupees)"
          }
        },
        fill: {
          opacity: 1
        },
        tooltip: {
          y: {
            formatter: function(val: number) {
              return "₹ " + val.toFixed(2);
            }
          }
        }
      });
    }
  }, [inventoryValue, isInventoryValueLoading]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Raw Materials
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isRawMaterialsLoading ? "Loading..." : `Rs. ${rawMaterialsData?.totalValue?.toLocaleString() || 0}`}
            </div>
            <p className="text-xs text-muted-foreground">
              {rawMaterialsData?.count || 0} items
            </p>
            <Button variant="link" className="px-0 text-xs" onClick={() => navigate("/raw-materials")}>
              View all
              <ArrowUpRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Packaging Items
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isPackagingLoading ? "Loading..." : `Rs. ${packagingData?.totalValue?.toLocaleString() || 0}`}
            </div>
            <p className="text-xs text-muted-foreground">
              {packagingData?.count || 0} items
            </p>
            <Button variant="link" className="px-0 text-xs" onClick={() => navigate("/packaging-items")}>
              View all
              <ArrowUpRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Finished Products
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isFinishedProductsLoading ? "Loading..." : `Rs. ${finishedProductsData?.totalValue?.toLocaleString() || 0}`}
            </div>
            <p className="text-xs text-muted-foreground">
              {finishedProductsData?.count || 0} items
            </p>
            <Button variant="link" className="px-0 text-xs" onClick={() => navigate("/finished-goods")}>
              View all
              <ArrowUpRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-2 md:col-span-1">
          <CardHeader>
            <CardTitle>Inventory Value</CardTitle>
            <CardDescription>
              Distribution of inventory value across categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isInventoryValueLoading ? (
              <div className="flex justify-center items-center h-80">
                <p>Loading chart data...</p>
              </div>
            ) : (
              <Chart
                type="bar"
                options={chartOptions}
                series={chartOptions.series}
                height={350}
              />
            )}
          </CardContent>
        </Card>

        <Card className="col-span-2 md:col-span-1">
          <CardHeader>
            <CardTitle>Recent Production Batches</CardTitle>
            <CardDescription>
              Latest production batch activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isRecentBatchesLoading ? (
              <div className="flex justify-center items-center h-80">
                <p>Loading recent batches...</p>
              </div>
            ) : recentBatches && recentBatches.length > 0 ? (
              <div className="space-y-4">
                {recentBatches.map((batch: any) => (
                  <div key={batch.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{batch.batch_number}</p>
                      <p className="text-sm text-gray-500">
                        {batch.finished_products ? 
                          `${batch.finished_products.name || 'Unknown'} (${batch.finished_products.sku || 'Unknown'})` : 
                          'Unknown product'}
                      </p>
                    </div>
                    <div className={`px-2 py-1 text-xs rounded-full ${
                      batch.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : batch.status === 'cancelled' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-blue-100 text-blue-800'
                    }`}>
                      {batch.status}
                    </div>
                  </div>
                ))}
                <Button variant="link" className="px-0 text-xs" onClick={() => navigate("/production-batches")}>
                  View all production batches
                  <ArrowUpRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-80 text-center">
                <List className="h-10 w-10 text-muted-foreground mb-2" />
                <p>No production batches yet</p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => navigate("/production-batches")}
                >
                  Create a batch
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
