
// Import the Product property from the finished_products module
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { AlertCircle, Package, ShoppingCart, TrendingUp } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState("month");

  const { data: rawMaterials } = useQuery({
    queryKey: ["rawMaterialsInventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("raw_materials")
        .select("*")
        .order("quantity_in_stock", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: packagingItems } = useQuery({
    queryKey: ["packagingInventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packaging_items")
        .select("*")
        .order("quantity_in_stock", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: recentBatches } = useQuery({
    queryKey: ["recentBatches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("production_batches")
        .select(`
          *,
          finished_products!inner(name)
        `)
        .order("production_date", { ascending: false })
        .limit(5);
      
      if (error) {
        console.error("Error fetching recent batches:", error);
        throw error;
      }
      
      return data?.map(batch => {
        // Make sure to check if the nested object exists and has the property
        const productName = batch.finished_products ? 
                           (typeof batch.finished_products === 'object' && 'name' in batch.finished_products ? 
                             batch.finished_products.name : 
                             "Unknown") : 
                           "Unknown";
        
        return {
          ...batch,
          product_name: productName
        };
      }) || [];
    },
  });

  // Inventory alerts
  const inventoryAlerts = [];

  // Check raw materials
  if (rawMaterials) {
    const lowRawMaterials = rawMaterials.filter(item => item.quantity_in_stock <= item.reorder_point);
    
    lowRawMaterials.forEach(item => {
      inventoryAlerts.push({
        id: item.id,
        name: item.name,
        type: "Raw Material",
        current: item.quantity_in_stock,
        threshold: item.reorder_point
      });
    });
  }

  // Check packaging items
  if (packagingItems) {
    const lowPackagingItems = packagingItems.filter(item => item.quantity_in_stock <= item.reorder_point);
    
    lowPackagingItems.forEach(item => {
      inventoryAlerts.push({
        id: item.id,
        name: item.name,
        type: "Packaging",
        current: item.quantity_in_stock,
        threshold: item.reorder_point
      });
    });
  }

  // Mock data for charts
  // In a real app, this would be calculated from production history
  const productionData = [
    { month: 'Jan', batches: 4 },
    { month: 'Feb', batches: 3 },
    { month: 'Mar', batches: 5 },
    { month: 'Apr', batches: 7 },
    { month: 'May', batches: 2 },
    { month: 'Jun', batches: 6 },
  ];

  // In a real app, this would be calculated from inventory movements
  const inventoryValueData = [
    { day: '01', raw: 1000, packaging: 500, finished: 2000 },
    { day: '08', raw: 1200, packaging: 550, finished: 2100 },
    { day: '15', raw: 900, packaging: 600, finished: 2300 },
    { day: '22', raw: 1100, packaging: 650, finished: 2500 },
    { day: '29', raw: 1300, packaging: 700, finished: 2700 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your inventory and production
        </p>
      </div>
      
      {/* Alerts section */}
      {inventoryAlerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Inventory Alerts</h3>
          {inventoryAlerts.map(alert => (
            <Alert key={alert.id} variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Low Inventory: {alert.name}</AlertTitle>
              <AlertDescription>
                {alert.type}: Current level ({alert.current}) is below reorder point ({alert.threshold}).
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}
      
      {/* Stats overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Raw Materials
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rawMaterials?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {rawMaterials?.reduce((acc, item) => acc + (item.total_value || 0), 0).toFixed(2)} USD Total Value
            </p>
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
            <div className="text-2xl font-bold">{packagingItems?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {packagingItems?.reduce((acc, item) => acc + (item.total_value || 0), 0).toFixed(2)} USD Total Value
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Production Trend
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentBatches?.length || 0} Recent Batches</div>
            <p className="text-xs text-muted-foreground">
              Latest: {recentBatches && recentBatches.length > 0 ? 
                new Date(recentBatches[0].production_date).toLocaleDateString() : 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Production Batches</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="batches" fill="#8884d8" name="Production Batches" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Inventory Value</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={inventoryValueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="raw" stroke="#8884d8" name="Raw Materials" />
                <Line type="monotone" dataKey="packaging" stroke="#82ca9d" name="Packaging" />
                <Line type="monotone" dataKey="finished" stroke="#ffc658" name="Finished Goods" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent batches section */}
      <div>
        <h3 className="text-lg font-medium mb-2">Recent Production Batches</h3>
        <div className="space-y-2">
          {recentBatches?.length ? (
            recentBatches.map(batch => (
              <Card key={batch.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Batch #{batch.batch_number || "N/A"}</p>
                      <p className="text-sm text-muted-foreground">Product: {batch.product_name}</p>
                    </div>
                    <div className="text-right">
                      <p>{new Date(batch.production_date).toLocaleDateString()}</p>
                      <p className="text-sm text-muted-foreground">Status: {batch.status}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground">No recent production batches found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
